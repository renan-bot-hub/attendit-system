const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const { register } = require('../controllers/authController');
const { mockResponse, withMocked } = require('./helpers');

test('mobile registration rejects teacher and staff self-registration', async () => {
  const req = {
    body: {
      name: 'Teacher',
      email: 'teacher@example.com',
      password: 'secret123',
      role: 'teacher',
    },
  };
  const res = mockResponse();

  await register(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.msg, /parent accounts/i);
});

test('parent registration requires a matching student record by default', async () => {
  process.env.ALLOW_PARENT_SELF_REGISTRATION = 'true';
  process.env.ALLOW_UNLINKED_PARENT_REGISTRATION = 'false';

  await withMocked(User, {
    findOne: async () => null,
    find: async () => [],
  }, async () => {
    const req = {
      body: {
        name: 'Parent',
        email: 'parent@example.com',
        password: 'secret123',
        role: 'parent',
        studentNumber: 'S-001',
      },
    };
    const res = mockResponse();

    await register(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.body.msg, /matching student/i);
  });
});

test('linked parent registration creates a parent account', async () => {
  process.env.ALLOW_PARENT_SELF_REGISTRATION = 'true';
  process.env.ALLOW_UNLINKED_PARENT_REGISTRATION = 'false';

  const created = [];
  await withMocked(User, {
    findOne: async () => null,
    find: async () => [{ _id: 'student-id', role: 'student', parentEmail: 'parent@example.com' }],
    create: async (doc) => {
      created.push(doc);
      return { _id: 'parent-id', ...doc };
    },
  }, async () => {
    const req = {
      body: {
        name: 'Parent',
        email: 'Parent@Example.com',
        password: 'secret123',
        role: 'parent',
        studentNumber: 'S-001',
      },
    };
    const res = mockResponse();

    await register(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(created[0].email, 'parent@example.com');
    assert.equal(created[0].role, 'parent');
  });
});
