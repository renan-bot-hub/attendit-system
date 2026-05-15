const mongoose = require('mongoose');

// Parent–teacher conference scheduled by the Prefect of Discipline (staff)
// after a case is escalated. Manuscript Fig. 18.
const conferenceSchema = new mongoose.Schema({
  caseRef:    { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // staff

  date:       { type: Date, required: true },
  time:       { type: String, default: '' },          // "02:00 PM"
  attendees:  [{ type: String }],                     // free-text labels e.g. "Luis Ramos (Parent)"
  location:   { type: String, default: '' },
  agenda:     { type: String, default: '' },

  status:     { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
  outcome:    { type: String, default: '' },
}, { timestamps: true });

conferenceSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Conference', conferenceSchema);
