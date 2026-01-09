const express = require("express");
const router = express.Router();
const noticesController = require("../controllers/noticesController");
const verifyToken = require("../middleware/authMiddleware");

// Public routes - specific paths first
router.get("/featured", noticesController.getFeaturedNotices);
router.get("/category/:category", noticesController.getNoticesByCategory);
router.get("/", noticesController.getNotices);

// Protected routes - specific paths first
router.get("/user/my-notices", verifyToken, noticesController.getUserNotices);

// Routes with ID parameter - these come last
router.get("/:id", noticesController.getNotice);
router.post("/", verifyToken, noticesController.createNotice);
router.put("/:id", verifyToken, noticesController.updateNotice);
router.delete("/:id", verifyToken, noticesController.deleteNotice);
router.post("/:id/like", verifyToken, noticesController.toggleLike);
router.post("/:id/share", verifyToken, noticesController.toggleShare);
router.post("/:id/pin", verifyToken, noticesController.togglePin);
router.post("/:id/comment", verifyToken, noticesController.addComment);
router.delete(
  "/:id/comment/:commentId",
  verifyToken,
  noticesController.deleteComment
);

module.exports = router;
