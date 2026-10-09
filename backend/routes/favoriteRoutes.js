const express = require("express");

const {
  addFavorite,
  removeFavorite,
  getMyFavorites,
} = require("../controllers/favoriteController");

const { protect } = require("../middleware/auth");

const authorize = require("../middleware/roles");

const router = express.Router();

const customerOnly = ["customer"];

// ==========================================
// CUSTOMER FAVORITES
// ==========================================

router.get(
  "/me/favorites",
  protect,
  authorize(...customerOnly),
  getMyFavorites
);

// ==========================================
// ADD FAVORITE
// ==========================================

router.post(
  "/properties/:id/favorite",
  protect,
  authorize(...customerOnly),
  addFavorite
);

// ==========================================
// REMOVE FAVORITE
// ==========================================

router.delete(
  "/properties/:id/favorite",
  protect,
  authorize(...customerOnly),
  removeFavorite
);

module.exports = router;
