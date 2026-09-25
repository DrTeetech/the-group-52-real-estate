const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // =========================================================
    // PAYMENT IDENTIFICATION
    // =========================================================

    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // =========================================================
    // RELATIONSHIPS
    // =========================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      index: true,
    },

    lease: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lease",
      index: true,
    },

    rentalApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentalApplication",
    },

    // =========================================================
    // PAYMENT AMOUNT
    // =========================================================

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      enum: ["NGN", "USD"],
      default: "NGN",
    },

    // =========================================================
    // PAYMENT TYPE
    // =========================================================

    type: {
      type: String,
      enum: [
        "rent",
        "security_deposit",
        "service_charge",
        "application_fee",
        "other",
      ],
      required: true,
    },

    // =========================================================
    // PAYMENT PROVIDER
    // =========================================================

    provider: {
      type: String,
      enum: ["paystack", "flutterwave", "bank_transfer", "cash"],
      required: true,
    },

    providerReference: {
      type: String,
      index: true,
    },

    // =========================================================
    // PAYMENT STATUS
    // =========================================================

    status: {
      type: String,
      enum: ["pending", "successful", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    paidAt: Date,

    // Allows storage of provider-specific information
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({
  user: 1,
  status: 1,
});

paymentSchema.index({
  lease: 1,
  type: 1,
});

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
