const Attendance = require("../models/Attendance");
const jwt = require("jsonwebtoken");

exports.scanQR = async (req, res) => {
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const exists = await Attendance.findOne({
      studentId: req.user.id,
      sessionId: decoded.sessionId,
    });

    if (exists) return res.send("Already recorded");

    await Attendance.create({
      studentId: req.user.id,
      sessionId: decoded.sessionId,
    });

    res.send("Attendance recorded");
  } catch {
    res.status(400).send("Invalid QR");
  }
};
