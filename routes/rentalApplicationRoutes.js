const express = require("express");

const {
  createRentalApplication,
  getMyRentalApplications,
  getRentalApplication,
  updateRentalApplication,
  withdrawRentalApplication,
  getAllRentalApplications,
  reviewRentalApplication,
} = require("../controllers/rentalApplicationController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

const router = express.Router();

router.use(protect);

// Customer routes
router.post("/", createRentalApplication);
router.get("/my-applications", getMyRentalApplications);

// Property management route
router.get(
  "/",
  authorize("agent", "property_manager", "admin", "super_admin"),
  getAllRentalApplications
);

// Customer single-application routes
router.get("/:id", getRentalApplication);
router.put("/:id", updateRentalApplication);
router.patch("/:id/withdraw", withdrawRentalApplication);

// Property management review route
router.patch(
  "/:id/review",
  authorize("agent", "property_manager", "admin", "super_admin"),
  reviewRentalApplication
);

module.exports = router;