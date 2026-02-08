const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");

// Get all notifications for the authenticated user
router.get("/", authMiddleware, getNotifications);

// Get unread count
router.get("/unread-count", authMiddleware, getUnreadCount);

// Mark a specific notification as read
router.patch("/:notificationId/read", authMiddleware, markAsRead);

// Mark all notifications as read
router.patch("/read-all", authMiddleware, markAllAsRead);

// Delete a notification
router.delete("/:notificationId", authMiddleware, deleteNotification);

module.exports = router;
