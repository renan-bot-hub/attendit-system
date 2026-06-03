const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { login, requestOtp, verifyOtp } = require('../controllers/authController');
const { mockResponse, withMocked } = require('./helpers');

test('login rejects missing credentials', async () => {
  const req = { body: { email: '', password: '' } };
  const res = mockResponse();

  await login(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.msg, /required/i);
});

test('login returns a token for active users with valid credentials', async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'x'.repeat(40);

  await withMocked(User, {
    findOne: async () => ({
      _id: '507f1f77bcf86cd799439101',
      name: 'Teacher',
      email: 'teacher@example.com',
      password: 'hash',
      role: 'teacher',
      isActive: true,
    }),
  }, async () => withMocked(bcrypt, {
    compare: async () => true,
  }, async () => withMocked(jwt, {
    sign: () => 'signed-token',
  }, async () => {
    const req = { body: { email: 'Teacher@Example.com', password: 'secret123' } };
    const res = mockResponse();

    await login(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.token, 'signed-token');
    assert.equal(res.body.user.email, 'teacher@example.com');
  })));
});

test('login finds imported users with case-insensitive padded emails', async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'x'.repeat(40);

  const queries = [];
  await withMocked(User, {
    findOne: async (query) => {
      queries.push(query);
      if (queries.length === 1) return null;
      return {
        _id: '507f1f77bcf86cd799439102',
        name: 'Renan',
        email: ' Renan@School.edu ',
        password: 'hash',
        role: 'admin',
      };
    },
  }, async () => withMocked(bcrypt, {
    compare: async () => true,
  }, async () => withMocked(jwt, {
    sign: () => 'signed-token',
  }, async () => {
    const req = { body: { email: 'renan@school.edu', password: 'secret123' } };
    const res = mockResponse();

    await login(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.token, 'signed-token');
    assert.equal(queries[0].email, 'renan@school.edu');
    assert.ok(queries[1].email instanceof RegExp);
  })));
});

test('login rejects users explicitly marked inactive', async () => {
  await withMocked(User, {
    findOne: async () => ({
      _id: '507f1f77bcf86cd799439103',
      name: 'Inactive Teacher',
      email: 'inactive@example.com',
      password: 'hash',
      role: 'teacher',
      isActive: false,
    }),
  }, async () => withMocked(bcrypt, {
    compare: async () => true,
  }, async () => {
    const req = { body: { email: 'inactive@example.com', password: 'secret123' } };
    const res = mockResponse();

    await login(req, res);

    assert.equal(res.statusCode, 403);
    assert.match(res.body.msg, /deactivated/i);
  }));
});

test('requestOtp stores a hashed OTP and returns a verification challenge', async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'x'.repeat(40);
  process.env.NODE_ENV = 'test';

  const user = {
    _id: '507f1f77bcf86cd799439104',
    name: 'Teacher',
    email: 'teacher@example.com',
    password: 'hash',
    role: 'teacher',
    isActive: true,
    save: async function save() { return this; },
  };

  await withMocked(User, {
    findOne: async () => user,
  }, async () => withMocked(bcrypt, {
    compare: async () => true,
  }, async () => {
    const req = { body: { email: 'teacher@example.com', password: 'secret123' } };
    const res = mockResponse();

    await requestOtp(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.otpRequired, true);
    assert.match(res.body.devOtp, /^\d{6}$/);
    assert.ok(user.otpHash);
    assert.ok(user.otpExpiresAt instanceof Date);
  }));
});

test('verifyOtp exchanges a valid OTP for a token', async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'x'.repeat(40);
  process.env.NODE_ENV = 'test';

  const user = {
    _id: '507f1f77bcf86cd799439105',
    name: 'Teacher',
    email: 'teacher@example.com',
    password: 'hash',
    role: 'teacher',
    isActive: true,
    save: async function save() { return this; },
  };

  await withMocked(User, {
    findOne: async () => user,
  }, async () => withMocked(bcrypt, {
    compare: async () => true,
  }, async () => {
    const requestReq = { body: { email: 'teacher@example.com', password: 'secret123' } };
    const requestRes = mockResponse();
    await requestOtp(requestReq, requestRes);

    await withMocked(jwt, {
      sign: () => 'otp-signed-token',
    }, async () => {
      const verifyReq = { body: { email: 'teacher@example.com', otp: requestRes.body.devOtp } };
      const verifyRes = mockResponse();

      await verifyOtp(verifyReq, verifyRes);

      assert.equal(verifyRes.statusCode, 200);
      assert.equal(verifyRes.body.token, 'otp-signed-token');
      assert.equal(verifyRes.body.user.email, 'teacher@example.com');
      assert.equal(user.otpHash, null);
    });
  }));
});
