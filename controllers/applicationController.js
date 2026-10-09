const mongoose = require("mongoose");
const RentalApplication = require("../models/RentalApplication");
const Property = require("../models/property");

const reviewRoles = ["property_manager", "landlord", "admin"];
const activeStatuses = ["submitted", "under_review", "approved"];
const populatedPaths = [
  { path: "applicant", select: "firstName lastName email phone" },
  {
    path: "property",
    select: "title propertyCode slug propertyType rent location bedrooms bathrooms media status",
  },
];

const employmentStatusMap = {
  "Full-time": "full_time",
  "Part-time": "part_time",
  "Self-employed": "self_employed",
  Contract: "contract",
  Unemployed: "unemployed",
};

const employmentStatusLabels = Object.fromEntries(
  Object.entries(employmentStatusMap).map(([label, value]) => [value, label])
);

function serializeApplication(application) {
  const applicant = application.applicant || {};
  const property = application.property || {};
  const location = property.location || {};
  const locationLabel = [...new Set(
    [location.area, location.city, location.state].filter(Boolean)
  )].join(", ");

  return {
    id: String(application._id),
    applicant: [applicant.firstName, applicant.lastName].filter(Boolean).join(" "),
    applicantEmail: applicant.email || "",
    applicantPhone: applicant.phone || "",
    dateOfBirth: application.dateOfBirth,
    employmentStatus: employmentStatusLabels[application.employmentStatus] || application.employmentStatus,
    employer: application.employer || "",
    jobTitle: application.jobTitle || "",
    income: application.monthlyIncome,
    propertyId: property._id ? String(property._id) : String(application.property),
    property: property.title || "Property unavailable",
    location: locationLabel,
    propertyRent: property.rent?.amount || 0,
    propertyDetails: property._id
      ? {
          id: String(property._id),
          name: property.title,
          type: property.propertyType,
          status: property.status,
          location: locationLabel,
          city: location.city || "",
          state: location.state || "",
          address: location.address || "",
          monthlyRent: property.rent?.amount || 0,
          bedrooms: property.bedrooms || 0,
          bathrooms: property.bathrooms || 0,
          images: (property.media || []).map((item) => item.url).filter(Boolean),
        }
      : null,
    date: application.createdAt?.toISOString().slice(0, 10),
    lastUpdated: application.updatedAt?.toISOString().slice(0, 10),
    status: {
      submitted: "Pending",
      under_review: "Under Review",
      approved: "Approved",
      rejected: "Rejected",
      withdrawn: "Withdrawn",
    }[application.status] || application.status,
    moveInDate: application.intendedMoveInDate?.toISOString().slice(0, 10) || "",
    occupants: application.occupants,
    currentAddress: application.currentAddress || "",
    additionalInfo: application.notes || "",
    documents: application.documents || [],
    rejectionReason: application.rejectionReason || "",
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
}

function handleApplicationError(res, error) {
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "An active application already exists for this property.",
    });
  }

  console.error("Application API error:", error);
  return res.status(500).json({
    success: false,
    message: "Unable to complete the application request.",
  });
}

async function getAccessibleApplication(id, user) {
  const application = await RentalApplication.findById(id);
  if (!application) return { application: null, allowed: false };

  if (user.role === "admin") return { application, allowed: true };

  if (user.role === "tenant") {
    return {
      application,
      allowed: String(application.applicant) === String(user.id),
    };
  }

  if (!reviewRoles.includes(user.role)) {
    return { application, allowed: false };
  }

  const property = await Property.findById(application.property)
    .select("owner assignedAgent");

  if (!property) return { application, allowed: false };

  const allowed = user.role === "property_manager"
    ? String(property.assignedAgent || "") === String(user.id)
    : user.role === "landlord"
      ? String(property.owner || "") === String(user.id)
      : false;

  return { application, allowed };
}

async function loadPopulatedApplication(id) {
  return RentalApplication.findById(id).populate(populatedPaths);
}

exports.createApplication = async (req, res) => {
  try {
    if (req.user.role !== "tenant") {
      return res.status(403).json({
        success: false,
        message: "Only tenant accounts can submit rental applications.",
      });
    }

    const {
      propertyId,
      dateOfBirth,
      employmentStatus,
      employer,
      jobTitle,
      income,
      moveInDate,
      occupants,
      currentAddress,
      additionalInfo,
      documents,
    } = req.body || {};

    if (!propertyId || !mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({
        success: false,
        message: "A valid property ID is required.",
      });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    if (property.status !== "available" || property.visibility !== "public") {
      return res.status(400).json({
        success: false,
        message: "This property is not currently accepting applications.",
      });
    }

    const requiredFields = [
      dateOfBirth,
      employmentStatus,
      employer,
      jobTitle,
      income,
      moveInDate,
      occupants,
      currentAddress,
    ];
    if (requiredFields.some((value) => value === undefined || value === null || String(value).trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Complete all required application fields.",
      });
    }

    const parsedBirthDate = new Date(dateOfBirth);
    const parsedMoveInDate = new Date(moveInDate);
    if (
      Number.isNaN(parsedBirthDate.getTime()) ||
      parsedBirthDate >= new Date() ||
      Number.isNaN(parsedMoveInDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter valid birth and move-in dates.",
      });
    }

    const normalizedEmploymentStatus = employmentStatusMap[employmentStatus] || employmentStatus;
    if (!Object.values(employmentStatusMap).includes(normalizedEmploymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Choose a valid employment status.",
      });
    }

    const monthlyIncome = Number(income);
    const occupantCount = Number(occupants);
    if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0 || !Number.isInteger(occupantCount) || occupantCount < 1) {
      return res.status(400).json({
        success: false,
        message: "Income and occupant count must be valid positive numbers.",
      });
    }

    const duplicate = await RentalApplication.exists({
      applicant: req.user.id,
      property: property._id,
      status: { $in: activeStatuses },
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "You already have an active application for this property.",
      });
    }

    const application = await RentalApplication.create({
      applicant: req.user.id,
      property: property._id,
      dateOfBirth: parsedBirthDate,
      employmentStatus: normalizedEmploymentStatus,
      employer: String(employer).trim(),
      jobTitle: String(jobTitle).trim(),
      monthlyIncome,
      intendedMoveInDate: parsedMoveInDate,
      occupants: occupantCount,
      currentAddress: String(currentAddress).trim(),
      notes: String(additionalInfo || "").trim(),
      documents: Array.isArray(documents) ? documents.slice(0, 10) : [],
    });

    const populatedApplication = await loadPopulatedApplication(application._id);
    return res.status(201).json({
      success: true,
      message: "Application submitted successfully.",
      data: serializeApplication(populatedApplication),
    });
  } catch (error) {
    return handleApplicationError(res, error);
  }
};

exports.getApplications = async (req, res) => {
  try {
    let filter;

    if (req.user.role === "admin") {
      filter = {};
    } else if (req.user.role === "tenant") {
      filter = { applicant: req.user.id };
    } else if (req.user.role === "property_manager") {
      const propertyIds = await Property.distinct("_id", {
        assignedAgent: req.user.id,
      });
      filter = { property: { $in: propertyIds } };
    } else if (req.user.role === "landlord") {
      const propertyIds = await Property.distinct("_id", {
        owner: req.user.id,
      });
      filter = { property: { $in: propertyIds } };
    } else {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view applications.",
      });
    }

    const applications = await RentalApplication.find(filter)
      .populate(populatedPaths)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications.map(serializeApplication),
    });
  } catch (error) {
    return handleApplicationError(res, error);
  }
};

exports.getApplicationById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID.",
      });
    }

    const { application, allowed } = await getAccessibleApplication(req.params.id, req.user);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this application.",
      });
    }

    const populatedApplication = await loadPopulatedApplication(application._id);
    return res.status(200).json({
      success: true,
      data: serializeApplication(populatedApplication),
    });
  } catch (error) {
    return handleApplicationError(res, error);
  }
};

exports.updateApplication = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID.",
      });
    }

    const { application, allowed } = await getAccessibleApplication(req.params.id, req.user);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this application.",
      });
    }

    const { status, rejectionReason } = req.body || {};
    if (req.user.role === "tenant") {
      if (status !== "withdrawn" && status !== "Withdrawn") {
        return res.status(403).json({
          success: false,
          message: "Tenants may only withdraw their own submitted applications.",
        });
      }
      if (application.status !== "submitted") {
        return res.status(409).json({
          success: false,
          message: "Only submitted applications can be withdrawn.",
        });
      }
      application.status = "withdrawn";
    } else {
      if (!reviewRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to review applications.",
        });
      }

      const normalizedStatus = {
        "Under Review": "under_review",
        Approved: "approved",
        Rejected: "rejected",
      }[status] || status;
      if (!["under_review", "approved", "rejected"].includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: "Choose a valid application review status.",
        });
      }
      if (!["submitted", "under_review"].includes(application.status)) {
        return res.status(409).json({
          success: false,
          message: "This application has already received a final decision.",
        });
      }
      if (normalizedStatus === "rejected" && !String(rejectionReason || "").trim()) {
        return res.status(400).json({
          success: false,
          message: "A rejection reason is required.",
        });
      }

      application.status = normalizedStatus;
      application.reviewedBy = req.user.id;
      application.reviewedAt = new Date();
      application.rejectionReason = normalizedStatus === "rejected"
        ? String(rejectionReason).trim()
        : "";
    }

    await application.save();
    const populatedApplication = await loadPopulatedApplication(application._id);
    return res.status(200).json({
      success: true,
      message: "Application updated successfully.",
      data: serializeApplication(populatedApplication),
    });
  } catch (error) {
    return handleApplicationError(res, error);
  }
};

exports.deleteApplication = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID.",
      });
    }

    const { application, allowed } = await getAccessibleApplication(req.params.id, req.user);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this application.",
      });
    }
    if (req.user.role === "tenant" && application.status !== "submitted") {
      return res.status(403).json({
        success: false,
        message: "Only submitted applications can be deleted by the applicant.",
      });
    }

    await application.deleteOne();
    return res.status(200).json({
      success: true,
      message: "Application deleted successfully.",
      data: { id: String(application._id) },
    });
  } catch (error) {
    return handleApplicationError(res, error);
  }
};