// One row per (student, session). markedBy distinguishes mobile-scan
// rows from teacher manual entries and end-of-day auto-absent rows.

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  status: {
    type: String,
    enum: ['Present', 'Late', 'Absent'],
    default: 'Present',
  },
  markedBy: {
    type: String,
    enum: ['Scan', 'Manual', 'Auto'],
    default: 'Manual',
  },
  notes:  { type: String, default: '' },
  timeIn: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

attendanceSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
