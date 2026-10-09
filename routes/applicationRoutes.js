const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createApplication,
  deleteApplication,
  getApplicationById,
  getApplications,
  updateApplication,
} = require("../controllers/applicationController");

const router = express.Router();

router.use(authMiddleware);

router.route("/").get(getApplications).post(createApplication);
router
  .route("/:id")
  .get(getApplicationById)
  .put(updateApplication)
  .delete(deleteApplication);

module.exports = router;