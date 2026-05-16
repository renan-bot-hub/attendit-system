// Attendance-intervention cases. Lifecycle: Open → (Escalated) → Resolved.
// Admin-only delete; teachers / staff / admin can open and update.

const Case = require('../models/Case');
const User = require('../models/User');

exports.getCases = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status)    filter.status    = req.query.status;
    if (req.query.riskLevel) filter.riskLevel = req.query.riskLevel;
    if (req.query.type)      filter.type      = req.query.type;
    if (req.query.student)   filter.student   = req.query.student;

    const cases = await Case.find(filter)
      .populate('student',     'name email studentId section gradeLevel parentName parentEmail')
      .populate('reviewedBy',  'name role')
      .populate('openedBy',    'name role')
      .populate('escalatedTo', 'name role')
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const [total, open, escalated, resolved] = await Promise.all([
      Case.countDocuments(),
      Case.countDocuments({ status: { $in: ['Open', 'Pending'] } }),
      Case.countDocuments({ status: 'Escalated' }),
      Case.countDocuments({ status: { $in: ['Resolved', 'Approved', 'Rejected'] } }),
    ]);
    res.json({ total, open, escalated, resolved });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createCase = async (req, res) => {
  if (!['teacher', 'staff', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  try {
    const { studentId, type, description, fileName, riskLevel } = req.body;
    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'description is required' });
    }
    if (!studentId) return res.status(400).json({ message: 'studentId is required' });

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const newCase = await Case.create({
      student: studentId,
      type: type || 'Attendance Intervention',
      description: description.trim(),
      fileName: fileName || '',
      riskLevel: riskLevel || 'Medium Risk',
      openedBy: req.user.id,
      status: 'Open',
    });

    const populated = await newCase.populate('student',
      'name email studentId section gradeLevel parentName parentEmail');
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateCaseStatus = async (req, res) => {
  try {
    if (!['teacher', 'admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { status, reviewNote } = req.body;
    if (!['Open', 'Pending', 'Approved', 'Rejected', 'Escalated', 'Resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const patch = { status, reviewNote: reviewNote || '' };
    if (status === 'Escalated') {
      patch.escalatedAt = new Date();
    }
    if (['Approved', 'Rejected', 'Resolved'].includes(status)) {
      patch.reviewedBy = req.user.id;
      patch.reviewedAt = new Date();
    }

    const updated = await Case.findByIdAndUpdate(req.params.id, patch, { new: true })
      .populate('student',    'name email studentId section gradeLevel parentName parentEmail')
      .populate('reviewedBy', 'name role')
      .populate('openedBy',   'name role');

    if (!updated) return res.status(404).json({ message: 'Case not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const c = await Case.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ message: 'Case not found' });
    res.json({ message: 'Case deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.escalate = async (req, res) => {
  if (!['teacher', 'admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  try {
    const c = await Case.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Case not found' });
    c.status = 'Escalated';
    c.escalatedAt = new Date();
    c.riskLevel = req.body.riskLevel || c.riskLevel || 'Critical';
    await c.save();
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
