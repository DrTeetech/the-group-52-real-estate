const express = require("express");

const {
  createPayment,
  getMyPayments,
  getPayment,
  updatePaymentStatus,
} = require("../controllers/paymentController");

const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/", createPayment);
router.get("/my-payments", getMyPayments);
router.get("/:id", getPayment);
router.patch("/:id/status", updatePaymentStatus);

module.exports = router;