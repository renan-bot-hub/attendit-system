const mongoose = require('mongoose');

// Single-document settings — there's only ever one record (key === 'global')
const settingsSchema = new mongoose.Schema({
  key:               { type: String, default: 'global', unique: true },
  schoolName:        { type: String, default: 'My School' },
  schoolType:        { type: String, enum: ['public', 'private'], default: 'public' },
  academicYear:      { type: String, default: '2025-2026' },

  // --- Attendance Rules & Thresholds (manuscript Fig. 23) -----------------
  // Time configuration — written as "HH:MM" in 24h, used by the scanner /
  // end-of-day finalizer to decide Late vs Absent automatically.
  lateCutoffTime:    { type: String, default: '07:30' },  // arrivals after this are 'Late'
  autoAbsentTime:    { type: String, default: '17:00' },  // unmarked students get 'Absent'

  // Pattern triggers (drive the AI alerts + case escalation)
  consecutiveAbsenceThreshold: { type: Number, default: 3, min: 1, max: 30 },  // AI alert
  warningTotalAbsences:        { type: Number, default: 3, min: 1, max: 50 },  // case = Warning
  criticalTotalAbsences:       { type: Number, default: 5, min: 1, max: 50 },  // case = Critical → POD

  // Attendance-rate risk bands (used by analytics + risk score)
  attendanceCriticalBelow:     { type: Number, default: 75, min: 0, max: 100 },
  attendanceHighRiskBelow:     { type: Number, default: 85, min: 0, max: 100 },
  attendanceModerateBelow:     { type: Number, default: 92, min: 0, max: 100 },

  contactEmail:      { type: String, default: '' },
  contactPhone:      { type: String, default: '' },
  address:           { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
