const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['teacher', 'admin'], default: 'teacher' }
  // isVerified, otp, and otpExpires are REMOVED
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);