const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
  },
  timestamp: { type: Date, default: Date.now },
});

// Prevent duplicates
attendanceSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
