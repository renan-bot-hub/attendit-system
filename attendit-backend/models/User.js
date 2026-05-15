const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },

  // Roles per manuscript: admin, teacher, staff (Prefect of Discipline), student.
  // Students are data-only on the web — they don't log in; the parent uses mobile.
  role: {
    type: String,
    enum: ['student', 'teacher', 'staff', 'admin'],
    default: 'teacher',
  },

  // Student-specific fields (only used when role === 'student')
  studentId:  { type: String, default: null },
  section:    { type: String, default: null },
  gradeLevel: { type: String, default: null },

  // QR code payload printed on the student ID — opaque token, used by the
  // mobile scanner. Regenerable from Student & Section Management (admin only)
  // when a card is lost. Indexed but not required so non-student rows are unaffected.
  qrCode: { type: String, default: null, index: true, sparse: true },

  // Parent/guardian contact (mirrored on the student record so the mobile
  // parent portal and SMS/email blasts have something to address).
  parentName:  { type: String, default: null },
  parentEmail: { type: String, default: null },
  parentPhone: { type: String, default: null },

  // Teacher/Admin/Staff-specific fields
  department: { type: String, default: null },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Helper for callers that need a fresh QR token without going through the controller.
userSchema.statics.generateQrToken = function () {
  return `AIT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
};

module.exports = mongoose.model('User', userSchema);
