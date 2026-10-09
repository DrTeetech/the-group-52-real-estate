const mongoose = require("mongoose");
const Lease = require("../models/lease");
const Property = require("../models/property");
const RentalApplication = require("../models/RentalApplication");
const User = require("../models/user");

const canReviewLeaseRoles = ["property_manager", "landlord", "admin"];
const activeLeaseStatuses = ["active", "pending"];

function serializeLease(lease) {
  const property = lease.property || {};
  const tenant = lease.tenant || {};
  const application = lease.rentalApplication || {};
  const location = property.location || {};
  const propertyName = property.title || "Property unavailable";

  return {
    id: String(lease._id),
    leaseNumber: lease.leaseNumber,
    tenantId: tenant._id ? String(tenant._id) : lease.tenant ? String(lease.tenant) : "",
    tenantName: [tenant.firstName, tenant.lastName].filter(Boolean).join(" ") || "",
    tenantEmail: tenant.email || "",
    propertyId: property._id ? String(property._id) : lease.property ? String(lease.property) : "",
    propertyName,
    propertyLocation: [location.area, location.city, location.state].filter(Boolean).join(", "),
    applicationId: application._id ? String(application._id) : lease.rentalApplication ? String(lease.rentalApplication) : "",
    startDate: lease.startDate ? new Date(lease.startDate).toISOString().slice(0, 10) : "",
    endDate: lease.endDate ? new Date(lease.endDate).toISOString().slice(0, 10) : "",
    monthlyRent: lease.rentAmount || 0,
    securityDeposit: lease.securityDeposit || 0,
    paymentDueDate: lease.paymentDueDate ? new Date(lease.paymentDueDate).toISOString().slice(0, 10) : "",
    lateFee: lease.lateFee || 0,
    noticePeriodDays: lease.noticePeriodDays || 30,
    renewalTerms: lease.renewalTerms || "",
    occupancyLimit: lease.occupancyLimit || 1,
    additionalNotes: lease.additionalNotes || "",
    status: lease.status === "pending" ? "Active" : lease.status === "terminated" ? "Terminated" : lease.status === "expired" ? "Expired" : "Active",
    createdAt: lease.createdAt,
    updatedAt: lease.updatedAt,
    terminationReason: lease.terminationReason || "",
    terminatedAt: lease.terminatedAt || null,
  };
}

function resolveUserAccess(userRole, userId, lease) {
  if (userRole === "admin") return true;

  if (userRole === "tenant") {
    const tenantId = lease.tenant && lease.tenant._id ? lease.tenant._id : lease.tenant;
    return String(tenantId || "") === String(userId);
  }

  if (!canReviewLeaseRoles.includes(userRole)) return false;

  const property = lease.property || {};
  if (userRole === "property_manager") {
    return String(property.assignedAgent || "") === String(userId);
  }
  if (userRole === "landlord") {
    return String(property.owner || "") === String(userId);
  }
  return false;
}

async function validateLeaseRequest({ user, tenantId, propertyId, applicationId, startDate, endDate, rentAmount, property, tenant, application }) {
  const tenantRecord = tenant || (await User.findById(tenantId).select("_id role firstName lastName email"));
  if (!tenantRecord) {
    throw Object.assign(new Error("Tenant not found."), { statusCode: 404 });
  }

  if (tenantRecord.role !== "tenant") {
    throw Object.assign(new Error("The lease tenant must be a tenant account."), { statusCode: 400 });
  }

  const propertyRecord = property || (await Property.findById(propertyId).select("_id title status visibility owner assignedAgent"));
  if (!propertyRecord) {
    throw Object.assign(new Error("Property not found."), { statusCode: 404 });
  }

  const applicationRecord = application || (await RentalApplication.findById(applicationId).select("_id status applicant property reviewedBy reviewedAt"));
  if (!applicationRecord) {
    throw Object.assign(new Error("Application not found."), { statusCode: 404 });
  }

  if (String(applicationRecord.applicant) !== String(user.id) && user.role === "tenant") {
    throw Object.assign(new Error("You may only create a lease for your own approved application."), { statusCode: 403 });
  }

  if (applicationRecord.status !== "approved") {
    throw Object.assign(new Error("A lease can only be created from an approved application."), { statusCode: 400 });
  }

  if (String(applicationRecord.property) !== String(propertyRecord._id) || String(applicationRecord.applicant) !== String(tenantRecord._id)) {
    throw Object.assign(new Error("The approved application does not match the selected property and tenant."), { statusCode: 400 });
  }

  if (user.role !== "admin") {
    if (user.role === "property_manager" && String(propertyRecord.assignedAgent || "") !== String(user.id)) {
      throw Object.assign(new Error("You do not manage this property."), { statusCode: 403 });
    }
    if (user.role === "landlord" && String(propertyRecord.owner || "") !== String(user.id)) {
      throw Object.assign(new Error("You do not own this property."), { statusCode: 403 });
    }
  }

  const existingLease = await Lease.findOne({
    property: propertyRecord._id,
    tenant: tenantRecord._id,
    status: { $in: activeLeaseStatuses },
  }).select("_id");
  if (existingLease) {
    throw Object.assign(new Error("This tenant already has an active lease for the selected property."), { statusCode: 409 });
  }

  if (propertyRecord.status === "rented") {
    throw Object.assign(new Error("This property is already occupied."), { statusCode: 409 });
  }

  if (!startDate || !endDate) {
    throw Object.assign(new Error("Lease start and end dates are required."), { statusCode: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw Object.assign(new Error("Lease end date must be after the start date."), { statusCode: 400 });
  }

  if (!Number.isFinite(Number(rentAmount)) || Number(rentAmount) <= 0) {
    throw Object.assign(new Error("Rent amount must be greater than zero."), { statusCode: 400 });
  }

  return { tenantRecord, propertyRecord, applicationRecord };
}

exports.createLease = async (req, res) => {
  try {
    if (req.user.role === "tenant") {
      return res.status(403).json({
        success: false,
        message: "Tenants cannot create leases.",
      });
    }

    const { tenantId, propertyId, applicationId, startDate, endDate, rentAmount, securityDeposit, paymentDueDate, lateFee, noticePeriodDays, renewalTerms, occupancyLimit, additionalNotes, status } = req.body || {};
    if (!tenantId || !propertyId || !applicationId) {
      return res.status(400).json({
        success: false,
        message: "Tenant, property, and approved application are required.",
      });
    }

    const { tenantRecord, propertyRecord, applicationRecord } = await validateLeaseRequest({
      user: req.user,
      tenantId,
      propertyId,
      applicationId,
      startDate,
      endDate,
      rentAmount,
      property: null,
      tenant: null,
      application: null,
    });

    const lease = await Lease.create({
      leaseNumber: `LEASE-${Date.now()}`,
      tenant: tenantRecord._id,
      property: propertyRecord._id,
      rentalApplication: applicationRecord._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      rentAmount: Number(rentAmount),
      rentPeriod: "monthly",
      serviceCharge: 0,
      securityDeposit: Number(securityDeposit || 0),
      paymentDueDate: paymentDueDate ? new Date(paymentDueDate) : new Date(startDate),
      lateFee: Number(lateFee || 0),
      noticePeriodDays: Number(noticePeriodDays || 30),
      renewalTerms: renewalTerms || "Renewal by mutual agreement and written notice.",
      occupancyLimit: Number(occupancyLimit || 1),
      additionalNotes: additionalNotes || "",
      status: status === "draft" ? "pending" : "active",
      createdBy: req.user.id,
    });

    propertyRecord.status = "rented";
    await propertyRecord.save();

    const populatedLease = await Lease.findById(lease._id)
      .populate([
        { path: "tenant", select: "firstName lastName email phone role" },
        { path: "property", select: "title propertyCode propertyType location status owner assignedAgent" },
        { path: "rentalApplication", select: "status applicant property" },
      ]);

    return res.status(201).json({
      success: true,
      message: "Lease created successfully.",
      data: serializeLease(populatedLease),
    });
  } catch (error) {
    const message = error.message || "Unable to create lease.";
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) console.error("Lease creation error:", error);
    return res.status(statusCode).json({ success: false, message });
  }
};

exports.getLeases = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "tenant") {
      filter = { tenant: req.user.id };
    } else if (req.user.role === "property_manager") {
      const propertyIds = await Property.find({ assignedAgent: req.user.id }).distinct("_id");
      filter = { property: { $in: propertyIds } };
    } else if (req.user.role === "landlord") {
      const propertyIds = await Property.find({ owner: req.user.id }).distinct("_id");
      filter = { property: { $in: propertyIds } };
    } else if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden." });
    }

    const leases = await Lease.find(filter)
      .populate([
        { path: "tenant", select: "firstName lastName email phone" },
        { path: "property", select: "title propertyCode location status owner assignedAgent" },
        { path: "rentalApplication", select: "status applicant property" },
      ])
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leases.length,
      data: leases.map(serializeLease),
    });
  } catch (error) {
    console.error("Get leases error:", error);
    return res.status(500).json({ success: false, message: "Unable to load leases." });
  }
};

exports.getLeaseById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid lease ID." });
    }

    const lease = await Lease.findById(req.params.id)
      .populate([
        { path: "tenant", select: "firstName lastName email phone" },
        { path: "property", select: "title propertyCode location status owner assignedAgent" },
        { path: "rentalApplication", select: "status applicant property" },
      ]);

    if (!lease) {
      return res.status(404).json({ success: false, message: "Lease not found." });
    }

    if (req.user.role !== "admin" && !resolveUserAccess(req.user.role, req.user.id, lease)) {
      return res.status(403).json({ success: false, message: "You do not have permission to view this lease." });
    }

    return res.status(200).json({ success: true, data: serializeLease(lease) });
  } catch (error) {
    console.error("Get lease by ID error:", error);
    return res.status(500).json({ success: false, message: "Unable to load lease." });
  }
};

exports.updateLease = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid lease ID." });
    }

    const lease = await Lease.findById(req.params.id);
    if (!lease) {
      return res.status(404).json({ success: false, message: "Lease not found." });
    }

    if (req.user.role !== "admin" && !resolveUserAccess(req.user.role, req.user.id, lease)) {
      return res.status(403).json({ success: false, message: "You do not have permission to update this lease." });
    }

    const { status, terminationReason, terminatedAt, rentAmount, securityDeposit, paymentDueDate, lateFee, noticePeriodDays, renewalTerms, occupancyLimit, additionalNotes, endDate, startDate } = req.body || {};

    if (req.user.role === "tenant") {
      return res.status(403).json({ success: false, message: "Tenants cannot update leases." });
    }

    if (status && ["terminated", "expired", "cancelled"].includes(String(status).toLowerCase())) {
      lease.status = "terminated";
      lease.terminationReason = terminationReason || "Lease terminated by the property team.";
      lease.terminatedAt = terminatedAt ? new Date(terminatedAt) : new Date();
    } else {
      if (startDate) lease.startDate = new Date(startDate);
      if (endDate) lease.endDate = new Date(endDate);
      if (rentAmount !== undefined) lease.rentAmount = Number(rentAmount);
      if (securityDeposit !== undefined) lease.securityDeposit = Number(securityDeposit);
      if (paymentDueDate) lease.paymentDueDate = new Date(paymentDueDate);
      if (lateFee !== undefined) lease.lateFee = Number(lateFee);
      if (noticePeriodDays !== undefined) lease.noticePeriodDays = Number(noticePeriodDays);
      if (renewalTerms !== undefined) lease.renewalTerms = renewalTerms;
      if (occupancyLimit !== undefined) lease.occupancyLimit = Number(occupancyLimit);
      if (additionalNotes !== undefined) lease.additionalNotes = additionalNotes;
      if (status) {
        const normalizedStatus = String(status).toLowerCase();
        if (["active", "pending", "expired", "terminated", "cancelled"].includes(normalizedStatus)) {
          lease.status = normalizedStatus === "pending" ? "pending" : normalizedStatus;
        }
      }
    }

    await lease.save();
    const populatedLease = await Lease.findById(lease._id).populate([
      { path: "tenant", select: "firstName lastName email phone" },
      { path: "property", select: "title propertyCode location status owner assignedAgent" },
      { path: "rentalApplication", select: "status applicant property" },
    ]);

    return res.status(200).json({ success: true, message: "Lease updated successfully.", data: serializeLease(populatedLease) });
  } catch (error) {
    console.error("Update lease error:", error);
    return res.status(500).json({ success: false, message: "Unable to update lease." });
  }
};

exports.deleteLease = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid lease ID." });
    }

    const lease = await Lease.findById(req.params.id);
    if (!lease) {
      return res.status(404).json({ success: false, message: "Lease not found." });
    }

    if (req.user.role !== "admin" && !resolveUserAccess(req.user.role, req.user.id, lease)) {
      return res.status(403).json({ success: false, message: "You do not have permission to delete this lease." });
    }

    if (req.user.role === "tenant") {
      return res.status(403).json({ success: false, message: "Tenants cannot delete leases." });
    }

    await lease.deleteOne();
    return res.status(200).json({ success: true, message: "Lease deleted successfully.", data: { id: String(lease._id) } });
  } catch (error) {
    console.error("Delete lease error:", error);
    return res.status(500).json({ success: false, message: "Unable to delete lease." });
  }
};
