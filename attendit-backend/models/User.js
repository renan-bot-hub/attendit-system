const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },

  // Fix #6: Added 'student' role to support the full system
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'teacher',
  },

  // Student-specific fields (only used when role === 'student')
  studentId:  { type: String, default: null },   // e.g. "2023-0142"
  section:    { type: String, default: null },    // e.g. "Grade 10 - Section A"
  gradeLevel: { type: String, default: null },    // e.g. "Grade 10"

  // Teacher/Admin-specific fields
  department: { type: String, default: null },    // e.g. "Mathematics"

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
