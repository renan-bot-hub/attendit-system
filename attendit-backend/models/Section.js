const mongoose = require('mongoose');

// Class section (e.g. "Grade 10 - A"). Admin creates these in Student & Section
// Management; teacher assignment drives who sees what in the dashboards.
const sectionSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, unique: true },   // "Grade 10 - A"
  gradeLevel:  { type: String, required: true, trim: true },                  // "Grade 10"
  adviser:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Section', sectionSchema);
