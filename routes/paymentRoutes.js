const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createPayment,
  deletePayment,
  getPaymentById,
  getPayments,
  updatePayment,
} = require("../controllers/paymentController");

const router = express.Router();

router.use(authMiddleware);

router.route("/").get(getPayments).post(createPayment);
router.route("/:id").get(getPaymentById).put(updatePayment).delete(deletePayment);

module.exports = router;
