const Session = require('../models/Session');
const mongoose = require('mongoose');

// GET /api/sessions  — list sessions for the logged-in teacher (or all for admin)
exports.getSessions = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { teacherId: req.user.id };
    const sessions = await Session.find(filter)
      .populate('teacherId', 'name email')
      .sort({ date: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/sessions  — create a new session
exports.createSession = async (req, res) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  try {
    const { className, section, subject, date } = req.body;
    if (!className || !section) {
      return res.status(400).json({ message: 'className and section are required' });
    }
    const session = await Session.create({
      className, section, subject,
      date: date || new Date(),
      active: true,
      teacherId: req.user.id,
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH /api/sessions/:id/toggle  — activate or deactivate a session
exports.toggleSession = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (req.user.role === 'teacher' && session.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not your session' });
    }

    session.active = !session.active;
    await session.save();
    res.json({ message: `Session ${session.active ? 'activated' : 'deactivated'}`, session });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
