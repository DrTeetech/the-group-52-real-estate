const mongoose = require("mongoose");
const Notification = require("../models/notification");
const User = require("../models/user");
const RentalApplication = require("../models/RentalApplication");
const Lease = require("../models/lease");
const Payment = require("../models/payment");
const MaintenanceRequest = require("../models/maintenanceRequest");
const Property = require("../models/property");

const notificationTypes = ["application", "lease", "payment", "maintenance", "rent", "system", "general"];
const relatedModels = {
  application: RentalApplication,
  lease: Lease,
  payment: Payment,
  maintenance: MaintenanceRequest,
  property: Property,
};

const typeLabels = {
  application: "Application",
  lease: "Lease",
  payment: "Payment",
  maintenance: "Maintenance",
  rent: "Rent",
  system: "System",
  general: "General",
};

const roleLabels = {
  tenant: "TENANT",
  property_manager: "PROPERTY_MANAGER",
  landlord: "LANDLORD",
  admin: "ADMIN",
};

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function normalizeNotificationType(value) {
  const normalized = String(value || "general").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!notificationTypes.includes(normalized)) {
    throw httpError(400, "Notification type is invalid.");
  }
  return normalized;
}

function normalizeRelatedEntity(value) {
  if (!value) return "";
  const normalized = String(value).trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases = {
    rental_application: "application",
    applications: "application",
    leases: "lease",
    payments: "payment",
    maintenance_request: "maintenance",
    maintenance_requests: "maintenance",
    properties: "property",
  };
  return aliases[normalized] || normalized;
}

function serializeNotification(notification) {
  const value = notification.toObject ? notification.toObject() : { ...notification };
  const recipient = value.recipient || {};
  const id = String(value._id || value.id || "");
  const recipientId = String(recipient._id || recipient || "");

  return {
    id,
    notificationId: `NOT-${id.slice(-8).toUpperCase()}`,
    userId: recipientId,
    userRole: roleLabels[recipient.role] || "",
    type: typeLabels[value.type] || "General",
    title: value.title,
    message: value.message,
    read: Boolean(value.read),
    readAt: value.readAt || null,
    relatedEntity: value.relatedEntity || "",
    relatedEntityId: value.relatedEntityId ? String(value.relatedEntityId) : "",
    relatedId: value.relatedEntityId ? String(value.relatedEntityId) : "",
    link: value.link || "",
    relatedRoute: value.link || "",
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function getErrorResponse(error, fallback) {
  const statusCode = error.statusCode || (error.name === "ValidationError" || error.name === "CastError" ? 400 : 500);
  if (statusCode === 500) console.error(fallback, error);
  return { statusCode, message: error.message || fallback };
}

async function resolveRecipient(req, input, type, relatedEntity, relatedEntityId) {
  const suppliedRecipient = input.recipientId || input.recipient || input.userId || input.user || null;
  if (!suppliedRecipient || String(suppliedRecipient) === String(req.user.id)) {
    return String(req.user.id);
  }

  if (!mongoose.isValidObjectId(suppliedRecipient)) {
    throw httpError(400, "Invalid notification recipient ID.");
  }

  if (type !== "maintenance" || relatedEntity !== "maintenance" || !relatedEntityId) {
    throw httpError(403, "You can only create notifications for your own account.");
  }

  const maintenance = await MaintenanceRequest.findById(relatedEntityId)
    .populate("property", "owner assignedAgent")
    .select("tenant property status");

  if (!maintenance) {
    throw httpError(404, "Related maintenance request not found.");
  }

  if (String(maintenance.tenant) !== String(suppliedRecipient)) {
    throw httpError(403, "The notification recipient must own the related maintenance request.");
  }

  if (!["completed", "resolved"].includes(String(maintenance.status || "").toLowerCase())) {
    throw httpError(403, "A maintenance notification can only be sent for a resolved request.");
  }

  const property = maintenance.property || {};
  const isAuthorized = req.user.role === "admin" ||
    (req.user.role === "property_manager" && String(property.assignedAgent || "") === String(req.user.id)) ||
    (req.user.role === "landlord" && String(property.owner || "") === String(req.user.id));

  if (!isAuthorized) {
    throw httpError(403, "You cannot create a notification for this maintenance request.");
  }

  return String(maintenance.tenant);
}

exports.getNotifications = async (req, res) => {
  try {
    const filter = { recipient: req.user.id };
    if (req.query.read !== undefined) {
      if (req.query.read !== "true" && req.query.read !== "false") {
        return res.status(400).json({ success: false, message: "Read filter must be true or false." });
      }
      filter.read = req.query.read === "true";
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).populate("recipient", "role").sort({ createdAt: -1 }),
      Notification.countDocuments({ recipient: req.user.id, read: false }),
    ]);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications.map(serializeNotification),
    });
  } catch (error) {
    const result = getErrorResponse(error, "Unable to load notifications.");
    return res.status(result.statusCode).json({ success: false, message: result.message });
  }
};

exports.getNotificationById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID." });
    }

    const notification = await Notification.findById(req.params.id).populate("recipient", "role");
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }
    if (String(notification.recipient._id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "You do not have permission to view this notification." });
    }

    return res.status(200).json({ success: true, data: serializeNotification(notification) });
  } catch (error) {
    const result = getErrorResponse(error, "Unable to load notification.");
    return res.status(result.statusCode).json({ success: false, message: result.message });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const input = req.body || {};
    const title = String(input.title || "").trim();
    const message = String(input.message || "").trim();
    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Notification title and message are required." });
    }
    if (title.length > 160 || message.length > 2000) {
      return res.status(400).json({ success: false, message: "Notification title or message is too long." });
    }

    const type = normalizeNotificationType(input.type);
    let relatedEntity = normalizeRelatedEntity(input.relatedEntity);
    const relatedEntityId = input.relatedEntityId || input.relatedId || null;
    if (!relatedEntity && type === "maintenance" && relatedEntityId) relatedEntity = "maintenance";
    if (relatedEntity && !["application", "lease", "payment", "maintenance", "property", "system", "general"].includes(relatedEntity)) {
      return res.status(400).json({ success: false, message: "Related entity is invalid." });
    }
    if (relatedEntityId && !mongoose.isValidObjectId(relatedEntityId)) {
      return res.status(400).json({ success: false, message: "Invalid related entity ID." });
    }
    if (relatedEntityId && !relatedEntity) {
      return res.status(400).json({ success: false, message: "Related entity is required when a related ID is supplied." });
    }
    if (relatedEntityId) {
      const relatedModel = relatedModels[relatedEntity];
      if (!relatedModel) {
        return res.status(400).json({ success: false, message: "This related entity cannot have an ID." });
      }
      if (!(await relatedModel.exists({ _id: relatedEntityId }))) {
        return res.status(404).json({ success: false, message: "Related entity not found." });
      }
    }

    const link = String(input.link || input.relatedRoute || "").trim();
    if (link && (!link.startsWith("/") || link.startsWith("//") || link.includes("\\"))) {
      return res.status(400).json({ success: false, message: "Notification link must be an internal application path." });
    }

    const recipientId = await resolveRecipient(req, input, type, relatedEntity, relatedEntityId);
    if (!(await User.exists({ _id: recipientId }))) {
      return res.status(404).json({ success: false, message: "Notification recipient not found." });
    }

    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      read: false,
      readAt: null,
      ...(relatedEntity ? { relatedEntity } : {}),
      ...(relatedEntityId ? { relatedEntityId } : {}),
      link,
    });
    const populated = await Notification.findById(notification._id).populate("recipient", "role");

    return res.status(201).json({
      success: true,
      message: "Notification created successfully.",
      data: serializeNotification(populated),
    });
  } catch (error) {
    const result = getErrorResponse(error, "Unable to create notification.");
    return res.status(result.statusCode).json({ success: false, message: result.message });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID." });
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }
    if (String(notification.recipient) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "You do not have permission to update this notification." });
    }

    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();
    }
    const updated = await Notification.findById(notification._id).populate("recipient", "role");

    return res.status(200).json({ success: true, data: serializeNotification(updated) });
  } catch (error) {
    const result = getErrorResponse(error, "Unable to mark notification as read.");
    return res.status(result.statusCode).json({ success: false, message: result.message });
  }
};

exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate("recipient", "role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      modifiedCount: result.modifiedCount,
      unreadCount: 0,
      data: notifications.map(serializeNotification),
    });
  } catch (error) {
    const response = getErrorResponse(error, "Unable to mark notifications as read.");
    return res.status(response.statusCode).json({ success: false, message: response.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID." });
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }
    if (String(notification.recipient) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "You do not have permission to delete this notification." });
    }

    await notification.deleteOne();
    return res.status(200).json({ success: true, id: String(notification._id) });
  } catch (error) {
    const result = getErrorResponse(error, "Unable to delete notification.");
    return res.status(result.statusCode).json({ success: false, message: result.message });
  }
};