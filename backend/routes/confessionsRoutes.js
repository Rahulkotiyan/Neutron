const express = require("express");
const router = express.Router();
const confessionsController = require("../controllers/confessionsController");
const { verifyToken } = require("../middleware/authMiddleware");

// Public routes
router.get("/", confessionsController.getConfessions);
router.get(
  "/category/:category",
  confessionsController.getConfessionsByCategory
);
router.get("/:id", confessionsController.getConfession);

// Protected routes
router.post("/", verifyToken, confessionsController.createConfession);
router.put("/:id", verifyToken, confessionsController.updateConfession);
router.delete("/:id", verifyToken, confessionsController.deleteConfession);

router.post("/:id/like", verifyToken, confessionsController.toggleLike);
router.post("/:id/comment", verifyToken, confessionsController.addComment);
router.delete(
  "/:id/comment/:commentId",
  verifyToken,
  confessionsController.deleteComment
);
router.post("/:id/resolve", verifyToken, confessionsController.toggleResolved);

module.exports = router;
