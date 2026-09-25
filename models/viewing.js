const mongoose = require("mongoose");

const viewingSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["physical", "virtual"],
      default: "physical",
    },

    status: {
      type: String,
      enum: ["requested", "confirmed", "completed", "cancelled", "no_show"],
      default: "requested",
      index: true,
    },

    notes: {
      type: String,
      maxlength: 2000,
    },

    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Viewing = mongoose.model("Viewing", viewingSchema);

module.exports = Viewing;
