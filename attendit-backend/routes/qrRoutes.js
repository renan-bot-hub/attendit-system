// Legacy QR endpoint for the mobile scanner. Student ID backup QR tokens
// are managed under /api/users; session QR tokens are generated here.

const router = require("express").Router();
const { generateQRToken } = require("../controllers/qrController");
const auth = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const { validateObjectIdParam } = require("../middleware/validateRequest");

router.get("/generate/:sessionId", auth, requireRoles("admin", "teacher", "staff"), validateObjectIdParam("sessionId"), generateQRToken);

module.exports = router;
