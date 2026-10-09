const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => jwt.sign(
  { userId: user._id.toString(), tokenVersion: user.tokenVersion || 0 },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d', algorithm: 'HS256' }
);

const publicUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  emailVerified: user.emailVerified,
  phoneVerified: user.phoneVerified,
  avatar: user.avatar,
  address: user.address,
});

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body || {};
    if (![firstName, lastName, email, phone, password].every((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ success: false, message: 'First name, last name, email, phone and password are required' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address' });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Password must be between 8 and 128 characters' });
    }
    if (firstName.trim().length > 50 || lastName.trim().length > 50 || phone.trim().length > 30) {
      return res.status(400).json({ success: false, message: 'One or more profile fields exceed the allowed length' });
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      role: 'customer', // Never accept a public registration role.
    });
    return res.status(201).json({ success: true, message: 'Account created successfully', token: generateToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Registration data is invalid', errors: Object.values(error.errors).map((item) => item.message) });
    }
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account is not active' });
    }
    user.lastLoginAt = new Date();
    await user.save();
    return res.status(200).json({ success: true, message: 'Login successful', token: generateToken(user), user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};

const getMe = (req, res) => res.status(200).json({ success: true, user: publicUser(req.user) });

module.exports = { register, login, getMe };
