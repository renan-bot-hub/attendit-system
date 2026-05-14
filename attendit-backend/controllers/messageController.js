const Message = require('../models/Message');
const User = require('../models/User');

// POST /api/messages  — send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, text } = req.body;

    if (!recipientId || !text || !text.trim()) {
      return res.status(400).json({ message: 'recipientId and text are required' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

    const msg = await Message.create({
      sender: req.user.id,
      recipient: recipientId,
      text: text.trim(),
    });

    const populated = await msg.populate('sender recipient', 'name email role');
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/messages/contacts  — list distinct conversation partners with last-message preview
exports.getContacts = async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('sender recipient', 'name email role');

    const map = new Map();
    for (const m of messages) {
      const partner = m.sender._id.toString() === userId ? m.recipient : m.sender;
      const key = partner._id.toString();
      if (!map.has(key)) {
        const unread = await Message.countDocuments({
          sender: partner._id,
          recipient: userId,
          read: false,
        });
        map.set(key, {
          _id: partner._id,
          name: partner.name,
          email: partner.email,
          role: partner.role,
          lastMessage: m.text,
          time: m.createdAt,
          unread,
        });
      }
    }
    res.json([...map.values()]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/messages/thread/:partnerId  — conversation between current user and partner
exports.getThread = async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnerId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: partnerId },
        { sender: partnerId, recipient: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender recipient', 'name role');

    // Mark partner-sent messages as read
    await Message.updateMany(
      { sender: partnerId, recipient: userId, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};