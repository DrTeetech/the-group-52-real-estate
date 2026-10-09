const Inquiry = require("../models/Inquiry");
const Property = require("../models/Property");

const createInquiry = async (req, res) => {
  try {
    const { message } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "An inquiry message is required",
      });
    }

    const mongoose = require("mongoose");
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid property ID" });
    if (message.length > 2000) return res.status(400).json({ success: false, message: "Inquiry message cannot exceed 2000 characters" });

    const property = await Property.findOne({
      _id: req.params.id,
      visibility: "public",
      status: "available",
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or unavailable",
      });
    }

    const inquiry = await Inquiry.create({
      property: property._id,
      user: req.user._id,
      message: message.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully",
      inquiry,
    });
  } catch (error) {
    console.error("Create inquiry error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to submit inquiry",
    });
  }
};

const getMyInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({
      user: req.user._id,
    })
      .populate("property", "title slug propertyCode rent location")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: inquiries.length,
      inquiries,
    });
  } catch (error) {
    console.error("Get my inquiries error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve inquiries",
    });
  }
};

const getAllInquiries = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      const allowedStatuses = [
        "new",
        "contacted",
        "in_progress",
        "resolved",
        "closed",
      ];

      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid inquiry status",
        });
      }

      filter.status = req.query.status;
    }

    if (req.user.role === "agent") {
      const assignedPropertyIds = await Property.find({ assignedAgent: req.user._id }).distinct("_id");
      filter.$or = [{ assignedAgent: req.user._id }, { assignedAgent: null, property: { $in: assignedPropertyIds } }];
    }

    const page = Number.parseInt(req.query.page || "1", 10);
    const limit = Number.parseInt(req.query.limit || "20", 10);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ success: false, message: "page must be >= 1 and limit must be between 1 and 100" });
    }
    const total = await Inquiry.countDocuments(filter);

    const inquiries = await Inquiry.find(filter)
      .populate("user", "firstName lastName email phone")
      .populate("property", "title propertyCode slug")
      .populate("assignedAgent", "firstName lastName email")
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);

    res.status(200).json({
      success: true,
      count: inquiries.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      inquiries,
    });
  } catch (error) {
    console.error("Get all inquiries error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve inquiries",
    });
  }
};

const updateInquiry = async (req, res, next) => {
  try {
    const mongoose = require("mongoose");
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid inquiry ID" });
    const { status, assignedAgent } = req.body || {};
    const updates = {};
    if (status !== undefined) {
      const allowedStatuses = ["new", "contacted", "in_progress", "resolved", "closed"];
      if (!allowedStatuses.includes(status)) return res.status(400).json({ success: false, message: "Invalid inquiry status" });
      updates.status = status;
    }
    if (assignedAgent !== undefined) {
      if (!["admin", "super_admin", "property_manager"].includes(req.user.role)) return res.status(403).json({ success: false, message: "Only managers and administrators can assign inquiries" });
      const User = require("../models/User");
      const agent = await User.findOne({ _id: assignedAgent, role: { $in: ["agent", "property_manager"] }, status: "active" }).select("_id");
      if (!agent) return res.status(400).json({ success: false, message: "Assigned staff member is invalid or inactive" });
      updates.assignedAgent = agent._id;
    }
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: "Provide a valid status or staff assignment" });

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ success: false, message: "Inquiry not found" });
    if (req.user.role === "agent") {
      const property = await Property.findById(inquiry.property).select("assignedAgent");
      const hasSpecificAssignment = Boolean(inquiry.assignedAgent);
      const canManageInquiry = hasSpecificAssignment
        ? String(inquiry.assignedAgent) === String(req.user._id)
        : String(property?.assignedAgent || "") === String(req.user._id);
      if (!canManageInquiry) return res.status(403).json({ success: false, message: "You may only manage inquiries assigned to you or unassigned inquiries for your properties" });
    }
    Object.assign(inquiry, updates);
    await inquiry.save();
    await inquiry.populate("user", "firstName lastName email phone");
    await inquiry.populate("property", "title propertyCode");
    await inquiry.populate("assignedAgent", "firstName lastName email");
    return res.status(200).json({ success: true, message: "Inquiry updated successfully", inquiry });
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ success: false, message: "Inquiry update is invalid" });
    return next(error);
  }
};

module.exports = {
  createInquiry,
  getMyInquiries,
  getAllInquiries,
  updateInquiry,
};
