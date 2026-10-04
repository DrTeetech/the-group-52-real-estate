const Viewing = require("../models/viewing");
const Property = require("../models/property");

// CREATE VIEWING REQUEST
exports.createViewing = async (req, res) => {
  try {
    const { property, scheduledFor, type, notes } = req.body;

    if (!property || !scheduledFor) {
      return res.status(400).json({
        success: false,
        message: "Please provide property and scheduledFor",
      });
    }

    const propertyExists = await Property.findById(property);

    if (!propertyExists) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    const viewing = await Viewing.create({
      property,
      user: req.user._id,
      scheduledFor,
      type: type || "physical",
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Viewing request created successfully",
      viewing,
    });
  } catch (error) {
    console.error("Create viewing error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET MY VIEWINGS
exports.getMyViewings = async (req, res) => {
  try {
    const viewings = await Viewing.find({
      user: req.user._id,
    })
      .populate(
        "property",
        "propertyCode title propertyType rent location"
      )
      .populate(
        "assignedAgent",
        "firstName lastName email phone"
      )
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
      message: "Server error while fetching viewings",
    });
  }
};

// GET SINGLE VIEWING
exports.getViewing = async (req, res) => {
  try {
    const viewing = await Viewing.findById(req.params.id)
      .populate(
        "property",
        "propertyCode title propertyType rent location"
      )
      .populate(
        "assignedAgent",
        "firstName lastName email phone"
      );

    if (!viewing) {
      return res.status(404).json({
        success: false,
        message: "Viewing not found",
      });
    }

    if (viewing.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this viewing",
      });
    }

    res.status(200).json({
      success: true,
      viewing,
    });
  } catch (error) {
    console.error("Get viewing error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching viewing",
    });
  }
};

// UPDATE VIEWING
exports.updateViewing = async (req, res) => {
  try {
    const viewing = await Viewing.findById(req.params.id);

    if (!viewing) {
      return res.status(404).json({
        success: false,
        message: "Viewing not found",
      });
    }

    if (viewing.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this viewing",
      });
    }

    if (req.body.scheduledFor !== undefined) {
      viewing.scheduledFor = req.body.scheduledFor;
    }

    if (req.body.type !== undefined) {
      viewing.type = req.body.type;
    }

    if (req.body.notes !== undefined) {
      viewing.notes = req.body.notes;
    }

    await viewing.save();

    res.status(200).json({
      success: true,
      message: "Viewing updated successfully",
      viewing,
    });
  } catch (error) {
    console.error("Update viewing error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// CANCEL VIEWING
exports.cancelViewing = async (req, res) => {
  try {
    const viewing = await Viewing.findById(req.params.id);

    if (!viewing) {
      return res.status(404).json({
        success: false,
        message: "Viewing not found",
      });
    }

    if (viewing.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this viewing",
      });
    }

    viewing.status = "cancelled";

    await viewing.save();

    res.status(200).json({
      success: true,
      message: "Viewing cancelled successfully",
      viewing,
    });
  } catch (error) {
    console.error("Cancel viewing error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};