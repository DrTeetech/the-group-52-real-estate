const express = require("express");

const {
  createInquiry,
  getMyInquiries,
  getAllInquiries,
  updateInquiry,
} = require("../controllers/inquiryController");

const { protect } = require("../middleware/auth");
const authorize = require("../middleware/roles");

const router = express.Router();

const staffRoles = ["agent", "property_manager", "admin", "super_admin"];

router.get("/me", protect, authorize("customer"), getMyInquiries);

router.post("/properties/:id", protect, authorize("customer"), createInquiry);

router.get("/", protect, authorize(...staffRoles), getAllInquiries);

router.patch("/:id", protect, authorize(...staffRoles), updateInquiry);

module.exports = router;
