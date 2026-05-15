const Message = require('../models/Message');
const Thread = require('../models/Thread');
const User = require('../models/User');

// Triggered-thread messaging (manuscript Fig. 12):
//   * Only teachers/staff/admin may open a new thread (parent participation
//     happens via mobile in a thread the teacher already opened).
//   * Either side can post while status === 'Open'.
//   * Either teacher or staff can close a thread; parents see "closed" and
//     can no longer reply on mobile.

// GET /api/threads  — list visible threads for the current user
exports.listThreads = async (req, res) => {
  try {
    const me = req.user.id;
    const filter = req.user.role === 'admin' ? {} : {
      $or: [{ teacher: me }, { parent: me }],
    };
    if (req.query.status) filter.status = req.query.status;
    const threads = await Thread.find(filter)
      .populate('teacher', 'name role')
      .populate('parent',  'name role')
      .populate('student', 'name studentId section gradeLevel parentName parentEmail')
      .populate('caseRef', 'riskLevel status')
      .sort({ lastMessageAt: -1 });

    // Tag each thread with unread count for the current user
    const enriched = await Promise.all(threads.map(async (t) => {
      const unread = await Message.countDocuments({
        thread: t._id,
        recipient: me,
        read: false,
      });
      return { ...t.toObject(), unread };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/threads  — teacher opens a thread about a student.
// body: { studentId, topic, caseRef? }
exports.createThread = async (req, res) => {
  if (!['teacher', 'admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Only teachers and staff can open threads.' });
  }
  try {
    const { studentId, topic, caseRef } = req.body;
    if (!studentId) return res.status(400).json({ message: 'studentId is required' });
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }
    // Try to resolve the parent user record by parentEmail (if registered)
    let parentUser = null;
    if (student.parentEmail) {
      parentUser = await User.findOne({ email: student.parentEmail });
    }
    const t = await Thread.create({
      teacher: req.user.id,
      parent: parentUser ? parentUser._id : null,
      student: student._id,
      caseRef: caseRef || null,
      topic: topic || 'Attendance',
      status: 'Open',
      lastMessageAt: new Date(),
    });
    res.status(201).json(t);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH /api/threads/:id/close  — close a thread (teacher / staff / admin)
exports.closeThread = async (req, res) => {
  try {
    const t = await Thread.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Thread not found' });
    if (req.user.role !== 'admin' && t.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the opening teacher (or an admin) can close this thread' });
    }
    t.status = 'Closed';
    t.closedBy = req.user.id;
    t.closedAt = new Date();
    await t.save();
    res.json(t);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/threads/:id/reopen  — reopen a closed thread (teacher / staff / admin)
exports.reopenThread = async (req, res) => {
  try {
    const t = await Thread.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Thread not found' });
    if (req.user.role !== 'admin' && t.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the opening teacher (or an admin) can reopen this thread' });
    }
    t.status = 'Open';
    t.closedBy = null;
    t.closedAt = null;
    await t.save();
    res.json(t);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/threads/:id/messages  — full conversation; marks as read
exports.getMessages = async (req, res) => {
  try {
    const t = await Thread.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Thread not found' });
    if (req.user.role !== 'admin'
        && t.teacher.toString() !== req.user.id
        && (t.parent && t.parent.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'You are not a participant in this thread' });
    }
    const msgs = await Message.find({ thread: t._id })
      .sort({ createdAt: 1 })
      .populate('sender', 'name role');
    await Message.updateMany(
      { thread: t._id, recipient: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/threads/:id/messages  — send a message inside an open thread
exports.sendMessage = async (req, res) => {
  try {
    const t = await Thread.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Thread not found' });
    if (t.status === 'Closed') {
      return res.status(400).json({ message: 'Thread is closed' });
    }
    const me = req.user.id;
    const isTeacher = t.teacher.toString() === me;
    const isParent  = t.parent && t.parent.toString() === me;
    if (!isTeacher && !isParent && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not a participant in this thread' });
    }
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'text is required' });
    const recipient = isTeacher ? (t.parent || t.teacher) : t.teacher;
    const msg = await Message.create({
      thread: t._id,
      sender: me,
      recipient,
      text: text.trim(),
    });
    t.lastMessageAt = new Date();
    await t.save();
    const populated = await msg.populate('sender', 'name role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- Legacy compatibility shims so older callers don't 404 -------------------
// Older dashboards used getContacts/getThread/sendMessage at /api/messages.
// We keep them as no-ops returning empty payloads so the dashboard still loads.
exports.legacyContacts = async (_req, res) => res.json([]);
exports.legacyThread   = async (_req, res) => res.json([]);
exports.legacySend     = async (_req, res) => res.status(410).json({ message: 'Replaced by triggered threads — use POST /api/threads' });
