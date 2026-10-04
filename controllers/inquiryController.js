const Inquiry = require("../models/inquiry");
const Property = require("../models/property");

// CREATE INQUIRY
exports.createInquiry = async (req, res) => {
  try {
    const { property, message } = req.body;

    if (!property || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide property and message",
      });
    }

    const propertyExists = await Property.findById(property);

    if (!propertyExists) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    const inquiry = await Inquiry.create({
      property,
      user: req.user._id,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Inquiry created successfully",
      inquiry,
    });
  } catch (error) {
    console.error("Create inquiry error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET MY INQUIRIES
exports.getMyInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({
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
      message: "Server error while fetching inquiries",
    });
  }
};

// GET SINGLE INQUIRY
exports.getInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
      .populate(
        "property",
        "propertyCode title propertyType rent location"
      )
      .populate(
        "assignedAgent",
        "firstName lastName email phone"
      );

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    if (inquiry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this inquiry",
      });
    }

    res.status(200).json({
      success: true,
      inquiry,
    });
  } catch (error) {
    console.error("Get inquiry error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching inquiry",
    });
  }
};

// UPDATE INQUIRY
exports.updateInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    if (inquiry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this inquiry",
      });
    }

    if (req.body.message !== undefined) {
      inquiry.message = req.body.message;
    }

    await inquiry.save();

    res.status(200).json({
      success: true,
      message: "Inquiry updated successfully",
      inquiry,
    });
  } catch (error) {
    console.error("Update inquiry error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};