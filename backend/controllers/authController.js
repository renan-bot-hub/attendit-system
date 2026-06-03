// Signup + login. First web user in an empty DB is auto-promoted to admin.
// /register supports mobile parent accounts without opening public admin signup.

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {
  findStudentsForParentIdentity,
  normalizeEmail,
} = require('../utils/accessControl');

const WEB_SIGNUP_ROLES = ['teacher', 'staff'];
const MOBILE_REGISTER_ROLES = ['parent'];
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

function publicStaffSignupAllowed() {
  return process.env.ALLOW_PUBLIC_STAFF_SIGNUP === 'true';
}

function bootstrapAdminAllowed() {
  if (process.env.ALLOW_BOOTSTRAP_ADMIN === 'true') return true;
  return process.env.NODE_ENV !== 'production' && process.env.ALLOW_BOOTSTRAP_ADMIN !== 'false';
}

function parentSelfRegistrationAllowed() {
  return process.env.ALLOW_PARENT_SELF_REGISTRATION !== 'false';
}

function unlinkedParentRegistrationAllowed() {
  return process.env.ALLOW_UNLINKED_PARENT_REGISTRATION === 'true';
}

function escapeRegExp(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function findUserForLogin(email) {
  const exactUser = await User.findOne({ email });
  if (exactUser) return exactUser;

  return User.findOne({
    email: new RegExp(`^\\s*${escapeRegExp(email)}\\s*$`, 'i'),
  });
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

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(user, otp) {
  return crypto
    .createHash('sha256')
    .update(`${user._id}:${otp}:${process.env.JWT_SECRET}`)
    .digest('hex');
}

function maskTarget(value = '') {
  const text = String(value || '').trim();
  if (!text) return 'registered contact';
  if (text.includes('@')) {
    const [name, domain] = text.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  }
  return `${text.slice(0, 4)}***${text.slice(-2)}`;
}

function otpDeliveryTarget(user) {
  return user.contactNumber || user.parentPhone || user.email;
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
    parentName: body.parentName || (body.role === 'parent' ? body.name : null),
    parentEmail: body.parentEmail || (body.role === 'parent' ? normalizeEmail(body.email) : null),
    parentPhone: body.parentPhone || body.contactNumber || null,
  };
}

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ msg: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ msg: 'User already exists' });

    const userCount = await User.countDocuments();
    let finalRole = role || 'teacher';
    if (userCount === 0) {
      if (!bootstrapAdminAllowed()) {
        return res.status(403).json({ msg: 'Bootstrap admin signup is disabled. Create the first admin through a controlled admin seed or database console.' });
      }
      finalRole = 'admin';
    } else if (finalRole === 'admin') {
      return res.status(403).json({ msg: 'Admin accounts can only be created by an existing administrator.' });
    }
    if (!WEB_SIGNUP_ROLES.includes(finalRole) && userCount !== 0) {
      return res.status(400).json({ msg: 'Web signup is restricted to teacher and staff (Prefect of Discipline) accounts.' });
    }
    if (userCount !== 0 && !publicStaffSignupAllowed()) {
      return res.status(403).json({ msg: 'Public staff signup is disabled. Ask an administrator to create your account.' });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role: finalRole,
      ...mobileFields(req.body),
    });

    const msg = userCount === 0
      ? 'First user registered as administrator.'
      : 'User registered successfully';

    res.status(201).json({
      success: true,
      msg,
      message: msg,
      bootstrapAdmin: userCount === 0,
      user: publicUser(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const role = req.body.role || 'parent';

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ msg: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }
    if (!parentSelfRegistrationAllowed()) {
      return res.status(403).json({ msg: 'Parent self-registration is disabled. Ask the school office to create your account.' });
    }
    if (!MOBILE_REGISTER_ROLES.includes(role)) {
      return res.status(400).json({ msg: 'Mobile registration is restricted to parent accounts.' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ msg: 'User already exists' });

    const linkedStudents = await findStudentsForParentIdentity({
      ...req.body,
      email: normalizedEmail,
      parentEmail: req.body.parentEmail || normalizedEmail,
    });
    if (!linkedStudents.length && !unlinkedParentRegistrationAllowed()) {
      return res.status(400).json({
        msg: 'No matching student record found for this parent account.',
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
      message: 'User registered successfully',
      user: publicUser(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required' });
    }

    const user = await findUserForLogin(email);
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ msg: 'Your account has been deactivated. Contact admin.' });
    }

    res.json({
      success: true,
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.requestOtp = async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required' });
    }

    const user = await findUserForLogin(email);
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    if (user.isActive === false) {
      return res.status(403).json({ msg: 'Your account has been deactivated. Contact admin.' });
    }

    const otp = generateOtp();
    user.otpHash = hashOtp(user, otp);
    user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    user.otpAttempts = 0;
    await user.save();

    const target = otpDeliveryTarget(user);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[auth] OTP for ${user.email}: ${otp}`);
    }

    res.json({
      success: true,
      otpRequired: true,
      message: 'OTP sent to registered contact.',
      deliveryTarget: maskTarget(target),
      expiresInSeconds: OTP_TTL_MS / 1000,
      ...(process.env.NODE_ENV === 'production' ? {} : { devOtp: otp }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();

    if (!email || !otp) {
      return res.status(400).json({ msg: 'Email and OTP are required' });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ msg: 'OTP must be a 6-digit code' });
    }

    const user = await findUserForLogin(email);
    if (!user || !user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ msg: 'Request a new OTP before verification.' });
    }
    if (user.isActive === false) {
      return res.status(403).json({ msg: 'Your account has been deactivated. Contact admin.' });
    }
    if (user.otpExpiresAt.getTime() < Date.now()) {
      user.otpHash = null;
      user.otpExpiresAt = null;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({ msg: 'OTP expired. Request a new code.' });
    }
    if ((user.otpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ msg: 'Too many OTP attempts. Request a new code.' });
    }

    const expected = user.otpHash;
    const actual = hashOtp(user, otp);
    if (actual !== expected) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ msg: 'Invalid OTP' });
    }

    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    await user.save();

    res.json({
      success: true,
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
