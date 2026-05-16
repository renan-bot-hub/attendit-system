// All attendance read/write endpoints — manual submit, ledger with
// filters, per-row correction/delete, risk analysis, summary, trend.

const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const User = require('../models/User');
const Settings = require('../models/Settings');

async function loadSettings() {
  let s = await Settings.findOne({ key: 'global' });
  if (!s) s = await Settings.create({ key: 'global' });
  return s;
}

function classifyRate(rate, s) {
  if (rate < s.attendanceCriticalBelow) return 'Critical';
  if (rate < s.attendanceHighRiskBelow) return 'High Risk';
  if (rate < s.attendanceModerateBelow) return 'Moderate';
  return 'Low Risk';
}

exports.submitManual = async (req, res) => {
  const { sessionId, records } = req.body;

  if (!['teacher', 'admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  if (!sessionId || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'sessionId and records[] are required' });
  }

  try {
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const ops = records.map(({ studentId, status }) => ({
      updateOne: {
        filter: { studentId, sessionId },
        update: {
          $set: {
            studentId, sessionId, status,
            markedBy: 'Manual',
            timestamp: new Date(),
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(ops);
    res.status(200).json({ message: 'Attendance saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getLedger = async (req, res) => {
  const { sessionId, studentId, status, markedBy, from, to } = req.query;

  try {
    const filter = {};
    if (sessionId) filter.sessionId = sessionId;
    if (studentId) filter.studentId = studentId;
    if (status)    filter.status    = status;
    if (markedBy)  filter.markedBy  = markedBy;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to)   filter.timestamp.$lte = new Date(to);
    }

    let records = await Attendance.find(filter)
      .populate('studentId', 'name email studentId section gradeLevel')
      .populate('sessionId', 'className section date subject')
      .sort({ timestamp: -1 });

    if (req.query.section) {
      const wanted = String(req.query.section).toLowerCase();
      records = records.filter((r) => (r.studentId?.section || '').toLowerCase() === wanted);
    }

    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.correctEntry = async (req, res) => {
  if (!['teacher', 'admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  const { status } = req.body;
  if (!['Present', 'Late', 'Absent'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const updated = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status, markedBy: 'Manual', timestamp: new Date() },
      { new: true }
    )
      .populate('studentId', 'name email studentId section gradeLevel')
      .populate('sessionId', 'className section date subject');

    if (!updated) return res.status(404).json({ message: 'Entry not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeEntry = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const row = await Attendance.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ message: 'Entry not found' });
    res.json({ message: 'Attendance entry deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getRiskAnalysis = async (req, res) => {
  try {
    const settings = await loadSettings();
    const totalSessions = await Session.countDocuments();
    if (totalSessions === 0) return res.json([]);

    const students = await User.find({ role: 'student', isActive: true });

    const results = await Promise.all(students.map(async (student) => {
      const records = await Attendance.find({ studentId: student._id }).sort({ timestamp: 1 });
      const attendedCount = records.filter((r) => r.status === 'Present' || r.status === 'Late').length;
      const absentCount   = records.filter((r) => r.status === 'Absent').length;
      const lateCount     = records.filter((r) => r.status === 'Late').length;
      const attendanceRate = Math.round((attendedCount / totalSessions) * 100);

      let consecutive = 0;
      for (let i = records.length - 1; i >= 0; i--) {
        if (records[i].status === 'Absent') consecutive++;
        else break;
      }

      return {
        studentId: student._id,
        name: student.name,
        section: student.section,
        gradeLevel: student.gradeLevel,
        attendanceRate,
        absentCount,
        lateCount,
        consecutiveAbsences: consecutive,
        riskLevel: classifyRate(attendanceRate, settings),
      };
    }));

    results.sort((a, b) => a.attendanceRate - b.attendanceRate);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const totalSessions = await Session.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    const present = await Attendance.countDocuments({ status: 'Present' });
    const late = await Attendance.countDocuments({ status: 'Late' });
    const absent = await Attendance.countDocuments({ status: 'Absent' });
    const totalRecords = present + late + absent;

    const overallRate = totalRecords === 0 ? 0 : Math.round(((present + late) / totalRecords) * 100);

    res.json({
      totalSessions,
      totalStudents,
      present, late, absent,
      overallRate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTrend = async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 14, 60);
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const records = await Attendance.find({ timestamp: { $gte: since } });
    const buckets = new Map();
    for (let d = 0; d < days; d++) {
      const day = new Date(since);
      day.setDate(since.getDate() + d);
      const key = day.toISOString().slice(0, 10);
      buckets.set(key, { date: key, present: 0, late: 0, absent: 0 });
    }
    for (const r of records) {
      const key = new Date(r.timestamp).toISOString().slice(0, 10);
      const b = buckets.get(key);
      if (!b) continue;
      if (r.status === 'Present') b.present++;
      else if (r.status === 'Late') b.late++;
      else if (r.status === 'Absent') b.absent++;
    }
    const trend = [...buckets.values()].map((b) => {
      const total = b.present + b.late + b.absent;
      return { ...b, rate: total === 0 ? 0 : Math.round(((b.present + b.late) / total) * 100) };
    });
    res.json(trend);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
