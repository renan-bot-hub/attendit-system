// Teacher-initiated conversation container (Triggered Threads, Fig. 12).
// Parents can only reply while status === 'Open'. Messages live separately.

const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  teacher:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parent:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  student:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  caseRef:   { type: mongoose.Schema.Types.ObjectId, ref: 'Case', default: null },
  topic:     { type: String, default: 'Attendance' },
  status:    { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  closedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  closedAt:  { type: Date, default: null },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

threadSchema.index({ teacher: 1, status: 1, lastMessageAt: -1 });
threadSchema.index({ parent: 1, status: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Thread', threadSchema);
