// Parent–teacher conference scheduled by POD off an escalated case
// (Fig. 18). Tracked Scheduled → Completed / Cancelled with outcome notes.

const mongoose = require('mongoose');

const conferenceSchema = new mongoose.Schema({
  caseRef:    { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:       { type: Date, required: true },
  time:       { type: String, default: '' },
  attendees:  [{ type: String }],
  location:   { type: String, default: '' },
  agenda:     { type: String, default: '' },
  status:     { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
  outcome:    { type: String, default: '' },
}, { timestamps: true });

conferenceSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Conference', conferenceSchema);
