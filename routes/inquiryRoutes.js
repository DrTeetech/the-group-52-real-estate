const express = require("express");

const {
  createInquiry,
  getMyInquiries,
  getInquiry,
  updateInquiry,
} = require("../controllers/inquiryController");

const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/", createInquiry);
router.get("/my-inquiries", getMyInquiries);
router.get("/:id", getInquiry);
router.put("/:id", updateInquiry);

module.exports = router;
