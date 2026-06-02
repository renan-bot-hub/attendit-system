const express = require("express");
const router = express.Router();

const {
  signup,
  register,
  login,
  sendOTP,
  verifyOTP,
  updateProfile,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const { validateBody } = require("../middleware/validateRequest");

const signupSchema = {
  name: { type: "string", required: true, maxLength: 120 },
  email: { type: "string", required: true, maxLength: 180 },
  password: { type: "string", required: true, minLength: 6, maxLength: 128 },
  role: { type: "string", enum: ["admin", "teacher", "staff"] },
};

const registerSchema = {
  name: { type: "string", required: true, maxLength: 120 },
  email: { type: "string", required: true, maxLength: 180 },
  password: { type: "string", required: true, minLength: 6, maxLength: 128 },
  role: { type: "string", enum: ["parent"] },
  studentId: { type: "string", maxLength: 80 },
  studentNumber: { type: "string", maxLength: 80 },
  parentEmail: { type: "string", maxLength: 180 },
  parentPhone: { type: "string", maxLength: 40 },
  contactNumber: { type: "string", maxLength: 40 },
};

const loginSchema = {
  email: { type: "string", required: true, maxLength: 180 },
  password: { type: "string", required: true, maxLength: 128 },
};

const otpEmailSchema = {
  email: { type: "string", required: true, maxLength: 180 },
};

const verifyOtpSchema = {
  email: { type: "string", required: true, maxLength: 180 },
  otp: { type: "string", required: true, minLength: 6, maxLength: 6 },
};

const updateProfileSchema = {
  name: { type: "string", required: true, maxLength: 120 },
  contactNumber: { type: "string", maxLength: 40 },
  birthdate: { type: "string", maxLength: 40 },
  gradeSection: { type: "string", maxLength: 120 },
};

router.post("/signup", validateBody(signupSchema), signup);
router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);

router.post("/send-otp", validateBody(otpEmailSchema), sendOTP);
router.post("/verify-otp", validateBody(verifyOtpSchema), verifyOTP);

router.put(
  "/update-profile",
  authMiddleware,
  validateBody(updateProfileSchema),
  updateProfile
);

module.exports = router;