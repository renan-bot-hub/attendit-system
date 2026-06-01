const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');

function indexByName(name) {
  return User.schema.indexes().find(([, options]) => options?.name === name);
}

test('student identifiers and QR codes have unique partial indexes', () => {
  for (const name of ['uniq_student_studentId', 'uniq_student_studentNumber', 'uniq_student_qrCode']) {
    const index = indexByName(name);
    assert.ok(index, `${name} index should exist`);
    assert.equal(index[1].unique, true);
    assert.equal(index[1].partialFilterExpression.role, 'student');
  }
});
