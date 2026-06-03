// Parent–teacher conferences scheduled by POD off an escalated case
// (Fig. 18). Admin/POD schedule + update; admin can delete.

const Conference = require('../models/Conference');
const Case = require('../models/Case');
const {
  findStudentsForParentUser,
  getAccessibleStudentIds,
} = require('../utils/accessControl');
const { normalizeRiskLevel } = require('../utils/riskLevels');

async function buildConferenceFilter(req) {
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
    const filter = await buildConferenceFilter(req);
    const items = await Conference.find(filter)
      .populate('student',     'name studentId section gradeLevel parentName parentEmail parentPhone')
      .populate('caseRef',     'riskLevel status')
      .populate('scheduledBy', 'name role')
      .sort({ date: 1 });
    res.json(items.map((item) => {
      const data = typeof item.toObject === 'function' ? item.toObject() : item;
      return {
        ...data,
        caseRef: data.caseRef
          ? { ...data.caseRef, riskLevel: normalizeRiskLevel(data.caseRef.riskLevel) }
          : data.caseRef,
      };
    }));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  if (!['staff', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Staff (POD) or admin required' });
  }
  try {
    const { caseRef, date, time, location, agenda, attendees } = req.body;
    if (!caseRef || !date) return res.status(400).json({ message: 'caseRef and date are required' });

    const c = await Case.findById(caseRef);
    if (!c) return res.status(404).json({ message: 'Case not found' });

    const item = await Conference.create({
      caseRef, student: c.student,
      scheduledBy: req.user.id,
      date: new Date(date),
      time: time || '',
      attendees: Array.isArray(attendees) ? attendees : [],
      location: location || '',
      agenda: agenda || '',
      status: 'Scheduled',
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const item = await Conference.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Conference not found' });
    res.json({ message: 'Conference deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.update = async (req, res) => {
  if (!['staff', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Staff (POD) or admin required' });
  }
  try {
    const { status, outcome, date, time, location, agenda, attendees } = req.body;
    const patch = {};
    if (status !== undefined)   patch.status    = status;
    if (outcome !== undefined)  patch.outcome   = outcome;
    if (date !== undefined)     patch.date      = new Date(date);
    if (time !== undefined)     patch.time      = time;
    if (location !== undefined) patch.location  = location;
    if (agenda !== undefined)   patch.agenda    = agenda;
    if (attendees !== undefined) patch.attendees = attendees;

    const item = await Conference.findByIdAndUpdate(req.params.id, patch, { new: true })
      .populate('student',     'name studentId section')
      .populate('scheduledBy', 'name role');
    if (!item) return res.status(404).json({ message: 'Conference not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
