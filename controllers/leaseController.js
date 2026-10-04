const Lease = require("../models/lease");
const Property = require("../models/property");
const RentalApplication = require("../models/rentalApplication");

// CREATE LEASE
exports.createLease = async (req, res) => {
  try {
    const {
      property,
      rentalApplication,
      startDate,
      endDate,
      rentAmount,
      rentPeriod,
      serviceCharge,
      securityDeposit,
      currency,
    } = req.body;

    if (
      !property ||
      !rentalApplication ||
      !startDate ||
      !endDate ||
      rentAmount === undefined ||
      !rentPeriod
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide property, rentalApplication, startDate, endDate, rentAmount and rentPeriod",
      });
    }

    const propertyExists = await Property.findById(property);

    if (!propertyExists) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    const application = await RentalApplication.findById(
      rentalApplication
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Rental application not found",
      });
    }

    if (
      application.applicant.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to use this rental application",
      });
    }

    if (
      application.property.toString() !==
      property.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rental application does not belong to this property",
      });
    }

    if (application.status !== "approved") {
      return res.status(400).json({
        success: false,
        message:
          "Only approved rental applications can be used to create a lease",
      });
    }

    const existingLease = await Lease.findOne({
      rentalApplication,
    });

    if (existingLease) {
      return res.status(400).json({
        success: false,
        message:
          "A lease already exists for this rental application",
      });
    }

    const leaseNumber = `LEASE-${Date.now()}`;

    const lease = await Lease.create({
      leaseNumber,
      property,
      tenant: req.user._id,
      rentalApplication,
      startDate,
      endDate,
      rentAmount,
      rentPeriod,
      serviceCharge: serviceCharge || 0,
      securityDeposit: securityDeposit || 0,
      currency: currency || "NGN",
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Lease created successfully",
      lease,
    });
  } catch (error) {
    console.error("Create lease error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET MY LEASES
exports.getMyLeases = async (req, res) => {
  try {
    const leases = await Lease.find({
      tenant: req.user._id,
    })
      .populate(
        "property",
        "propertyCode title propertyType rent location"
      )
      .populate(
        "rentalApplication",
        "status intendedMoveInDate monthlyIncome occupants"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leases.length,
      leases,
    });
  } catch (error) {
    console.error("Get my leases error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching leases",
    });
  }
};

// GET SINGLE LEASE
exports.getLease = async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id)
      .populate(
        "property",
        "propertyCode title propertyType rent location"
      )
      .populate(
        "tenant",
        "firstName lastName email phone"
      )
      .populate(
        "rentalApplication",
        "status intendedMoveInDate monthlyIncome occupants"
      );

    if (!lease) {
      return res.status(404).json({
        success: false,
        message: "Lease not found",
      });
    }

    if (
      lease.tenant._id.toString() !== req.user._id.toString() &&
      lease.createdBy &&
      lease.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this lease",
      });
    }

    res.status(200).json({
      success: true,
      lease,
    });
  } catch (error) {
    console.error("Get lease error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching lease",
    });
  }
};

// UPDATE LEASE
exports.updateLease = async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id);

    if (!lease) {
      return res.status(404).json({
        success: false,
        message: "Lease not found",
      });
    }

    if (
      lease.tenant.toString() !== req.user._id.toString() &&
      lease.createdBy &&
      lease.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this lease",
      });
    }

    const allowedFields = [
      "startDate",
      "endDate",
      "rentAmount",
      "rentPeriod",
      "serviceCharge",
      "securityDeposit",
      "currency",
      "status",
      "document",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        lease[field] = req.body[field];
      }
    });

    await lease.save();

    res.status(200).json({
      success: true,
      message: "Lease updated successfully",
      lease,
    });
  } catch (error) {
    console.error("Update lease error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// CANCEL LEASE
exports.cancelLease = async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id);

    if (!lease) {
      return res.status(404).json({
        success: false,
        message: "Lease not found",
      });
    }

    if (lease.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this lease",
      });
    }

    if (lease.status === "active") {
      return res.status(400).json({
        success: false,
        message: "An active lease cannot be cancelled",
      });
    }

    lease.status = "cancelled";

    await lease.save();

    res.status(200).json({
      success: true,
      message: "Lease cancelled successfully",
      lease,
    });
  } catch (error) {
    console.error("Cancel lease error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while cancelling lease",
    });
  }
};