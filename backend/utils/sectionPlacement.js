const Section = require('../models/Section');
const User = require('../models/User');

function gradeNumber(value = '') {
  const match = String(value).match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : null;
}

function sameGrade(a, b) {
  const left = gradeNumber(a);
  const right = gradeNumber(b);
  return left !== null && right !== null && left === right;
}

function sectionComparator(a, b) {
  const gradeDiff = (gradeNumber(a.gradeLevel) || 999) - (gradeNumber(b.gradeLevel) || 999);
  if (gradeDiff) return gradeDiff;
  return String(a.name || '').localeCompare(String(b.name || ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

async function findSectionsForGrade(gradeLevel) {
  if (!gradeLevel) return [];

  const sections = await Section.find({ isActive: { $ne: false } })
    .select('name gradeLevel')
    .lean();

  return sections
    .filter((section) => sameGrade(section.gradeLevel, gradeLevel))
    .sort(sectionComparator);
}

async function pickLeastFilledSection(gradeLevel) {
  const sections = await findSectionsForGrade(gradeLevel);
  if (!sections.length) return null;

  const counts = await User.aggregate([
    {
      $match: {
        role: 'student',
        section: { $in: sections.map((section) => section.name) },
      },
    },
    { $group: { _id: '$section', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((row) => [row._id, row.count]));

  return sections
    .map((section) => ({ ...section, studentCount: countMap.get(section.name) || 0 }))
    .sort((a, b) => {
      const countDiff = a.studentCount - b.studentCount;
      if (countDiff) return countDiff;
      return sectionComparator(a, b);
    })[0];
}

async function resolveStudentSection({ role, section, gradeLevel, gradeSection }) {
  if (role && role !== 'student') return { section, gradeLevel, gradeSection };

  if (section) {
    const existing = await Section.findOne({ name: section }).select('name gradeLevel').lean();
    return {
      section,
      gradeLevel: gradeLevel || existing?.gradeLevel || null,
      gradeSection: gradeSection || section,
    };
  }

  if (!gradeLevel) return { section, gradeLevel, gradeSection };

  const picked = await pickLeastFilledSection(gradeLevel);
  if (!picked) return { section, gradeLevel, gradeSection };

  return {
    section: picked.name,
    gradeLevel: picked.gradeLevel || gradeLevel,
    gradeSection: picked.name,
  };
}

module.exports = {
  findSectionsForGrade,
  gradeNumber,
  pickLeastFilledSection,
  resolveStudentSection,
  sameGrade,
  sectionComparator,
};
