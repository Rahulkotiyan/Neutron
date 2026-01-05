const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const verifyToken = require("../middleware/authMiddleware");

// Get all posts (with optional filtering)
router.get("/", postController.getPosts);

// Get global feed (all colleges)
router.get("/global", postController.getGlobalFeed);

// Get college-specific feed
router.get("/college/:college", postController.getCollegeFeed);

// Get list of colleges
router.get("/colleges/list", postController.getColleges);

// Create post (protected)
router.post("/", verifyToken, postController.createPost);

// Like/unlike post (protected)
router.put("/:id/like", verifyToken, postController.likePost);

// Comment on post (protected)
router.post("/:id/comment", verifyToken, postController.commentPost);

// Repost (protected)
router.post("/:id/repost", verifyToken, postController.repostPost);

module.exports = router;
