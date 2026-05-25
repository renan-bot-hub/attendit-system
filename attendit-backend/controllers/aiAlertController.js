// AI / Decision Support module (Module #4, Fig. 10). Aggregates per-student
// attendance signals, scores risk with the trained TF.js model (rule-engine
// fallback), labels the pattern, and upserts AIAlert rows. Teachers can
// escalate alerts to POD which spawns a linked Case.

const AIAlert = require('../models/AIAlert');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Settings = require('../models/Settings');
const Case = require('../models/Case');
const mongoose = require('mongoose');
const riskModel = require('../ml/riskModel');

riskModel.load().catch((err) => {
  console.warn('[ai-alerts] TF risk model unavailable — using rule-engine fallback.', err.message);
});

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function analyseStudent(records, totalSessions = 0) {
  const sorted = [...records].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  let consecutive = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].status === 'Absent') consecutive++;
    else break;
  }

  const dowAbsent = [0, 0, 0, 0, 0, 0, 0];
  const dowTotal  = [0, 0, 0, 0, 0, 0, 0];
  for (const r of sorted) {
    const d = new Date(r.timestamp).getDay();
    dowTotal[d]++;
    if (r.status === 'Absent') dowAbsent[d]++;
  }
  let worstDow = -1, worstRate = 0;
  for (let i = 0; i < 7; i++) {
    if (dowTotal[i] >= 3) {
      const rate = dowAbsent[i] / dowTotal[i];
      if (rate > worstRate) { worstRate = rate; worstDow = i; }
    }
  }

  const total   = sorted.length;
  const absent  = sorted.filter((r) => r.status === 'Absent').length;
  const late    = sorted.filter((r) => r.status === 'Late').length;
  const present = sorted.filter((r) => r.status === 'Present' || r.status === 'Late').length;

  const denom = totalSessions > 0 ? totalSessions : Math.max(total, 1);
  const attendanceRate = Math.round((present / denom) * 100);

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const last7DayAbsences  = sorted.filter((r) => r.status === 'Absent'
                                              && (now - new Date(r.timestamp).getTime()) <= 7 * day).length;
  const last30DayAbsences = sorted.filter((r) => r.status === 'Absent'
                                              && (now - new Date(r.timestamp).getTime()) <= 30 * day).length;

  return {
    consecutive, worstDow, worstDowRate: worstRate,
    total, absent, late,
    attendanceRate,
    last7DayAbsences, last30DayAbsences,
  };
}

function detectPattern(signals, s) {
  const recs = [];
  if (signals.consecutive >= s.consecutiveAbsenceThreshold) {
    recs.push('Notify the parent of the consecutive-absence streak.');
    recs.push('Open an intervention case for the homeroom adviser.');
    return { pattern: 'Consecutive Absences',
             patternDetail: `${signals.consecutive} day${signals.consecutive > 1 ? 's' : ''} in a row`,
             recs };
  }
  if (signals.absent >= s.criticalTotalAbsences) {
    recs.push('Escalate to the Prefect of Discipline.');
    recs.push('Schedule a parent–teacher conference.');
    return { pattern: 'Total Absences Trend',
             patternDetail: `${signals.absent} total absences this term`,
             recs };
  }
  if (signals.absent >= s.warningTotalAbsences) {
    recs.push('Issue a warning notice via the parent app.');
    return { pattern: 'Total Absences Trend',
             patternDetail: `${signals.absent} total absences — approaching critical`,
             recs };
  }
  if (signals.worstDow >= 0 && signals.worstDowRate >= 0.5) {
    recs.push('Ask the parent about recurring weekday conflicts.');
    return { pattern: 'Day-of-Week Pattern',
             patternDetail: `${Math.round(signals.worstDowRate * 100)}% absence rate on ${WEEKDAYS[signals.worstDow]}`,
             recs };
  }
  if (signals.late >= 5) {
    recs.push('Remind the parent of the late-cutoff time.');
    return { pattern: 'Frequent Tardiness',
             patternDetail: `${signals.late} tardies this term`,
             recs };
  }
  return null;
}

function ruleScore(signals) {
  const streakPart = Math.min(signals.consecutive * 12, 60);
  const totalPart  = Math.min(signals.absent * 6, 30);
  const latePart   = Math.min(signals.late * 2, 10);
  const score = Math.min(100, streakPart + totalPart + latePart);

  let tier;
  if (score >= 75) tier = 'Critical';
  else if (score >= 55) tier = 'High Risk';
  else if (score >= 30) tier = 'Medium Risk';
  else tier = 'Low Risk';
  return { score, tier };
}

async function buildAlert(student, signals, s) {
  const pat = detectPattern(signals, s);
  if (!pat) return null;

  let score, tier, source = 'model', probabilities;
  try {
    const pred = await riskModel.predict({
      attendanceRate:          signals.attendanceRate,
      consecutiveAbsences:     signals.consecutive,
      totalAbsences:           signals.absent,
      lateCount:               signals.late,
      last7DayAbsences:        signals.last7DayAbsences,
      last30DayAbsences:       signals.last30DayAbsences,
      worstWeekdayAbsenceRate: signals.worstDowRate || 0,
    });
    score = pred.score;
    tier  = pred.tier;
    probabilities = pred.probabilities;
  } catch (err) {
    const r = ruleScore(signals);
    score = r.score;
    tier  = r.tier;
    source = 'rules';
  }

  return {
    student: student._id,
    section: student.section || '',
    pattern: pat.pattern,
    patternDetail: pat.patternDetail,
    riskScore: score,
    riskLevel: tier,
    recommendations: pat.recs,
    status: 'New',
    flaggedOn: new Date(),
    _meta: { source, probabilities },
  };
}

exports.runAnalysis = async (req, res) => {
  if (!['teacher', 'admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  try {
    let s = await Settings.findOne({ key: 'global' });
    if (!s) s = await Settings.create({ key: 'global' });

    const Session = require('../models/Session');
    const totalSessions = await Session.countDocuments();

    const students = await User.find({ role: 'student', isActive: true });
    let created = 0, refreshed = 0;
    let modelHits = 0, ruleHits = 0;

    for (const student of students) {
      const records = await Attendance.find({ studentId: student._id });
      const signals = analyseStudent(records, totalSessions);
      const draft = await buildAlert(student, signals, s);
      if (!draft) continue;

      if (draft._meta?.source === 'model') modelHits++;
      else ruleHits++;
      delete draft._meta;

      const existing = await AIAlert.findOne({
        student: student._id,
        pattern: draft.pattern,
        status: { $in: ['New', 'Under Review'] },
      });
      if (existing) {
        Object.assign(existing, draft);
        await existing.save();
        refreshed++;
      } else {
        await AIAlert.create(draft);
        created++;
      }
    }

    res.json({
      message: 'Analysis complete',
      created, refreshed,
      scorer: { model: modelHits, rules: ruleHits, modelReady: riskModel.isReady() },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.listAlerts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status)    filter.status    = req.query.status;
    if (req.query.riskLevel) filter.riskLevel = req.query.riskLevel;
    const alerts = await AIAlert.find(filter)
      .populate('student', 'name email studentId section gradeLevel parentName parentEmail parentPhone')
      .populate('linkedCase', 'status riskLevel')
      .sort({ flaggedOn: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAlert = async (req, res) => {
  if (!['teacher', 'admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  try {
    const { status, linkedCase } = req.body;
    const patch = {};
    if (status) patch.status = status;
    if (linkedCase !== undefined) patch.linkedCase = linkedCase;

    const reviewerId = req.user.id || req.user._id || req.user.userId;
    if (mongoose.Types.ObjectId.isValid(reviewerId)) {
      patch.reviewedBy = reviewerId;
    }
    patch.reviewedAt = new Date();

    const alert = await AIAlert.findByIdAndUpdate(req.params.id, patch, { new: true })
      .populate('student', 'name email studentId section parentName parentEmail');
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.escalateAlert = async (req, res) => {
  if (!['teacher', 'admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  try {
    const alert = await AIAlert.findById(req.params.id).populate('student');
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    if (alert.linkedCase) return res.status(400).json({ message: 'Alert already escalated' });

    const newCase = await Case.create({
      student: alert.student._id,
      type: 'Attendance Intervention',
      description: `${alert.pattern}: ${alert.patternDetail}. Recommendations: ${alert.recommendations.join(' ')}`,
      riskLevel: alert.riskLevel,
      status: alert.riskLevel === 'Critical' ? 'Escalated' : 'Open',
      consecutiveAbsences: 0,
      openedBy: req.user.id,
      escalatedTo: null,
      escalatedAt: alert.riskLevel === 'Critical' ? new Date() : null,
      sourceAlert: alert._id,
    });

    alert.status = 'Actioned';
    alert.linkedCase = newCase._id;
    alert.reviewedBy = req.user.id;
    alert.reviewedAt = new Date();
    await alert.save();

    res.json({ alert, case: newCase });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
