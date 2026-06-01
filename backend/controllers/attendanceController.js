// Attendance endpoints: manual submit, QR scan, ledger, corrections, analytics.

const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const User = require('../models/User');
const Settings = require('../models/Settings');
const jwt = require('jsonwebtoken');
const { isValidObjectId } = require('../middleware/validateRequest');
const {
  asId,
  buildScopedStudentQuery,
  canManageSession,
  findStudentsForParentUser,
  getAccessibleStudentIds,
  normalizeText,
  studentBelongsToParent,
  getParentUser,
} = require('../utils/accessControl');

const VALID_ATTENDANCE_STATUSES = ['Present', 'Late', 'Absent'];

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

function sameSection(session, student) {
  const sessionSection = normalizeText(session.section);
  const studentSection = normalizeText(student.section || student.gradeSection);
  return !sessionSection || !studentSection || sessionSection === studentSection;
}

function sectionFilter(section) {
  if (!section) return {};
  const pattern = new RegExp(`^${escapeRegex(section)}$`, 'i');
  return { section: pattern };
}

function buildSessionScopeForUser(user, extra = {}) {
  const filter = { ...extra };
  if (user.role === 'teacher') filter.teacherId = user.id;
  return filter;
}

async function findRelevantSessions(user, student) {
  const section = student.section || student.gradeSection;
  const filter = buildSessionScopeForUser(user, sectionFilter(section));
  return Session.find(filter).select('_id');
}

async function loadStudentByIdentifier(identifier) {
  if (!identifier) return null;
  const value = String(identifier).trim();

  if (isValidObjectId(value)) {
    return User.findOne({ _id: value, role: 'student', isActive: true });
  }

  return User.findOne({
    role: 'student',
    isActive: true,
    $or: [
      { studentId: value },
      { studentNumber: value },
      { qrCode: value },
    ],
  });
}

async function resolveTokenScanStudent(req) {
  if (req.user.role === 'student') {
    return User.findOne({ _id: req.user.id, role: 'student', isActive: true });
  }

  if (req.user.role !== 'parent') {
    return null;
  }

  const students = await findStudentsForParentUser(req.user.id);
  if (!students.length) return null;

  if (req.body.studentId) {
    const requested = await loadStudentByIdentifier(req.body.studentId);
    const parent = await getParentUser(req.user.id);
    if (requested && parent && studentBelongsToParent(parent, requested)) return requested;
    return null;
  }

  if (students.length > 1) {
    const error = new Error('studentId is required when a parent account is linked to multiple students.');
    error.status = 400;
    throw error;
  }

  return students[0];
}

async function buildLedgerFilter(req) {
  const { sessionId, studentId, status, markedBy, from, to } = req.query;
  const filter = {};

  if (sessionId) filter.sessionId = sessionId;
  if (studentId) filter.studentId = studentId;
  if (status) filter.status = status;
  if (markedBy) filter.markedBy = markedBy;
  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(from);
    if (to) filter.timestamp.$lte = new Date(to);
  }

  if (sessionId && !isValidObjectId(sessionId)) {
    const error = new Error('Invalid sessionId');
    error.status = 400;
    throw error;
  }
  if (studentId && !isValidObjectId(studentId)) {
    const error = new Error('Invalid studentId');
    error.status = 400;
    throw error;
  }
  if (status && !VALID_ATTENDANCE_STATUSES.includes(status)) {
    const error = new Error('Invalid attendance status');
    error.status = 400;
    throw error;
  }

  if (req.user.role === 'parent') {
    const students = await findStudentsForParentUser(req.user.id);
    const allowedIds = students.map((student) => asId(student._id));

    if (studentId && !allowedIds.includes(String(studentId))) {
      const error = new Error('You can only view attendance for your linked student.');
      error.status = 403;
      throw error;
    }

    filter.studentId = studentId || { $in: allowedIds };
    return filter;
  }

  if (req.user.role === 'teacher') {
    if (sessionId) {
      const session = await Session.findById(sessionId);
      if (!session || !canManageSession(req.user, session)) {
        const error = new Error('You can only view attendance for your sessions.');
        error.status = 403;
        throw error;
      }
      return filter;
    }

    const sessions = await Session.find({ teacherId: req.user.id }).select('_id');
    filter.sessionId = { $in: sessions.map((session) => session._id) };
  }

  return filter;
}

exports.submitManual = async (req, res) => {
  const { sessionId, records } = req.body;

  if (!sessionId || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'sessionId and records[] are required' });
  }
  if (!isValidObjectId(sessionId)) {
    return res.status(400).json({ message: 'Invalid sessionId' });
  }

  try {
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (!canManageSession(req.user, session)) {
      return res.status(403).json({ message: 'You can only submit attendance for sessions you manage.' });
    }

    const studentIds = [...new Set(records.map((record) => String(record.studentId || '')))];
    if (studentIds.some((id) => !isValidObjectId(id))) {
      return res.status(400).json({ message: 'All records must include a valid studentId' });
    }
    if (records.some((record) => !VALID_ATTENDANCE_STATUSES.includes(record.status))) {
      return res.status(400).json({ message: 'Invalid attendance status' });
    }

    const students = await User.find({ _id: { $in: studentIds }, role: 'student', isActive: true });
    const studentById = new Map(students.map((student) => [asId(student._id), student]));
    if (studentById.size !== studentIds.length) {
      return res.status(400).json({ message: 'One or more student records were not found' });
    }
    if (students.some((student) => !sameSection(session, student))) {
      return res.status(400).json({ message: 'One or more students do not belong to this session section' });
    }

    const ops = records.map(({ studentId, status }) => ({
      updateOne: {
        filter: { studentId, sessionId },
        update: {
          $set: {
            studentId,
            sessionId,
            status,
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
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

exports.scanQR = async (req, res) => {
  const { token, qrCode, sessionId } = req.body;

  try {
    let student = null;
    let targetSessionId = sessionId;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      targetSessionId = decoded.sessionId;
      student = await resolveTokenScanStudent(req);
      if (!student) {
        return res.status(403).json({ message: 'No linked student found for this scan.' });
      }
    } else if (qrCode && sessionId) {
      if (!canManageSession(req.user, { teacherId: req.user.id }) && !['admin', 'staff', 'teacher'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      student = await User.findOne({ qrCode, role: 'student', isActive: true });
      if (!student) return res.status(404).json({ message: 'Student QR not found' });
    } else {
      return res.status(400).json({ message: 'Invalid QR payload' });
    }

    if (!targetSessionId || !isValidObjectId(targetSessionId)) {
      return res.status(400).json({ message: 'Invalid sessionId' });
    }

    const session = await Session.findById(targetSessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (!session.active) return res.status(400).json({ message: 'Session is not active' });
    if (!sameSection(session, student)) {
      return res.status(400).json({ message: 'Student does not belong to this session section' });
    }
    if (req.user.role === 'teacher' && !token && !canManageSession(req.user, session)) {
      return res.status(403).json({ message: 'You can only scan attendance for your sessions.' });
    }

    const exists = await Attendance.findOne({ studentId: student._id, sessionId: targetSessionId });
    if (exists) return res.json({ message: 'Already recorded' });

    await Attendance.create({
      studentId: student._id,
      sessionId: targetSessionId,
      status: 'Present',
      markedBy: 'Scan',
      timeIn: new Date().toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: new Date(),
    });

    res.json({ message: 'Attendance recorded' });
  } catch (err) {
    if (err?.code === 11000) return res.json({ message: 'Already recorded' });
    res.status(err.status || 400).json({ message: err.message || 'Invalid QR' });
  }
};

exports.getLedger = async (req, res) => {
  try {
    const filter = await buildLedgerFilter(req);

    let records = await Attendance.find(filter)
      .populate('studentId', 'name email studentId section gradeLevel')
      .populate('sessionId', 'className section date subject teacherId')
      .sort({ timestamp: -1 });

    if (req.query.section) {
      const wanted = normalizeText(req.query.section);
      records = records.filter((r) => normalizeText(r.studentId?.section) === wanted);
    }

    res.json(records);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

exports.correctEntry = async (req, res) => {
  const { status } = req.body;
  if (!VALID_ATTENDANCE_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const row = await Attendance.findById(req.params.id).populate('sessionId', 'teacherId');
    if (!row) return res.status(404).json({ message: 'Entry not found' });
    if (!canManageSession(req.user, row.sessionId)) {
      return res.status(403).json({ message: 'You can only correct attendance for sessions you manage.' });
    }

    row.status = status;
    row.markedBy = 'Manual';
    row.timestamp = new Date();
    await row.save();

    const updated = await Attendance.findById(row._id)
      .populate('studentId', 'name email studentId section gradeLevel')
      .populate('sessionId', 'className section date subject');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeEntry = async (req, res) => {
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

    const students = await User.find(await buildScopedStudentQuery(req.user));
    if (!students.length) return res.json([]);

    const results = await Promise.all(students.map(async (student) => {
      const relevantSessions = await findRelevantSessions(req.user, student);
      const relevantSessionIds = relevantSessions.map((session) => session._id);
      const totalSessions = relevantSessionIds.length;
      if (totalSessions === 0) {
        return {
          studentId: student._id,
          name: student.name,
          section: student.section,
          gradeLevel: student.gradeLevel,
          attendanceRate: 0,
          absentCount: 0,
          lateCount: 0,
          consecutiveAbsences: 0,
          riskLevel: classifyRate(0, settings),
        };
      }
      const records = await Attendance.find({
        studentId: student._id,
        sessionId: { $in: relevantSessionIds },
      }).sort({ timestamp: 1 });
      const attendedCount = records.filter((r) => r.status === 'Present' || r.status === 'Late').length;
      const absentCount = records.filter((r) => r.status === 'Absent').length;
      const lateCount = records.filter((r) => r.status === 'Late').length;
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
    const sessionScope = buildSessionScopeForUser(req.user);
    const sessions = await Session.find(sessionScope).select('_id');
    const sessionIds = sessions.map((session) => session._id);
    const studentIds = await getAccessibleStudentIds(req.user);
    const recordScope = {
      sessionId: { $in: sessionIds },
      studentId: { $in: studentIds },
    };

    const totalSessions = sessionIds.length;
    const totalStudents = studentIds.length;
    const present = await Attendance.countDocuments({ ...recordScope, status: 'Present' });
    const late = await Attendance.countDocuments({ ...recordScope, status: 'Late' });
    const absent = await Attendance.countDocuments({ ...recordScope, status: 'Absent' });
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

exports.getTrend = async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 14, 60);
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const sessions = await Session.find(buildSessionScopeForUser(req.user)).select('_id');
    const studentIds = await getAccessibleStudentIds(req.user);
    const records = await Attendance.find({
      timestamp: { $gte: since },
      sessionId: { $in: sessions.map((session) => session._id) },
      studentId: { $in: studentIds },
    });
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
