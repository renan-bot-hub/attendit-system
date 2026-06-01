// Unified user document for web and mobile roles.
// Students are data-only records; parent accounts log in through mobile.

const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ['student', 'teacher', 'staff', 'admin', 'parent'],
    default: 'teacher',
  },

  studentId:  { type: String, default: null },
  studentNumber: { type: String, default: null },
  section:    { type: String, default: null },
  gradeLevel: { type: String, default: null },
  gradeSection: { type: String, default: null },

  qrCode: { type: String, default: null },

  parentName:  { type: String, default: null },
  parentEmail: { type: String, default: null },
  parentPhone: { type: String, default: null },

  department: { type: String, default: null },
  teacherNumber: { type: String, default: null },
  birthdate: { type: String, default: null },
  contactNumber: { type: String, default: null },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.index({ role: 1, isActive: 1, section: 1 });
userSchema.index({ role: 1, isActive: 1, gradeSection: 1 });
userSchema.index(
  { role: 1, studentId: 1 },
  {
    unique: true,
    name: 'uniq_student_studentId',
    partialFilterExpression: { role: 'student', studentId: { $type: 'string' } },
  }
);
userSchema.index(
  { role: 1, studentNumber: 1 },
  {
    unique: true,
    name: 'uniq_student_studentNumber',
    partialFilterExpression: { role: 'student', studentNumber: { $type: 'string' } },
  }
);
userSchema.index(
  { role: 1, qrCode: 1 },
  {
    unique: true,
    name: 'uniq_student_qrCode',
    partialFilterExpression: { role: 'student', qrCode: { $type: 'string' } },
  }
);
userSchema.index({ parentEmail: 1 }, { sparse: true });
userSchema.index({ parentPhone: 1 }, { sparse: true });

userSchema.statics.generateQrToken = function () {
  return `AIT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
};

module.exports = mongoose.model('User', userSchema);
