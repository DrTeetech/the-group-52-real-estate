const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
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

    message: {
      type: String,
      required: [true, "Inquiry message is required"],
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: ["new", "contacted", "in_progress", "resolved", "closed"],
      default: "new",
      index: true,
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

const Inquiry = mongoose.model("Inquiry", inquirySchema);

module.exports = Inquiry;
