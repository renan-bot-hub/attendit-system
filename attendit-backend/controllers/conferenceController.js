const Conference = require('../models/Conference');
const Case = require('../models/Case');

// GET /api/conferences  — list everything visible to staff/admin.
// Teachers can see conferences linked to cases they opened.
exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const items = await Conference.find(filter)
      .populate('student', 'name studentId section gradeLevel parentName parentEmail parentPhone')
      .populate('caseRef',  'riskLevel status')
      .populate('scheduledBy', 'name role')
      .sort({ date: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/conferences  — staff (POD) schedules a parent–teacher meeting.
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

// PATCH /api/conferences/:id  — mark completed / cancel / update outcome
exports.update = async (req, res) => {
  if (!['staff', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Staff (POD) or admin required' });
  }
  try {
    const { status, outcome, date, time, location, agenda, attendees } = req.body;
    const patch = {};
    if (status !== undefined)   patch.status   = status;
    if (outcome !== undefined)  patch.outcome  = outcome;
    if (date !== undefined)     patch.date     = new Date(date);
    if (time !== undefined)     patch.time     = time;
    if (location !== undefined) patch.location = location;
    if (agenda !== undefined)   patch.agenda   = agenda;
    if (attendees !== undefined) patch.attendees = attendees;
    const item = await Conference.findByIdAndUpdate(req.params.id, patch, { new: true })
      .populate('student', 'name studentId section')
      .populate('scheduledBy', 'name role');
    if (!item) return res.status(404).json({ message: 'Conference not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
