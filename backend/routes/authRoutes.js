// /api/auth - public signup + login.
// /register is kept as a mobile-backend compatibility alias.

const express = require('express');
const router = express.Router();
const {
  signup,
  register,
  login,
  requestOtp,
  verifyOtp,
} = require('../controllers/authController');
const { validateBody } = require('../middleware/validateRequest');

const signupSchema = {
  name: { type: 'string', required: true, maxLength: 120 },
  email: { type: 'string', required: true, maxLength: 180 },
  password: { type: 'string', required: true, minLength: 6, maxLength: 128 },
  role: { type: 'string', enum: ['admin', 'teacher', 'staff'] },
};

const registerSchema = {
  name: { type: 'string', required: true, maxLength: 120 },
  email: { type: 'string', required: true, maxLength: 180 },
  password: { type: 'string', required: true, minLength: 6, maxLength: 128 },
  role: { type: 'string', enum: ['parent'] },
  studentId: { type: 'string', maxLength: 80 },
  studentNumber: { type: 'string', maxLength: 80 },
  parentEmail: { type: 'string', maxLength: 180 },
  parentPhone: { type: 'string', maxLength: 40 },
  contactNumber: { type: 'string', maxLength: 40 },
};

const loginSchema = {
  email: { type: 'string', required: true, maxLength: 180 },
  password: { type: 'string', required: true, maxLength: 128 },
};

const verifyOtpSchema = {
  email: { type: 'string', required: true, maxLength: 180 },
  otp: { type: 'string', required: true, minLength: 6, maxLength: 6 },
};

router.post('/signup', validateBody(signupSchema), signup);
router.post('/register', validateBody(registerSchema), register);
router.post('/request-otp', validateBody(loginSchema), requestOtp);
router.post('/verify-otp', validateBody(verifyOtpSchema), verifyOtp);
router.post('/login', validateBody(loginSchema), login);

module.exports = router;
