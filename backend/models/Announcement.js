// School-wide notice (Fig. 15). Admin/staff publish; everyone reads.

const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  body:         { type: String, required: true, trim: true },
  postedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:       { type: String, enum: ['Draft', 'Published'], default: 'Published' },
  targetSections: [{ type: String }],
  publishedAt:  { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
