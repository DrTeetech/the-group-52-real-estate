const Property = require("../models/property");

// CREATE PROPERTY
exports.createProperty = async (req, res) => {
  try {
    const property = await Property.create({
      ...req.body,
      assignedAgent: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Property created successfully",
      property,
    });
  } catch (error) {
    console.error("Create property error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL PROPERTIES
exports.getAllProperties = async (req, res) => {
  try {
   const properties = await Property.find().populate(
      "assignedAgent",
      "firstName lastName email phone"
    );

    res.status(200).json({
      success: true,
      count: properties.length,
      properties,
    });
  } catch (error) {
    console.error("Get properties error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching properties",
    });
  }
};

// GET SINGLE PROPERTY
exports.getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      "assignedAgent",
      "firstName lastName email phone"
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    res.status(200).json({
      success: true,
      property,
    });
  } catch (error) {
    console.error("Get property error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching property",
    });
  }
};

// UPDATE PROPERTY
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    Object.assign(property, req.body);

    await property.save();

    res.status(200).json({
      success: true,
      message: "Property updated successfully",
      property,
    });
  } catch (error) {
    console.error("Update property error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE PROPERTY
exports.deleteProperty = async (req, res) => {
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
      message: "Server error while deleting property",
    });
  }
};