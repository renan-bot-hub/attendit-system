// AI / Decision-Support engine.
//
// The manuscript refers to this module as the "TensorFlow and Decision Support
// Module" (Module #4, Fig. 10). Per the Delimitation section the AI component
// uses *rule-based* algorithms for risk prediction rather than trained ML
// models — see manuscript p. 4: "The AI component uses rule-based algorithms
// for risk prediction rather than machine learning models that require large
// historical datasets for training." This file is that rule engine.
//
// Inputs:  per-student attendance history + Settings thresholds.
// Outputs: AIAlert documents (pattern, riskScore, riskLevel, recommendations)
//          and auto-opened/escalated Case rows when warning / critical
//          thresholds are crossed.

const Attendance = require('../models/Attendance');
const Session    = require('../models/Session');
const User       = require('../models/User');
const Settings   = require('../models/Settings');
const AIAlert    = require('../models/AIAlert');
const Case       = require('../models/Case');

// ---------- helpers --------------------------------------------------------

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Build a per-student timeline sorted by session date, oldest first.
async function loadTimeline(studentId) {
  const rows = await Attendance.find({ studentId })
    .populate('sessionId', 'date')
    .sort({ timestamp: 1 });
  return rows
    .filter((r) => r.sessionId)
    .map((r) => ({
      status: r.status,
      date: r.sessionId.date,
      dow: new Date(r.sessionId.date).getDay(),
    }));
}

// Count the largest run of consecutive 'Absent' entries that ends on the most
// recent record. We care about *current* runs because a student who was absent
// 5 days last month but has since returned isn't currently at risk.
function trailingConsecutiveAbsences(timeline) {
  let run = 0;
  for (let i = timeline.length - 1; i >= 0; i--) {
    if (timeline[i].status === 'Absent') run++;
    else break;
  }
  return run;
}

// Find the day-of-week with disproportionately high absences (>= 50% of absences
// fall on it AND the count is at least 3). Returns the day name, or null.
function dominantAbsenceDay(timeline) {
  const buckets = [0, 0, 0, 0, 0, 0, 0];
  let totalAbs = 0;
  for (const t of timeline) {
    if (t.status === 'Absent') {
      buckets[t.dow]++;
      totalAbs++;
    }
  }
  if (totalAbs < 3) return null;
  let bestIdx = 0;
  for (let i = 1; i < 7; i++) if (buckets[i] > buckets[bestIdx]) bestIdx = i;
  if (buckets[bestIdx] >= 3 && buckets[bestIdx] / totalAbs >= 0.5) {
    return { day: DAY_NAMES[bestIdx], count: buckets[bestIdx] };
  }
  return null;
}

// Total late count + tardiness rate
function tardinessStats(timeline) {
  const lates = timeline.filter((t) => t.status === 'Late').length;
  const rate = timeline.length === 0 ? 0 : lates / timeline.length;
  return { lates, rate };
}

// Compute the overall risk score (0-100) using a weighted blend of:
//   - attendance rate (lower = riskier)
//   - trailing consecutive absences
//   - total absences vs critical threshold
//   - day-of-week pattern presence
// We cap at 100. This mirrors the "risk score" badge in Fig. 10.
function computeRiskScore({ rate, consecutive, totalAbsences, hasDowPattern, settings }) {
  const rateGap = Math.max(0, 100 - rate);                  // 0..100
  const consecutivePenalty = Math.min(40, consecutive * 12); // each missed day in a row adds 12 up to 40
  const absencePenalty = Math.min(30, (totalAbsences / Math.max(1, settings.criticalTotalAbsences)) * 30);
  const dowBonus = hasDowPattern ? 8 : 0;

  const score = Math.round(rateGap * 0.5 + consecutivePenalty + absencePenalty + dowBonus);
  return Math.max(0, Math.min(100, score));
}

function scoreToRiskLevel(score) {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High Risk';
  if (score >= 35) return 'Medium Risk';
  return 'Low Risk';
}

// Generate the prescriptive bullet list per pattern. These map directly to the
// "System Recommendations" panel in Fig. 10.
function recommendationsFor({ pattern, riskLevel, settings }) {
  const base = [];
  if (pattern === 'Consecutive Absences') {
    base.push('Immediate parent contact required');
    base.push('Request health certificate if medical issue');
    if (riskLevel === 'Critical') base.push(`Escalate to POD — critical threshold (${settings.criticalTotalAbsences}+) reached`);
  } else if (pattern === 'Day-of-Week Pattern') {
    base.push('Investigate underlying cause for the recurring absence day');
    base.push('Schedule parent-teacher discussion to discuss schedule conflicts');
  } else if (pattern === 'Frequent Tardiness') {
    base.push('Send tardiness reminder to parent');
    base.push('Recommend earlier wake/commute routine');
  } else if (pattern === 'Total Absences Trend') {
    base.push(`Total absences exceeded warning threshold (${settings.warningTotalAbsences})`);
    base.push('Open a case and document any submitted excuse letters');
    if (riskLevel === 'Critical') base.push('Escalate to POD for disciplinary review');
  } else if (pattern === 'Sudden Drop') {
    base.push('Attendance dropped sharply — flag for counseling check-in');
    base.push('Verify with parent if there are personal/family concerns');
  }
  return base;
}

// ---------- public API -----------------------------------------------------

/**
 * Re-scan a single student and create/refresh AIAlert rows + auto-open Cases.
 * Called whenever attendance is recorded for them.
 */
async function analyzeStudent(studentId, opts = {}) {
  const settings = await Settings.findOne({ key: 'global' }) || await Settings.create({ key: 'global' });
  const student  = await User.findById(studentId);
  if (!student || student.role !== 'student') return [];

  const timeline = await loadTimeline(studentId);
  if (timeline.length === 0) return [];

  const totalSessions = timeline.length;
  const present = timeline.filter((t) => t.status === 'Present').length;
  const late    = timeline.filter((t) => t.status === 'Late').length;
  const absent  = timeline.filter((t) => t.status === 'Absent').length;
  const rate    = Math.round(((present + late) / totalSessions) * 100);

  const consecutive = trailingConsecutiveAbsences(timeline);
  const dow         = dominantAbsenceDay(timeline);
  const tardiness   = tardinessStats(timeline);

  const detected = [];

  if (consecutive >= settings.consecutiveAbsenceThreshold) {
    detected.push({
      pattern: 'Consecutive Absences',
      patternDetail: `Consecutive absences pattern detected (${consecutive} days in a row)`,
    });
  }
  if (dow) {
    detected.push({
      pattern: 'Day-of-Week Pattern',
      patternDetail: `Student frequently absent on ${dow.day}s (${dow.count} occurrences)`,
    });
  }
  if (tardiness.lates >= 5 && tardiness.rate >= 0.25) {
    detected.push({
      pattern: 'Frequent Tardiness',
      patternDetail: `Late ${tardiness.lates}× — ${(tardiness.rate * 100).toFixed(0)}% of recorded sessions`,
    });
  }
  if (absent >= settings.warningTotalAbsences) {
    detected.push({
      pattern: 'Total Absences Trend',
      patternDetail: `${absent} total absences (warning ≥ ${settings.warningTotalAbsences}, critical ≥ ${settings.criticalTotalAbsences})`,
    });
  }
  // Sudden-drop heuristic: last 5 vs previous 5
  if (timeline.length >= 10) {
    const last5 = timeline.slice(-5);
    const prev5 = timeline.slice(-10, -5);
    const r = (arr) => arr.filter((t) => t.status === 'Present' || t.status === 'Late').length / arr.length;
    if (r(prev5) - r(last5) >= 0.4) {
      detected.push({
        pattern: 'Sudden Drop',
        patternDetail: 'Attendance dropped ≥40 points in the last 5 sessions',
      });
    }
  }

  const createdAlerts = [];
  for (const d of detected) {
    const riskScore = computeRiskScore({
      rate, consecutive, totalAbsences: absent,
      hasDowPattern: !!dow, settings,
    });
    const riskLevel = scoreToRiskLevel(riskScore);
    const recs = recommendationsFor({ pattern: d.pattern, riskLevel, settings });

    // De-dupe: if an open New/Under-Review alert with the same pattern already
    // exists, refresh it rather than spawning duplicates.
    const existing = await AIAlert.findOne({
      student: studentId,
      pattern: d.pattern,
      status: { $in: ['New', 'Under Review'] },
    });

    let alert;
    if (existing) {
      existing.patternDetail = d.patternDetail;
      existing.riskScore = riskScore;
      existing.riskLevel = riskLevel;
      existing.recommendations = recs;
      existing.section = student.section || '';
      existing.flaggedOn = new Date();
      await existing.save();
      alert = existing;
    } else {
      alert = await AIAlert.create({
        student: studentId,
        section: student.section || '',
        pattern: d.pattern,
        patternDetail: d.patternDetail,
        riskScore,
        riskLevel,
        recommendations: recs,
      });
    }
    createdAlerts.push(alert);
  }

  // Auto-case escalation: if total absences crossed the critical threshold
  // and no open case for this student exists, open one and flag it Escalated
  // so it lands in the POD queue (Fig. 17).
  if (absent >= settings.criticalTotalAbsences) {
    const openCase = await Case.findOne({
      student: studentId,
      type: 'Attendance Intervention',
      status: { $in: ['Open', 'Pending', 'Escalated'] },
    });
    if (!openCase) {
      await Case.create({
        student: studentId,
        type: 'Attendance Intervention',
        description: `Auto-opened: ${absent} total absences (critical ≥ ${settings.criticalTotalAbsences}). Consecutive: ${consecutive}.`,
        riskLevel: 'Critical',
        status: 'Escalated',
        totalAbsences: absent,
        consecutiveAbsences: consecutive,
        openedBy: opts.openedBy || null,
        escalatedAt: new Date(),
        sourceAlert: createdAlerts.find((a) => a.pattern === 'Total Absences Trend')?._id || null,
      });
    }
  } else if (absent >= settings.warningTotalAbsences) {
    const openCase = await Case.findOne({
      student: studentId,
      type: 'Attendance Intervention',
      status: { $in: ['Open', 'Pending', 'Escalated'] },
    });
    if (!openCase) {
      await Case.create({
        student: studentId,
        type: 'Attendance Intervention',
        description: `Auto-opened: ${absent} total absences crossed warning threshold (${settings.warningTotalAbsences}). Consecutive: ${consecutive}.`,
        riskLevel: 'High Risk',
        status: 'Open',
        totalAbsences: absent,
        consecutiveAbsences: consecutive,
        openedBy: opts.openedBy || null,
        sourceAlert: createdAlerts[0]?._id || null,
      });
    }
  }

  return createdAlerts;
}

/**
 * Re-scan every active student. Called from the analytics screen "Run Analysis"
 * button and from any admin-triggered recompute.
 */
async function analyzeAll(opts = {}) {
  const students = await User.find({ role: 'student', isActive: true });
  const results = { scanned: 0, alerts: 0, students: students.length };
  for (const s of students) {
    const alerts = await analyzeStudent(s._id, opts);
    results.scanned++;
    results.alerts += alerts.length;
  }
  return results;
}

module.exports = {
  analyzeStudent,
  analyzeAll,
  // Exposed for tests / unit calls
  _internal: { trailingConsecutiveAbsences, dominantAbsenceDay, computeRiskScore, scoreToRiskLevel },
};
