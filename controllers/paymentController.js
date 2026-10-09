const mongoose = require("mongoose");
const Payment = require("../models/payment");
const Property = require("../models/property");
const Lease = require("../models/lease");
const User = require("../models/user");

const validTypes = ["rent", "security_deposit", "service_charge", "application_fee", "other"];
const validProviders = ["paystack", "flutterwave", "bank_transfer", "cash"];
const paymentLeaseRules = {
  rent: { required: true, eligibleStatuses: ["active"] },
  security_deposit: { required: true, eligibleStatuses: ["pending", "active"] },
  service_charge: { required: true, eligibleStatuses: ["active"] },
  application_fee: { required: false, eligibleStatuses: [] },
  other: { required: false, eligibleStatuses: [] },
};

const paymentTypeLabels = {
  rent: "Rent",
  security_deposit: "Security Deposit",
  service_charge: "Service Charge",
  application_fee: "Application Fee",
  other: "Other",
};

const paymentStatusLabels = {
  pending: "Pending",
  successful: "Successful",
  failed: "Failed",
  refunded: "Refunded",
};

const paymentMethodLabels = {
  paystack: "Card",
  flutterwave: "Card",
  bank_transfer: "Bank Transfer",
  cash: "Cash",
};

function normalizeDate(dateValue) {
  if (!dateValue) return "";
  const value = new Date(dateValue);
  if (Number.isNaN(value.getTime())) return "";
  return value.toISOString().slice(0, 10);
}

function sanitizePaymentMetadata(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};

  const { paidAt, paidDate, status, ...safeMetadata } = metadata;
  return safeMetadata;
}

function serializePayment(payment) {
  const paymentDoc = payment.toObject ? payment.toObject() : { ...payment };
  const user = paymentDoc.user || {};
  const property = paymentDoc.property || {};
  const lease = paymentDoc.lease || {};

  return {
    id: String(paymentDoc._id || paymentDoc.id),
    paymentId: paymentDoc.reference || String(paymentDoc._id || paymentDoc.id),
    reference: paymentDoc.reference || String(paymentDoc._id || paymentDoc.id),
    userId: user._id ? String(user._id) : paymentDoc.user ? String(paymentDoc.user) : "",
    tenantId: user._id ? String(user._id) : paymentDoc.user ? String(paymentDoc.user) : "",
    tenantName: [user.firstName, user.lastName].filter(Boolean).join(" ") || "",
    tenantEmail: user.email || "",
    propertyId: property._id ? String(property._id) : paymentDoc.property ? String(paymentDoc.property) : "",
    propertyName: property.title || "",
    leaseId: lease._id ? String(lease._id) : paymentDoc.lease ? String(paymentDoc.lease) : "",
    amount: Number(paymentDoc.amount || 0),
    currency: paymentDoc.currency || "NGN",
    type: paymentDoc.type || "other",
    paymentType: paymentTypeLabels[paymentDoc.type] || "Other",
    provider: paymentDoc.provider || "cash",
    paymentMethod: paymentMethodLabels[paymentDoc.provider] || "N/A",
    status: paymentDoc.status || "pending",
    paymentStatus: paymentStatusLabels[paymentDoc.status] || "Pending",
    transactionReference: paymentDoc.providerReference || paymentDoc.reference || "",
    dueDate: normalizeDate(paymentDoc.metadata?.dueDate),
    paidDate: paymentDoc.paidAt ? normalizeDate(paymentDoc.paidAt) : "",
    description: paymentDoc.metadata?.description || "",
    metadata: sanitizePaymentMetadata(paymentDoc.metadata),
    createdAt: paymentDoc.createdAt,
    updatedAt: paymentDoc.updatedAt,
  };
}

function resolvePaymentAccess(user, payment) {
  if (!payment) return false;

  if (user.role === "admin") return true;

  if (user.role === "tenant") {
    const tenantId = payment.user && payment.user._id ? String(payment.user._id) : String(payment.user || "");
    return tenantId === String(user.id);
  }

  const property = payment.property || {};
  if (user.role === "property_manager") {
    return String(property.assignedAgent || "") === String(user.id);
  }

  if (user.role === "landlord") {
    return String(property.owner || "") === String(user.id);
  }

  return false;
}

function buildPaymentQueryForUser(user) {
  if (user.role === "admin") return {};
  if (user.role === "tenant") return { user: user.id };
  if (user.role === "property_manager") {
    return { property: { $in: [] } };
  }
  if (user.role === "landlord") {
    return { property: { $in: [] } };
  }
  return { _id: null };
}

async function getUserPaymentScope(user) {
  if (user.role === "tenant") return { user: user.id };
  if (user.role === "property_manager") {
    const propertyIds = await Property.find({ assignedAgent: user.id }).distinct("_id");
    return { property: { $in: propertyIds } };
  }
  if (user.role === "landlord") {
    const propertyIds = await Property.find({ owner: user.id }).distinct("_id");
    return { property: { $in: propertyIds } };
  }
  if (user.role === "admin") return {};
  return { _id: null };
}

async function validatePaymentInput({ user, input, isUpdate = false }) {
  const amount = Number(input.amount ?? input.total ?? 0);
  const type = String(input.type || input.paymentType || "rent").toLowerCase();
  const provider = String(input.provider || input.paymentMethod || "paystack").toLowerCase();

  if (!isUpdate && (!input.amount && amount <= 0)) {
    throw Object.assign(new Error("Payment amount must be greater than zero."), { statusCode: 400 });
  }

  if (input.amount !== undefined && !Number.isFinite(amount)) {
    throw Object.assign(new Error("Payment amount must be numeric."), { statusCode: 400 });
  }

  if (input.amount !== undefined && amount <= 0) {
    throw Object.assign(new Error("Payment amount must be greater than zero."), { statusCode: 400 });
  }

  if (type && !validTypes.includes(type)) {
    throw Object.assign(new Error("Payment type is invalid."), { statusCode: 400 });
  }

  if (provider && !validProviders.includes(provider)) {
    throw Object.assign(new Error("Payment provider is invalid."), { statusCode: 400 });
  }

  const rawUserId = input.userId || input.user || input.tenantId || input.tenant || null;
  const rawPropertyId = input.propertyId || input.property || null;
  const rawLeaseId = input.leaseId || input.lease || null;
  const leaseRule = paymentLeaseRules[type];

  if (!isUpdate && (!rawUserId || !rawPropertyId)) {
    throw Object.assign(new Error("Tenant and property are required."), { statusCode: 400 });
  }

  if (rawUserId && !mongoose.isValidObjectId(rawUserId)) {
    throw Object.assign(new Error("Invalid tenant user ID."), { statusCode: 400 });
  }

  if (rawPropertyId && !mongoose.isValidObjectId(rawPropertyId)) {
    throw Object.assign(new Error("Invalid property ID."), { statusCode: 400 });
  }

  if (rawLeaseId && !mongoose.isValidObjectId(rawLeaseId)) {
    throw Object.assign(new Error("Invalid lease ID."), { statusCode: 400 });
  }

  if (!isUpdate && leaseRule.required && !rawLeaseId) {
    throw Object.assign(new Error(`A lease is required for ${type.replaceAll("_", " ")} payments.`), { statusCode: 400 });
  }

  const tenantRecord = rawUserId ? await User.findById(rawUserId).select("_id role firstName lastName email") : null;
  if (rawUserId && !tenantRecord) {
    throw Object.assign(new Error("Tenant account not found."), { statusCode: 404 });
  }

  if (tenantRecord && tenantRecord.role !== "tenant") {
    throw Object.assign(new Error("Payments can only be recorded for tenant accounts."), { statusCode: 400 });
  }

  const propertyRecord = rawPropertyId ? await Property.findById(rawPropertyId).select("_id title owner assignedAgent") : null;
  if (rawPropertyId && !propertyRecord) {
    throw Object.assign(new Error("Property not found."), { statusCode: 404 });
  }

  if (user.role === "tenant") {
    if (!rawUserId || String(rawUserId) !== String(user.id)) {
      throw Object.assign(new Error("You can only create payments for your own account."), { statusCode: 403 });
    }
  } else if (user.role === "property_manager") {
    if (!propertyRecord || String(propertyRecord.assignedAgent || "") !== String(user.id)) {
      throw Object.assign(new Error("You do not manage this property."), { statusCode: 403 });
    }
  } else if (user.role === "landlord") {
    if (!propertyRecord || String(propertyRecord.owner || "") !== String(user.id)) {
      throw Object.assign(new Error("You do not own this property."), { statusCode: 403 });
    }
  }

  if (rawLeaseId) {
    const leaseRecord = await Lease.findById(rawLeaseId).select("_id tenant property status");
    if (!leaseRecord) {
      throw Object.assign(new Error("Lease not found."), { statusCode: 404 });
    }
    if (String(leaseRecord.property) !== String(propertyRecord._id)) {
      throw Object.assign(new Error("The lease does not belong to the selected property."), { statusCode: 400 });
    }
    if (String(leaseRecord.tenant) !== String(tenantRecord._id)) {
      throw Object.assign(new Error("The lease does not belong to the selected tenant."), { statusCode: 400 });
    }
    if (leaseRule.eligibleStatuses.length && !leaseRule.eligibleStatuses.includes(leaseRecord.status)) {
      throw Object.assign(new Error(`The lease status does not allow a ${type.replaceAll("_", " ")} payment.`), { statusCode: 400 });
    }
  }

  const reference = String(input.reference || input.transactionReference || input.providerReference || `PAY-${Date.now().toString().slice(-6)}`);
  const duplicate = await Payment.findOne({ reference }).select("_id");
  if (duplicate && !isUpdate) {
    throw Object.assign(new Error("A payment with this reference already exists."), { statusCode: 409 });
  }

  return {
    tenantRecord,
    propertyRecord,
    reference,
    amount,
    type,
    provider,
  };
}

exports.getPayments = async (req, res) => {
  try {
    const filter = await getUserPaymentScope(req.user);

    const payments = await Payment.find(filter)
      .populate([
        { path: "user", select: "firstName lastName email role" },
        { path: "property", select: "title owner assignedAgent" },
        { path: "lease", select: "tenant property" },
      ])
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments.map(serializePayment),
    });
  } catch (error) {
    console.error("Get payments error:", error);
    return res.status(500).json({ success: false, message: "Unable to load payments." });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid payment ID." });
    }

    const payment = await Payment.findById(req.params.id)
      .populate([
        { path: "user", select: "firstName lastName email role" },
        { path: "property", select: "title owner assignedAgent" },
        { path: "lease", select: "tenant property" },
      ]);

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    if (req.user.role !== "admin" && !resolvePaymentAccess(req.user, payment)) {
      return res.status(403).json({ success: false, message: "You do not have permission to view this payment." });
    }

    return res.status(200).json({ success: true, data: serializePayment(payment) });
  } catch (error) {
    console.error("Get payment by ID error:", error);
    return res.status(500).json({ success: false, message: "Unable to load payment." });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const input = req.body || {};

    if (req.user.role === "tenant") {
      input.userId = req.user.id;
    }

    const { amount, provider, type, reference, tenantRecord, propertyRecord } = await validatePaymentInput({
      user: req.user,
      input,
      isUpdate: false,
    });

    const metadata = sanitizePaymentMetadata(input.metadata);

    if (input.description || input.notes) metadata.description = input.description || input.notes;
    if (input.dueDate) metadata.dueDate = input.dueDate;
    const payment = await Payment.create({
      user: tenantRecord._id,
      property: propertyRecord._id,
      lease: input.leaseId || input.lease || null,
      amount,
      currency: input.currency || "NGN",
      type,
      provider,
      providerReference: input.providerReference || reference,
      reference,
      status: "pending",
      paidAt: null,
      metadata,
    });

    const populated = await Payment.findById(payment._id)
      .populate([
        { path: "user", select: "firstName lastName email role" },
        { path: "property", select: "title owner assignedAgent" },
        { path: "lease", select: "tenant property status" },
      ]);

    return res.status(201).json({ success: true, message: "Payment created successfully.", data: serializePayment(populated) });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) console.error("Create payment error:", error);
    return res.status(statusCode).json({ success: false, message: error.message || "Unable to create payment." });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid payment ID." });
    }

    const payment = await Payment.findById(req.params.id).populate([
      { path: "user", select: "firstName lastName email role" },
      { path: "property", select: "title owner assignedAgent" },
      { path: "lease", select: "tenant property" },
    ]);

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    if (req.user.role !== "admin" && !resolvePaymentAccess(req.user, payment)) {
      return res.status(403).json({ success: false, message: "You do not have permission to update this payment." });
    }

    if (req.user.role === "tenant") {
      return res.status(403).json({ success: false, message: "Tenants cannot update payment records." });
    }

    const input = req.body || {};
    const { amount, provider, type } = await validatePaymentInput({
      user: req.user,
      input: { ...input, userId: payment.user ? String(payment.user._id || payment.user) : input.userId, propertyId: payment.property ? String(payment.property._id || payment.property) : input.propertyId },
      isUpdate: true,
    });

    if (input.amount !== undefined) payment.amount = amount;
    if (input.currency) payment.currency = input.currency;
    if (input.type || input.paymentType) payment.type = type;
    if (input.provider || input.paymentMethod) payment.provider = provider;
    if (input.reference || input.transactionReference || input.providerReference) payment.reference = String(input.reference || input.transactionReference || input.providerReference);
    if (input.providerReference) payment.providerReference = input.providerReference;
    if (input.metadata || input.description || input.dueDate || input.notes) {
      payment.metadata = sanitizePaymentMetadata({
        ...(payment.metadata || {}),
        ...(input.metadata || {}),
      });
      if (input.description || input.notes) payment.metadata.description = input.description || input.notes;
      if (input.dueDate) payment.metadata.dueDate = input.dueDate;
    }

    await payment.save();
    const updated = await Payment.findById(payment._id).populate([
      { path: "user", select: "firstName lastName email role" },
      { path: "property", select: "title owner assignedAgent" },
      { path: "lease", select: "tenant property" },
    ]);

    return res.status(200).json({ success: true, message: "Payment updated successfully.", data: serializePayment(updated) });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) console.error("Update payment error:", error);
    return res.status(statusCode).json({ success: false, message: error.message || "Unable to update payment." });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid payment ID." });
    }

    const payment = await Payment.findById(req.params.id).populate([
      { path: "user", select: "firstName lastName email role" },
      { path: "property", select: "title owner assignedAgent" },
      { path: "lease", select: "tenant property" },
    ]);

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    if (req.user.role !== "admin" && !resolvePaymentAccess(req.user, payment)) {
      return res.status(403).json({ success: false, message: "You do not have permission to delete this payment." });
    }

    if (req.user.role === "tenant") {
      return res.status(403).json({ success: false, message: "Tenants cannot delete payment records." });
    }

    await payment.deleteOne();
    return res.status(200).json({ success: true, message: "Payment deleted successfully.", data: { id: String(payment._id) } });
  } catch (error) {
    console.error("Delete payment error:", error);
    return res.status(500).json({ success: false, message: "Unable to delete payment." });
  }
};
