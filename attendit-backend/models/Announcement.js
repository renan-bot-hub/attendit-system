const mongoose = require('mongoose');

// School-wide announcements (manuscript Fig. 15). Admin/staff publish, every
// other role sees a read-only feed. `targetSections` is an optional filter so
// you can ship a notice to specific grade levels without spamming everyone.
const announcementSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  body:         { type: String, required: true, trim: true },
  postedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:       { type: String, enum: ['Draft', 'Published'], default: 'Published' },
  targetSections: [{ type: String }], // empty array = everyone
  publishedAt:  { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
