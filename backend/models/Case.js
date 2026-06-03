// Attendance-intervention case opened on a student.
// Lifecycle: Open → (Escalated) → Resolved.

const mongoose = require('mongoose');
const { RISK_LEVELS } = require('../utils/riskLevels');

const caseSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['Attendance Intervention', 'Medical Certificate', 'Excuse Letter', 'Other'],
    default: 'Attendance Intervention',
  },
  description: { type: String, required: true, trim: true },
  fileName:    { type: String, default: '' },
  riskLevel: {
    type: String,
    enum: RISK_LEVELS,
    default: 'Moderate',
  },
  status: {
    type: String,
    enum: ['Open', 'Pending', 'Approved', 'Rejected', 'Escalated', 'Resolved'],
    default: 'Open',
  },
  totalAbsences:       { type: Number, default: 0 },
  consecutiveAbsences: { type: Number, default: 0 },
  openedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  escalatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  escalatedAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  reviewNote: { type: String, default: '' },
  sourceAlert: { type: mongoose.Schema.Types.ObjectId, ref: 'AIAlert', default: null },
}, { timestamps: true });

caseSchema.index({ status: 1, riskLevel: 1, createdAt: -1 });

module.exports = mongoose.model('Case', caseSchema);
