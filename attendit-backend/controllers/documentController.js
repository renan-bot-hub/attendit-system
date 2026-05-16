// Parent excuse / health-cert submissions (Fig. 13). Mobile submits;
// web teacher accepts or rejects. Counts feed dashboard tiles.

const Document = require('../models/Document');
const User = require('../models/User');

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const docs = await Document.find(filter)
      .populate('student', 'name email studentId section gradeLevel parentName parentEmail')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { studentId, documentType, fileName, fileUrl, absenceDate, reason, parentName } = req.body;
    if (!studentId) return res.status(400).json({ message: 'studentId is required' });

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const doc = await Document.create({
      student: studentId,
      submittedBy: req.user.id,
      parentName: parentName || student.parentName || '',
      documentType: documentType || 'Excuse Letter',
      fileName: fileName || '',
      fileUrl: fileUrl || '',
      absenceDate: absenceDate ? new Date(absenceDate) : null,
      reason: reason || '',
      status: 'Pending Review',
    });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.review = async (req, res) => {
  if (!['teacher', 'admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  try {
    const { status, reviewNote } = req.body;
    if (!['Accepted', 'Rejected', 'Pending Review'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewNote: reviewNote || '',
        reviewedBy: status === 'Pending Review' ? null : req.user.id,
        reviewedAt: status === 'Pending Review' ? null : new Date(),
      },
      { new: true }
    ).populate('student', 'name email studentId section parentName parentEmail');
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const doc = await Document.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.summary = async (req, res) => {
  try {
    const pending  = await Document.countDocuments({ status: 'Pending Review' });
    const accepted = await Document.countDocuments({ status: 'Accepted' });
    const rejected = await Document.countDocuments({ status: 'Rejected' });
    res.json({ pending, accepted, rejected, total: pending + accepted + rejected });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
