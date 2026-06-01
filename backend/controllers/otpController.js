const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");

// =====================================================
// ATTEND-IT OTP CONTROLLER
// DEMO-SAFE VERSION
// OTP is generated and printed in the backend terminal.
// Email sending is temporarily disabled to prevent timeout.
// =====================================================

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    await OTP.findOneAndDelete({
      email: cleanEmail,
    });

    await OTP.create({
      email: cleanEmail,
      otp,
      attempts: 0,
    });

    console.log("=================================");
    console.log("ATTEND-IT OTP GENERATED");
    console.log("EMAIL:", cleanEmail);
    console.log("OTP:", otp);
    console.log("NOTE: Email sending is temporarily disabled.");
    console.log("Use this OTP in the mobile app.");
    console.log("=================================");

    return res.status(200).json({
      success: true,
      message: "OTP generated successfully. Check backend terminal.",
    });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate OTP",
    });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOTP = otp.toString().trim();

    const existingOTP = await OTP.findOne({
      email: cleanEmail,
    });

    if (!existingOTP) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new code.",
      });
    }

    if (existingOTP.attempts >= 3) {
      await OTP.deleteOne({
        email: cleanEmail,
      });

      return res.status(400).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    if (existingOTP.otp !== cleanOTP) {
      existingOTP.attempts += 1;
      await existingOTP.save();

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. Attempts left: ${3 - existingOTP.attempts}`,
      });
    }

    await OTP.deleteOne({
      email: cleanEmail,
    });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify OTP",
    });
  }
};