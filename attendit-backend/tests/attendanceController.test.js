const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const { scanQR } = require('../controllers/attendanceController');
const { mockResponse, withMocked } = require('./helpers');

const parentId = '507f1f77bcf86cd799439011';
const studentId = '507f1f77bcf86cd799439012';
const sessionId = '507f1f77bcf86cd799439013';

function makeUser(doc) {
  return {
    ...doc,
    select: async () => doc,
  };
}

test('parent token scan records attendance for the linked student, not the parent account', async () => {
  const student = {
    _id: studentId,
    role: 'student',
    isActive: true,
    section: 'Grade 7 - A',
    studentNumber: 'S-001',
    parentEmail: 'parent@example.com',
  };
  const parent = makeUser({
    _id: parentId,
    role: 'parent',
    email: 'parent@example.com',
    studentNumber: 'S-001',
  });
  const created = [];

  await withMocked(jwt, {
    verify: () => ({ sessionId }),
  }, async () => withMocked(User, {
    findById: () => parent,
    find: async () => [student],
  }, async () => withMocked(Session, {
    findById: async () => ({
      _id: sessionId,
      active: true,
      section: 'Grade 7 - A',
      teacherId: '507f1f77bcf86cd799439014',
    }),
  }, async () => withMocked(Attendance, {
    findOne: async () => null,
    create: async (doc) => {
      created.push(doc);
      return doc;
    },
  }, async () => {
    const req = {
      user: { id: parentId, role: 'parent' },
      body: { token: 'signed-session-token' },
    };
    const res = mockResponse();

    await scanQR(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, 'Attendance recorded');
    assert.equal(String(created[0].studentId), studentId);
    assert.notEqual(String(created[0].studentId), parentId);
  }))));
});
