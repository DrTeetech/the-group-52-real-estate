const express = require("express");

const {
  createLease,
  getMyLeases,
  getAllLeases,
  updateLeaseStatus,
} = require("../controllers/leaseController");

const { protect } = require("../middleware/auth");
const authorize = require("../middleware/roles");

const router = express.Router();

router.get("/me", protect, authorize("customer"), getMyLeases);

router.get(
  "/",
  protect,
  authorize("property_manager", "admin", "super_admin"),
  getAllLeases
);

router.post(
  "/",
  protect,
  authorize("property_manager", "admin", "super_admin"),
  createLease
);

router.patch(
  "/:id/status",
  protect,
  authorize("property_manager", "admin", "super_admin"),
  updateLeaseStatus
);

module.exports = router;
