const mongoose = require('mongoose');
const User = require('../models/User');

const staffRoles = ['agent', 'property_manager', 'admin', 'super_admin'];
const safeStaff = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
});

const getStaffUsers = async (req, res, next) => {
  try {
    const filter = { role: { $in: staffRoles } };
    if (req.query.role) {
      if (!staffRoles.includes(req.query.role)) return res.status(400).json({ success: false, message: 'Invalid staff role' });
      if (req.user.role !== 'super_admin' && ['admin', 'super_admin'].includes(req.query.role)) {
        return res.status(403).json({ success: false, message: 'You cannot view this staff role' });
      }
      filter.role = req.query.role;
    }
    if (req.query.status) {
      if (!['active', 'suspended', 'deactivated'].includes(req.query.status)) return res.status(400).json({ success: false, message: 'Invalid account status' });
      filter.status = req.query.status;
    }
    if (req.user.role !== 'super_admin') filter.role = req.query.role ? req.query.role : { $in: ['agent', 'property_manager'] };
    const page = Number.parseInt(req.query.page || '1', 10);
    const limit = Number.parseInt(req.query.limit || '20', 10);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ success: false, message: 'page must be >= 1 and limit must be between 1 and 100' });
    }
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, count: users.length, total, page, pages: Math.ceil(total / limit), staff: users.map(safeStaff) });
  } catch (error) { return next(error); }
};

const createStaffUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body || {};
    if (![firstName, lastName, email, phone, password, role].every((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ success: false, message: 'First name, last name, email, phone, password and role are required' });
    }
    if (!staffRoles.includes(role)) return res.status(400).json({ success: false, message: 'Invalid staff role' });
    if (req.user.role !== 'super_admin' && ['admin', 'super_admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Only a super administrator can create administrators' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ success: false, message: 'Enter a valid email address' });
    if (password.length < 8 || password.length > 128) return res.status(400).json({ success: false, message: 'Password must be between 8 and 128 characters' });
    const user = await User.create({ firstName: firstName.trim(), lastName: lastName.trim(), email: normalizedEmail, phone: phone.trim(), password, role, status: 'active' });
    return res.status(201).json({ success: true, message: 'Staff account created', staff: safeStaff(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Staff account data is invalid', errors: Object.values(error.errors).map((item) => item.message) });
    return next(error);
  }
};

const updateStaffUser = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid staff user ID' });
    const { role, status } = req.body || {};
    if (role === undefined && status === undefined) return res.status(400).json({ success: false, message: 'Provide a role or status to update' });
    if (role !== undefined && !staffRoles.includes(role)) return res.status(400).json({ success: false, message: 'Invalid staff role' });
    if (status !== undefined && !['active', 'suspended', 'deactivated'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid account status' });

    const target = await User.findById(req.params.id);
    if (!target || !staffRoles.includes(target.role)) return res.status(404).json({ success: false, message: 'Staff user not found' });
    if (target._id.toString() === req.user._id.toString()) return res.status(409).json({ success: false, message: 'You cannot change your own role or status' });
    if (req.user.role !== 'super_admin' && ['admin', 'super_admin'].includes(target.role)) return res.status(403).json({ success: false, message: 'Only a super administrator can manage administrator accounts' });
    if (req.user.role !== 'super_admin' && role && ['admin', 'super_admin'].includes(role)) return res.status(403).json({ success: false, message: 'Only a super administrator can assign administrator roles' });
    if (target.role === 'super_admin' && req.user.role !== 'super_admin') return res.status(403).json({ success: false, message: 'Only a super administrator can manage this account' });

    if (role !== undefined) target.role = role;
    if (status !== undefined) target.status = status;
    target.tokenVersion = (target.tokenVersion || 0) + 1;
    await target.save();
    return res.status(200).json({ success: true, message: 'Staff account updated', staff: safeStaff(target) });
  } catch (error) { return next(error); }
};

module.exports = { getStaffUsers, createStaffUser, updateStaffUser };
