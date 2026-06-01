const User = require('../models/User');

const STAFF_ROLES = ['admin', 'teacher', 'staff'];

function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

function normalizePhone(phone = '') {
  return String(phone).replace(/[^\d+]/g, '').trim();
}

function normalizeText(value = '') {
  return String(value).trim().toLowerCase();
}

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function asId(value) {
  return value?._id ? String(value._id) : String(value || '');
}

function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

function canManageStaffData(user) {
  return user && isStaffRole(user.role);
}

function canManageSession(user, session) {
  if (!user || !session) return false;
  if (user.role === 'admin' || user.role === 'staff') return true;
  return user.role === 'teacher' && asId(session.teacherId) === asId(user.id);
}

function collectUserSections(user = {}) {
  return [user.section, user.gradeSection]
    .map(normalizeText)
    .filter(Boolean);
}

async function getTeacherSectionNames(user = {}) {
  if (!user || user.role !== 'teacher') return [];

  const sections = new Set(collectUserSections(user));

  const Session = require('../models/Session');
  const sessions = await Session.find({ teacherId: user.id }).select('section');
  for (const session of sessions) {
    const section = normalizeText(session.section);
    if (section) sections.add(section);
  }

  return [...sections];
}

async function getStudentScopeForUser(user = {}) {
  if (!user) return { _id: { $in: [] } };
  if (user.role === 'admin' || user.role === 'staff') return {};

  if (user.role === 'teacher') {
    const sections = await getTeacherSectionNames(user);
    if (!sections.length) return { _id: { $in: [] } };
    const sectionPatterns = sections.map((section) => new RegExp(`^${escapeRegex(section)}$`, 'i'));
    return {
      $or: [
        { section: { $in: sectionPatterns } },
        { gradeSection: { $in: sectionPatterns } },
      ],
    };
  }

  if (user.role === 'parent') {
    const students = await findStudentsForParentUser(user.id);
    return { _id: { $in: students.map((student) => student._id) } };
  }

  return { _id: { $in: [] } };
}

async function buildScopedStudentQuery(user = {}, extra = {}) {
  const scope = await getStudentScopeForUser(user);
  return {
    role: 'student',
    isActive: true,
    ...extra,
    ...scope,
  };
}

async function getAccessibleStudentIds(user = {}, extra = {}) {
  const students = await User.find(await buildScopedStudentQuery(user, extra)).select('_id');
  return students.map((student) => student._id);
}

async function userCanAccessStudent(user = {}, student = {}) {
  if (!user || !student) return false;
  if (user.role === 'admin' || user.role === 'staff') return true;
  if (user.role === 'parent') {
    const parent = await getParentUser(user.id);
    return Boolean(parent && studentBelongsToParent(parent, student));
  }
  if (user.role === 'teacher') {
    const sections = await getTeacherSectionNames(user);
    const studentSections = [student.section, student.gradeSection].map(normalizeText).filter(Boolean);
    return studentSections.some((section) => sections.includes(section));
  }
  return false;
}

function buildParentStudentQuery(identity = {}) {
  const parentEmail = normalizeEmail(identity.parentEmail || identity.email);
  const parentPhone = normalizePhone(identity.parentPhone || identity.contactNumber);
  const studentNumber = normalizeText(identity.studentNumber || identity.studentId);
  const or = [];

  if (parentEmail) or.push({ parentEmail });
  if (parentPhone) {
    or.push({ parentPhone });
    or.push({ contactNumber: parentPhone });
  }
  if (studentNumber) {
    or.push({ studentId: studentNumber });
    or.push({ studentNumber });
  }

  if (!or.length) return null;

  return {
    role: 'student',
    isActive: true,
    $or: or,
  };
}

function studentBelongsToParent(parent = {}, student = {}) {
  const parentEmail = normalizeEmail(parent.parentEmail || parent.email);
  const studentParentEmail = normalizeEmail(student.parentEmail);
  if (parentEmail && studentParentEmail && parentEmail === studentParentEmail) return true;

  const parentPhone = normalizePhone(parent.parentPhone || parent.contactNumber);
  const studentParentPhone = normalizePhone(student.parentPhone || student.contactNumber);
  if (parentPhone && studentParentPhone && parentPhone === studentParentPhone) return true;

  const parentStudentNumber = normalizeText(parent.studentNumber || parent.studentId);
  const studentNumber = normalizeText(student.studentNumber || student.studentId);
  return Boolean(parentStudentNumber && studentNumber && parentStudentNumber === studentNumber);
}

async function findStudentsForParentIdentity(identity = {}) {
  const query = buildParentStudentQuery(identity);
  if (!query) return [];
  return User.find(query);
}

async function getParentUser(userId) {
  if (!userId) return null;
  const user = await User.findById(userId).select(
    'name email role studentId studentNumber parentEmail parentPhone contactNumber'
  );
  return user && user.role === 'parent' ? user : null;
}

async function findStudentsForParentUser(userId) {
  const parent = await getParentUser(userId);
  if (!parent) return [];
  return findStudentsForParentIdentity(parent);
}

module.exports = {
  STAFF_ROLES,
  asId,
  canManageSession,
  canManageStaffData,
  buildScopedStudentQuery,
  findStudentsForParentIdentity,
  findStudentsForParentUser,
  getAccessibleStudentIds,
  getParentUser,
  getStudentScopeForUser,
  getTeacherSectionNames,
  isStaffRole,
  normalizeEmail,
  normalizePhone,
  normalizeText,
  studentBelongsToParent,
  userCanAccessStudent,
};
