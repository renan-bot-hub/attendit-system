// Output of the TF.js pattern-detection / decision-support module
// (Module #4, Fig. 10). One row per (student, pattern).

const mongoose = require('mongoose');
const { RISK_LEVELS } = require('../utils/riskLevels');

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
  riskLevel:     { type: String, enum: RISK_LEVELS, default: 'Moderate' },
  recommendations: [{ type: String }],
  scorer:         { type: String, enum: ['model', 'rules'], default: 'rules' },
  modelVersion:   { type: String, default: '' },
  modelProbabilities: {
    type: Map,
    of: Number,
    default: undefined,
  },
  status:        { type: String, enum: ['New', 'Under Review', 'Actioned', 'Dismissed'], default: 'New' },
  flaggedOn:     { type: Date, default: Date.now },
  reviewedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt:    { type: Date, default: null },
  linkedCase:    { type: mongoose.Schema.Types.ObjectId, ref: 'Case', default: null },
}, { timestamps: true });

aiAlertSchema.index({ status: 1, flaggedOn: -1 });
aiAlertSchema.index({ student: 1, pattern: 1, status: 1 });

module.exports = mongoose.model('AIAlert', aiAlertSchema);
