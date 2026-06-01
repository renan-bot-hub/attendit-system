// One message inside a Thread. New messages are only accepted while the
// parent thread's status is 'Open'.

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  thread:    { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true, index: true },
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:      { type: String, required: true, trim: true },
  read:      { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ thread: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
