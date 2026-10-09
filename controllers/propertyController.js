const { randomBytes } = require("crypto");
const mongoose = require("mongoose");
const Property = require("../models/property");

const managementRoles = ["property_manager", "landlord", "admin"];

const propertyFields = [
  "title",
  "description",
  "propertyType",
  "rent",
  "serviceCharge",
  "cautionFee",
  "location",
  "bedrooms",
  "bathrooms",
  "units",
  "parkingSpaces",
  "propertySize",
  "furnished",
  "yearBuilt",
  "floor",
  "totalFloors",
  "condition",
  "amenities",
  "media",
  "status",
  "visibility",
  "isFeatured",
];

function serializeProperty(property) {
  const data = property.toObject ? property.toObject() : { ...property };
  data.id = String(data._id);
  delete data._id;
  delete data.__v;
  delete data.owner;
  delete data.assignedAgent;
  return data;
}

function hasPropertyAccess(property, user) {
  if (user.role === "admin") return true;

  if (user.role === "property_manager") {
    return String(property.assignedAgent || "") === String(user.id);
  }

  if (user.role === "landlord") {
    return String(property.owner || "") === String(user.id);
  }

  return (
    user.role === "tenant" &&
    property.visibility === "public" &&
    property.status === "available"
  );
}

function handlePropertyError(res, error) {
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A property with this title or property code already exists.",
    });
  }

  console.error("Property API error:", error);
  return res.status(500).json({
    success: false,
    message: "Unable to complete the property request.",
  });
}

function validPropertyId(id) {
  return mongoose.isValidObjectId(id);
}

exports.createProperty = async (req, res) => {
  try {
    if (!managementRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create properties.",
      });
    }

    const input = req.body || {};
    const propertyData = {
      propertyCode:
        input.propertyCode ||
        `PROP-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`,
    };

    for (const field of propertyFields) {
      if (Object.prototype.hasOwnProperty.call(input, field)) {
        propertyData[field] = input[field];
      }
    }

    if (req.user.role === "property_manager") {
      propertyData.assignedAgent = req.user.id;
    } else if (req.user.role === "landlord") {
      propertyData.owner = req.user.id;
    } else {
      if (input.assignedAgent) propertyData.assignedAgent = input.assignedAgent;
      if (input.owner) propertyData.owner = input.owner;
    }

    const property = await Property.create(propertyData);

    return res.status(201).json({
      success: true,
      message: "Property created successfully.",
      data: serializeProperty(property),
    });
  } catch (error) {
    return handlePropertyError(res, error);
  }
};

exports.getProperties = async (req, res) => {
  try {
    let filter;

    switch (req.user.role) {
      case "admin":
        filter = {};
        break;
      case "property_manager":
        filter = { assignedAgent: req.user.id };
        break;
      case "landlord":
        filter = { owner: req.user.id };
        break;
      case "tenant":
        filter = { visibility: "public", status: "available" };
        break;
      default:
        return res.status(403).json({
          success: false,
          message: "You do not have permission to view properties.",
        });
    }

    const properties = await Property.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties.map(serializeProperty),
    });
  } catch (error) {
    return handlePropertyError(res, error);
  }
};

exports.getPropertyById = async (req, res) => {
  try {
    if (!validPropertyId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID.",
      });
    }

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    if (!hasPropertyAccess(property, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this property.",
      });
    }

    return res.status(200).json({
      success: true,
      data: serializeProperty(property),
    });
  } catch (error) {
    return handlePropertyError(res, error);
  }
};

exports.updateProperty = async (req, res) => {
  try {
    if (!validPropertyId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID.",
      });
    }

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    if (!managementRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update properties.",
      });
    }

    if (!hasPropertyAccess(property, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this property.",
      });
    }

    const input = req.body || {};
    for (const field of propertyFields) {
      if (Object.prototype.hasOwnProperty.call(input, field)) {
        property.set(field, input[field]);
      }
    }

    if (req.user.role === "admin") {
      if (Object.prototype.hasOwnProperty.call(input, "owner")) {
        property.owner = input.owner;
      }
      if (Object.prototype.hasOwnProperty.call(input, "assignedAgent")) {
        property.assignedAgent = input.assignedAgent;
      }
    }

    await property.save();

    return res.status(200).json({
      success: true,
      message: "Property updated successfully.",
      data: serializeProperty(property),
    });
  } catch (error) {
    return handlePropertyError(res, error);
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    if (!validPropertyId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID.",
      });
    }

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    if (!managementRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete properties.",
      });
    }

    if (!hasPropertyAccess(property, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this property.",
      });
    }

    await property.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Property deleted successfully.",
      data: { id: String(property._id) },
    });
  } catch (error) {
    return handlePropertyError(res, error);
  }
};