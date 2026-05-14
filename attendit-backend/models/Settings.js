const mongoose = require('mongoose');

// Single-document settings — there's only ever one record (key === 'global')
const settingsSchema = new mongoose.Schema({
  key:               { type: String, default: 'global', unique: true },
  schoolName:        { type: String, default: 'My School' },
  schoolType:        { type: String, enum: ['public', 'private'], default: 'public' },
  academicYear:      { type: String, default: '2025-2026' },
  consecutiveAbsenceThreshold: { type: Number, default: 3, min: 1, max: 30 },
  attendanceCriticalBelow:     { type: Number, default: 75, min: 0, max: 100 },
  attendanceHighRiskBelow:     { type: Number, default: 85, min: 0, max: 100 },
  attendanceModerateBelow:     { type: Number, default: 92, min: 0, max: 100 },
  contactEmail:      { type: String, default: '' },
  contactPhone:      { type: String, default: '' },
  address:           { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
