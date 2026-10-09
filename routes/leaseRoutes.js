const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createLease,
  deleteLease,
  getLeaseById,
  getLeases,
  updateLease,
} = require("../controllers/leaseController");

const router = express.Router();

router.use(authMiddleware);

router.route("/").get(getLeases).post(createLease);
router.route("/:id").get(getLeaseById).put(updateLease).delete(deleteLease);

module.exports = router;
