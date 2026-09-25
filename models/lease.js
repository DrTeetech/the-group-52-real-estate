const mongoose = require("mongoose");

const leaseSchema = new mongoose.Schema(
  {
    // =========================================================
    // LEASE IDENTIFICATION
    // =========================================================

    leaseNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // =========================================================
    // RELATIONSHIPS
    // =========================================================

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    rentalApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentalApplication",
      index: true,
    },

    // =========================================================
    // LEASE PERIOD
    // =========================================================

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    // =========================================================
    // RENTAL FINANCIALS
    // =========================================================

    rentAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    rentPeriod: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },

    serviceCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    securityDeposit: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      enum: ["NGN", "USD"],
      default: "NGN",
    },

    // =========================================================
    // LEASE STATUS
    // =========================================================

    status: {
      type: String,
      enum: ["pending", "active", "expired", "terminated", "cancelled"],
      default: "pending",
      index: true,
    },

    // =========================================================
    // DOCUMENT
    // =========================================================

    document: {
      url: String,
      publicId: String,
    },

    // =========================================================
    // INTERNAL MANAGEMENT
    // =========================================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

leaseSchema.index({
  property: 1,
  status: 1,
});

leaseSchema.index({
  tenant: 1,
  status: 1,
});

const Lease = mongoose.model("Lease", leaseSchema);

module.exports = Lease;
