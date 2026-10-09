const mongoose = require("mongoose");

const maintenanceRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    lease: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lease",
      index: true,
    },

    title: {
      type: String,
      required: [true, "Maintenance title is required."],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long."],
      maxlength: [200, "Title cannot exceed 200 characters."],
    },

    description: {
      type: String,
      required: [true, "Maintenance description is required."],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long."],
      maxlength: [4000, "Description cannot exceed 4000 characters."],
    },

    category: {
      type: String,
      enum: ["plumbing", "electrical", "hvac", "appliance", "security", "structural", "general", "other"],
      default: "general",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },

    status: {
      type: String,
      enum: ["submitted", "under_review", "assigned", "in_progress", "completed", "cancelled"],
      default: "submitted",
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: [2000, "Resolution notes cannot exceed 2000 characters."],
      default: "",
    },

    attachments: {
      type: [String],
      default: [],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

maintenanceRequestSchema.pre("validate", function (next) {
  if (!this.requestId) {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    this.requestId = `MNT-${Date.now().toString().slice(-6)}-${suffix}`;
  }
  next();
});

maintenanceRequestSchema.index({ tenant: 1, status: 1 });
maintenanceRequestSchema.index({ property: 1, status: 1 });

const MaintenanceRequest = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);

module.exports = MaintenanceRequest;
