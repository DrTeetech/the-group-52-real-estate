const RentalApplication = require("../models/rentalApplication");
const Property = require("../models/property");

// CREATE RENTAL APPLICATION
exports.createRentalApplication = async (req, res) => {
  try {
    const {
      property,
      employmentStatus,
      employer,
      monthlyIncome,
      intendedMoveInDate,
      occupants,
      notes,
    } = req.body;

    if (!property) {
      return res.status(400).json({
        success: false,
        message: "Please provide property",
      });
    }

    const propertyExists = await Property.findById(property);

    if (!propertyExists) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    const application = await RentalApplication.create({
      property,
      applicant: req.user._id,
      employmentStatus,
      employer,
      monthlyIncome,
      intendedMoveInDate,
      occupants,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Rental application submitted successfully",
      application,
    });
  } catch (error) {
    console.error("Create rental application error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET MY RENTAL APPLICATIONS
exports.getMyRentalApplications = async (req, res) => {
  try {
    const applications = await RentalApplication.find({
      applicant: req.user._id,
    })
      .populate(
        "property",
        "propertyCode title propertyType rent location bedrooms bathrooms"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get my rental applications error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching rental applications",
    });
  }
};

// GET SINGLE RENTAL APPLICATION
exports.getRentalApplication = async (req, res) => {
  try {
    const application = await RentalApplication.findById(req.params.id)
      .populate(
        "property",
        "propertyCode title propertyType rent location bedrooms bathrooms"
      )
      .populate(
        "reviewedBy",
        "firstName lastName email phone"
      );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Rental application not found",
      });
    }

    if (
      application.applicant.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this rental application",
      });
    }

    res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Get rental application error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching rental application",
    });
  }
};

// UPDATE RENTAL APPLICATION
exports.updateRentalApplication = async (req, res) => {
  try {
    const application = await RentalApplication.findById(
      req.params.id
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Rental application not found",
      });
    }

    if (
      application.applicant.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this rental application",
      });
    }

    if (application.status !== "submitted") {
      return res.status(400).json({
        success: false,
        message: "Only submitted applications can be updated",
      });
    }

    const allowedFields = [
      "employmentStatus",
      "employer",
      "monthlyIncome",
      "intendedMoveInDate",
      "occupants",
      "notes",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        application[field] = req.body[field];
      }
    });

    await application.save();

    res.status(200).json({
      success: true,
      message: "Rental application updated successfully",
      application,
    });
  } catch (error) {
    console.error("Update rental application error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// WITHDRAW RENTAL APPLICATION
exports.withdrawRentalApplication = async (req, res) => {
  try {
    const application = await RentalApplication.findById(
      req.params.id
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Rental application not found",
      });
    }

    if (
      application.applicant.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to withdraw this rental application",
      });
    }

    if (
      application.status === "approved" ||
      application.status === "rejected"
    ) {
      return res.status(400).json({
        success: false,
        message: "This application can no longer be withdrawn",
      });
    }

    application.status = "withdrawn";

    await application.save();

    res.status(200).json({
      success: true,
      message: "Rental application withdrawn successfully",
      application,
    });
  } catch (error) {
    console.error("Withdraw rental application error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL RENTAL APPLICATIONS FOR PROPERTY MANAGEMENT
exports.getAllRentalApplications = async (req, res) => {
  try {
    const applications = await RentalApplication.find()
      .populate(
        "property",
        "propertyCode title propertyType rent location bedrooms bathrooms assignedAgent"
      )
      .populate(
        "applicant",
        "firstName lastName email phone"
      )
      .populate(
        "reviewedBy",
        "firstName lastName email phone"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get all rental applications error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching rental applications",
    });
  }
};

// REVIEW RENTAL APPLICATION
exports.reviewRentalApplication = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!["under_review", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be under_review, approved, or rejected",
      });
    }

    const application = await RentalApplication.findById(
      req.params.id
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Rental application not found",
      });
    }

    if (application.status === "withdrawn") {
      return res.status(400).json({
        success: false,
        message: "Withdrawn applications cannot be reviewed",
      });
    }

    if (status === "rejected" && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rejection reason",
      });
    }

    application.status = status;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();

    if (status === "rejected") {
      application.rejectionReason = rejectionReason;
    } else {
      application.rejectionReason = undefined;
    }

    await application.save();

    res.status(200).json({
      success: true,
      message: "Rental application reviewed successfully",
      application,
    });
  } catch (error) {
    console.error("Review rental application error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};