const AIAlert = require('../models/AIAlert');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Settings = require('../models/Settings');
const Case = require('../models/Case');

// Module #4 in the manuscript: pattern-detection + decision-support service.
// We do not run a Python TensorFlow model in-process — that lives in a
// sibling service. What this controller provides is the orchestration:
//   * compute interpretable signals (consecutive streak, weekday skew, total absences, late streak)
//   * weight them into a 0–100 risk score
//   * translate score → tier and emit prescriptive recommendations
// Teachers can then act on the alerts from the AI Alerts screen (Fig. 10).

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Aggregate per-student attendance signals from raw records
function analyseStudent(records) {
  const sorted = [...records].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let consecutive = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].status === 'Absent') consecutive++;
    else break;
  }

  // Day-of-week skew — does this student miss more on a specific weekday?
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

  const total = sorted.length;
  const absent = sorted.filter((r) => r.status === 'Absent').length;
  const late   = sorted.filter((r) => r.status === 'Late').length;

  return { consecutive, worstDow, worstDowRate: worstRate, total, absent, late };
}

// Convert signals + thresholds into pattern, score, level, and recommendations
function buildAlert(student, signals, s) {
  let pattern = null;
  let patternDetail = '';
  const recs = [];

  if (signals.consecutive >= s.consecutiveAbsenceThreshold) {
    pattern = 'Consecutive Absences';
    patternDetail = `${signals.consecutive} day${signals.consecutive > 1 ? 's' : ''} in a row`;
    recs.push('Notify the parent of the consecutive-absence streak.');
    recs.push('Open an intervention case for the homeroom adviser.');
  } else if (signals.absent >= s.criticalTotalAbsences) {
    pattern = 'Total Absences Trend';
    patternDetail = `${signals.absent} total absences this term`;
    recs.push('Escalate to the Prefect of Discipline.');
    recs.push('Schedule a parent–teacher conference.');
  } else if (signals.absent >= s.warningTotalAbsences) {
    pattern = 'Total Absences Trend';
    patternDetail = `${signals.absent} total absences — approaching critical`;
    recs.push('Issue a warning notice via the parent app.');
  } else if (signals.worstDow >= 0 && signals.worstDowRate >= 0.5) {
    pattern = 'Day-of-Week Pattern';
    patternDetail = `${Math.round(signals.worstDowRate * 100)}% absence rate on ${WEEKDAYS[signals.worstDow]}`;
    recs.push('Ask the parent about recurring weekday conflicts.');
  } else if (signals.late >= 5) {
    pattern = 'Frequent Tardiness';
    patternDetail = `${signals.late} tardies this term`;
    recs.push('Remind the parent of the late-cutoff time.');
  }

  if (!pattern) return null;

  // Risk score: weighted combo of streak, total absences, lateness
  const streakPart = Math.min(signals.consecutive * 12, 60);
  const totalPart  = Math.min(signals.absent * 6, 30);
  const latePart   = Math.min(signals.late * 2, 10);
  const score = Math.min(100, streakPart + totalPart + latePart);

  let riskLevel;
  if (score >= 75) riskLevel = 'Critical';
  else if (score >= 55) riskLevel = 'High Risk';
  else if (score >= 30) riskLevel = 'Medium Risk';
  else riskLevel = 'Low Risk';

  return {
    student: student._id,
    section: student.section || '',
    pattern,
    patternDetail,
    riskScore: score,
    riskLevel,
    recommendations: recs,
    status: 'New',
    flaggedOn: new Date(),
  };
}

// POST /api/ai-alerts/run  — re-scan all students and upsert fresh alerts.
// "Upsert" = if a student already has an open alert of the same pattern, we
// refresh it in-place rather than duplicating.
exports.runAnalysis = async (req, res) => {
  if (!['teacher', 'admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  try {
    let s = await Settings.findOne({ key: 'global' });
    if (!s) s = await Settings.create({ key: 'global' });

    const students = await User.find({ role: 'student', isActive: true });
    let created = 0, refreshed = 0;

    for (const student of students) {
      const records = await Attendance.find({ studentId: student._id });
      const signals = analyseStudent(records);
      const draft = buildAlert(student, signals, s);
      if (!draft) continue;

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

    res.json({ message: 'Analysis complete', created, refreshed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/ai-alerts  — list alerts (?status=, ?riskLevel=)
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

// PATCH /api/ai-alerts/:id  — update status / link a case
exports.updateAlert = async (req, res) => {
  if (!['teacher', 'admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  try {
    const { status, linkedCase } = req.body;
    const patch = {};
    if (status) patch.status = status;
    if (linkedCase !== undefined) patch.linkedCase = linkedCase;
    patch.reviewedBy = req.user.id;
    patch.reviewedAt = new Date();

    const alert = await AIAlert.findByIdAndUpdate(req.params.id, patch, { new: true })
      .populate('student', 'name email studentId section parentName parentEmail');
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/ai-alerts/:id/escalate  — turn an alert into a Case routed to POD.
// One-click action from the AI Alerts screen ("Escalate to POD" button).
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
      openedBy:   req.user.id,
      escalatedTo: alert.riskLevel === 'Critical' ? null : null,  // POD picks it up from the staff queue
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
