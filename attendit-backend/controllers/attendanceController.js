const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const User = require('../models/User');

// POST /api/attendance/manual  — teacher manually submits attendance list
exports.submitManual = async (req, res) => {
  const { sessionId, records } = req.body;
  // records = [{ studentId, status }, ...]

  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  if (!sessionId || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'sessionId and records[] are required' });
  }

  try {
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Upsert each record (insert or update if already exists)
    const ops = records.map(({ studentId, status }) => ({
      updateOne: {
        filter: { studentId, sessionId },
        update: { $set: { studentId, sessionId, status, timestamp: new Date() } },
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

// GET /api/attendance/ledger  — fetch attendance records
exports.getLedger = async (req, res) => {
  const { sessionId, studentId } = req.query;

  try {
    const filter = {};
    if (sessionId) filter.sessionId = sessionId;
    if (studentId) filter.studentId = studentId;

    // Students only see their own records
    if (req.user.role === 'student') {
      filter.studentId = req.user.id;
    }

    const records = await Attendance.find(filter)
      .populate('studentId', 'name email studentId section')
      .populate('sessionId', 'className section date')
      .sort({ timestamp: -1 });

    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/attendance/:id  — correct a single attendance entry (teacher/admin only)
exports.correctEntry = async (req, res) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const { status } = req.body;
  if (!['Present', 'Late', 'Absent'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const updated = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status, timestamp: new Date() },
      { new: true }
    )
      .populate('studentId', 'name email studentId section')
      .populate('sessionId', 'className section date');

    if (!updated) return res.status(404).json({ message: 'Entry not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/attendance/risk-analysis  — compute at-risk students
exports.getRiskAnalysis = async (req, res) => {
  try {
    const totalSessions = await Session.countDocuments();

    // If no sessions, return empty array with helpful message
    if (totalSessions === 0) {
      return res.json([]);
    }

    const students = await User.find({ role: 'student', isActive: true });

    const results = await Promise.all(students.map(async (student) => {
      const attended = await Attendance.countDocuments({
        studentId: student._id,
        status: { $in: ['Present', 'Late'] },
      });

      const attendanceRate = Math.round((attended / totalSessions) * 100);

      let riskLevel = 'Low Risk';
      if (attendanceRate < 75)      riskLevel = 'Critical';
      else if (attendanceRate < 85) riskLevel = 'High Risk';
      else if (attendanceRate < 92) riskLevel = 'Moderate';

      return {
        studentId: student._id,
        name: student.name,
        section: student.section,
        attendanceRate,
        riskLevel,
      };
    }));

    results.sort((a, b) => a.attendanceRate - b.attendanceRate);

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/attendance/summary  — overall KPIs for analytics dashboard
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
      present,
      late,
      absent,
      overallRate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
