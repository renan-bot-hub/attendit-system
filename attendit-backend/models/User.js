// Unified user document for all four roles (admin / teacher / staff / student).
// Students are data-only records — they don't log in on web; parents use mobile.

const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ['student', 'teacher', 'staff', 'admin'],
    default: 'teacher',
  },

  studentId:  { type: String, default: null },
  section:    { type: String, default: null },
  gradeLevel: { type: String, default: null },

  qrCode: { type: String, default: null, index: true, sparse: true },

  parentName:  { type: String, default: null },
  parentEmail: { type: String, default: null },
  parentPhone: { type: String, default: null },

  department: { type: String, default: null },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.statics.generateQrToken = function () {
  return `AIT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
};

module.exports = mongoose.model('User', userSchema);
