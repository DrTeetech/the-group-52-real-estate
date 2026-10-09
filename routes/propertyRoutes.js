const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createProperty,
  deleteProperty,
  getProperties,
  getPropertyById,
  updateProperty,
} = require("../controllers/propertyController");

const router = express.Router();

router.use(authMiddleware);

router.route("/").get(getProperties).post(createProperty);
router
  .route("/:id")
  .get(getPropertyById)
  .put(updateProperty)
  .delete(deleteProperty);

module.exports = router;