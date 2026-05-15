const generateQR = require("../utils/generateQR");
const Session = require("../models/Session");
const mongoose = require("mongoose");

exports.generateQRToken = async (req, res) => {
  const { sessionId } = req.params;

  // ✅ Role check
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  // ✅ Validate ID format
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({ message: "Invalid session ID" });
  }

  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (!session.active) {
      return res.status(400).json({ message: "Session is not active" });
    }

    // Optional: ownership check
    // if (session.teacherId.toString() !== req.user.id) {
    //   return res.status(403).json({ message: "Not your session" });
    // }

    const token = generateQR(sessionId);

    res.json({
      token,
      expiresAt: Date.now() + 30000,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
