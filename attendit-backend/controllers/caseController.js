const Case = require('../models/Case');
const User = require('../models/User');

// GET /api/cases  — list all cases (teachers/admins see all; students see their own)
exports.getCases = async (req, res) => {
  try {
    const filter = req.user.role === 'student' ? { student: req.user.id } : {};
    const cases = await Case.find(filter)
      .populate('student', 'name email studentId section gradeLevel')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/cases  — submit a new case (any logged-in user; if student, auto-assigned)
exports.createCase = async (req, res) => {
  try {
    const { studentId, type, description, fileName } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'description is required' });
    }

    // Students submit cases for themselves; teachers/admins can submit for a student
    let targetStudent = req.user.id;
    if (req.user.role !== 'student') {
      if (!studentId) {
        return res.status(400).json({ message: 'studentId is required when submitted by staff' });
      }
      const student = await User.findById(studentId);
      if (!student || student.role !== 'student') {
        return res.status(404).json({ message: 'Student not found' });
      }
      targetStudent = studentId;
    }

    const newCase = await Case.create({
      student: targetStudent,
      type: type || 'Excuse Letter',
      description: description.trim(),
      fileName: fileName || '',
    });

    const populated = await newCase.populate('student', 'name email studentId section gradeLevel');
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH /api/cases/:id/status  — approve / reject / revert (teacher / admin only)
exports.updateCaseStatus = async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { status, reviewNote } = req.body;
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updated = await Case.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewNote: reviewNote || '',
        reviewedBy: status === 'Pending' ? null : req.user.id,
        reviewedAt: status === 'Pending' ? null : new Date(),
      },
      { new: true }
    )
      .populate('student', 'name email studentId section gradeLevel')
      .populate('reviewedBy', 'name role');

    if (!updated) return res.status(404).json({ message: 'Case not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};