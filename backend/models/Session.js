// A single class meeting that attendance is taken against.

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  className:  { type: String, required: true },
  section:    { type: String, required: true },
  subject:    { type: String, default: '' },
  date:       { type: Date,   default: Date.now },
  active:     { type: Boolean, default: false },
  teacherId:  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
