const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const Session = require('../models/Session');
const Document = require('../models/Document');
const { create, list, review } = require('../controllers/documentController');
const { mockResponse, withMocked } = require('./helpers');

const parentId = '507f1f77bcf86cd799439021';
const studentId = '507f1f77bcf86cd799439022';

function selectable(doc) {
  return {
    ...doc,
    select: async () => doc,
  };
}

test('parent cannot submit a document for an unrelated student', async () => {
  let created = false;

  await withMocked(User, {
    findById: (id) => {
      if (String(id) === parentId) {
        return selectable({
          _id: parentId,
          role: 'parent',
          email: 'parent@example.com',
          studentNumber: 'S-001',
        });
      }
      return selectable({
        _id: studentId,
        role: 'student',
        parentEmail: 'someone-else@example.com',
        studentNumber: 'S-999',
      });
    },
  }, async () => withMocked(Document, {
    create: async () => {
      created = true;
      return {};
    },
  }, async () => {
    const req = {
      user: { id: parentId, role: 'parent' },
      body: {
        studentId,
        documentType: 'Excuse Letter',
        reason: 'Sick',
      },
    };
    const res = mockResponse();

    await create(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(created, false);
  }));
});

test('teacher document list is scoped to accessible students only', async () => {
  const scopedStudentId = '507f1f77bcf86cd799439023';
  let documentFilter = null;

  await withMocked(Session, {
    find: () => ({
      select: async () => [{ section: 'Grade 7 - A' }],
    }),
  }, async () => withMocked(User, {
    find: () => ({
      select: async () => [{ _id: scopedStudentId }],
    }),
  }, async () => withMocked(Document, {
    find: (filter) => {
      documentFilter = filter;
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
    assert.deepEqual(documentFilter.student.$in, [scopedStudentId]);
  })));
});

test('admin document list is not teacher-scoped', async () => {
  let documentFilter = null;

  await withMocked(Document, {
    find: (filter) => {
      documentFilter = filter;
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
    assert.deepEqual(documentFilter, {});
  });
});

test('teacher cannot review a document for an unrelated student', async () => {
  let saved = false;
  const doc = {
    student: { _id: studentId, role: 'student', section: 'Grade 8 - B' },
    save: async () => {
      saved = true;
    },
  };

  await withMocked(Session, {
    find: () => ({
      select: async () => [{ section: 'Grade 7 - A' }],
    }),
  }, async () => withMocked(Document, {
    findById: () => ({
      populate: async () => doc,
    }),
  }, async () => {
    const req = {
      user: { id: 'teacher-id', role: 'teacher' },
      params: { id: '507f1f77bcf86cd799439024' },
      body: { status: 'Accepted' },
    };
    const res = mockResponse();

    await review(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(saved, false);
  }));
});
