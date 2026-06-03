// JWT bearer-token guard. Verifies the Authorization header, confirms the
// user still exists and is active, then sets req.user = { id, role }.

const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id role isActive');
    if (!user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account has been deactivated. Contact admin." });
    }
    req.user = {
      id: String(user._id),
      role: user.role,
    };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
