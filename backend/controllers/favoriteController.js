const mongoose = require("mongoose");
const Favorite = require("../models/Favorite");
const Property = require("../models/Property");

// ==========================================
// ADD PROPERTY TO FAVORITES
// POST /api/properties/:id/favorite
// CUSTOMER ONLY
// ==========================================

const addFavorite = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid property ID" });
    const property = await Property.findOne({
      _id: req.params.id,
      visibility: "public",
      status: "available",
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or is not available",
      });
    }

    const existingFavorite = await Favorite.findOne({
      user: req.user._id,
      property: property._id,
    });

    if (existingFavorite) {
      return res.status(409).json({
        success: false,
        message: "Property is already in your favorites",
      });
    }

    const favorite = await Favorite.create({
      user: req.user._id,
      property: property._id,
    });

    res.status(201).json({
      success: true,
      message: "Property added to favorites",
      favorite,
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "Property is already in your favorites" });
    console.error("Add favorite error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to add property to favorites" });
  }
};

// ==========================================
// REMOVE PROPERTY FROM FAVORITES
// DELETE /api/properties/:id/favorite
// CUSTOMER ONLY
// ==========================================

const removeFavorite = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid property ID" });
    const favorite = await Favorite.findOneAndDelete({
      user: req.user._id,
      property: req.params.id,
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Property is not in your favorites",
      });
    }

    res.status(200).json({
      success: true,
      message: "Property removed from favorites",
    });
  } catch (error) {
    console.error("Remove favorite error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to remove property from favorites",
    });
  }
};

// ==========================================
// GET CUSTOMER FAVORITES
// GET /api/me/favorites
// CUSTOMER ONLY
// ==========================================

const getMyFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({
      user: req.user._id,
    })
      .populate({ path: "property", select: "-assignedAgent -reservedForApplication" })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: favorites.length,
      favorites,
    });
  } catch (error) {
    console.error("Get favorites error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve your favorites",
    });
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  getMyFavorites,
};
