const mongoose = require('mongoose');

// Messages live inside a Thread (manuscript "Triggered Threads" — Fig. 12):
//   - Threads can only be created by a teacher or auto-spawned from a case.
//   - Parents may reply only while the thread is Open.
//   - Either side may "Close Thread" to end the conversation.
//
// We model the thread inline with the message via `thread` (a stable ID) and
// keep a tiny Thread document for status + participants + case linkage.

const messageSchema = new mongoose.Schema({
  thread:    { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true, index: true },
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:      { type: String, required: true, trim: true },
  read:      { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ thread: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
