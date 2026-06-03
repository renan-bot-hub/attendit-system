const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const Attendance = require('../models/Attendance');
require('../models/Session');
const User = require('../models/User');
const { CLASS_LABELS, rawFeatureVector } = require('../ml/featureSpec');
const { DEFAULT_THRESHOLDS, labelFor } = require('../ml/dataset');

const DEFAULT_OUT = path.resolve(__dirname, '..', 'ml', 'private-data', 'historical-attendance.csv');

function parseArgs(argv) {
  const options = {
    out: DEFAULT_OUT,
    minRecords: 1,
    includeRuleLabels: true,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--out' && next) {
      options.out = path.resolve(process.cwd(), next);
      i++;
    } else if (arg === '--min-records' && next) {
      options.minRecords = Number(next) || options.minRecords;
      i++;
    } else if (arg === '--no-labels') {
      options.includeRuleLabels = false;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Usage:
  npm run ml:export:mongo
  npm run ml:export:mongo -- --out .\\ml\\private-data\\historical-attendance.csv
  npm run ml:export:mongo -- --min-records 3

What it does:
  Exports existing MongoDB attendance records into the anonymized training CSV
  shape expected by ml/train.js. The CSV contains only student identifiers and
  model feature columns, not names, emails, parent contacts, or passwords.

Options:
  --out <path>       Output CSV path.
  --min-records <n> Only export students with at least n attendance rows.
  --no-labels       Do not write rule-derived risk_label values.
`);
}

function csvEscape(value) {
  const text = value === undefined || value === null ? '' : String(value);
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function sortRecords(records) {
  return records
    .map((record) => {
      const sessionDate = record.sessionId?.date ? new Date(record.sessionId.date) : null;
      return {
        status: record.status,
        date: sessionDate && !Number.isNaN(sessionDate.getTime())
          ? sessionDate
          : new Date(record.timestamp || record.createdAt || Date.now()),
      };
    })
    .filter((record) => !Number.isNaN(record.date.getTime()))
    .sort((a, b) => a.date - b.date);
}

function signalsFromRecords(records) {
  const sorted = sortRecords(records);
  const total = sorted.length || 1;
  const presentOrLate = sorted.filter((record) => record.status === 'Present' || record.status === 'Late').length;
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

  return {
    attendanceRate: Math.round((presentOrLate / total) * 100),
    consecutiveAbsences,
    totalAbsences: absent,
    lateCount: late,
    last7DayAbsences,
    last30DayAbsences,
    worstWeekdayAbsenceRate,
  };
}

function studentKey(student) {
  return student.studentNumber || student.studentId || String(student._id);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await connectDB();

  const students = await User.find({ role: 'student', isActive: { $ne: false } })
    .select('_id studentId studentNumber')
    .lean();

  const records = await Attendance.find({ studentId: { $in: students.map((student) => student._id) } })
    .select('studentId sessionId status timestamp createdAt')
    .populate('sessionId', 'date')
    .lean();

  const recordsByStudent = new Map();
  for (const record of records) {
    const key = String(record.studentId);
    const row = recordsByStudent.get(key) || [];
    row.push(record);
    recordsByStudent.set(key, row);
  }

  const headers = [
    'student_id',
    'attendance_records',
    'attendance_rate',
    'consecutive_absences',
    'total_absences',
    'late_count',
    'last7_day_absences',
    'last30_day_absences',
    'worst_weekday_absence_rate',
  ];
  if (options.includeRuleLabels) headers.push('risk_label');

  const rows = [headers];
  for (const student of students) {
    const studentRecords = recordsByStudent.get(String(student._id)) || [];
    if (studentRecords.length < options.minRecords) continue;

    const signals = signalsFromRecords(studentRecords);
    const raw = rawFeatureVector(signals);
    const row = [
      studentKey(student),
      studentRecords.length,
      raw[0],
      raw[1],
      raw[2],
      raw[3],
      raw[4],
      raw[5],
      raw[6],
    ];

    if (options.includeRuleLabels) {
      row.push(CLASS_LABELS[labelFor(signals, DEFAULT_THRESHOLDS)]);
    }
    rows.push(row);
  }

  if (rows.length === 1) {
    throw new Error('No student attendance records were exported. Add attendance records first or lower --min-records.');
  }

  fs.mkdirSync(path.dirname(options.out), { recursive: true });
  fs.writeFileSync(options.out, rows.map((row) => row.map(csvEscape).join(',')).join('\n'));

  console.log(`Exported ${rows.length - 1} student training rows.`);
  console.log(`Output: ${options.out}`);
  console.log('Next: npm.cmd run ml:train -- --production --data .\\ml\\private-data\\historical-attendance.csv --salt "your-private-salt"');
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
