const express = require("express");

const {
  createProperty,
  getAllProperties,
  getProperty,
  updateProperty,
  deleteProperty,
} = require("../controllers/propertyController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

const router = express.Router();

// Public routes
router.get("/", getAllProperties);
router.get("/:id", getProperty);

// Protected property-management routes
router.post(
  "/",
  protect,
  authorize("agent", "property_manager", "admin", "super_admin"),
  createProperty
);

router.put(
  "/:id",
  protect,
  authorize("agent", "property_manager", "admin", "super_admin"),
  updateProperty
);

router.delete(
  "/:id",
  protect,
  authorize("agent", "property_manager", "admin", "super_admin"),
  deleteProperty
);

module.exports = router;