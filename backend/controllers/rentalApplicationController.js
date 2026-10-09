const RentalApplication = require("../models/RentalApplication");
const Property = require("../models/Property");
const User = require("../models/User");
const Lease = require("../models/Lease");
const mongoose = require("mongoose");

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

    const activeApplicationKey = `${property._id.toString()}:${req.user._id.toString()}`;
    const existingApplication = await RentalApplication.findOne({
      $or: [
        { activeApplicationKey },
        { property: property._id, applicant: req.user._id, status: { $in: ["submitted", "under_review", "approved"] } },
      ],
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
      activeApplicationKey,
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
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "You already have an active application for this property" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: "Rental application data is invalid", errors: Object.values(error.errors).map((item) => item.message) });
    }
    console.error("Create rental application error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to submit rental application" });
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

    if (req.user.role === "agent") {
      const assignedPropertyIds = await Property.find({ assignedAgent: req.user._id }).distinct("_id");
      filter.property = { $in: assignedPropertyIds };
    }

    const page = Number.parseInt(req.query.page || "1", 10);
    const limit = Number.parseInt(req.query.limit || "20", 10);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ success: false, message: "page must be >= 1 and limit must be between 1 and 100" });
    }
    const total = await RentalApplication.countDocuments(filter);

    const applications = await RentalApplication.find(filter)
      .populate("applicant", "firstName lastName email phone")
      .populate("property", "title propertyCode slug rent location")
      .populate("reviewedBy", "firstName lastName email")
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      page,
      pages: Math.ceil(total / limit),
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

const updateApplication = async (req, res, next) => {
  const session = await mongoose.startSession();
  let updatedApplication;
  try {
    const { status, rejectionReason } = req.body || {};
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid rental application ID" });
    }
    if (!["under_review", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be under_review, approved or rejected" });
    }
    if (status === "rejected" && (typeof rejectionReason !== "string" || !rejectionReason.trim())) {
      return res.status(400).json({ success: false, message: "A rejection reason is required" });
    }
    if (rejectionReason !== undefined && (typeof rejectionReason !== "string" || rejectionReason.length > 1000)) {
      return res.status(400).json({ success: false, message: "Rejection reason must be text of at most 1000 characters" });
    }

    await session.withTransaction(async () => {
      const application = await RentalApplication.findById(req.params.id).session(session);
      if (!application) { const error = new Error("Rental application not found"); error.statusCode = 404; throw error; }
      const canRejectApproved = application.status === "approved" && status === "rejected";
      if (!["submitted", "under_review"].includes(application.status) && !canRejectApproved) {
        const error = new Error("This application can no longer be reviewed"); error.statusCode = 409; throw error;
      }

      if (canRejectApproved) {
        const linkedLease = await Lease.findOne({ property: application.property, rentalApplication: application._id, status: { $in: ["pending", "active"] } }).session(session);
        if (linkedLease) {
          const error = new Error("Cancel or terminate the associated lease before rejecting this approved application"); error.statusCode = 409; throw error;
        }
        await Property.updateOne(
          { _id: application.property, status: "reserved", reservedForApplication: application._id },
          { $set: { status: "available", visibility: "public" }, $unset: { reservedForApplication: "" } },
          { session }
        );
      }

      if (status === "approved") {
        // Atomically reserve the property. Only one competing application can win this update.
        const property = await Property.findOneAndUpdate(
          { _id: application.property, status: "available", visibility: "public", reservedForApplication: { $exists: false } },
          { $set: { status: "reserved", visibility: "private", reservedForApplication: application._id } },
          { new: true, session, runValidators: true }
        );
        if (!property) {
          const error = new Error("Property is no longer available or another application has already reserved it");
          error.statusCode = 409;
          throw error;
        }
        const activeLease = await Lease.findOne({ property: property._id, status: { $in: ["pending", "active"] }, endDate: { $gt: new Date() } }).session(session);
        if (activeLease) {
          const error = new Error("This property already has a pending or active lease"); error.statusCode = 409; throw error;
        }
      }

      application.status = status;
      application.reviewedBy = req.user._id;
      application.reviewedAt = new Date();
      application.rejectionReason = status === "rejected" ? rejectionReason.trim() : undefined;
      if (status === "rejected") application.activeApplicationKey = undefined;
      await application.save({ session });
      updatedApplication = application;
    });

    return res.status(200).json({ success: true, message: "Rental application reviewed successfully", application: updatedApplication });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    if (error.code === 11000) return res.status(409).json({ success: false, message: "Another active application already exists" });
    if (error.name === "ValidationError") return res.status(400).json({ success: false, message: "Application update is invalid" });
    return next(error);
  } finally { await session.endSession(); }
};

const withdrawMyApplication = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid rental application ID" });
    const application = await RentalApplication.findOne({ _id: req.params.id, applicant: req.user._id });
    if (!application) return res.status(404).json({ success: false, message: "Rental application not found" });
    if (!["submitted", "under_review"].includes(application.status)) {
      return res.status(409).json({ success: false, message: "Only submitted or under-review applications can be withdrawn" });
    }
    application.status = "withdrawn";
    application.activeApplicationKey = undefined;
    await application.save();
    return res.status(200).json({ success: true, message: "Rental application withdrawn", application });
  } catch (error) { return next(error); }
};

module.exports = {
  createApplication,
  getMyApplications,
  getAllApplications,
  updateApplication,
  withdrawMyApplication,
};
