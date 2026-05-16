// Signup + login. First user in an empty DB is auto-promoted to admin.
// Web signup is otherwise restricted to teacher / staff (POD) roles.

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, studentId, section, gradeLevel, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'User already exists' });

    const userCount = await User.countDocuments();
    let finalRole = role || 'teacher';
    if (userCount === 0) {
      finalRole = 'admin';
    } else if (finalRole === 'admin') {
      return res.status(403).json({ msg: 'Admin accounts can only be created by an existing administrator.' });
    }
    if (!['teacher', 'staff'].includes(finalRole) && userCount !== 0) {
      return res.status(400).json({ msg: 'Web signup is restricted to teacher and staff (Prefect of Discipline) accounts.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: finalRole,
      studentId: studentId || null,
      section: section || null,
      gradeLevel: gradeLevel || null,
      department: department || null,
    });
    await user.save();
    res.status(201).json({
      msg: userCount === 0
        ? 'First user registered — promoted to administrator.'
        : 'User registered successfully',
      bootstrapAdmin: userCount === 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    if (!user.isActive) {
      return res.status(403).json({ msg: 'Your account has been deactivated. Contact admin.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        section: user.section,
        gradeLevel: user.gradeLevel,
        studentId: user.studentId,
        department: user.department,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
