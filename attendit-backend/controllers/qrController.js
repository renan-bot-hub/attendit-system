// Generates short-lived QR attendance tokens for active sessions.

const generateQR = require('../utils/generateQR');
const Session = require('../models/Session');
const { canManageSession } = require('../utils/accessControl');

exports.generateQRToken = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (!canManageSession(req.user, session)) {
      return res.status(403).json({ message: 'You can only generate QR tokens for sessions you manage.' });
    }
    if (!session.active) return res.status(400).json({ message: 'Session is not active' });

    const token = generateQR(sessionId);
    res.json({
      token,
      expiresAt: Date.now() + 30000,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
