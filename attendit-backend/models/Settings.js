// Single-document school configuration ({ key: 'global' }). Stores
// branding, attendance time rules, case-escalation thresholds, and
// risk-band cutoffs (Fig. 23).

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key:          { type: String, default: 'global', unique: true },
  schoolName:   { type: String, default: 'My School' },
  schoolType:   { type: String, enum: ['public', 'private'], default: 'public' },
  academicYear: { type: String, default: '2025-2026' },

  lateCutoffTime: { type: String, default: '07:30' },
  autoAbsentTime: { type: String, default: '17:00' },

  consecutiveAbsenceThreshold: { type: Number, default: 3, min: 1, max: 30 },
  warningTotalAbsences:        { type: Number, default: 3, min: 1, max: 50 },
  criticalTotalAbsences:       { type: Number, default: 5, min: 1, max: 50 },

  attendanceCriticalBelow: { type: Number, default: 75, min: 0, max: 100 },
  attendanceHighRiskBelow: { type: Number, default: 85, min: 0, max: 100 },
  attendanceModerateBelow: { type: Number, default: 92, min: 0, max: 100 },

  contactEmail: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  address:      { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
