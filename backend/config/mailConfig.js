const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendOtpEmail(email, otp) {
  return transporter.sendMail({
    from: `"AttendIT System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "AttendIT OTP Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>AttendIT OTP Verification</h2>
        <p>Your OTP verification code is:</p>
        <h1 style="letter-spacing: 6px;">${otp}</h1>
        <p>This code will expire in 5 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail };