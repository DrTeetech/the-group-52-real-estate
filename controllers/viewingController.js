const Viewing = require("../models/viewing");
const Property = require("../models/property");

const createViewing = async (req, res) => {
  try {
    const { scheduledFor, type, notes } = req.body;

    const date = new Date(scheduledFor);

    if (!scheduledFor || Number.isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: "A valid viewing date and time are required",
      });
    }

    if (date <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Viewing must be scheduled in the future",
      });
    }

    if (type && !["physical", "virtual"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Viewing type must be physical or virtual",
      });
    }

    if (notes !== undefined && typeof notes !== "string") {
      return res.status(400).json({
        success: false,
        message: "Notes must be text",
      });
    }

    if (notes && notes.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Notes cannot exceed 2000 characters",
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

    const viewing = await Viewing.create({
      property: property._id,
      user: req.user._id,
      scheduledFor: date,
      type: type || "physical",
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Viewing request submitted",
      viewing,
    });
  } catch (error) {
    console.error("Create viewing error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to request viewing",
    });
  }
};

const getMyViewings = async (req, res) => {
  try {
    const viewings = await Viewing.find({
      user: req.user._id,
    })
      .populate("property", "title slug propertyCode rent location")
      .populate("assignedAgent", "firstName lastName email phone")
      .sort({ scheduledFor: 1 });

    res.status(200).json({
      success: true,
      count: viewings.length,
      viewings,
    });
  } catch (error) {
    console.error("Get my viewings error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve viewings",
    });
  }
};

const getAllViewings = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      const allowedStatuses = [
        "requested",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ];

      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid viewing status",
        });
      }

      filter.status = req.query.status;
    }

    const viewings = await Viewing.find(filter)
      .populate("user", "firstName lastName email phone")
      .populate("property", "title propertyCode slug location")
      .populate("assignedAgent", "firstName lastName email phone")
      .sort({ scheduledFor: 1 });

    res.status(200).json({
      success: true,
      count: viewings.length,
      viewings,
    });
  } catch (error) {
    console.error("Get all viewings error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve viewings",
    });
  }
};

const updateViewing = async (req, res) => {
  try {
    const { status, scheduledFor, type, notes, assignedAgent } = req.body;
    const updates = {};

    if (status !== undefined) {
      const allowedStatuses = [
        "requested",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid viewing status",
        });
      }

      updates.status = status;
    }

    if (scheduledFor !== undefined) {
      const date = new Date(scheduledFor);

      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid viewing date",
        });
      }

      if (date <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Rescheduled viewing must be in the future",
        });
      }

      updates.scheduledFor = date;
    }

    if (type !== undefined) {
      if (!["physical", "virtual"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid viewing type",
        });
      }

      updates.type = type;
    }

    if (notes !== undefined) {
      if (typeof notes !== "string" || notes.length > 2000) {
        return res.status(400).json({
          success: false,
          message: "Notes must be text of at most 2000 characters",
        });
      }

      updates.notes = notes;
    }

    if (assignedAgent !== undefined) {
      if (
        !["admin", "super_admin", "property_manager"].includes(req.user.role)
      ) {
        return res.status(403).json({
          success: false,
          message: "Only managers and administrators can assign viewings",
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
        message: "Provide at least one valid field to update",
      });
    }

    const viewing = await Viewing.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("user", "firstName lastName email phone")
      .populate("property", "title propertyCode")
      .populate("assignedAgent", "firstName lastName email phone");

    if (!viewing) {
      return res.status(404).json({
        success: false,
        message: "Viewing request not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Viewing updated successfully",
      viewing,
    });
  } catch (error) {
    console.error("Update viewing error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update viewing",
    });
  }
};

module.exports = {
  createViewing,
  getMyViewings,
  getAllViewings,
  updateViewing,
};
