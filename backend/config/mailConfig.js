const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Temporarily disabled to avoid startup error from Gmail IPv6/network issue
// transporter.verify((error) => {
//   if (error) {
//     console.log("MAIL CONFIG ERROR:", error);
//   } else {
//     console.log("MAIL SERVER READY");
//   }
// });

module.exports = transporter;