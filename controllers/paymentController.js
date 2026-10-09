const Payment = require("../models/payment");
const Lease = require("../models/lease");
const mongoose = require("mongoose");

const createPaymentRecord = async (req, res) => {
  try {
    const { lease: leaseId, type, amount, provider } = req.body;

    if (!leaseId || !mongoose.isValidObjectId(leaseId)) {
      return res.status(400).json({
        success: false,
        message: "A valid lease ID is required",
      });
    }

    if (!["rent", "security_deposit", "service_charge"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment type",
      });
    }

    if (!Number.isFinite(amount) || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be a positive number",
      });
    }

    if (!["paystack", "flutterwave"].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: "Online payments must use a supported payment provider",
      });
    }

    const lease = await Lease.findById(leaseId);

    if (!lease || lease.tenant.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: "Lease not found",
      });
    }

    if (lease.status !== "active") {
      return res.status(409).json({
        success: false,
        message: "Payments require an active lease",
      });
    }

    const expectedAmounts = {
      rent: lease.rentAmount,
      security_deposit: lease.securityDeposit,
      service_charge: lease.serviceCharge,
    };

    if (amount !== expectedAmounts[type]) {
      return res.status(400).json({
        success: false,
        message:
          "Payment amount does not match the lease amount for this payment type",
      });
    }

    const reference = `PAY-${new mongoose.Types.ObjectId()
      .toString()
      .toUpperCase()}`;

    const payment = await Payment.create({
      reference,
      user: req.user._id,
      property: lease.property,
      lease: lease._id,
      amount,
      currency: lease.currency,
      type,
      provider,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message:
        "Pending payment record created. Complete provider checkout to pay.",
      payment,
    });
  } catch (error) {
    console.error("Create payment record error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create payment record",
    });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      user: req.user._id,
    })
      .populate("property", "title propertyCode")
      .populate("lease", "leaseNumber rentAmount rentPeriod")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Get my payments error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve payments",
    });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      const statuses = ["pending", "successful", "failed", "refunded"];

      if (!statuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status",
        });
      }

      filter.status = req.query.status;
    }

    const payments = await Payment.find(filter)
      .populate("user", "firstName lastName email")
      .populate("property", "title propertyCode")
      .populate("lease", "leaseNumber")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Get all payments error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve payments",
    });
  }
};

// Internal handler: call only after server-side provider verification.
const recordVerifiedPayment = async ({
  reference,
  providerReference,
  verifiedAmount,
  verifiedCurrency,
  verifiedSuccess,
}) => {
  const payment = await Payment.findOne({ reference });

  if (!payment) {
    throw new Error("Payment record not found");
  }

  if (payment.status !== "pending") {
    return payment;
  }

  if (!verifiedSuccess) {
    payment.status = "failed";
  } else {
    if (
      verifiedAmount !== payment.amount ||
      verifiedCurrency !== payment.currency
    ) {
      throw new Error("Verified payment amount or currency mismatch");
    }

    payment.status = "successful";
    payment.providerReference = providerReference;
    payment.paidAt = new Date();
  }

  await payment.save();
  return payment;
};

module.exports = {
  createPaymentRecord,
  getMyPayments,
  getAllPayments,
  recordVerifiedPayment,
};
