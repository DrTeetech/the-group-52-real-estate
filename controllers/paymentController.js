const Payment = require("../models/payment");
const Lease = require("../models/lease");
const Property = require("../models/property");

// CREATE PAYMENT
exports.createPayment = async (req, res) => {
  try {
    const {
      property,
      lease,
      amount,
      currency,
      type,
      provider,
      providerReference,
      metadata,
    } = req.body;

    if (amount === undefined || !type || !provider) {
      return res.status(400).json({
        success: false,
        message: "Please provide amount, type and provider",
      });
    }

    if (lease) {
      const leaseExists = await Lease.findById(lease);

      if (!leaseExists) {
        return res.status(404).json({
          success: false,
          message: "Lease not found",
        });
      }
    }

    if (property) {
      const propertyExists = await Property.findById(property);

      if (!propertyExists) {
        return res.status(404).json({
          success: false,
          message: "Property not found",
        });
      }
    }

    const reference = `PAY-${Date.now()}`;

    const payment = await Payment.create({
      reference,
      user: req.user._id,
      property,
      lease,
      amount,
      currency: currency || "NGN",
      type,
      provider,
      providerReference,
      metadata,
    });

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      payment,
    });
  } catch (error) {
    console.error("Create payment error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET MY PAYMENTS
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      user: req.user._id,
    })
      .populate("property", "propertyCode title propertyType")
      .populate(
        "lease",
        "leaseNumber startDate endDate rentAmount status"
      )
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
      message: "Server error while fetching payments",
    });
  }
};

// GET SINGLE PAYMENT
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("property", "propertyCode title propertyType")
      .populate(
        "lease",
        "leaseNumber startDate endDate rentAmount status"
      );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this payment",
      });
    }

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Get payment error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching payment",
    });
  }
};

// UPDATE PAYMENT STATUS
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status, providerReference } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this payment",
      });
    }

    if (status) {
      payment.status = status;
    }

    if (providerReference) {
      payment.providerReference = providerReference;
    }

    if (status === "successful") {
      payment.paidAt = new Date();
    }

    await payment.save();

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      payment,
    });
  } catch (error) {
    console.error("Update payment error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};