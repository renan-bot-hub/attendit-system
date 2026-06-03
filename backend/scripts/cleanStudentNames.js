const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

function parseArgs(argv) {
  const options = { apply: false };

  for (const arg of argv) {
    if (arg === '--apply') {
      options.apply = true;
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
  npm run students:clean-names
  npm run students:clean-names -- --apply

What it does:
  Removes grade/section labels from student name fields only.
  Example: "Grade 7 - A Jerome Santiago" -> "Jerome Santiago"
`);
}

function cleanStudentName(name = '') {
  let cleaned = String(name).trim();

  const patterns = [
    /\bgrade\s*(?:7|8|9|10|11|12)\b/gi,
    /\bg(?:7|8|9|10|11|12)\b/gi,
    /\b(?:7|8|9|10|11|12)\s*-\s*(?:[a-z]+|gas|humss|stem|abm)\b/gi,
    /\bsection\s+[a-z0-9-]+\b/gi,
    /\b(?:gas|humss|stem|abm)\b/gi,
  ];

  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, ' ');
  }

  cleaned = cleaned
    .replace(/[|,_]+/g, ' ')
    .replace(/\s*-\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || String(name).trim();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await connectDB();

  const students = await User.find({ role: 'student' })
    .select('_id name studentId gradeLevel section')
    .sort({ gradeLevel: 1, section: 1, name: 1 });

  const updates = students
    .map((student) => ({
      student,
      cleanedName: cleanStudentName(student.name),
    }))
    .filter(({ student, cleanedName }) => cleanedName && cleanedName !== student.name);

  console.log(`Found ${students.length} student record${students.length === 1 ? '' : 's'}.`);
  console.log(`Names needing cleanup: ${updates.length}.`);
  console.log(options.apply ? 'Applying updates...' : 'Preview only. Add --apply to write changes.');

  for (const { student, cleanedName } of updates.slice(0, 20)) {
    console.log(`${student.studentId || '(no ID)'} | "${student.name}" -> "${cleanedName}"`);
  }
  if (updates.length > 20) {
    console.log(`...and ${updates.length - 20} more.`);
  }

  if (!options.apply || !updates.length) return;

  const result = await User.bulkWrite(updates.map(({ student, cleanedName }) => ({
    updateOne: {
      filter: { _id: student._id, role: 'student' },
      update: { $set: { name: cleanedName } },
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
