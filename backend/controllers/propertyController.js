const mongoose = require('mongoose');
const crypto = require('crypto');
const Property = require('../models/Property');
const User = require('../models/User');
const Lease = require('../models/Lease');
const Favorite = require('../models/Favorite');
const Inquiry = require('../models/Inquiry');
const Viewing = require('../models/Viewing');

const editableFields = [
  'title', 'description', 'propertyType', 'rent', 'serviceCharge', 'cautionFee',
  'location', 'bedrooms', 'bathrooms', 'parkingSpaces', 'propertySize',
  'furnished', 'yearBuilt', 'floor', 'totalFloors', 'condition', 'amenities', 'media',
];
const isManager = (role) => ['property_manager', 'admin', 'super_admin'].includes(role);
const validId = (id) => mongoose.isValidObjectId(id);
const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const canManage = (property, user, res) => {
  if (user.role === 'agent' && (!property.assignedAgent || property.assignedAgent.toString() !== user._id.toString())) {
    res.status(403).json({ success: false, message: 'You may only manage properties assigned to you' });
    return false;
  }
  return true;
};

const validateAssignedAgent = async (assignedAgent) => {
  if (!validId(assignedAgent)) return null;
  return User.findOne({ _id: assignedAgent, role: { $in: ['agent', 'property_manager'] }, status: 'active' }).select('_id');
};

const getProperties = async (req, res, next) => {
  try {
    const { city, state, propertyType, minPrice, maxPrice, bedrooms, furnished } = req.query;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 12);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ success: false, message: 'page must be >= 1 and limit must be between 1 and 100' });
    }
    for (const value of [minPrice, maxPrice, bedrooms].filter((v) => v !== undefined)) {
      if (value === '' || !Number.isFinite(Number(value)) || Number(value) < 0) {
        return res.status(400).json({ success: false, message: 'Price and bedroom filters must be non-negative numbers' });
      }
    }
    if (minPrice !== undefined && maxPrice !== undefined && Number(minPrice) > Number(maxPrice)) {
      return res.status(400).json({ success: false, message: 'minPrice cannot exceed maxPrice' });
    }
    if (furnished !== undefined && !['true', 'false'].includes(furnished)) {
      return res.status(400).json({ success: false, message: 'furnished must be true or false' });
    }

    const filter = { visibility: 'public', status: 'available' };
    if (city) filter['location.city'] = new RegExp(`^${String(city).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    if (state) filter['location.state'] = new RegExp(`^${String(state).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    if (propertyType) filter.propertyType = String(propertyType).toLowerCase();
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter['rent.amount'] = {};
      if (minPrice !== undefined) filter['rent.amount'].$gte = Number(minPrice);
      if (maxPrice !== undefined) filter['rent.amount'].$lte = Number(maxPrice);
    }
    if (bedrooms !== undefined) filter.bedrooms = { $gte: Number(bedrooms) };
    if (furnished !== undefined) filter.furnished = furnished === 'true';

    const [properties, total] = await Promise.all([
      Property.find(filter).select('-assignedAgent -reservedForApplication').sort({ isFeatured: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Property.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, count: properties.length, total, page, pages: Math.ceil(total / limit), properties });
  } catch (error) { return next(error); }
};

const getPropertyBySlug = async (req, res, next) => {
  try {
    const property = await Property.findOne({ slug: req.params.slug, visibility: 'public', status: 'available' }).select('-assignedAgent -reservedForApplication');
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    await Property.updateOne({ _id: property._id }, { $inc: { views: 1 } });
    property.views += 1;
    return res.status(200).json({ success: true, property });
  } catch (error) { return next(error); }
};

const createProperty = async (req, res, next) => {
  try {
    if (!isPlainObject(req.body)) return res.status(400).json({ success: false, message: 'A JSON object is required' });
    const { assignedAgent } = req.body;
    const data = {};
    for (const field of editableFields) if (req.body[field] !== undefined) data[field] = req.body[field];
    data.propertyCode = typeof req.body.propertyCode === 'string' && req.body.propertyCode.trim()
      ? req.body.propertyCode.trim().toUpperCase()
      : `PROP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    data.status = 'draft';
    data.visibility = 'private';
    data.isFeatured = false;

    if (req.user.role === 'agent') data.assignedAgent = req.user._id;
    else if (assignedAgent !== undefined) {
      const agent = await validateAssignedAgent(assignedAgent);
      if (!agent) return res.status(400).json({ success: false, message: 'assignedAgent must identify an active agent or property manager' });
      data.assignedAgent = agent._id;
    }
    const property = await Property.create(data);
    return res.status(201).json({ success: true, message: 'Property created as a private draft for review', property });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Property code or slug already exists' });
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Property data is invalid', errors: Object.values(error.errors).map((e) => e.message) });
    return next(error);
  }
};

const updateProperty = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid property ID' });
    if (!isPlainObject(req.body)) return res.status(400).json({ success: false, message: 'A JSON object is required' });
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    if (!canManage(property, req.user, res)) return;

    const updates = {};
    for (const field of editableFields) if (req.body[field] !== undefined) updates[field] = req.body[field];
    if (req.body.propertyCode !== undefined && isManager(req.user.role)) updates.propertyCode = req.body.propertyCode;
    if (req.body.isFeatured !== undefined && isManager(req.user.role)) updates.isFeatured = req.body.isFeatured;
    if (req.body.assignedAgent !== undefined) {
      if (!isManager(req.user.role)) return res.status(403).json({ success: false, message: 'Only managers and administrators can reassign properties' });
      const agent = await validateAssignedAgent(req.body.assignedAgent);
      if (!agent) return res.status(400).json({ success: false, message: 'assignedAgent must identify an active agent or property manager' });
      updates.assignedAgent = agent._id;
    }
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: 'No editable property fields were supplied' });
    Object.assign(property, updates);
    await property.save();
    return res.status(200).json({ success: true, message: 'Property updated successfully', property });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Property code or slug already exists' });
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Property data is invalid', errors: Object.values(error.errors).map((e) => e.message) });
    return next(error);
  }
};

const updatePropertyStatus = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid property ID' });
    const { status } = req.body || {};
    const allowed = ['draft', 'available', 'reserved', 'rented', 'unavailable'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid property status' });
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    if (!canManage(property, req.user, res)) return;
    const currentLease = await Lease.findOne({ property: property._id, status: { $in: ['pending', 'active'] }, endDate: { $gt: new Date() } });
    if (currentLease) return res.status(409).json({ success: false, message: 'Property status is controlled by its pending/active lease; update the lease instead' });
    if (property.reservedForApplication && status !== 'reserved') {
      return res.status(409).json({ success: false, message: 'Property is reserved for an approved application; resolve that application first' });
    }
    if (['reserved', 'rented'].includes(status) && !property.reservedForApplication) {
      return res.status(409).json({ success: false, message: 'Reserved/rented status must be driven by the rental application and lease workflow' });
    }
    property.status = status;
    if (status !== 'available') property.visibility = 'private';
    await property.save();
    return res.status(200).json({ success: true, message: 'Property status updated successfully', property });
  } catch (error) { return next(error); }
};

const publishProperty = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid property ID' });
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    if (property.status !== 'available' || property.reservedForApplication) return res.status(409).json({ success: false, message: 'Only unreserved available properties can be published' });
    const currentLease = await Lease.findOne({ property: property._id, status: { $in: ['pending', 'active'] }, endDate: { $gt: new Date() } });
    if (currentLease) return res.status(409).json({ success: false, message: 'Property has a pending or active lease and cannot be published' });
    property.visibility = 'public';
    await property.save();
    return res.status(200).json({ success: true, message: 'Property published successfully', property });
  } catch (error) { return next(error); }
};

const deleteProperty = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid property ID' });
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    const [leases, applications, payments, favorites, inquiries, viewings] = await Promise.all([
      Lease.exists({ property: property._id }),
      require('../models/RentalApplication').exists({ property: property._id }),
      require('../models/Payment').exists({ property: property._id }),
      Favorite.exists({ property: property._id }),
      Inquiry.exists({ property: property._id }),
      Viewing.exists({ property: property._id }),
    ]);
    if (leases || applications || payments || favorites || inquiries || viewings) {
      property.status = 'unavailable';
      property.visibility = 'private';
      await property.save();
      return res.status(200).json({ success: true, message: 'Property archived because it has rental or financial history', property });
    }
    await property.deleteOne();
    return res.status(200).json({ success: true, message: 'Property deleted successfully' });
  } catch (error) { return next(error); }
};

module.exports = { getProperties, getPropertyBySlug, createProperty, updateProperty, updatePropertyStatus, publishProperty, deleteProperty };
