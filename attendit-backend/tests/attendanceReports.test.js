const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const { getSummary, getTrend, submitManual } = require('../controllers/attendanceController');
const { mockResponse, withMocked } = require('./helpers');

const teacherId = '507f1f77bcf86cd799439301';
const sessionId = '507f1f77bcf86cd799439302';
const studentId = '507f1f77bcf86cd799439303';

test('manual attendance rejects students outside the session section', async () => {
  let wrote = false;

  await withMocked(Session, {
    findById: async () => ({
      _id: sessionId,
      teacherId,
      section: 'Grade 7 - A',
    }),
  }, async () => withMocked(User, {
    find: async () => [{
      _id: studentId,
      role: 'student',
      isActive: true,
      section: 'Grade 8 - B',
    }],
  }, async () => withMocked(Attendance, {
    bulkWrite: async () => {
      wrote = true;
    },
  }, async () => {
    const req = {
      user: { id: teacherId, role: 'teacher' },
      body: {
        sessionId,
        records: [{ studentId, status: 'Present' }],
      },
    };
    const res = mockResponse();

    await submitManual(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /section/i);
    assert.equal(wrote, false);
  })));
});

test('attendance summary is scoped to teacher sessions and students', async () => {
  const attendanceFilters = [];

  await withMocked(Session, {
    find: () => ({
      select: async () => [{ _id: sessionId }],
    }),
  }, async () => withMocked(User, {
    find: () => ({
      select: async () => [{ _id: studentId }],
    }),
  }, async () => withMocked(Attendance, {
    countDocuments: async (filter) => {
      attendanceFilters.push(filter);
      return filter.status === 'Present' ? 2 : 0;
    },
  }, async () => {
    const req = { user: { id: teacherId, role: 'teacher' }, query: {} };
    const res = mockResponse();

    await getSummary(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.present, 2);
    assert.ok(attendanceFilters.every((filter) => filter.sessionId && filter.studentId));
  })));
});

test('attendance trend is scoped to teacher sessions and students', async () => {
  let receivedFilter = null;

  await withMocked(Session, {
    find: () => ({
      select: async () => [{ _id: sessionId }],
    }),
  }, async () => withMocked(User, {
    find: () => ({
      select: async () => [{ _id: studentId }],
    }),
  }, async () => withMocked(Attendance, {
    find: async (filter) => {
      receivedFilter = filter;
      return [];
    },
  }, async () => {
    const req = { user: { id: teacherId, role: 'teacher' }, query: { days: '3' } };
    const res = mockResponse();

    await getTrend(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.length, 3);
    assert.ok(receivedFilter.sessionId);
    assert.ok(receivedFilter.studentId);
  })));
});
