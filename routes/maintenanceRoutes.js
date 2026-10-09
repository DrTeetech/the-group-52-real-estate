const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createMaintenanceRequest,
  deleteMaintenanceRequest,
  getMaintenanceRequestById,
  getMaintenanceRequests,
  updateMaintenanceRequest,
} = require("../controllers/maintenanceController");

const router = express.Router();

router.use(authMiddleware);

router.route("/")
  .get(getMaintenanceRequests)
  .post(createMaintenanceRequest);

router.route("/:id")
  .get(getMaintenanceRequestById)
  .put(updateMaintenanceRequest)
  .delete(deleteMaintenanceRequest);

module.exports = router;
