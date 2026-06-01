// Parent excuse / health-cert submissions (Fig. 13). Mobile submits;
// web teacher accepts or rejects. Counts feed dashboard tiles.

const Document = require('../models/Document');
const User = require('../models/User');
const { isValidObjectId } = require('../middleware/validateRequest');
const {
  findStudentsForParentUser,
  getAccessibleStudentIds,
  userCanAccessStudent,
} = require('../utils/accessControl');

async function buildDocumentFilter(req) {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  if (req.user.role === 'parent') {
    const students = await findStudentsForParentUser(req.user.id);
    filter.student = { $in: students.map((student) => student._id) };
  } else if (req.user.role === 'teacher') {
    filter.student = { $in: await getAccessibleStudentIds(req.user) };
  } else if (!['admin', 'staff'].includes(req.user.role)) {
    filter.student = { $in: [] };
  }

  return filter;
}

exports.list = async (req, res) => {
  try {
    const filter = await buildDocumentFilter(req);
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
    if (!['parent', 'teacher', 'admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { studentId, documentType, fileName, fileUrl, absenceDate, reason, parentName } = req.body;
    if (!studentId) return res.status(400).json({ message: 'studentId is required' });
    if (!isValidObjectId(studentId)) return res.status(400).json({ message: 'Invalid studentId' });

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }
    if (!await userCanAccessStudent(req.user, student)) {
      return res.status(403).json({ message: 'You can only submit documents for students in your scope.' });
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
    const doc = await Document.findById(req.params.id)
      .populate('student', 'name email studentId section gradeSection parentName parentEmail');
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (!await userCanAccessStudent(req.user, doc.student)) {
      return res.status(403).json({ message: 'You can only review documents for students in your scope.' });
    }

    doc.status = status;
    doc.reviewNote = reviewNote || '';
    doc.reviewedBy = status === 'Pending Review' ? null : req.user.id;
    doc.reviewedAt = status === 'Pending Review' ? null : new Date();
    await doc.save();

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
    const base = await buildDocumentFilter(req);
    const pending  = await Document.countDocuments({ ...base, status: 'Pending Review' });
    const accepted = await Document.countDocuments({ ...base, status: 'Accepted' });
    const rejected = await Document.countDocuments({ ...base, status: 'Rejected' });
    res.json({ pending, accepted, rejected, total: pending + accepted + rejected });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
