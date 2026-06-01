const test = require('node:test');
const assert = require('node:assert/strict');
const { requireRoles } = require('../middleware/roleMiddleware');
const { mockResponse } = require('./helpers');

test('requireRoles rejects unauthenticated requests', () => {
  const req = {};
  const res = mockResponse();
  let called = false;

  requireRoles('admin')(req, res, () => {
    called = true;
  });

  assert.equal(called, false);
  assert.equal(res.statusCode, 401);
});

test('requireRoles rejects authenticated users without the required role', () => {
  const req = { user: { role: 'parent' } };
  const res = mockResponse();
  let called = false;

  requireRoles('admin', 'staff')(req, res, () => {
    called = true;
  });

  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
});

test('requireRoles permits allowed roles', () => {
  const req = { user: { role: 'teacher' } };
  const res = mockResponse();
  let called = false;

  requireRoles('admin', 'teacher')(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(res.statusCode, 200);
});
