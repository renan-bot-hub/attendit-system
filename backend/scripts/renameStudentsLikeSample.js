const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Section = require('../models/Section');

const DEFAULT_GRADE_CODE = 'G';
const DEFAULT_START = 20;
const DEFAULT_STUDENT_DOMAIN = 'holyheart.edu.ph';
const DEFAULT_PARENT_DOMAIN = 'school.edu';

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

const DEFAULT_SECTION_PLANS = [
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
    apply: false,
    gradeCode: DEFAULT_GRADE_CODE,
    start: DEFAULT_START,
    studentDomain: DEFAULT_STUDENT_DOMAIN,
    parentDomain: DEFAULT_PARENT_DOMAIN,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const [key, inlineValue] = arg.split('=');
    const value = inlineValue !== undefined ? inlineValue : argv[i + 1];

    if (arg === '--apply') {
      options.apply = true;
    } else if (key === '--grade') {
      options.gradeCode = String(value || DEFAULT_GRADE_CODE).trim().toUpperCase();
      if (inlineValue === undefined) i++;
    } else if (key === '--start') {
      options.start = parsePositiveInt(value, 'start');
      if (inlineValue === undefined) i++;
    } else if (key === '--student-domain') {
      options.studentDomain = normalizeDomain(value, 'student-domain');
      if (inlineValue === undefined) i++;
    } else if (key === '--parent-domain') {
      options.parentDomain = normalizeDomain(value, 'parent-domain');
      if (inlineValue === undefined) i++;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  if (!/^[A-Z0-9]+$/.test(options.gradeCode)) {
    throw new Error('--grade must contain only letters and numbers, for example G.');
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

function normalizeDomain(value, label) {
  const domain = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    throw new Error(`--${label} must be a valid domain, for example holyheart.edu.ph.`);
  }
  return domain;
}

function printHelp() {
  console.log(`
Usage:
  npm run students:rename
  npm run students:rename -- --apply

Options:
  --apply                    Write changes to MongoDB. Without this, only a preview is shown.
  --grade=G                  Student ID grade prefix. Default: ${DEFAULT_GRADE_CODE}
  --start=20                 Starting number. Default: ${DEFAULT_START}
  --student-domain=DOMAIN    Student email domain. Default: ${DEFAULT_STUDENT_DOMAIN}
  --parent-domain=DOMAIN     Parent email domain. Default: ${DEFAULT_PARENT_DOMAIN}

Example output pattern:
  Jerome Santiago | G7-020 | Santiago Parent | santiago.parent@school.edu | jeromesantiago@holyheart.edu.ph
`);
}

function gradeNumber(value = '') {
  const match = String(value).match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
}

function sectionComparator(a, b) {
  const gradeDiff = gradeNumber(a.gradeLevel) - gradeNumber(b.gradeLevel);
  if (gradeDiff) return gradeDiff;
  return String(a.section || a.name || '').localeCompare(String(b.section || b.name || ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
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

function personName(index) {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
  const cycle = Math.floor(index / (FIRST_NAMES.length * LAST_NAMES.length));

  return {
    first,
    last,
    suffix: cycle > 0 ? String(cycle + 1) : '',
  };
}

function makeStudentData(index, options, sectionPlan) {
  const sequence = options.start + index;
  const { first, last, suffix } = personName(index);
  const displayLast = suffix ? `${last} ${suffix}` : last;
  const name = `${first} ${displayLast}`;
  const studentId = `${gradeCodeFor(sectionPlan.gradeLevel, options.gradeCode)}-${String(sequence).padStart(3, '0')}`;
  const emailSuffix = suffix || '';
  const studentEmail = `${cleanLocalPart(`${first}${last}`)}${emailSuffix}@${options.studentDomain}`;
  const parentLocal = `${cleanLocalPart(last)}.parent${emailSuffix}`;

  return {
    name,
    email: studentEmail,
    studentId,
    studentNumber: studentId,
    gradeLevel: sectionPlan.gradeLevel,
    section: sectionPlan.section,
    gradeSection: sectionPlan.section,
    parentName: `${last} Parent${suffix ? ` ${suffix}` : ''}`,
    parentEmail: `${parentLocal}@${options.parentDomain}`,
  };
}

async function loadSectionPlans() {
  const sections = await Section.find({ isActive: { $ne: false } })
    .select('name gradeLevel')
    .lean();

  if (!sections.length) return DEFAULT_SECTION_PLANS;

  return sections
    .map((section) => ({
      section: section.name,
      gradeLevel: section.gradeLevel,
    }))
    .sort(sectionComparator);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await connectDB();

  const students = await User.find({ role: 'student' })
    .select('_id name email studentId studentNumber gradeLevel parentName parentEmail')
    .sort({ createdAt: 1, _id: 1 });

  if (!students.length) {
    console.log('No student records found.');
    return;
  }

  const sectionPlans = await loadSectionPlans();
  const updates = students.map((student, index) => ({
    student,
    next: makeStudentData(index, options, sectionPlans[index % sectionPlans.length]),
  }));

  console.log(`Found ${updates.length} student record${updates.length === 1 ? '' : 's'}.`);
  console.log(`Assigning students across ${sectionPlans.length} grade-level section${sectionPlans.length === 1 ? '' : 's'}.`);
  console.log(options.apply ? 'Applying updates...' : 'Preview only. Add --apply to write changes.');

  for (const { student, next } of updates.slice(0, 10)) {
    console.log(
      `${student.studentId || '(no ID)'} -> ${next.name} | ${next.studentId} | ${next.parentName} | ${next.parentEmail} | ${next.email}`
      + ` | ${next.gradeLevel} / ${next.section}`
    );
  }
  if (updates.length > 10) {
    console.log(`...and ${updates.length - 10} more.`);
  }

  if (!options.apply) return;

  const result = await User.bulkWrite(updates.map(({ student, next }) => ({
    updateOne: {
      filter: { _id: student._id, role: 'student' },
      update: { $set: next },
    },
  })), { ordered: false });

  console.log(`Students matched: ${result.matchedCount || 0}`);
  console.log(`Students updated: ${result.modifiedCount || 0}`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
