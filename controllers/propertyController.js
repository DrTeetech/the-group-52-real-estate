const Property = require("../models/property");

// ==========================================
// GET ALL PUBLIC PROPERTIES
// GET /api/properties
// ==========================================

const getProperties = async (req, res) => {
  try {
    const {
      city,
      state,
      propertyType,
      minPrice,
      maxPrice,
      bedrooms,
      furnished,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {
      visibility: "public",
      status: "available",
    };

    // Location filters
    if (city) {
      filter["location.city"] = city;
    }

    if (state) {
      filter["location.state"] = state;
    }

    // Property type
    if (propertyType) {
      filter.propertyType = propertyType;
    }

    // Price range
    if (minPrice || maxPrice) {
      filter["rent.amount"] = {};

      if (minPrice) {
        filter["rent.amount"].$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter["rent.amount"].$lte = Number(maxPrice);
      }
    }

    // Bedrooms
    if (bedrooms) {
      filter.bedrooms = {
        $gte: Number(bedrooms),
      };
    }

    // Furnished
    if (furnished !== undefined) {
      filter.furnished = furnished === "true";
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),

      Property.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: properties.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      properties,
    });
  } catch (error) {
    console.error("Get properties error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve properties",
    });
  }
};

// ==========================================
// GET SINGLE PUBLIC PROPERTY
// GET /api/properties/:slug
// ==========================================

const getPropertyBySlug = async (req, res) => {
  try {
    const property = await Property.findOne({
      slug: req.params.slug,
      visibility: "public",
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Increment views
    property.views += 1;
    await property.save();

    res.status(200).json({
      success: true,
      property,
    });
  } catch (error) {
    console.error("Get property error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve property",
    });
  }
};

// ==========================================
// CREATE PROPERTY
// POST /api/properties
// STAFF ONLY
// ==========================================

const createProperty = async (req, res) => {
  try {
    const property = await Property.create({
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: "Property created successfully",
      property,
    });
  } catch (error) {
    console.error("Create property error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Property code or slug already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to create property",
    });
  }
};

// ==========================================
// UPDATE PROPERTY
// PATCH /api/properties/:id
// STAFF ONLY
// ==========================================

const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Prevent clients from modifying sensitive fields
    const protectedFields = ["status", "visibility", "views"];

    protectedFields.forEach((field) => {
      delete req.body[field];
    });

    Object.assign(property, req.body);

    await property.save();

    res.status(200).json({
      success: true,
      message: "Property updated successfully",
      property,
    });
  } catch (error) {
    console.error("Update property error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update property",
    });
  }
};

// ==========================================
// UPDATE PROPERTY STATUS
// PATCH /api/properties/:id/status
// STAFF ONLY
// ==========================================

const updatePropertyStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "draft",
      "available",
      "reserved",
      "rented",
      "unavailable",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property status",
      });
    }

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Property status updated successfully",
      property,
    });
  } catch (error) {
    console.error("Update property status error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update property status",
    });
  }
};

// ==========================================
// PUBLISH PROPERTY
// POST /api/properties/:id/publish
// STAFF ONLY
// ==========================================

const publishProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (property.status !== "available") {
      return res.status(400).json({
        success: false,
        message: "Only available properties can be published",
      });
    }

    property.visibility = "public";

    await property.save();

    res.status(200).json({
      success: true,
      message: "Property published successfully",
      property,
    });
  } catch (error) {
    console.error("Publish property error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to publish property",
    });
  }
};

// ==========================================
// DELETE PROPERTY
// DELETE /api/properties/:id
// ADMIN ONLY
// ==========================================

const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    await property.deleteOne();

    res.status(200).json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("Delete property error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete property",
    });
  }
};

module.exports = {
  getProperties,
  getPropertyBySlug,
  createProperty,
  updateProperty,
  updatePropertyStatus,
  publishProperty,
  deleteProperty,
};
