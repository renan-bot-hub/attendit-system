const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET /api/users  — list users (any authenticated user; non-admins get a slim projection)
exports.getAllUsers = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { isActive: true };
    const projection = req.user.role === 'admin'
      ? '-password'
      : 'name email role department section gradeLevel studentId isActive';

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
    const { name, email, password, role, studentId, section, gradeLevel, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, password: hashedPassword,
      role: role || 'teacher',
      studentId, section, gradeLevel, department,
    });

    res.status(201).json({ message: 'User created', user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/users/bulk  — bulk create users (admin only)
// body: { users: [{ name, email, password?, role, studentId, section, gradeLevel, department }, ...] }
// If password is missing for a row, defaults to "changeme123"
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
      const exists = await User.findOne({ email: row.email });
      if (exists) {
        results.errors.push({ row: i + 1, message: `Email already exists: ${row.email}` });
        results.skipped++;
        continue;
      }
      const hashed = await bcrypt.hash(row.password || 'changeme123', 10);
      await User.create({
        name: row.name,
        email: row.email,
        password: hashed,
        role: row.role || 'student',
        studentId: row.studentId || null,
        section: row.section || null,
        gradeLevel: row.gradeLevel || null,
        department: row.department || null,
      });
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
    const { name, email, role, department, section, gradeLevel, studentId } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, department, section, gradeLevel, studentId },
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
