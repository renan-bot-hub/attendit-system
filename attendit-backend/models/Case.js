const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['Medical Certificate', 'Excuse Letter', 'Other'],
    default: 'Excuse Letter',
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  fileName: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  reviewNote: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Case', caseSchema);