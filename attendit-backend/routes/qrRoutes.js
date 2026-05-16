// Legacy QR endpoint — not mounted in server.js. Active QR flow lives
// under /api/users (mint on create + admin regenerate). Kept for
// backward compatibility with any external caller still hitting /api/qr.

const router = require("express").Router();
const { generateQRToken } = require("../controllers/qrController");
const auth = require("../middleware/authMiddleware");

router.get("/generate/:sessionId", auth, generateQRToken);

module.exports = router;
