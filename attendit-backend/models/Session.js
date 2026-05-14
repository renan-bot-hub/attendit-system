const mongoose = require('mongoose');

// Fix #7: Expanded Session model with teacherId, subject, section
const sessionSchema = new mongoose.Schema({
  className:  { type: String, required: true },      // e.g. "Mathematics"
  section:    { type: String, required: true },      // e.g. "Grade 10 - Section A"
  subject:    { type: String, default: '' },
  date:       { type: Date, default: Date.now },
  active:     { type: Boolean, default: false },

  // Owner reference — used for QR ownership check
  teacherId:  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
