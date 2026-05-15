const mongoose = require('mongoose');

// Output of the pattern-detection / decision-support module (manuscript
// Module #4 — "TensorFlow and Decision Support"). Each row is a flagged
// student with a detected pattern, computed risk score, and the prescriptive
// actions the system recommends. Teachers act on these from the AI Alerts
// & Recommendations screen (Fig. 10).
const aiAlertSchema = new mongoose.Schema({
  student:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  section:       { type: String, default: '' },

  // Pattern type drives the recommendation set
  pattern:       {
    type: String,
    enum: ['Consecutive Absences', 'Day-of-Week Pattern', 'Frequent Tardiness', 'Total Absences Trend', 'Sudden Drop'],
    required: true,
  },
  patternDetail: { type: String, default: '' },   // human-readable e.g. "3 days in a row"

  riskScore:     { type: Number, default: 0, min: 0, max: 100 },
  riskLevel:     { type: String, enum: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical'], default: 'Medium Risk' },
  recommendations: [{ type: String }],

  status:        { type: String, enum: ['New', 'Under Review', 'Actioned', 'Dismissed'], default: 'New' },
  flaggedOn:     { type: Date, default: Date.now },

  // Audit fields filled when a teacher acts on the alert
  reviewedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt:    { type: Date, default: null },
  linkedCase:    { type: mongoose.Schema.Types.ObjectId, ref: 'Case', default: null },
}, { timestamps: true });

aiAlertSchema.index({ status: 1, flaggedOn: -1 });
aiAlertSchema.index({ student: 1, pattern: 1, status: 1 }); // de-dupe lookups

module.exports = mongoose.model('AIAlert', aiAlertSchema);
