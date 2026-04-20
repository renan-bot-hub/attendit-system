const router = require("express").Router();
const scanQR = require("../controllers/attendanceController").scanQR;
const auth = require("../middleware/authMiddleware");

router.post("/scan", auth, scanQR);

module.exports = router;
