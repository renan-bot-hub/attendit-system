const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateAttendanceScanBody,
  validateBody,
} = require('../middleware/validateRequest');
const { mockResponse } = require('./helpers');

test('validateBody rejects missing required fields', () => {
  const req = { body: {} };
  const res = mockResponse();
  let nextCalled = false;

  validateBody({
    email: { type: 'string', required: true },
    password: { type: 'string', required: true, minLength: 6 },
  })(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 400);
  assert.equal(nextCalled, false);
  assert.ok(res.body.errors.some((error) => error.includes('email is required')));
});

test('validateAttendanceScanBody accepts a signed session token scan', () => {
  const req = { body: { token: 'signed-token' } };
  const res = mockResponse();
  let nextCalled = false;

  validateAttendanceScanBody(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(nextCalled, true);
});

test('validateAttendanceScanBody rejects student QR scans without a valid sessionId', () => {
  const req = { body: { qrCode: 'AIT-123', sessionId: 'not-an-id' } };
  const res = mockResponse();
  let nextCalled = false;

  validateAttendanceScanBody(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 400);
  assert.equal(nextCalled, false);
  assert.ok(res.body.errors.some((error) => error.includes('sessionId')));
});
