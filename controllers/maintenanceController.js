const mongoose = require("mongoose");
const MaintenanceRequest = require("../models/maintenanceRequest");
const Property = require("../models/property");
const Lease = require("../models/lease");
const User = require("../models/user");

const validStatuses = ["submitted", "under_review", "assigned", "in_progress", "completed", "cancelled"];
const validPriorities = ["low", "medium", "high", "urgent"];
const validCategories = ["plumbing", "electrical", "hvac", "appliance", "security", "structural", "general", "other"];

const statusLabels = {
  submitted: "Submitted",
  under_review: "Under Review",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Resolved",
  cancelled: "Closed",
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Emergency",
};

const categoryLabels = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  hvac: "HVAC",
  appliance: "Appliance",
  security: "Security",
  structural: "Structural",
  general: "General",
  other: "Other",
};

const statusValues = {
  Submitted: "submitted",
  "Under Review": "under_review",
  Assigned: "assigned",
  "In Progress": "in_progress",
  Resolved: "completed",
  Closed: "completed",
  submitted: "submitted",
  under_review: "under_review",
  assigned: "assigned",
  in_progress: "in_progress",
  completed: "completed",
  cancelled: "cancelled",
};

const priorityValues = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Emergency: "urgent",
  low: "low",
  medium: "medium",
  high: "high",
  urgent: "urgent",
};

const categoryValues = {
  Plumbing: "plumbing",
  Electrical: "electrical",
  HVAC: "hvac",
  Appliance: "appliance",
  Security: "security",
  Structural: "structural",
  General: "general",
  Other: "other",
  plumbing: "plumbing",
  electrical: "electrical",
  hvac: "hvac",
  appliance: "appliance",
  security: "security",
  structural: "structural",
  general: "general",
  other: "other",
};

function toIsoDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function serializeMaintenanceRequest(record) {
  const requestDoc = record.toObject ? record.toObject() : { ...record };
  const tenant = requestDoc.tenant || {};
  const property = requestDoc.property || {};
  const lease = requestDoc.lease || {};
  const assignedTo = requestDoc.assignedTo || {};

  const rawStatus = requestDoc.status || "submitted";
  const rawPriority = requestDoc.priority || "medium";
  const rawCategory = requestDoc.category || "general";

  return {
    id: String(requestDoc._id || requestDoc.id),
    requestId: requestDoc.requestId || `MNT-${String(requestDoc._id || requestDoc.id).slice(-6).toUpperCase()}`,
    tenantId: tenant._id ? String(tenant._id) : requestDoc.tenant ? String(requestDoc.tenant) : "",
    tenantName: [tenant.firstName, tenant.lastName].filter(Boolean).join(" ") || "",
    tenantEmail: tenant.email || "",
    propertyId: property._id ? String(property._id) : requestDoc.property ? String(requestDoc.property) : "",
    propertyName: property.title || "",
    leaseId: lease._id ? String(lease._id) : requestDoc.lease ? String(requestDoc.lease) : "",
    title: requestDoc.title || "",
    issue: requestDoc.title || "",
    category: categoryLabels[rawCategory] || "General",
    priority: priorityLabels[rawPriority] || "Medium",
    status: statusLabels[rawStatus] || "Submitted",
    description: requestDoc.description || "",
    submittedDate: toIsoDate(requestDoc.createdAt || requestDoc.submittedAt),
    updatedDate: toIsoDate(requestDoc.updatedAt),
    resolvedDate: toIsoDate(requestDoc.resolvedAt),
    assignedTo: assignedTo._id ? String(assignedTo._id) : requestDoc.assignedTo ? String(requestDoc.assignedTo) : "",
    assignedToName: [assignedTo.firstName, assignedTo.lastName].filter(Boolean).join(" ") || "",
    resolutionNotes: requestDoc.resolutionNotes || "",
    attachments: Array.isArray(requestDoc.attachments) ? requestDoc.attachments : [],
    createdAt: requestDoc.createdAt,
    updatedAt: requestDoc.updatedAt,
  };
}

function resolveMaintenanceAccess(user, record) {
  if (!record) return false;
  if (user.role === "admin") return true;

  const tenantId = record.tenant && record.tenant._id ? String(record.tenant._id) : record.tenant ? String(record.tenant) : "";
  if (user.role === "tenant") {
    return tenantId === String(user.id);
  }

  const property = record.property || {};
  if (user.role === "property_manager") {
    return String(property.assignedAgent || "") === String(user.id);
  }

  if (user.role === "landlord") {
    return String(property.owner || "") === String(user.id);
  }

  return false;
}

async function getUserMaintenanceScope(user) {
  if (user.role === "admin") return {};
  if (user.role === "tenant") return { tenant: user.id };
  if (user.role === "property_manager") {
    const propertyIds = await Property.find({ assignedAgent: user.id }).distinct("_id");
    return { property: { $in: propertyIds } };
  }
  if (user.role === "landlord") {
    const propertyIds = await Property.find({ owner: user.id }).distinct("_id");
    return { property: { $in: propertyIds } };
  }
  return { _id: null };
}

async function validateMaintenanceInput({ user, input, isUpdate = false, existingRecord = null }) {
  const title = String(input.title ?? input.issue ?? existingRecord?.title ?? "").trim();
  const description = String(input.description ?? existingRecord?.description ?? "").trim();
  const rawCategory = String(input.category ?? existingRecord?.category ?? "general").trim();
  const rawPriority = String(input.priority ?? existingRecord?.priority ?? "medium").trim();
  const rawStatus = String(input.status ?? existingRecord?.status ?? "submitted").trim();
  const rawPropertyId = input.propertyId || input.property || (existingRecord && (existingRecord.property ? String(existingRecord.property._id || existingRecord.property) : undefined)) || null;
  const rawTenantId = input.tenantId || input.tenant || (existingRecord && (existingRecord.tenant ? String(existingRecord.tenant._id || existingRecord.tenant) : undefined)) || null;
  const rawLeaseId = input.leaseId || input.lease || (existingRecord && (existingRecord.lease ? String(existingRecord.lease._id || existingRecord.lease) : undefined)) || null;

  if (!isUpdate && !title) {
    throw Object.assign(new Error("Maintenance title is required."), { statusCode: 400 });
  }

  if (!isUpdate && !description) {
    throw Object.assign(new Error("Maintenance description is required."), { statusCode: 400 });
  }

  if (!isUpdate && !rawPropertyId) {
    throw Object.assign(new Error("Property is required."), { statusCode: 400 });
  }

  if (rawPropertyId && !mongoose.isValidObjectId(rawPropertyId)) {
    throw Object.assign(new Error("Invalid property ID."), { statusCode: 400 });
  }

  if (rawLeaseId && !mongoose.isValidObjectId(rawLeaseId)) {
    throw Object.assign(new Error("Invalid lease ID."), { statusCode: 400 });
  }

  if (rawCategory && !validCategories.includes(categoryValues[rawCategory] || rawCategory.toLowerCase())) {
    throw Object.assign(new Error("Maintenance category is invalid."), { statusCode: 400 });
  }

  if (rawPriority && !validPriorities.includes(priorityValues[rawPriority] || rawPriority.toLowerCase())) {
    throw Object.assign(new Error("Maintenance priority is invalid."), { statusCode: 400 });
  }

  if (rawStatus && !validStatuses.includes(statusValues[rawStatus] || rawStatus.toLowerCase())) {
    throw Object.assign(new Error("Maintenance status is invalid."), { statusCode: 400 });
  }

  const normalizedStatus = (statusValues[rawStatus] || rawStatus.toLowerCase()) || "submitted";
  if (user.role === "tenant" && normalizedStatus !== "submitted") {
    throw Object.assign(new Error("Tenants may only submit a maintenance request with the submitted status."), { statusCode: 403 });
  }

  let propertyRecord = null;
  if (rawPropertyId) {
    propertyRecord = await Property.findById(rawPropertyId).select("_id title owner assignedAgent");
    if (!propertyRecord) {
      throw Object.assign(new Error("Property not found."), { statusCode: 404 });
    }
  }

  let tenantRecord = null;
  if (rawTenantId) {
    if (!mongoose.isValidObjectId(rawTenantId)) {
      throw Object.assign(new Error("Invalid tenant ID."), { statusCode: 400 });
    }
    tenantRecord = await User.findById(rawTenantId).select("_id role firstName lastName email");
    if (!tenantRecord) {
      throw Object.assign(new Error("Tenant not found."), { statusCode: 404 });
    }
    if (tenantRecord.role !== "tenant") {
      throw Object.assign(new Error("Maintenance requests may only be created for tenant accounts."), { statusCode: 400 });
    }
  }

  if (user.role === "tenant") {
    const tenantUserId = rawTenantId || user.id;
    if (String(tenantUserId) !== String(user.id)) {
      throw Object.assign(new Error("Tenants can only create requests for their own account."), { statusCode: 403 });
    }
    if (!tenantRecord) {
      tenantRecord = await User.findById(user.id).select("_id role firstName lastName email");
    }
  }

  if (!tenantRecord && rawPropertyId) {
    const fallbackTenant = reqUserForFallback(user);
    tenantRecord = fallbackTenant || null;
  }

  if (!tenantRecord && user.role !== "tenant") {
    throw Object.assign(new Error("Tenant is required."), { statusCode: 400 });
  }

  if (propertyRecord && user.role === "property_manager" && String(propertyRecord.assignedAgent || "") !== String(user.id)) {
    throw Object.assign(new Error("You do not manage this property."), { statusCode: 403 });
  }

  if (propertyRecord && user.role === "landlord" && String(propertyRecord.owner || "") !== String(user.id)) {
    throw Object.assign(new Error("You do not own this property."), { statusCode: 403 });
  }

  if (propertyRecord && tenantRecord && rawLeaseId) {
    const leaseRecord = await Lease.findById(rawLeaseId).select("_id tenant property status");
    if (!leaseRecord) {
      throw Object.assign(new Error("Lease not found."), { statusCode: 404 });
    }
    if (String(leaseRecord.property) !== String(propertyRecord._id)) {
      throw Object.assign(new Error("The lease does not belong to the selected property."), { statusCode: 400 });
    }
    if (String(leaseRecord.tenant) !== String(tenantRecord._id)) {
      const statusCode = user.role === "tenant" ? 403 : 400;
      throw Object.assign(new Error("The lease does not belong to the selected tenant."), { statusCode });
    }
  }

  if (propertyRecord && tenantRecord && !rawLeaseId && user.role === "tenant") {
    const activeLease = await Lease.findOne({
      tenant: tenantRecord._id,
      property: propertyRecord._id,
      status: { $in: ["active", "pending"] },
    }).select("_id");
    if (!activeLease) {
      throw Object.assign(new Error("This tenant does not have an active lease for the selected property."), { statusCode: 403 });
    }
  }

  const normalizedCategory = categoryValues[rawCategory] || rawCategory.toLowerCase();
  const normalizedPriority = priorityValues[rawPriority] || rawPriority.toLowerCase();

  return {
    title,
    description,
    category: validCategories.includes(normalizedCategory) ? normalizedCategory : "general",
    priority: validPriorities.includes(normalizedPriority) ? normalizedPriority : "medium",
    status: validStatuses.includes(normalizedStatus) ? normalizedStatus : "submitted",
    propertyRecord,
    tenantRecord,
  };
}

function reqUserForFallback(user) {
  if (!user || !user.id) return null;
  return {
    _id: user.id,
    id: user.id,
    role: user.role,
  };
}

exports.getMaintenanceRequests = async (req, res) => {
  try {
    const filter = await getUserMaintenanceScope(req.user);
    const requests = await MaintenanceRequest.find(filter)
      .populate([
        { path: "tenant", select: "firstName lastName email role" },
        { path: "property", select: "title owner assignedAgent" },
        { path: "lease", select: "tenant property status" },
        { path: "assignedTo", select: "firstName lastName email role" },
      ])
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests.map(serializeMaintenanceRequest),
    });
  } catch (error) {
    console.error("Get maintenance requests error:", error);
    return res.status(500).json({ success: false, message: "Unable to load maintenance requests." });
  }
};

exports.getMaintenanceRequestById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid maintenance request ID." });
    }

    const request = await MaintenanceRequest.findById(req.params.id)
      .populate([
        { path: "tenant", select: "firstName lastName email role" },
        { path: "property", select: "title owner assignedAgent" },
        { path: "lease", select: "tenant property status" },
        { path: "assignedTo", select: "firstName lastName email role" },
      ]);

    if (!request) {
      return res.status(404).json({ success: false, message: "Maintenance request not found." });
    }

    if (req.user.role !== "admin" && !resolveMaintenanceAccess(req.user, request)) {
      return res.status(403).json({ success: false, message: "You do not have permission to view this maintenance request." });
    }

    return res.status(200).json({ success: true, data: serializeMaintenanceRequest(request) });
  } catch (error) {
    console.error("Get maintenance request error:", error);
    return res.status(500).json({ success: false, message: "Unable to load maintenance request." });
  }
};

exports.createMaintenanceRequest = async (req, res) => {
  try {
    const input = req.body || {};

    if (req.user.role === "tenant") {
      input.tenantId = req.user.id;
    }

    const { title, description, category, priority, status, propertyRecord, tenantRecord } = await validateMaintenanceInput({
      user: req.user,
      input,
      isUpdate: false,
    });

    const maintenance = await MaintenanceRequest.create({
      tenant: tenantRecord._id,
      property: propertyRecord._id,
      lease: input.leaseId || input.lease || null,
      title,
      description,
      category,
      priority,
      status: req.user.role === "tenant" ? "submitted" : status,
      assignedTo: input.assignedTo || null,
      resolutionNotes: input.resolutionNotes || "",
      attachments: Array.isArray(input.attachments) ? input.attachments : [],
      createdBy: req.user.id,
    });

    const populated = await MaintenanceRequest.findById(maintenance._id)
      .populate([
        { path: "tenant", select: "firstName lastName email role" },
        { path: "property", select: "title owner assignedAgent" },
        { path: "lease", select: "tenant property status" },
        { path: "assignedTo", select: "firstName lastName email role" },
      ]);

    return res.status(201).json({
      success: true,
      message: "Maintenance request created successfully.",
      data: serializeMaintenanceRequest(populated),
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) console.error("Create maintenance request error:", error);
    return res.status(statusCode).json({ success: false, message: error.message || "Unable to create maintenance request." });
  }
};

exports.updateMaintenanceRequest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid maintenance request ID." });
    }

    const request = await MaintenanceRequest.findById(req.params.id)
      .populate([
        { path: "tenant", select: "firstName lastName email role" },
        { path: "property", select: "title owner assignedAgent" },
        { path: "lease", select: "tenant property status" },
        { path: "assignedTo", select: "firstName lastName email role" },
      ]);

    if (!request) {
      return res.status(404).json({ success: false, message: "Maintenance request not found." });
    }

    if (req.user.role !== "admin" && !resolveMaintenanceAccess(req.user, request)) {
      return res.status(403).json({ success: false, message: "You do not have permission to update this maintenance request." });
    }

    const input = { ...(req.body || {}) };

    if (req.user.role === "tenant") {
      if (input.status || input.assignedTo || input.propertyId || input.tenantId || input.leaseId) {
        return res.status(403).json({ success: false, message: "Tenants may only edit their own request details, not privileged fields." });
      }
      input.tenantId = String(request.tenant._id || request.tenant);
      input.propertyId = String(request.property._id || request.property);
    }

    const { title, description, category, priority, status, propertyRecord, tenantRecord } = await validateMaintenanceInput({
      user: req.user,
      input: {
        ...input,
        title: input.title ?? input.issue ?? request.title,
        description: input.description ?? request.description,
        tenantId: input.tenantId || input.tenant || (request.tenant ? String(request.tenant._id || request.tenant) : undefined),
        propertyId: input.propertyId || input.property || (request.property ? String(request.property._id || request.property) : undefined),
        leaseId: input.leaseId || input.lease || (request.lease ? String(request.lease._id || request.lease) : undefined),
        status: input.status ?? request.status,
        category: input.category ?? request.category,
        priority: input.priority ?? request.priority,
      },
      isUpdate: true,
      existingRecord: request,
    });

    if (req.user.role === "tenant") {
      request.title = title;
      request.description = description;
      request.category = category;
      request.priority = priority;
    } else {
      if (input.title || input.issue) request.title = title;
      if (input.description) request.description = description;
      if (input.category) request.category = category;
      if (input.priority) request.priority = priority;
      if (input.status || input.assignedTo || input.resolutionNotes) {
        if (input.status) request.status = status;
        if (input.assignedTo) request.assignedTo = input.assignedTo;
        if (input.resolutionNotes !== undefined) request.resolutionNotes = input.resolutionNotes;
      }
    }

    if (input.attachments) {
      request.attachments = Array.isArray(input.attachments) ? input.attachments : [];
    }

    request.updatedAt = new Date();
    await request.save();

    const updated = await MaintenanceRequest.findById(request._id)
      .populate([
        { path: "tenant", select: "firstName lastName email role" },
        { path: "property", select: "title owner assignedAgent" },
        { path: "lease", select: "tenant property status" },
        { path: "assignedTo", select: "firstName lastName email role" },
      ]);

    return res.status(200).json({ success: true, message: "Maintenance request updated successfully.", data: serializeMaintenanceRequest(updated) });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) console.error("Update maintenance request error:", error);
    return res.status(statusCode).json({ success: false, message: error.message || "Unable to update maintenance request." });
  }
};

exports.deleteMaintenanceRequest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid maintenance request ID." });
    }

    const request = await MaintenanceRequest.findById(req.params.id).populate([
      { path: "tenant", select: "firstName lastName email role" },
      { path: "property", select: "title owner assignedAgent" },
      { path: "lease", select: "tenant property status" },
    ]);

    if (!request) {
      return res.status(404).json({ success: false, message: "Maintenance request not found." });
    }

    if (req.user.role !== "admin" && !resolveMaintenanceAccess(req.user, request)) {
      return res.status(403).json({ success: false, message: "You do not have permission to cancel this maintenance request." });
    }

    if (req.user.role === "tenant") {
      request.status = "cancelled";
      request.resolutionNotes = request.resolutionNotes || "Cancelled by the tenant.";
      await request.save();
      return res.status(200).json({ success: true, message: "Maintenance request cancelled successfully.", data: { id: String(request._id) } });
    }

    await request.deleteOne();
    return res.status(200).json({ success: true, message: "Maintenance request deleted successfully.", data: { id: String(request._id) } });
  } catch (error) {
    console.error("Delete maintenance request error:", error);
    return res.status(500).json({ success: false, message: "Unable to delete maintenance request." });
  }
};
