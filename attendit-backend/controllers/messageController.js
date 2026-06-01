// Triggered Threads messaging (Fig. 12). Teachers, staff, and admins open
// threads; parents can reply only while the thread is open.

const Message = require('../models/Message');
const Thread = require('../models/Thread');
const User = require('../models/User');
const { isValidObjectId } = require('../middleware/validateRequest');
const { userCanAccessStudent } = require('../utils/accessControl');

async function loadThreadForParticipant(req, res) {
  if (!isValidObjectId(req.params.id)) {
    res.status(400).json({ message: 'Invalid thread ID' });
    return null;
  }

  const thread = await Thread.findById(req.params.id);
  if (!thread) {
    res.status(404).json({ message: 'Thread not found' });
    return null;
  }

  const me = req.user.id;
  const isTeacher = thread.teacher?.toString() === me;
  const isParent = thread.parent?.toString() === me;
  if (!isTeacher && !isParent && req.user.role !== 'admin') {
    res.status(403).json({ message: 'You are not a participant in this thread' });
    return null;
  }

  return thread;
}

exports.listThreads = async (req, res) => {
  try {
    const me = req.user.id;
    const filter = req.user.role === 'admin' ? {} : {
      $or: [{ teacher: me }, { parent: me }],
    };
    if (req.query.status) filter.status = req.query.status;

    const threads = await Thread.find(filter)
      .populate('teacher', 'name role')
      .populate('parent', 'name role')
      .populate('student', 'name studentId section gradeLevel parentName parentEmail')
      .populate('caseRef', 'riskLevel status')
      .sort({ lastMessageAt: -1 });

    const enriched = await Promise.all(threads.map(async (thread) => {
      const unread = await Message.countDocuments({
        thread: thread._id,
        recipient: me,
        read: false,
      });
      return { ...thread.toObject(), unread };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createThread = async (req, res) => {
  if (!['teacher', 'admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Only teachers and staff can open threads.' });
  }

  try {
    const { studentId, topic, caseRef } = req.body;
    if (!studentId || !isValidObjectId(studentId)) {
      return res.status(400).json({ message: 'Valid studentId is required' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }
    if (!await userCanAccessStudent(req.user, student)) {
      return res.status(403).json({ message: 'You can only open threads for students in your scope.' });
    }

    const parentUser = student.parentEmail
      ? await User.findOne({ email: student.parentEmail, role: 'parent', isActive: true })
      : null;

    const thread = await Thread.create({
      teacher: req.user.id,
      parent: parentUser ? parentUser._id : null,
      student: student._id,
      caseRef: caseRef || null,
      topic: topic || 'Attendance',
      status: 'Open',
      lastMessageAt: new Date(),
    });

    res.status(201).json(thread);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.closeThread = async (req, res) => {
  try {
    const thread = await loadThreadForParticipant(req, res);
    if (!thread) return;

    if (req.user.role !== 'admin' && thread.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the opening teacher or an admin can close this thread' });
    }

    thread.status = 'Closed';
    thread.closedBy = req.user.id;
    thread.closedAt = new Date();
    await thread.save();
    res.json(thread);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reopenThread = async (req, res) => {
  try {
    const thread = await loadThreadForParticipant(req, res);
    if (!thread) return;

    if (req.user.role !== 'admin' && thread.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the opening teacher or an admin can reopen this thread' });
    }

    thread.status = 'Open';
    thread.closedBy = null;
    thread.closedAt = null;
    await thread.save();
    res.json(thread);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const thread = await loadThreadForParticipant(req, res);
    if (!thread) return;

    const messages = await Message.find({ thread: thread._id })
      .sort({ createdAt: 1 })
      .populate('sender', 'name role');

    await Message.updateMany(
      { thread: thread._id, recipient: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const thread = await loadThreadForParticipant(req, res);
    if (!thread) return;

    if (thread.status === 'Closed') {
      return res.status(400).json({ message: 'Thread is closed' });
    }

    const me = req.user.id;
    const isTeacher = thread.teacher.toString() === me;
    const isParent = thread.parent && thread.parent.toString() === me;
    if (!isTeacher && !isParent && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not a participant in this thread' });
    }

    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'text is required' });

    const recipient = isTeacher ? (thread.parent || thread.teacher) : thread.teacher;
    const message = await Message.create({
      thread: thread._id,
      sender: me,
      recipient,
      text: text.trim(),
    });

    thread.lastMessageAt = new Date();
    await thread.save();

    const populated = await message.populate('sender', 'name role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
