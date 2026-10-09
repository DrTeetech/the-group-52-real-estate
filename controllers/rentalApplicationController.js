const RentalApplication = require("../models/RentalApplication");
const Property = require("../models/property");
const User = require("../models/user");

const createApplication = async (req, res) => {
  try {
    const {
      employmentStatus,
      employer,
      monthlyIncome,
      intendedMoveInDate,
      occupants,
      notes,
    } = req.body;

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

    const allowedEmploymentStatuses = [
      "employed",
      "self_employed",
      "business_owner",
      "student",
      "retired",
      "unemployed",
    ];

    if (
      employmentStatus !== undefined &&
      !allowedEmploymentStatuses.includes(employmentStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid employment status",
      });
    }

    if (
      monthlyIncome !== undefined &&
      (!Number.isFinite(monthlyIncome) ||
        typeof monthlyIncome !== "number" ||
        monthlyIncome < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Monthly income must be a non-negative number",
      });
    }

    if (
      occupants !== undefined &&
      (!Number.isInteger(occupants) || occupants < 1)
    ) {
      return res.status(400).json({
        success: false,
        message: "Occupants must be a positive whole number",
      });
    }

    if (notes !== undefined && typeof notes !== "string") {
      return res.status(400).json({
        success: false,
        message: "Notes must be text",
      });
    }

    if (notes && notes.length > 3000) {
      return res.status(400).json({
        success: false,
        message: "Notes cannot exceed 3000 characters",
      });
    }

    if (employer !== undefined && typeof employer !== "string") {
      return res.status(400).json({
        success: false,
        message: "Employer must be text",
      });
    }

    if (employer && employer.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Employer cannot exceed 200 characters",
      });
    }

    let moveInDate;

    if (intendedMoveInDate !== undefined) {
      moveInDate = new Date(intendedMoveInDate);

      if (Number.isNaN(moveInDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid intended move-in date",
        });
      }
    }

    const existingApplication = await RentalApplication.findOne({
      property: property._id,
      applicant: req.user._id,
      status: { $in: ["submitted", "under_review", "approved"] },
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: "You already have an active application for this property",
      });
    }

    const application = await RentalApplication.create({
      property: property._id,
      applicant: req.user._id,
      employmentStatus,
      employer,
      monthlyIncome,
      intendedMoveInDate: moveInDate,
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

    res.status(500).json({
      success: false,
      message: "Unable to submit rental application",
    });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await RentalApplication.find({
      applicant: req.user._id,
    })
      .populate("property", "title slug propertyCode rent location status")
      .populate("reviewedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get my applications error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve rental applications",
    });
  }
};

const getAllApplications = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      const allowedStatuses = [
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "withdrawn",
      ];

      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid application status",
        });
      }

      filter.status = req.query.status;
    }

    const applications = await RentalApplication.find(filter)
      .populate("applicant", "firstName lastName email phone")
      .populate("property", "title propertyCode slug rent location")
      .populate("reviewedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get all applications error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve applications",
    });
  }
};

const updateApplication = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    const allowedStatuses = ["under_review", "approved", "rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be under_review, approved or rejected",
      });
    }

    const application = await RentalApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Rental application not found",
      });
    }

    if (!["submitted", "under_review"].includes(application.status)) {
      return res.status(409).json({
        success: false,
        message: "This application can no longer be reviewed",
      });
    }

    if (
      status === "rejected" &&
      (!rejectionReason || !rejectionReason.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "A rejection reason is required",
      });
    }

    if (
      rejectionReason !== undefined &&
      (typeof rejectionReason !== "string" || rejectionReason.length > 1000)
    ) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason must be text of at most 1000 characters",
      });
    }

    if (status === "approved") {
      const activeLease = await require("../models/lease").findOne({
        property: application.property,
        status: "active",
        endDate: { $gt: new Date() },
      });

      if (activeLease) {
        return res.status(409).json({
          success: false,
          message: "This property already has an active lease",
        });
      }

      const property = await Property.findById(application.property);

      if (!property || property.status !== "available") {
        return res.status(409).json({
          success: false,
          message: "Property is no longer available",
        });
      }

      const anotherApprovedApplication = await RentalApplication.findOne({
        property: application.property,
        status: "approved",
        _id: { $ne: application._id },
      });

      if (anotherApprovedApplication) {
        return res.status(409).json({
          success: false,
          message:
            "Another application has already been approved for this property",
        });
      }
    }

    application.status = status;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    application.rejectionReason =
      status === "rejected" ? rejectionReason.trim() : undefined;

    await application.save();

    res.status(200).json({
      success: true,
      message: "Rental application reviewed successfully",
      application,
    });
  } catch (error) {
    console.error("Update rental application error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update rental application",
    });
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getAllApplications,
  updateApplication,
};
