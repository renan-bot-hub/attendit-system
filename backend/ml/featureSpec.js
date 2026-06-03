// TensorFlow classification input contract.
//
// These feature names are already produced from MongoDB attendance/session data
// in aiAlertController.analyseStudent(). Keep this file as the single source of
// truth for training and prediction so both paths apply the same preprocessing.

const MODEL_TASK = 'attendance-risk-classification';
const MODEL_VERSION = 'tfjs-attendance-classifier-v2';
const CLASS_LABELS = ['Low', 'Moderate', 'High'];

const FEATURE_SCHEMA = [
  {
    name: 'attendanceRate',
    description: 'Percentage of sessions attended as Present or Late.',
    source: 'Attendance.status grouped by student and relevant sessions',
    min: 0,
    max: 100,
  },
  {
    name: 'consecutiveAbsences',
    description: 'Latest consecutive absence streak.',
    source: 'Attendance.status ordered by timestamp',
    min: 0,
    max: 30,
  },
  {
    name: 'totalAbsences',
    description: 'Total absence count across scoped sessions.',
    source: 'Attendance.status grouped by student',
    min: 0,
    max: 50,
  },
  {
    name: 'lateCount',
    description: 'Total late count across scoped sessions.',
    source: 'Attendance.status grouped by student',
    min: 0,
    max: 20,
  },
  {
    name: 'last7DayAbsences',
    description: 'Absences within the last seven days.',
    source: 'Attendance.timestamp and Attendance.status',
    min: 0,
    max: 7,
  },
  {
    name: 'last30DayAbsences',
    description: 'Absences within the last thirty days.',
    source: 'Attendance.timestamp and Attendance.status',
    min: 0,
    max: 30,
  },
  {
    name: 'worstWeekdayAbsenceRate',
    description: 'Highest absence rate for any weekday with enough samples.',
    source: 'Attendance.timestamp weekday buckets',
    min: 0,
    max: 1,
  },
];

const FEATURE_NAMES = FEATURE_SCHEMA.map((feature) => feature.name);

function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function scaleValue(value, feature) {
  const clamped = clampNumber(value, feature.min, feature.max);
  const span = feature.max - feature.min;
  return span === 0 ? 0 : (clamped - feature.min) / span;
}

function extractFeatures(signals = {}) {
  return FEATURE_SCHEMA.map((feature) => scaleValue(signals[feature.name], feature));
}

function rawFeatureVector(signals = {}) {
  return FEATURE_SCHEMA.map((feature) => clampNumber(signals[feature.name], feature.min, feature.max));
}

module.exports = {
  CLASS_LABELS,
  FEATURE_NAMES,
  FEATURE_SCHEMA,
  MODEL_TASK,
  MODEL_VERSION,
  extractFeatures,
  rawFeatureVector,
};
