const test = require('node:test');
const assert = require('node:assert/strict');
const { securityHeaders } = require('../middleware/securityMiddleware');

test('security headers allow same-origin camera use for QR scanning', () => {
  const headers = {};
  const res = {
    setHeader(name, value) {
      headers[name] = value;
    },
  };

  securityHeaders({}, res, () => {});

  assert.match(headers['Permissions-Policy'], /camera=\(self\)/);
  assert.match(headers['Permissions-Policy'], /microphone=\(\)/);
});
