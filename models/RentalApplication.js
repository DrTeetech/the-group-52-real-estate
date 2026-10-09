const mongoose = require("mongoose");

const rentalApplicationSchema = new mongoose.Schema(
  {
    // =========================================================
    // RELATIONSHIPS
    // =========================================================

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // =========================================================
    // APPLICATION DETAILS
    // =========================================================

    employmentStatus: {
      type: String,
      enum: [
        "employed",
        "full_time",
        "part_time",
        "contract",
        "self_employed",
        "business_owner",
        "student",
        "retired",
        "unemployed",
      ],
    },

    employer: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    jobTitle: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    dateOfBirth: Date,

    currentAddress: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    documents: [
      {
        type: String,
        trim: true,
        maxlength: 300,
      },
    ],

    monthlyIncome: {
      type: Number,
      min: 0,
    },

    intendedMoveInDate: {
      type: Date,
    },

    occupants: {
      type: Number,
      min: 1,
    },

    notes: {
      type: String,
      maxlength: 3000,
    },

    // =========================================================
    // APPLICATION STATUS
    // =========================================================

    status: {
      type: String,
      enum: ["submitted", "under_review", "approved", "rejected", "withdrawn"],
      default: "submitted",
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: Date,

    rejectionReason: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

const RentalApplication = mongoose.model(
  "RentalApplication",
  rentalApplicationSchema
);

module.exports = RentalApplication;
