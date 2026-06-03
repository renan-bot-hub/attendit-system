const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { labelFor, DEFAULT_THRESHOLDS } = require('./dataset');
const { CLASS_LABELS, extractFeatures } = require('./featureSpec');
const { normalizeRiskLevel } = require('../utils/riskLevels');

const SENSITIVE_COLUMNS = [
  'name',
  'student_name',
  'email',
  'parent_email',
  'phone',
  'parent_phone',
  'address',
];

const STATUS_MAP = new Map([
  ['present', 'Present'],
  ['p', 'Present'],
  ['late', 'Late'],
  ['l', 'Late'],
  ['tardy', 'Late'],
  ['absent', 'Absent'],
  ['a', 'Absent'],
  ['unexcused', 'Absent'],
  ['unexcused_absence', 'Absent'],
  ['excused', 'Absent'],
  ['excused_absence', 'Absent'],
]);

function normalizeKey(key = '') {
  return String(key).trim().replace(/[\s-]+/g, '_').toLowerCase();
}

function normalizeRow(row = {}) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeKey(key), value])
  );
}

function numberFrom(row, names, fallback = 0) {
  for (const name of names) {
    const value = row[normalizeKey(name)];
    if (value === undefined || value === null || value === '') continue;
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function stringFrom(row, names, fallback = '') {
  for (const name of names) {
    const value = row[normalizeKey(name)];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return fallback;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch !== '\r') {
      cell += ch;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== '')) rows.push(row);
  if (!rows.length) return [];

  const headers = rows[0].map(normalizeKey);
  return rows.slice(1)
    .filter((values) => values.some((value) => String(value).trim() !== ''))
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

function readRows(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  if (path.extname(filePath).toLowerCase() === '.json') {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new Error('Training JSON must be an array of rows.');
    }
    return parsed.map(normalizeRow);
  }
  return parseCsv(text).map(normalizeRow);
}

function hashIdentifier(value, salt = '') {
  if (!value) return '';
  return crypto.createHash('sha256')
    .update(`${salt}:${value}`)
    .digest('hex')
    .slice(0, 24);
}

function normalizeLabel(value) {
  if (value === undefined || value === null || value === '') return null;
  const raw = String(value).trim().toLowerCase();
  if (['0', '1', '2'].includes(raw)) return Number(raw);
  if (raw === '3') return CLASS_LABELS.indexOf('High');
  const normalized = normalizeRiskLevel(value, '');
  const index = CLASS_LABELS.findIndex((tier) => tier.toLowerCase() === normalized.toLowerCase());
  if (index >= 0) return index;
  return null;
}

function signalsFromAggregated(row) {
  return {
    attendanceRate: numberFrom(row, ['attendance_rate', 'attendanceRate', 'rate']),
    consecutiveAbsences: numberFrom(row, ['consecutive_absences', 'consecutiveAbsences', 'absence_streak']),
    totalAbsences: numberFrom(row, ['total_absences', 'totalAbsences', 'absent_count', 'absences']),
    lateCount: numberFrom(row, ['late_count', 'lateCount', 'tardy_count', 'tardies']),
    last7DayAbsences: numberFrom(row, ['last7_day_absences', 'last7DayAbsences', 'last_7_absences']),
    last30DayAbsences: numberFrom(row, ['last30_day_absences', 'last30DayAbsences', 'last_30_absences']),
    worstWeekdayAbsenceRate: numberFrom(row, [
      'worst_weekday_absence_rate',
      'worstWeekdayAbsenceRate',
      'weekday_absence_rate',
    ]),
  };
}

function hasAggregatedColumns(row) {
  return ['attendance_rate', 'attendancerate', 'total_absences', 'absences', 'late_count']
    .some((key) => row[normalizeKey(key)] !== undefined);
}

function normalizedStatus(value) {
  return STATUS_MAP.get(normalizeKey(value)) || null;
}

function rawRowsToSamples(rows, thresholds, salt) {
  const groups = new Map();
  for (const row of rows) {
    const studentKey = stringFrom(row, ['student_id', 'student_number', 'studentId', 'studentNumber']);
    const status = normalizedStatus(stringFrom(row, ['status', 'attendance_status']));
    if (!studentKey || !status) continue;
    if (!groups.has(studentKey)) groups.set(studentKey, []);
    groups.get(studentKey).push({
      date: new Date(stringFrom(row, ['date', 'session_date', 'timestamp'], new Date().toISOString())),
      status,
      label: normalizeLabel(stringFrom(row, ['risk_label', 'risk_level', 'label'])),
    });
  }

  return [...groups.entries()].map(([studentKey, records]) => {
    const sorted = records
      .filter((record) => !Number.isNaN(record.date.getTime()))
      .sort((a, b) => a.date - b.date);
    const total = sorted.length || 1;
    const present = sorted.filter((record) => record.status === 'Present' || record.status === 'Late').length;
    const absent = sorted.filter((record) => record.status === 'Absent').length;
    const late = sorted.filter((record) => record.status === 'Late').length;

    let consecutiveAbsences = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].status === 'Absent') consecutiveAbsences++;
      else break;
    }

    const maxDate = sorted[sorted.length - 1]?.date || new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const last7DayAbsences = sorted.filter((record) => (
      record.status === 'Absent' && (maxDate - record.date) <= 7 * dayMs
    )).length;
    const last30DayAbsences = sorted.filter((record) => (
      record.status === 'Absent' && (maxDate - record.date) <= 30 * dayMs
    )).length;

    const weekdayTotals = Array(7).fill(0);
    const weekdayAbsences = Array(7).fill(0);
    for (const record of sorted) {
      const day = record.date.getDay();
      weekdayTotals[day]++;
      if (record.status === 'Absent') weekdayAbsences[day]++;
    }
    const worstWeekdayAbsenceRate = weekdayTotals.reduce((best, count, day) => {
      if (count < 3) return best;
      return Math.max(best, weekdayAbsences[day] / count);
    }, 0);

    const signals = {
      attendanceRate: Math.round((present / total) * 100),
      consecutiveAbsences,
      totalAbsences: absent,
      lateCount: late,
      last7DayAbsences,
      last30DayAbsences,
      worstWeekdayAbsenceRate,
    };

    const explicitLabel = [...sorted].reverse().find((record) => record.label !== null)?.label;
    return {
      features: extractFeatures(signals),
      label: explicitLabel ?? labelFor(signals, thresholds),
      signals,
      subjectHash: hashIdentifier(studentKey, salt),
    };
  });
}

function aggregatedRowsToSamples(rows, thresholds, salt) {
  return rows.map((row) => {
    const signals = signalsFromAggregated(row);
    const explicitLabel = normalizeLabel(stringFrom(row, ['risk_label', 'risk_level', 'label']));
    const studentKey = stringFrom(row, ['student_id', 'student_number', 'studentId', 'studentNumber']);
    return {
      features: extractFeatures(signals),
      label: explicitLabel ?? labelFor(signals, thresholds),
      signals,
      subjectHash: hashIdentifier(studentKey, salt),
    };
  });
}

function labelDistribution(labels) {
  const counts = Object.fromEntries(CLASS_LABELS.map((tier) => [tier, 0]));
  for (const label of labels) counts[CLASS_LABELS[label]] += 1;
  return counts;
}

function loadHistoricalDataset(filePath, options = {}) {
  const thresholds = options.thresholds || DEFAULT_THRESHOLDS;
  const salt = options.salt || process.env.ATTENDIT_HASH_SALT || 'attend-it-local-training';
  const rows = readRows(filePath);
  const samples = rows.some(hasAggregatedColumns)
    ? aggregatedRowsToSamples(rows, thresholds, salt)
    : rawRowsToSamples(rows, thresholds, salt);

  const valid = samples.filter((sample) => (
    sample.features.every(Number.isFinite)
      && Number.isInteger(sample.label)
      && sample.label >= 0
      && sample.label < CLASS_LABELS.length
  ));

  if (valid.length < 20) {
    throw new Error(`Need at least 20 valid student samples for real training; found ${valid.length}.`);
  }

  const X = valid.map((sample) => sample.features);
  const y = valid.map((sample) => sample.label);
  const dataHash = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');

  return {
    X,
    y,
    classes: CLASS_LABELS,
    samples: valid,
    stats: {
      sourceFile: path.basename(filePath),
      sourceFormat: path.extname(filePath).toLowerCase() === '.json' ? 'json' : 'csv',
      rowCount: rows.length,
      sampleCount: valid.length,
      dataHash,
      labelDistribution: labelDistribution(y),
      sensitiveColumnsExcluded: SENSITIVE_COLUMNS,
      identifiersHashed: true,
    },
  };
}

module.exports = {
  hashIdentifier,
  loadHistoricalDataset,
  parseCsv,
};
