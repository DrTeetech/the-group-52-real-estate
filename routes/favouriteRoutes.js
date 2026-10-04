const express = require("express");

const {
  addFavorite,
  getMyFavorites,
  removeFavorite,
} = require("../controllers/favouriteController");

const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/", addFavorite);
router.get("/my-favorites", getMyFavorites);
router.delete("/:id", removeFavorite);

module.exports = router;