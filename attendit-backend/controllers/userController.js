const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Allowed roles for web (admin, teacher, staff). Students are data-only records;
// parents use the mobile app and are not represented as login users here.
const WEB_ROLES   = ['admin', 'teacher', 'staff'];
const DATA_ROLES  = ['student'];
const ALL_ROLES   = [...WEB_ROLES, ...DATA_ROLES];

// GET /api/users  — list users (any authenticated user; non-admins get a slim projection)
exports.getAllUsers = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { isActive: true };
    const projection = req.user.role === 'admin'
      ? '-password'
      : 'name email role department section gradeLevel studentId parentName parentEmail parentPhone qrCode isActive';

    const users = await User.find(filter).select(projection).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/users/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/users/me  — update own profile (name/email/contact fields)
exports.updateMe = async (req, res) => {
  try {
    const { name, email, department, section, gradeLevel } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, department, section, gradeLevel },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/users/me/password  — change own password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/users  — create user (admin only)
exports.createUser = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const {
      name, email, password, role,
      studentId, section, gradeLevel, department,
      parentName, parentEmail, parentPhone,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    if (!ALL_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Students are data-only — they don't log in. A throwaway password is used so
    // the schema requirement is met but the record can never authenticate.
    const isLoginUser = WEB_ROLES.includes(role);
    if (isLoginUser && (!password || password.length < 6)) {
      return res.status(400).json({ message: 'Password (min 6) required for staff accounts' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(isLoginUser ? password : User.generateQrToken(), 10);

    const doc = {
      name, email, password: hashed,
      role,
      studentId: studentId || null,
      section: section || null,
      gradeLevel: gradeLevel || null,
      department: department || null,
      parentName: parentName || null,
      parentEmail: parentEmail || null,
      parentPhone: parentPhone || null,
    };
    // Auto-mint a QR token for new student records so the mobile scanner has something to read
    if (role === 'student') doc.qrCode = User.generateQrToken();

    const user = await User.create(doc);
    res.status(201).json({ message: 'User created', user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/users/bulk  — bulk create users (admin only)
exports.bulkCreate = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  const { users } = req.body;
  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ message: 'users[] is required' });
  }

  const results = { created: 0, skipped: 0, errors: [] };
  for (let i = 0; i < users.length; i++) {
    const row = users[i];
    try {
      if (!row.name || !row.email) {
        results.errors.push({ row: i + 1, message: 'Missing name or email' });
        results.skipped++;
        continue;
      }
      const role = (row.role || 'student').toLowerCase();
      if (!ALL_ROLES.includes(role)) {
        results.errors.push({ row: i + 1, message: `Invalid role: ${row.role}` });
        results.skipped++;
        continue;
      }
      const exists = await User.findOne({ email: row.email });
      if (exists) {
        results.errors.push({ row: i + 1, message: `Email already exists: ${row.email}` });
        results.skipped++;
        continue;
      }
      const hashed = await bcrypt.hash(row.password || 'changeme123', 10);
      const doc = {
        name: row.name,
        email: row.email,
        password: hashed,
        role,
        studentId: row.studentId || null,
        section: row.section || null,
        gradeLevel: row.gradeLevel || null,
        department: row.department || null,
        parentName: row.parentName || row.parent || null,
        parentEmail: row.parentEmail || null,
        parentPhone: row.parentPhone || null,
      };
      if (role === 'student') doc.qrCode = User.generateQrToken();
      await User.create(doc);
      results.created++;
    } catch (err) {
      results.errors.push({ row: i + 1, message: err.message });
      results.skipped++;
    }
  }
  res.json(results);
};

// PUT /api/users/:id  — admin edit
exports.updateUser = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const {
      name, email, role, department, section, gradeLevel, studentId,
      parentName, parentEmail, parentPhone,
    } = req.body;
    if (role && !ALL_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, department, section, gradeLevel, studentId,
        parentName, parentEmail, parentPhone },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH /api/users/:id/toggle-status
exports.toggleUserStatus = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/users/:id/regenerate-qr  — admin only.
// Mints a fresh QR token for a student. The use case is the manuscript's
// "lost ID" backup flow: scanning is the mobile primary path, so when a
// student loses their printed QR the admin issues a new one here.
exports.regenerateQr = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'student') {
      return res.status(400).json({ message: 'QR codes are only issued to student records' });
    }
    user.qrCode = User.generateQrToken();
    await user.save();
    res.json({ message: 'QR regenerated', qrCode: user.qrCode });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
