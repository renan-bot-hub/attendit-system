const router = require("express").Router();
const { generateQRToken } = require("../controllers/qrController");
const auth = require("../middleware/authMiddleware");

// Only teacher/admin should generate QR (optional but recommended)
router.get("/generate/:sessionId", auth, generateQRToken);

module.exports = router;
