const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../config/mailConfig");
const {
  findStudentsForParentIdentity,
  normalizeEmail,
} = require("../utils/accessControl");

const WEB_SIGNUP_ROLES = ["teacher", "staff"];
const MOBILE_REGISTER_ROLES = ["parent"];

function publicStaffSignupAllowed() {
  return process.env.ALLOW_PUBLIC_STAFF_SIGNUP === "true";
}

function bootstrapAdminAllowed() {
  if (process.env.ALLOW_BOOTSTRAP_ADMIN === "true") return true;
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_BOOTSTRAP_ADMIN !== "false"
  );
}

function parentSelfRegistrationAllowed() {
  return process.env.ALLOW_PARENT_SELF_REGISTRATION !== "false";
}

function unlinkedParentRegistrationAllowed() {
  return process.env.ALLOW_UNLINKED_PARENT_REGISTRATION === "true";
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    section: user.section,
    gradeLevel: user.gradeLevel,
    gradeSection: user.gradeSection,
    studentId: user.studentId,
    studentNumber: user.studentNumber,
    department: user.department,
    teacherNumber: user.teacherNumber,
    birthdate: user.birthdate,
    contactNumber: user.contactNumber,
  };
}

function mobileFields(body) {
  const studentNumber = body.studentNumber || body.studentId || null;
  const gradeSection = body.gradeSection || body.section || null;

  return {
    studentId: body.studentId || studentNumber,
    studentNumber,
    section: body.section || gradeSection,
    gradeLevel: body.gradeLevel || null,
    gradeSection,
    department: body.department || null,
    teacherNumber: body.teacherNumber || null,
    birthdate: body.birthdate || null,
    contactNumber: body.contactNumber || body.parentPhone || null,
    parentName: body.parentName || (body.role === "parent" ? body.name : null),
    parentEmail:
      body.parentEmail || (body.role === "parent" ? normalizeEmail(body.email) : null),
    parentPhone: body.parentPhone || body.contactNumber || null,
  };
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const userCount = await User.countDocuments();
    let finalRole = role || "teacher";

    if (userCount === 0) {
      if (!bootstrapAdminAllowed()) {
        return res.status(403).json({
          success: false,
          message:
            "Bootstrap admin signup is disabled. Create the first admin through a controlled admin seed or database console.",
        });
      }
      finalRole = "admin";
    } else if (finalRole === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts can only be created by an existing administrator.",
      });
    }

    if (!WEB_SIGNUP_ROLES.includes(finalRole) && userCount !== 0) {
      return res.status(400).json({
        success: false,
        message: "Web signup is restricted to teacher and staff accounts.",
      });
    }

    if (userCount !== 0 && !publicStaffSignupAllowed()) {
      return res.status(403).json({
        success: false,
        message: "Public staff signup is disabled. Ask an administrator to create your account.",
      });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role: finalRole,
      ...mobileFields(req.body),
    });

    res.status(201).json({
      success: true,
      message:
        userCount === 0
          ? "First user registered as administrator."
          : "User registered successfully",
      bootstrapAdmin: userCount === 0,
      user: publicUser(user),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const role = req.body.role || "parent";

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (!parentSelfRegistrationAllowed()) {
      return res.status(403).json({
        success: false,
        message: "Parent self-registration is disabled. Ask the school office to create your account.",
      });
    }

    if (!MOBILE_REGISTER_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Mobile registration is restricted to parent accounts.",
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const linkedStudents = await findStudentsForParentIdentity({
      ...req.body,
      email: normalizedEmail,
      parentEmail: req.body.parentEmail || normalizedEmail,
    });

    if (!linkedStudents.length && !unlinkedParentRegistrationAllowed()) {
      return res.status(400).json({
        success: false,
        message: "No matching student record found for this parent account.",
      });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role,
      ...mobileFields(req.body),
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: publicUser(user),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Contact admin.",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: "Login successful. Please verify OTP.",
      token,
      user: publicUser(user),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.sendOTP = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Contact admin.",
      });
    }

    const otp = generateOtp();

    user.otpCode = await bcrypt.hash(otp, 10);
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendOtpEmail(email, otp);

    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Check Gmail App Password and backend logs.",
    });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user || !user.otpCode || !user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "No OTP request found. Please request a new OTP.",
      });
    }

    if (user.otpExpires < new Date()) {
      user.otpCode = null;
      user.otpExpires = null;
      await user.save();

      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP.",
      });
    }

    const otpMatch = await bcrypt.compare(otp, user.otpCode);

    if (!otpMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};