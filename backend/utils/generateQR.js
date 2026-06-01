// Creates a short-lived JWT token for QR-based attendance sessions.
const jwt = require("jsonwebtoken");

module.exports = (sessionId) => {
  return jwt.sign(
    { sessionId },
    process.env.JWT_SECRET,
    { expiresIn: "30s" }, // anti-cheat
  );
};
