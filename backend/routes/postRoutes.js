const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const verifyToken = require("../middleware/authMiddleware");
const { uploadPost } = require("../middleware/uploadMiddleware");

// Get all posts (with optional filtering)
router.get("/", postController.getPosts);

// Get global feed (all colleges)
router.get("/global", postController.getGlobalFeed);

// Get college-specific feed
router.get("/college/:college", postController.getCollegeFeed);

// Get list of colleges
router.get("/colleges/list", postController.getColleges);

// Create post (protected) - with optional file upload
router.post(
  "/",
  verifyToken,
  uploadPost.single("file"),
  postController.createPost
);

// Like/unlike post (protected)
router.put("/:id/like", verifyToken, postController.likePost);

// Dislike/undislike post (protected)
router.put("/:id/dislike", verifyToken, postController.dislikePost);

// Comment on post (protected)
router.post("/:id/comment", verifyToken, postController.commentPost);

// Repost (protected)
router.post("/:id/repost", verifyToken, postController.repostPost);

// Get user's posts (protected)
router.get("/user/profile", verifyToken, postController.getUserPosts);

// Get posts for a specific user by ID (protected)
router.get("/user/:userId", verifyToken, postController.getUserPostsById);

// Check daily posting limit (protected)
router.get("/limit/check", verifyToken, postController.checkDailyPostingLimit);

// Increment post views (public - no auth required for viewing)
router.put("/:id/view", postController.incrementViews);

// Delete post (protected)
router.delete("/:id", verifyToken, postController.deletePost);

module.exports = router;
