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

  // How this row was captured — the Attendance Records screen surfaces this
  // in the "Marked By" column (Fig. 9). 'Scan' = mobile QR, 'Manual' = teacher override.
  markedBy: {
    type: String,
    enum: ['Scan', 'Manual', 'Auto'],
    default: 'Manual',
  },
  notes: { type: String, default: '' },

  // Optional time-in for late/present arrivals; helpful for the records view.
  timeIn:    { type: String, default: '' },

  timestamp: { type: Date, default: Date.now },
});

// Prevent duplicate attendance per student per session
attendanceSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
