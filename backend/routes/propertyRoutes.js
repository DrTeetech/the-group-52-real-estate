const express = require("express");

const {
  getProperties,
  getPropertyBySlug,
  createProperty,
  updateProperty,
  updatePropertyStatus,
  publishProperty,
  deleteProperty,
} = require("../controllers/propertyController");

const { protect } = require("../middleware/auth");

const authorize = require("../middleware/roles");

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Get all available public properties
router.get("/", getProperties);

// Get one public property
router.get("/:slug", getPropertyBySlug);

// ==========================================
// STAFF ROUTES
// ==========================================

// Create property
router.post(
  "/",
  protect,
  authorize("agent", "property_manager", "admin", "super_admin"),
  createProperty
);

// Update property
router.patch(
  "/:id",
  protect,
  authorize("agent", "property_manager", "admin", "super_admin"),
  updateProperty
);

// Update property status
router.patch(
  "/:id/status",
  protect,
  authorize("agent", "property_manager", "admin", "super_admin"),
  updatePropertyStatus
);

// Publish property
router.post(
  "/:id/publish",
  protect,
  authorize("property_manager", "admin", "super_admin"),
  publishProperty
);

// Delete property
router.delete(
  "/:id",
  protect,
  authorize("admin", "super_admin"),
  deleteProperty
);

module.exports = router;
