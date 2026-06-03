const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Section = require('../models/Section');
const { gradeNumber, sameGrade, sectionComparator } = require('../utils/sectionPlacement');

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
  npm run students:assign-sections
  npm run students:assign-sections -- --apply

What it does:
  Finds student records with a grade level and assigns them to the least-filled
  active section for that grade. Existing valid section assignments are kept.
`);
}

function hasValidSection(student, sectionByName) {
  if (!student.section) return false;
  const section = sectionByName.get(student.section);
  return Boolean(section && sameGrade(section.gradeLevel, student.gradeLevel));
}

function chooseSectionForGrade(gradeLevel, sections, counts) {
  const candidates = sections
    .filter((section) => sameGrade(section.gradeLevel, gradeLevel))
    .sort((a, b) => {
      const countDiff = (counts.get(a.name) || 0) - (counts.get(b.name) || 0);
      if (countDiff) return countDiff;
      return sectionComparator(a, b);
    });

  return candidates[0] || null;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await connectDB();

  const sections = await Section.find({ isActive: { $ne: false } })
    .select('name gradeLevel')
    .lean();
  const sectionByName = new Map(sections.map((section) => [section.name, section]));

  if (!sections.length) {
    console.log('No active sections found. Create sections first.');
    return;
  }

  const students = await User.find({
    role: 'student',
    gradeLevel: { $type: 'string', $ne: '' },
  })
    .select('_id name studentId section gradeLevel gradeSection')
    .sort({ gradeLevel: 1, studentId: 1, name: 1 });

  const counts = new Map();
  for (const student of students) {
    if (hasValidSection(student, sectionByName)) {
      counts.set(student.section, (counts.get(student.section) || 0) + 1);
    }
  }

  const updates = [];
  for (const student of students) {
    if (hasValidSection(student, sectionByName)) continue;

    const section = chooseSectionForGrade(student.gradeLevel, sections, counts);
    if (!section) continue;

    counts.set(section.name, (counts.get(section.name) || 0) + 1);
    updates.push({
      student,
      section,
    });
  }

  console.log(`Found ${students.length} student record${students.length === 1 ? '' : 's'} with grade levels.`);
  console.log(`Students needing section assignment: ${updates.length}.`);
  console.log(options.apply ? 'Applying updates...' : 'Preview only. Add --apply to write changes.');

  for (const { student, section } of updates.slice(0, 20)) {
    console.log(
      `${student.studentId || '(no ID)'} ${student.name} | ${student.gradeLevel} -> ${section.name}`
    );
  }
  if (updates.length > 20) console.log(`...and ${updates.length - 20} more.`);

  if (!options.apply || !updates.length) return;

  const result = await User.bulkWrite(updates.map(({ student, section }) => ({
    updateOne: {
      filter: { _id: student._id, role: 'student' },
      update: {
        $set: {
          section: section.name,
          gradeLevel: section.gradeLevel || student.gradeLevel,
          gradeSection: section.name,
        },
      },
    },
  })), { ordered: false });

  console.log(`Students matched: ${result.matchedCount || 0}`);
  console.log(`Students updated: ${result.modifiedCount || 0}`);

  const gradeSummary = new Map();
  for (const section of sections.sort(sectionComparator)) {
    const grade = section.gradeLevel || `Grade ${gradeNumber(section.name) || 'Unknown'}`;
    const row = gradeSummary.get(grade) || [];
    row.push(`${section.name}: ${counts.get(section.name) || 0}`);
    gradeSummary.set(grade, row);
  }

  console.log('Updated section distribution:');
  for (const [grade, rows] of gradeSummary.entries()) {
    console.log(`  ${grade} - ${rows.join(', ')}`);
  }
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
