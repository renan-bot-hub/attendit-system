// Input contract for the risk model: 7-feature vector (normalized 0..1)
// and the 4 risk tier labels. Used by training, inference, and any future
// retrain so the model always sees inputs in the same shape and scale.

const FEATURE_NAMES = [
  'attendanceRate',
  'consecutiveAbsences',
  'totalAbsences',
  'lateCount',
  'last7DayAbsences',
  'last30DayAbsences',
  'worstWeekdayAbsenceRate',
];

const RISK_TIERS = ['Low Risk', 'Medium Risk', 'High Risk', 'Critical'];

function extractFeatures(s) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v ?? 0));
  return [
    clamp(s.attendanceRate, 0, 100) / 100,
    clamp(s.consecutiveAbsences, 0, 30) / 30,
    clamp(s.totalAbsences, 0, 50) / 50,
    clamp(s.lateCount, 0, 20) / 20,
    clamp(s.last7DayAbsences, 0, 7) / 7,
    clamp(s.last30DayAbsences, 0, 30) / 30,
    clamp(s.worstWeekdayAbsenceRate, 0, 1),
  ];
}

module.exports = { FEATURE_NAMES, RISK_TIERS, extractFeatures };
