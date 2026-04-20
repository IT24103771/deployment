const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, username, email, password, role } = req.body;

    // Check duplicate username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Check duplicate email
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const user = await User.create({
      name,
      username,
      email,
      password,
      role: role || 'STAFF'
    });

    const token = generateToken(user);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      token
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { username, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Check if account is locked
    if (user.accountLocked) {
      return res.status(401).json({ message: 'Account is locked. Contact admin.' });
    }

    // Check if account is active
    if (user.status !== 'ACTIVE') {
      return res.status(401).json({ message: 'Account is deactivated. Contact admin.' });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // Increment failed login attempts
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.accountLocked = true;
      }
      await user.save();
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    await user.save();

    const token = generateToken(user);

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      token
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile };
