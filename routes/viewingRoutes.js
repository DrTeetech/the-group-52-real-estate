const express = require("express");

const {
  createViewing,
  getMyViewings,
  getViewing,
  updateViewing,
  cancelViewing,
} = require("../controllers/viewingController");

const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/", createViewing);
router.get("/my-viewings", getMyViewings);
router.get("/:id", getViewing);
router.put("/:id", updateViewing);
router.patch("/:id/cancel", cancelViewing);

module.exports = router;