const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Section = require('../models/Section');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');

const DEFAULT_COUNT = 200;
const DEFAULT_SESSIONS_PER_SECTION = 20;
const DEFAULT_PREFIX = 'G';

const FIRST_NAMES = [
  'Jerome', 'Angela', 'Marco', 'Hannah', 'Carlo', 'Sofia', 'Rafael', 'Bianca',
  'Miguel', 'Patricia', 'Gabriel', 'Lara', 'Adrian', 'Jasmine', 'Emmanuel',
  'Nina', 'Kyle', 'Fatima', 'Theo', 'Danica', 'Isaac', 'Aaliyah',
];

const LAST_NAMES = [
  'Santiago', 'Reyes', 'Dela Cruz', 'Garcia', 'Mendoza', 'Bautista',
  'Villanueva', 'Santos', 'Torres', 'Navarro', 'Ramos', 'Flores',
  'Cruz', 'Lim', 'Perez', 'Ocampo', 'Hernandez', 'Jimenez',
  'Ignacio', 'Quizon', 'Abad', 'Escobar',
];

const SECTION_PLANS = [
  { gradeLevel: 'Grade 7', section: '7 - A' },
  { gradeLevel: 'Grade 7', section: '7 - B' },
  { gradeLevel: 'Grade 8', section: '8 - A' },
  { gradeLevel: 'Grade 8', section: '8 - B' },
  { gradeLevel: 'Grade 9', section: '9 - A' },
  { gradeLevel: 'Grade 9', section: '9 - B' },
  { gradeLevel: 'Grade 10', section: '10 - A' },
  { gradeLevel: 'Grade 10', section: '10 - B' },
  { gradeLevel: 'Grade 11', section: '11 - A' },
  { gradeLevel: 'Grade 11', section: '11 - B' },
  { gradeLevel: 'Grade 12', section: '12 - GAS' },
];

function parseArgs(argv) {
  const options = {
    count: DEFAULT_COUNT,
    sessionsPerSection: DEFAULT_SESSIONS_PER_SECTION,
    prefix: DEFAULT_PREFIX,
    dryRun: false,
    withAttendance: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const [key, inlineValue] = arg.split('=');
    const nextValue = inlineValue !== undefined ? inlineValue : argv[i + 1];

    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--with-attendance') {
      options.withAttendance = true;
    } else if (key === '--count') {
      options.count = parsePositiveInt(nextValue, 'count');
      if (inlineValue === undefined) i++;
    } else if (key === '--sessions') {
      options.sessionsPerSection = parsePositiveInt(nextValue, 'sessions');
      if (inlineValue === undefined) i++;
    } else if (key === '--prefix') {
      options.prefix = String(nextValue || DEFAULT_PREFIX).trim() || DEFAULT_PREFIX;
      if (inlineValue === undefined) i++;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  if (options.count > 5000) {
    throw new Error('Refusing to generate more than 5000 students in one run.');
  }

  return options;
}

function parsePositiveInt(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`--${label} must be a positive integer.`);
  }
  return parsed;
}

function printHelp() {
  console.log(`
Usage:
  npm run seed:test-students
  npm run seed:test-students -- --count=200 --with-attendance

Options:
  --count=N            Number of students to upsert. Default: ${DEFAULT_COUNT}
  --with-attendance    Also create sessions and attendance records for AI testing.
  --sessions=N         Sessions per section when using --with-attendance. Default: ${DEFAULT_SESSIONS_PER_SECTION}
  --prefix=TEXT        Student ID grade prefix. Default: ${DEFAULT_PREFIX}
  --dry-run            Print a preview without writing to MongoDB.
`);
}

function gradeNumber(value = '') {
  const match = String(value).match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
}

function gradeCodeFor(gradeLevel, fallbackPrefix) {
  const grade = gradeNumber(gradeLevel);
  if (grade !== Number.MAX_SAFE_INTEGER) return `${fallbackPrefix}${grade}`;
  return fallbackPrefix;
}

function cleanLocalPart(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function makeStudentPlans(count, prefix) {
  return Array.from({ length: count }, (_, index) => {
    const sequence = index + 20;
    const padded = String(sequence).padStart(3, '0');
    const sectionPlan = SECTION_PLANS[index % SECTION_PLANS.length];
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
    const studentNumber = `${gradeCodeFor(sectionPlan.gradeLevel, prefix)}-${padded}`;
    const cycle = Math.floor(index / (FIRST_NAMES.length * LAST_NAMES.length));
    const emailSuffix = cycle > 0 ? String(cycle + 1) : '';
    const displayLastName = cycle > 0 ? `${lastName} ${cycle + 1}` : lastName;

    return {
      name: `${firstName} ${displayLastName}`,
      email: `${cleanLocalPart(`${firstName}${lastName}`)}${emailSuffix}@holyheart.edu.ph`,
      password: null,
      role: 'student',
      studentId: studentNumber,
      studentNumber,
      section: sectionPlan.section,
      gradeLevel: sectionPlan.gradeLevel,
      gradeSection: sectionPlan.section,
      parentName: `${lastName} Parent${cycle > 0 ? ` ${cycle + 1}` : ''}`,
      parentEmail: `${cleanLocalPart(lastName)}.parent${emailSuffix}@school.edu`,
      parentPhone: `+63917${String(1000000 + sequence).slice(-7)}`,
      isActive: true,
    };
  });
}

async function upsertSections(studentPlans) {
  const sections = [...new Map(studentPlans.map((student) => [
    student.section,
    { name: student.section, gradeLevel: student.gradeLevel, isActive: true },
  ])).values()];

  if (!sections.length) return { upserted: 0, modified: 0 };

  const result = await Section.bulkWrite(sections.map((section) => ({
    updateOne: {
      filter: { name: section.name },
      update: { $set: section },
      upsert: true,
    },
  })), { ordered: false });

  return {
    upserted: result.upsertedCount || 0,
    modified: result.modifiedCount || 0,
  };
}

async function upsertStudents(studentPlans) {
  const placeholderPassword = await bcrypt.hash(User.generateQrToken(), 10);
  const result = await User.bulkWrite(studentPlans.map((student) => ({
    updateOne: {
      filter: { email: student.email },
      update: {
        $set: {
          name: student.name,
          role: student.role,
          studentId: student.studentId,
          studentNumber: student.studentNumber,
          section: student.section,
          gradeLevel: student.gradeLevel,
          gradeSection: student.gradeSection,
          parentName: student.parentName,
          parentEmail: student.parentEmail,
          parentPhone: student.parentPhone,
          contactNumber: student.parentPhone,
          isActive: true,
        },
        $setOnInsert: {
          email: student.email,
          password: placeholderPassword,
          qrCode: User.generateQrToken(),
        },
      },
      upsert: true,
    },
  })), { ordered: false });

  return {
    upserted: result.upsertedCount || 0,
    modified: result.modifiedCount || 0,
    matched: result.matchedCount || 0,
  };
}

async function findSessionOwner() {
  return User.findOne({
    role: { $in: ['teacher', 'admin', 'staff'] },
    isActive: { $ne: false },
  }).select('_id role email');
}

function dateDaysAgo(daysAgo) {
  const date = new Date();
  date.setHours(8, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

async function upsertSessions(studentPlans, sessionsPerSection) {
  const owner = await findSessionOwner();
  if (!owner) {
    throw new Error('No active admin, teacher, or staff account found for seeded sessions.');
  }

  const sectionNames = [...new Set(studentPlans.map((student) => student.section))];
  const sessionDocs = [];

  for (const section of sectionNames) {
    for (let index = 0; index < sessionsPerSection; index++) {
      const slot = String(index + 1).padStart(2, '0');
      sessionDocs.push({
        className: `[TEST] Homeroom ${slot}`,
        section,
        subject: 'Seeded Attendance',
        date: dateDaysAgo(sessionsPerSection - index),
        active: false,
        teacherId: owner._id,
      });
    }
  }

  const bulkResult = await Session.bulkWrite(sessionDocs.map((session) => ({
    updateOne: {
      filter: {
        className: session.className,
        section: session.section,
        subject: session.subject,
      },
      update: { $set: session },
      upsert: true,
    },
  })), { ordered: false });

  const sessions = await Session.find({
    subject: 'Seeded Attendance',
    className: /^\[TEST\] Homeroom /,
    section: { $in: sectionNames },
  }).select('_id className section date');

  return {
    owner,
    sessions,
    upserted: bulkResult.upsertedCount || 0,
    modified: bulkResult.modifiedCount || 0,
  };
}

function statusForStudent(studentNumber, sessionIndex, totalSessions) {
  const numericId = Number.parseInt(String(studentNumber).match(/(\d+)$/)?.[1] || '0', 10);
  const profile = numericId % 10;
  const isRecent = sessionIndex >= totalSessions - 5;

  if (profile === 0) return isRecent || sessionIndex % 3 === 0 ? 'Absent' : 'Present';
  if (profile === 1) return sessionIndex % 2 === 0 ? 'Absent' : 'Present';
  if (profile === 2) return sessionIndex % 3 !== 0 ? 'Late' : 'Present';
  if (profile === 3) return sessionIndex % 5 === 0 ? 'Absent' : 'Present';
  if (profile === 4) return sessionIndex % 4 === 0 ? 'Late' : 'Present';
  return sessionIndex % 13 === 0 ? 'Absent' : 'Present';
}

async function upsertAttendance(studentPlans, sessions) {
  const studentDocs = await User.find({
    email: { $in: studentPlans.map((student) => student.email) },
    role: 'student',
  }).select('_id email studentNumber section');

  const studentsByEmail = new Map(studentDocs.map((student) => [student.email, student]));
  const sessionsBySection = new Map();
  for (const session of sessions) {
    const bucket = sessionsBySection.get(session.section) || [];
    bucket.push(session);
    sessionsBySection.set(session.section, bucket);
  }

  const ops = [];
  for (const plan of studentPlans) {
    const student = studentsByEmail.get(plan.email);
    if (!student) continue;

    const sectionSessions = (sessionsBySection.get(plan.section) || [])
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let index = 0; index < sectionSessions.length; index++) {
      const session = sectionSessions[index];
      const status = statusForStudent(plan.studentNumber, index, sectionSessions.length);
      ops.push({
        updateOne: {
          filter: { studentId: student._id, sessionId: session._id },
          update: {
            $set: {
              studentId: student._id,
              sessionId: session._id,
              status,
              markedBy: 'Auto',
              notes: 'Seeded test attendance',
              timestamp: session.date,
            },
          },
          upsert: true,
        },
      });
    }
  }

  if (!ops.length) return { upserted: 0, modified: 0, matched: 0 };

  const result = await Attendance.bulkWrite(ops, { ordered: false });
  return {
    upserted: result.upsertedCount || 0,
    modified: result.modifiedCount || 0,
    matched: result.matchedCount || 0,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const studentPlans = makeStudentPlans(options.count, options.prefix);
  const sections = [...new Set(studentPlans.map((student) => student.section))];

  console.log(`Preparing ${studentPlans.length} test students across ${sections.length} sections.`);
  console.log(`Student ID prefix: ${options.prefix}`);
  console.log(`Sample: ${studentPlans[0].studentId} - ${studentPlans[0].name} - ${studentPlans[0].section}`);

  if (options.dryRun) {
    console.log('Dry run only. No database writes were made.');
    return;
  }

  await connectDB();

  const sectionResult = await upsertSections(studentPlans);
  console.log(`Sections upserted: ${sectionResult.upserted}, updated: ${sectionResult.modified}`);

  const studentResult = await upsertStudents(studentPlans);
  console.log(`Students inserted: ${studentResult.upserted}, updated: ${studentResult.modified}, matched: ${studentResult.matched}`);

  if (options.withAttendance) {
    const sessionResult = await upsertSessions(studentPlans, options.sessionsPerSection);
    console.log(
      `Sessions inserted: ${sessionResult.upserted}, updated: ${sessionResult.modified}, owner: ${sessionResult.owner.email || sessionResult.owner.role}`
    );

    const attendanceResult = await upsertAttendance(studentPlans, sessionResult.sessions);
    console.log(
      `Attendance rows inserted: ${attendanceResult.upserted}, updated: ${attendanceResult.modified}, matched: ${attendanceResult.matched}`
    );
  } else {
    console.log('Skipped attendance history. Add --with-attendance when you want AI/risk test data.');
  }

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
