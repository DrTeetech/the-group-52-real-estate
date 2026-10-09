const mongoose = require('mongoose');
const Lease = require('../models/Lease');
const Property = require('../models/Property');
const RentalApplication = require('../models/RentalApplication');

const validId = mongoose.isValidObjectId;

const createLease = async (req, res, next) => {
  const session = await mongoose.startSession();
  let createdLease;
  try {
    const { rentalApplication, startDate, endDate } = req.body || {};
    if (!validId(rentalApplication)) return res.status(400).json({ success: false, message: 'A valid rental application ID is required' });
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!startDate || !endDate || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({ success: false, message: 'Valid lease dates are required and endDate must follow startDate' });
    }
    if (start <= new Date()) return res.status(400).json({ success: false, message: 'Lease startDate must be in the future; activate the lease when its start date arrives' });

    await session.withTransaction(async () => {
      const application = await RentalApplication.findOne({ _id: rentalApplication, status: 'approved' }).session(session);
      if (!application) {
        const error = new Error('A lease can only be created from an approved application'); error.statusCode = 409; throw error;
      }
      let property = await Property.findById(application.property).session(session);
      if (!property) { const error = new Error('Property not found'); error.statusCode = 404; throw error; }
      // Backward compatibility: reserve an available property for approved applications created before reservation logic was added.
      if (property.status === 'available' && property.visibility === 'public' && !property.reservedForApplication) {
        property = await Property.findOneAndUpdate(
          { _id: property._id, status: 'available', visibility: 'public', reservedForApplication: { $exists: false } },
          { $set: { status: 'reserved', visibility: 'private', reservedForApplication: application._id } },
          { new: true, session, runValidators: true }
        );
      }
      if (!property || property.status !== 'reserved' || String(property.reservedForApplication || '') !== String(application._id)) {
        const error = new Error('This property is not reserved for this approved application'); error.statusCode = 409; throw error;
      }
      const existingLease = await Lease.findOne({ property: property._id, status: { $in: ['pending', 'active'] }, endDate: { $gt: new Date() } }).session(session);
      if (existingLease) { const error = new Error('A pending or active lease already exists for this property'); error.statusCode = 409; throw error; }

      createdLease = (await Lease.create([{
        leaseNumber: `LSE-${new mongoose.Types.ObjectId().toString().toUpperCase()}`,
        property: property._id,
        tenant: application.applicant,
        rentalApplication: application._id,
        startDate: start,
        endDate: end,
        rentAmount: property.rent.amount,
        rentPeriod: property.rent.period,
        serviceCharge: property.serviceCharge?.amount || 0,
        serviceChargePeriod: property.serviceCharge?.period || 'yearly',
        securityDeposit: property.cautionFee?.amount || 0,
        currency: property.rent.currency || 'NGN',
        status: 'pending',
        createdBy: req.user._id,
      }], { session }))[0];
    });

    return res.status(201).json({ success: true, message: 'Lease created using the company property terms; awaiting activation', lease: createdLease });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'A lease with this identifier already exists' });
    return next(error);
  } finally { await session.endSession(); }
};

const getMyLeases = async (req, res, next) => {
  try {
    const leases = await Lease.find({ tenant: req.user._id })
      .populate('property', 'title slug propertyCode rent location')
      .populate('rentalApplication', 'status')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: leases.length, leases });
  } catch (error) { return next(error); }
};

const getAllLeases = async (req, res, next) => {
  try {
    const filter = {};
    const statuses = ['pending', 'active', 'expired', 'terminated', 'cancelled'];
    if (req.query.status) {
      if (!statuses.includes(req.query.status)) return res.status(400).json({ success: false, message: 'Invalid lease status' });
      filter.status = req.query.status;
    }
    const page = Number.parseInt(req.query.page || '1', 10);
    const limit = Number.parseInt(req.query.limit || '20', 10);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ success: false, message: 'page must be >= 1 and limit must be between 1 and 100' });
    }
    const [leases, total] = await Promise.all([
      Lease.find(filter).populate('tenant', 'firstName lastName email phone').populate('property', 'title propertyCode slug').populate('rentalApplication', 'status').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Lease.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, count: leases.length, total, page, pages: Math.ceil(total / limit), leases });
  } catch (error) { return next(error); }
};

const updateLeaseStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  let updatedLease;
  try {
    const { status } = req.body || {};
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid lease ID' });
    if (!['active', 'terminated', 'cancelled'].includes(status)) return res.status(400).json({ success: false, message: 'Status must be active, terminated or cancelled' });
    await session.withTransaction(async () => {
      const lease = await Lease.findById(req.params.id).session(session);
      if (!lease) { const error = new Error('Lease not found'); error.statusCode = 404; throw error; }
      if (!['pending', 'active'].includes(lease.status) || (lease.status === 'active' && status === 'active')) {
        const error = new Error('This lease cannot transition to the requested status'); error.statusCode = 409; throw error;
      }
      if ((lease.status === 'pending' && status === 'terminated') || (lease.status === 'active' && status === 'cancelled')) {
        const error = new Error('Pending leases can only be activated or cancelled; active leases can only be terminated'); error.statusCode = 409; throw error;
      }
      const now = new Date();
      if (status === 'active' && (lease.startDate > now || lease.endDate <= now)) {
        const error = new Error('Lease dates must include the current date before activation'); error.statusCode = 400; throw error;
      }
      const property = await Property.findById(lease.property).session(session);
      if (!property) { const error = new Error('Associated property not found'); error.statusCode = 409; throw error; }
      if (status === 'active') {
        if (property.status !== 'reserved' || String(property.reservedForApplication || '') !== String(lease.rentalApplication)) {
          const error = new Error('Property reservation does not match this lease'); error.statusCode = 409; throw error;
        }
        const conflict = await Lease.findOne({ _id: { $ne: lease._id }, property: lease.property, status: 'active', endDate: { $gt: now } }).session(session);
        if (conflict) { const error = new Error('Another active lease already exists for this property'); error.statusCode = 409; throw error; }
        property.status = 'rented';
        property.visibility = 'private';
        property.reservedForApplication = undefined;
      } else {
        const otherLease = await Lease.findOne({ _id: { $ne: lease._id }, property: lease.property, status: { $in: ['pending', 'active'] }, endDate: { $gt: now } }).session(session);
        if (!otherLease) {
          if (lease.status === 'pending' && status === 'cancelled') {
            // Keep the approved application reservation so staff can issue a corrected lease.
            property.status = 'reserved';
            property.visibility = 'private';
            property.reservedForApplication = lease.rentalApplication;
          } else {
            property.status = 'available';
            property.visibility = 'public';
            property.reservedForApplication = undefined;
          }
        }
      }
      lease.status = status;
      await lease.save({ session });
      await property.save({ session });
      updatedLease = lease;
    });
    return res.status(200).json({ success: true, message: 'Lease status updated successfully', lease: updatedLease });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    return next(error);
  } finally { await session.endSession(); }
};

module.exports = { createLease, getMyLeases, getAllLeases, updateLeaseStatus };
