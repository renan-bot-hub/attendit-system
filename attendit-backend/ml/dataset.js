// Synthetic dataset generator for the risk classifier. Produces labeled
// per-student feature vectors calibrated to the manuscript's attendance
// policy (consecutive-absence + warning/critical totals + rate bands).
// Replace generate() with a real-data loader once production history is
// large enough to train on.

const { extractFeatures, RISK_TIERS } = require('./featureSpec');

const DEFAULT_THRESHOLDS = {
  attendanceCriticalBelow: 75,
  attendanceHighRiskBelow: 85,
  attendanceModerateBelow: 92,
  consecutiveAbsenceThreshold: 3,
  warningTotalAbsences: 3,
  criticalTotalAbsences: 5,
};

function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function labelFor(signals, T) {
  const { attendanceRate, consecutiveAbsences, totalAbsences, lateCount } = signals;
  if (attendanceRate < T.attendanceCriticalBelow
      || consecutiveAbsences >= T.criticalTotalAbsences
      || totalAbsences >= T.criticalTotalAbsences) return 3;
  if (attendanceRate < T.attendanceHighRiskBelow
      || consecutiveAbsences >= T.consecutiveAbsenceThreshold
      || totalAbsences >= T.warningTotalAbsences) return 2;
  if (attendanceRate < T.attendanceModerateBelow || lateCount >= 5) return 1;
  return 0;
}

function sampleOne(T) {
  const profile = Math.floor(Math.random() * 4);
  let rate, consec, total, late;

  if (profile === 3) {
    rate   = 50 + randn() * 12;
    consec = 4 + Math.floor(Math.random() * 6) + randn();
    total  = 6 + Math.floor(Math.random() * 8) + randn();
    late   = Math.floor(Math.random() * 8);
  } else if (profile === 2) {
    rate   = 80 + randn() * 4;
    consec = 2 + Math.floor(Math.random() * 2);
    total  = 3 + Math.floor(Math.random() * 3);
    late   = Math.floor(Math.random() * 6);
  } else if (profile === 1) {
    rate   = 89 + randn() * 2;
    consec = Math.floor(Math.random() * 2);
    total  = 1 + Math.floor(Math.random() * 2);
    late   = 4 + Math.floor(Math.random() * 5);
  } else {
    rate   = 96 + randn() * 2;
    consec = 0;
    total  = Math.floor(Math.random() * 2);
    late   = Math.floor(Math.random() * 3);
  }

  const last7  = Math.max(0, Math.min(7,  consec + Math.floor(randn() * 1)));
  const last30 = Math.max(0, Math.min(30, total + Math.floor(Math.random() * 4)));
  const worstDow = profile >= 2 ? Math.min(1, 0.35 + Math.random() * 0.5) : Math.random() * 0.3;

  const signals = {
    attendanceRate:          Math.max(0, Math.min(100, rate)),
    consecutiveAbsences:     Math.max(0, Math.floor(consec)),
    totalAbsences:           Math.max(0, Math.floor(total)),
    lateCount:               Math.max(0, Math.floor(late)),
    last7DayAbsences:        last7,
    last30DayAbsences:       last30,
    worstWeekdayAbsenceRate: worstDow,
  };

  return { features: extractFeatures(signals), label: labelFor(signals, T), signals };
}

function generate({ n = 5000, thresholds = DEFAULT_THRESHOLDS } = {}) {
  const X = [];
  const y = [];
  for (let i = 0; i < n; i++) {
    const s = sampleOne(thresholds);
    X.push(s.features);
    y.push(s.label);
  }
  return { X, y, classes: RISK_TIERS };
}

module.exports = { generate, labelFor, sampleOne, DEFAULT_THRESHOLDS };
