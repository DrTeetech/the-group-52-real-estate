const express = require("express");

const {
  createLease,
  getMyLeases,
  getLease,
  updateLease,
  cancelLease,
} = require("../controllers/leaseController");

const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/", createLease);
router.get("/my-leases", getMyLeases);
router.get("/:id", getLease);
router.put("/:id", updateLease);
router.patch("/:id/cancel", cancelLease);

module.exports = router;