const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createNotification,
  deleteNotification,
  getNotificationById,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} = require("../controllers/notificationController");

const router = express.Router();

router.use(authMiddleware);

router.route("/").get(getNotifications).post(createNotification);
router.put("/read-all", markAllNotificationsAsRead);
router.put("/:id/read", markNotificationAsRead);
router.route("/:id").get(getNotificationById).delete(deleteNotification);

module.exports = router;