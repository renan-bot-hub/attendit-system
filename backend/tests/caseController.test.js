const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const Session = require('../models/Session');
const Case = require('../models/Case');
const { createCase, getSummary } = require('../controllers/caseController');
const { mockResponse, withMocked } = require('./helpers');

const teacherId = '507f1f77bcf86cd799439201';
const studentId = '507f1f77bcf86cd799439202';

test('teacher cannot create a case for a student outside assigned sections', async () => {
  let created = false;

  await withMocked(User, {
    findById: async () => ({
      _id: studentId,
      role: 'student',
      section: 'Grade 8 - B',
    }),
  }, async () => withMocked(Session, {
    find: () => ({
      select: async () => [{ section: 'Grade 7 - A' }],
    }),
  }, async () => withMocked(Case, {
    create: async () => {
      created = true;
      return {};
    },
  }, async () => {
    const req = {
      user: { id: teacherId, role: 'teacher' },
      body: {
        studentId,
        description: 'Attendance issue',
      },
    };
    const res = mockResponse();

    await createCase(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(created, false);
  })));
});

test('case summary is scoped for teachers', async () => {
  const filters = [];

  await withMocked(User, {
    find: () => ({
      select: async () => [{ _id: studentId }],
    }),
  }, async () => withMocked(Session, {
    find: () => ({
      select: async () => [{ section: 'Grade 7 - A' }],
    }),
  }, async () => withMocked(Case, {
    countDocuments: async (filter = {}) => {
      filters.push(filter);
      return 1;
    },
  }, async () => {
    const req = { user: { id: teacherId, role: 'teacher' }, query: {} };
    const res = mockResponse();

    await getSummary(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.total, 1);
    assert.ok(filters.every((filter) => filter.student));
  })));
});
