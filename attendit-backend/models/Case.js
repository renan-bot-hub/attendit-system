const mongoose = require('mongoose');

// A case is the unit that drives interventions in the manuscript flow:
//   AI alert  →  teacher opens a Case  →  POD may escalate  →  conference / resolution.
//
// Two flavors are supported by the same schema so we don't have to fork code:
//   * "Intervention" cases (manuscript Fig. 11) — created off an AI alert,
//     carry a risk level, escalate to POD when critical, and gather a chat
//     thread with the parent.
//   * "Parent submission" cases (legacy) — excuse letters / medical certs
//     submitted by the parent. We keep this for backward compatibility but
//     new parent docs prefer the dedicated Document model.
const caseSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // What kind of case this is. "Attendance Intervention" is the manuscript path.
  type: {
    type: String,
    enum: ['Attendance Intervention', 'Medical Certificate', 'Excuse Letter', 'Other'],
    default: 'Attendance Intervention',
  },

  description: { type: String, required: true, trim: true },
  fileName:    { type: String, default: '' },

  // Risk tier — drives the Critical Cases queue for POD (Fig. 17)
  riskLevel: {
    type: String,
    enum: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical'],
    default: 'Medium Risk',
  },

  // Lifecycle status. "Open" → "Escalated" → "Resolved" / "Rejected".
  status: {
    type: String,
    enum: ['Open', 'Pending', 'Approved', 'Rejected', 'Escalated', 'Resolved'],
    default: 'Open',
  },

  // Counters set at create time so list views don't have to recompute
  totalAbsences:        { type: Number, default: 0 },
  consecutiveAbsences:  { type: Number, default: 0 },

  // Ownership / routing
  openedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },  // teacher
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },  // teacher or staff
  escalatedTo:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },  // staff (POD)
  escalatedAt:{ type: Date, default: null },

  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  reviewNote: { type: String, default: '' },

  // Optional back-references so we can jump between alert / case / docs.
  sourceAlert:{ type: mongoose.Schema.Types.ObjectId, ref: 'AIAlert', default: null },
}, { timestamps: true });

caseSchema.index({ status: 1, riskLevel: 1, createdAt: -1 });

module.exports = mongoose.model('Case', caseSchema);
