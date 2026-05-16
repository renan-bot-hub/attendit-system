// Output of the TF.js pattern-detection / decision-support module
// (Module #4, Fig. 10). One row per (student, pattern).

const mongoose = require('mongoose');

const aiAlertSchema = new mongoose.Schema({
  student:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  section:       { type: String, default: '' },
  pattern: {
    type: String,
    enum: ['Consecutive Absences', 'Day-of-Week Pattern', 'Frequent Tardiness',
           'Total Absences Trend', 'Sudden Drop'],
    required: true,
  },
  patternDetail: { type: String, default: '' },
  riskScore:     { type: Number, default: 0, min: 0, max: 100 },
  riskLevel:     { type: String, enum: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical'], default: 'Medium Risk' },
  recommendations: [{ type: String }],
  status:        { type: String, enum: ['New', 'Under Review', 'Actioned', 'Dismissed'], default: 'New' },
  flaggedOn:     { type: Date, default: Date.now },
  reviewedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt:    { type: Date, default: null },
  linkedCase:    { type: mongoose.Schema.Types.ObjectId, ref: 'Case', default: null },
}, { timestamps: true });

aiAlertSchema.index({ status: 1, flaggedOn: -1 });
aiAlertSchema.index({ student: 1, pattern: 1, status: 1 });

module.exports = mongoose.model('AIAlert', aiAlertSchema);
