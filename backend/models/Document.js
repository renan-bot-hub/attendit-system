// Parent-submitted excuse letter or health certificate. Teacher accepts
// or rejects from the Parent Documents page.

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  student:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  parentName:  { type: String, default: '' },
  documentType:{ type: String, enum: ['Excuse Letter', 'Health Certificate', 'Other'], default: 'Excuse Letter' },
  fileName:    { type: String, default: '' },
  fileUrl:     { type: String, default: '' },
  absenceDate: { type: Date, default: null },
  reason:      { type: String, default: '' },
  status:      { type: String, enum: ['Pending Review', 'Accepted', 'Rejected'], default: 'Pending Review' },
  linkedCase:  { type: mongoose.Schema.Types.ObjectId, ref: 'Case', default: null },
  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt:  { type: Date, default: null },
  reviewNote:  { type: String, default: '' },
}, { timestamps: true });

documentSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
