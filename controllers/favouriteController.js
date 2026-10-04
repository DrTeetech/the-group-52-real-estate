const Favorite = require("../models/favourite");
const Property = require("../models/property");

// ADD PROPERTY TO FAVOURITES
exports.addFavorite = async (req, res) => {
  try {
    const { property } = req.body;

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

    const favorite = await Favorite.create({
      user: req.user._id,
      property,
    });

    res.status(201).json({
      success: true,
      message: "Property added to favourites successfully",
      favorite,
    });
  } catch (error) {
    console.error("Add favorite error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Property is already in your favourites",
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET MY FAVOURITES
exports.getMyFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({
      user: req.user._id,
    })
      .populate(
        "property",
        "propertyCode title propertyType rent location bedrooms bathrooms"
      )
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
      message: "Server error while fetching favourites",
    });
  }
};

// REMOVE PROPERTY FROM FAVOURITES
exports.removeFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Favourite not found",
      });
    }

    await favorite.deleteOne();

    res.status(200).json({
      success: true,
      message: "Property removed from favourites successfully",
    });
  } catch (error) {
    console.error("Remove favorite error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};