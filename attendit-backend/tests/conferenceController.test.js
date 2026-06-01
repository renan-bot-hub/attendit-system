const test = require('node:test');
const assert = require('node:assert/strict');
const Conference = require('../models/Conference');
const Session = require('../models/Session');
const User = require('../models/User');
const { list } = require('../controllers/conferenceController');
const { mockResponse, withMocked } = require('./helpers');

test('teacher conference list is scoped to accessible students only', async () => {
  const scopedStudentId = '507f1f77bcf86cd799439301';
  let conferenceFilter = null;

  await withMocked(Session, {
    find: () => ({
      select: async () => [{ section: 'Grade 7 - A' }],
    }),
  }, async () => withMocked(User, {
    find: () => ({
      select: async () => [{ _id: scopedStudentId }],
    }),
  }, async () => withMocked(Conference, {
    find: (filter) => {
      conferenceFilter = filter;
      return {
        populate() { return this; },
        sort: async () => [],
      };
    },
  }, async () => {
    const req = { user: { id: 'teacher-id', role: 'teacher' }, query: {} };
    const res = mockResponse();

    await list(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(conferenceFilter.student.$in, [scopedStudentId]);
  })));
});

test('parent conference list is scoped to linked students only', async () => {
  const parentId = '507f1f77bcf86cd799439302';
  const linkedStudentId = '507f1f77bcf86cd799439303';
  let conferenceFilter = null;

  await withMocked(User, {
    findById: () => ({
      select: async () => ({
        _id: parentId,
        role: 'parent',
        email: 'parent@example.com',
      }),
    }),
    find: async () => [{ _id: linkedStudentId }],
  }, async () => withMocked(Conference, {
    find: (filter) => {
      conferenceFilter = filter;
      return {
        populate() { return this; },
        sort: async () => [],
      };
    },
  }, async () => {
    const req = { user: { id: parentId, role: 'parent' }, query: {} };
    const res = mockResponse();

    await list(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(conferenceFilter.student.$in, [linkedStudentId]);
  }));
});

test('admin conference list is unscoped', async () => {
  let conferenceFilter = null;

  await withMocked(Conference, {
    find: (filter) => {
      conferenceFilter = filter;
      return {
        populate() { return this; },
        sort: async () => [],
      };
    },
  }, async () => {
    const req = { user: { id: 'admin-id', role: 'admin' }, query: {} };
    const res = mockResponse();

    await list(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(conferenceFilter, {});
  });
});
