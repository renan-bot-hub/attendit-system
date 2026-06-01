const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { login } = require('../controllers/authController');
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
