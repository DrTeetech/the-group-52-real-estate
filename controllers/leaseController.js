const Lease = require("../models/lease");
const Property = require("../models/property");
const RentalApplication = require("../models/RentalApplication");
const mongoose = require("mongoose");

const createLease = async (req, res) => {
  try {
    const {
      rentalApplication,
      startDate,
      endDate,
      rentAmount,
      rentPeriod,
      serviceCharge = 0,
      securityDeposit = 0,
      currency = "NGN",
    } = req.body;

    if (!rentalApplication || !mongoose.isValidObjectId(rentalApplication)) {
      return res.status(400).json({
        success: false,
        message: "A valid rental application ID is required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      !startDate ||
      !endDate ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid lease dates are required, and the end date must follow the start date",
      });
    }

    if (
      !Number.isFinite(rentAmount) ||
      typeof rentAmount !== "number" ||
      rentAmount < 0 ||
      !Number.isFinite(serviceCharge) ||
      serviceCharge < 0 ||
      !Number.isFinite(securityDeposit) ||
      securityDeposit < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rent, service charge and security deposit must be valid non-negative numbers",
      });
    }

    if (!["monthly", "yearly"].includes(rentPeriod)) {
      return res.status(400).json({
        success: false,
        message: "Rent period must be monthly or yearly",
      });
    }

    if (!["NGN", "USD"].includes(currency)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported currency",
      });
    }

    const application = await RentalApplication.findById(rentalApplication);

    if (!application || application.status !== "approved") {
      return res.status(409).json({
        success: false,
        message: "A lease can only be created from an approved application",
      });
    }

    const property = await Property.findById(application.property);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (property.status !== "available") {
      return res.status(409).json({
        success: false,
        message: "Property is not available for leasing",
      });
    }

    const existingLease = await Lease.findOne({
      property: property._id,
      status: { $in: ["pending", "active"] },
      endDate: { $gt: new Date() },
    });

    if (existingLease) {
      return res.status(409).json({
        success: false,
        message: "A pending or active lease already exists for this property",
      });
    }

    const leaseNumber = `LSE-${new mongoose.Types.ObjectId()
      .toString()
      .toUpperCase()}`;

    const lease = await Lease.create({
      leaseNumber,
      property: property._id,
      tenant: application.applicant,
      rentalApplication: application._id,
      startDate: start,
      endDate: end,
      rentAmount,
      rentPeriod,
      serviceCharge,
      securityDeposit,
      currency,
      status: "pending",
      createdBy: req.user._id,
    });

    property.status = "reserved";
    await property.save();

    res.status(201).json({
      success: true,
      message: "Lease created successfully; awaiting activation",
      lease,
    });
  } catch (error) {
    console.error("Create lease error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create lease",
    });
  }
};

const getMyLeases = async (req, res) => {
  try {
    const leases = await Lease.find({
      tenant: req.user._id,
    })
      .populate("property", "title slug propertyCode rent location")
      .populate("rentalApplication", "status")
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
      message: "Unable to retrieve leases",
    });
  }
};

const getAllLeases = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      const statuses = [
        "pending",
        "active",
        "expired",
        "terminated",
        "cancelled",
      ];

      if (!statuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid lease status",
        });
      }

      filter.status = req.query.status;
    }

    const leases = await Lease.find(filter)
      .populate("tenant", "firstName lastName email phone")
      .populate("property", "title propertyCode slug")
      .populate("rentalApplication", "status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leases.length,
      leases,
    });
  } catch (error) {
    console.error("Get all leases error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve leases",
    });
  }
};

const updateLeaseStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["active", "terminated", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active, terminated or cancelled",
      });
    }

    const lease = await Lease.findById(req.params.id);

    if (!lease) {
      return res.status(404).json({
        success: false,
        message: "Lease not found",
      });
    }

    if (
      !["pending", "active"].includes(lease.status) ||
      (lease.status === "active" && status === "active")
    ) {
      return res.status(409).json({
        success: false,
        message: "This lease cannot transition to the requested status",
      });
    }

    if (status === "active") {
      if (lease.startDate > new Date() || lease.endDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message:
            "Lease dates must include the current date before activation",
        });
      }

      const conflictingLease = await Lease.findOne({
        _id: { $ne: lease._id },
        property: lease.property,
        status: "active",
        endDate: { $gt: new Date() },
      });

      if (conflictingLease) {
        return res.status(409).json({
          success: false,
          message: "Another active lease already exists for this property",
        });
      }
    }

    lease.status = status;
    await lease.save();

    const property = await Property.findById(lease.property);

    if (property) {
      if (status === "active") {
        property.status = "rented";
        property.visibility = "private";
      } else {
        const otherLease = await Lease.findOne({
          _id: { $ne: lease._id },
          property: lease.property,
          status: { $in: ["pending", "active"] },
          endDate: { $gt: new Date() },
        });

        if (!otherLease) {
          property.status = "available";
          property.visibility = "public";
        }
      }

      await property.save();
    }

    res.status(200).json({
      success: true,
      message: "Lease status updated successfully",
      lease,
    });
  } catch (error) {
    console.error("Update lease status error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update lease status",
    });
  }
};

module.exports = {
  createLease,
  getMyLeases,
  getAllLeases,
  updateLeaseStatus,
};
