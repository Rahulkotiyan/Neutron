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
const { cacheMiddleware, clearOnSuccess } = require("../middleware/simpleCache");

// Get all notifications for the authenticated user
router.get("/", authMiddleware, cacheMiddleware(30000), getNotifications);

// Get unread count
router.get("/unread-count", authMiddleware, cacheMiddleware(15000), getUnreadCount);

// Mark a specific notification as read
router.patch("/:notificationId/read", authMiddleware, clearOnSuccess(req => `/api/notifications|${req.user._id}`), markAsRead);

// Mark all notifications as read
router.patch("/read-all", authMiddleware, clearOnSuccess(req => `/api/notifications|${req.user._id}`), markAllAsRead);

// Delete a notification
router.delete("/:notificationId", authMiddleware, clearOnSuccess(req => `/api/notifications|${req.user._id}`), deleteNotification);

module.exports = router;
