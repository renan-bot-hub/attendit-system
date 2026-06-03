// User CRUD + self-service profile actions + admin-only QR backup.
// Login roles: admin / teacher / staff / parent. Students are data-only records.

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { buildScopedStudentQuery, normalizeEmail } = require('../utils/accessControl');
const { resolveStudentSection } = require('../utils/sectionPlacement');

const WEB_ROLES   = ['admin', 'teacher', 'staff', 'parent'];
const DATA_ROLES  = ['student'];
const ALL_ROLES   = [...WEB_ROLES, ...DATA_ROLES];

exports.getAllUsers = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : await buildScopedStudentQuery(req.user);
    const projection = req.user.role === 'admin'
      ? '-password'
      : 'name email role section gradeLevel gradeSection studentId studentNumber parentName parentEmail parentPhone isActive';

    const users = await User.find(filter).select(projection).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const {
      name,
      department,
      section,
      gradeLevel,
      gradeSection,
      birthdate,
      contactNumber,
    } = req.body;
    const email = req.body.email ? normalizeEmail(req.body.email) : undefined;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, department, section, gradeLevel, gradeSection, birthdate, contactNumber },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

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

exports.createUser = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const {
      name, password, role,
      studentId, studentNumber, section, gradeLevel, gradeSection, department,
      teacherNumber, birthdate, contactNumber,
      parentName, parentEmail, parentPhone,
    } = req.body;

    const email = normalizeEmail(req.body.email);
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    if (!ALL_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const isLoginUser = WEB_ROLES.includes(role);
    if (isLoginUser && (!password || password.length < 6)) {
      return res.status(400).json({ message: 'Password (min 6) required for staff accounts' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(isLoginUser ? password : User.generateQrToken(), 10);
    const placement = await resolveStudentSection({ role, section, gradeLevel, gradeSection });

    const doc = {
      name, email, password: hashed,
      role,
      studentId: studentId || studentNumber || null,
      studentNumber: studentNumber || studentId || null,
      section: placement.section || null,
      gradeLevel: placement.gradeLevel || null,
      gradeSection: placement.gradeSection || null,
      department: department || null,
      teacherNumber: teacherNumber || null,
      birthdate: birthdate || null,
      contactNumber: contactNumber || parentPhone || null,
      parentName: parentName || null,
      parentEmail: parentEmail || null,
      parentPhone: parentPhone || contactNumber || null,
    };
    if (role === 'student') doc.qrCode = User.generateQrToken();

    const user = await User.create(doc);
    res.status(201).json({ message: 'User created', user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

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
      const email = normalizeEmail(row.email);
      if (!row.name || !email) {
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
      const exists = await User.findOne({ email });
      if (exists) {
        results.errors.push({ row: i + 1, message: `Email already exists: ${email}` });
        results.skipped++;
        continue;
      }
      const isLoginUser = WEB_ROLES.includes(role);
      if (isLoginUser && (!row.password || row.password.length < 6)) {
        results.errors.push({ row: i + 1, message: 'Password (min 6) required for login accounts' });
        results.skipped++;
        continue;
      }
      const hashed = await bcrypt.hash(isLoginUser ? row.password : User.generateQrToken(), 10);
      const placement = await resolveStudentSection({
        role,
        section: row.section || row.gradeSection,
        gradeLevel: row.gradeLevel,
        gradeSection: row.gradeSection || row.section,
      });
      const doc = {
        name: row.name,
        email,
        password: hashed,
        role,
        studentId: row.studentId || row.studentNumber || null,
        studentNumber: row.studentNumber || row.studentId || null,
        section: placement.section || null,
        gradeLevel: placement.gradeLevel || null,
        gradeSection: placement.gradeSection || null,
        department: row.department || null,
        teacherNumber: row.teacherNumber || null,
        birthdate: row.birthdate || null,
        contactNumber: row.contactNumber || row.parentPhone || null,
        parentName: row.parentName || row.parent || null,
        parentEmail: row.parentEmail || null,
        parentPhone: row.parentPhone || row.contactNumber || null,
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

exports.updateUser = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const {
      name, role, department, section, gradeLevel, gradeSection, studentId, studentNumber,
      teacherNumber, birthdate, contactNumber,
      parentName, parentEmail, parentPhone,
    } = req.body;
    const email = req.body.email ? normalizeEmail(req.body.email) : undefined;
    if (role && !ALL_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const existing = await User.findById(req.params.id).select('role section gradeLevel gradeSection');
    if (!existing) return res.status(404).json({ message: 'User not found' });
    const nextRole = role || existing.role;
    const nextSection = Object.prototype.hasOwnProperty.call(req.body, 'section') ? section : existing.section;
    const nextGradeLevel = gradeLevel || existing.gradeLevel;
    const nextGradeSection = Object.prototype.hasOwnProperty.call(req.body, 'gradeSection') ? gradeSection : existing.gradeSection;
    const placement = await resolveStudentSection({
      role: nextRole,
      section: nextSection,
      gradeLevel: nextGradeLevel,
      gradeSection: nextGradeSection,
    });
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, department, section: placement.section, gradeLevel: placement.gradeLevel, gradeSection: placement.gradeSection, studentId, studentNumber,
        teacherNumber, birthdate, contactNumber, parentName, parentEmail, parentPhone },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

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
