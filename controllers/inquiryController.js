const Inquiry = require("../models/inquiry");
const Property = require("../models/property");

const createInquiry = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "An inquiry message is required",
      });
    }

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

    const inquiries = await Inquiry.find(filter)
      .populate("user", "firstName lastName email phone")
      .populate("property", "title propertyCode slug")
      .populate("assignedAgent", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: inquiries.length,
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

const updateInquiry = async (req, res) => {
  try {
    const { status, assignedAgent } = req.body;
    const updates = {};

    if (status !== undefined) {
      const allowedStatuses = [
        "new",
        "contacted",
        "in_progress",
        "resolved",
        "closed",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid inquiry status",
        });
      }

      updates.status = status;
    }

    if (assignedAgent !== undefined) {
      if (
        !["admin", "super_admin", "property_manager"].includes(req.user.role)
      ) {
        return res.status(403).json({
          success: false,
          message: "Only managers and administrators can assign inquiries",
        });
      }

      const User = require("../models/user");
      const agent = await User.findOne({
        _id: assignedAgent,
        role: { $in: ["agent", "property_manager"] },
        status: "active",
      });

      if (!agent) {
        return res.status(400).json({
          success: false,
          message: "Assigned staff member is invalid or inactive",
        });
      }

      updates.assignedAgent = agent._id;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid status or staff assignment",
      });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("user", "firstName lastName email phone")
      .populate("property", "title propertyCode")
      .populate("assignedAgent", "firstName lastName email");

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Inquiry updated successfully",
      inquiry,
    });
  } catch (error) {
    console.error("Update inquiry error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update inquiry",
    });
  }
};

module.exports = {
  createInquiry,
  getMyInquiries,
  getAllInquiries,
  updateInquiry,
};
