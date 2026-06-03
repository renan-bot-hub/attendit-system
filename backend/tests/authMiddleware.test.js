const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const { mockResponse, withMocked } = require('./helpers');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'x'.repeat(40);

function reqWithToken(payload = { id: '507f1f77bcf86cd799439011', role: 'admin' }) {
  return {
    headers: {
      authorization: `Bearer ${jwt.sign(payload, process.env.JWT_SECRET)}`,
    },
  };
}

function mockFindById(user) {
  return () => ({
    select: async () => user,
  });
}

test('auth middleware loads active user from token', async () => {
  const req = reqWithToken();
  const res = mockResponse();
  let nextCalled = false;

  await withMocked(User, {
    findById: mockFindById({
      _id: '507f1f77bcf86cd799439011',
      role: 'admin',
      isActive: true,
    }),
  }, async () => {
    await auth(req, res, () => { nextCalled = true; });
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, {
    id: '507f1f77bcf86cd799439011',
    role: 'admin',
  });
});

test('auth middleware rejects tokens for missing users', async () => {
  const req = reqWithToken();
  const res = mockResponse();

  await withMocked(User, {
    findById: mockFindById(null),
  }, async () => {
    await auth(req, res, () => {});
  });

  assert.equal(res.statusCode, 401);
  assert.match(res.body.message, /invalid/i);
});

test('auth middleware rejects deactivated users', async () => {
  const req = reqWithToken();
  const res = mockResponse();

  await withMocked(User, {
    findById: mockFindById({
      _id: '507f1f77bcf86cd799439011',
      role: 'admin',
      isActive: false,
    }),
  }, async () => {
    await auth(req, res, () => {});
  });

  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /deactivated/i);
});
