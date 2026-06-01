// Class section like "Grade 10 - A". Admin manages from
// Student & Section Management (Fig. 22).

const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true, unique: true },
  gradeLevel: { type: String, required: true, trim: true },
  adviser:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Section', sectionSchema);
