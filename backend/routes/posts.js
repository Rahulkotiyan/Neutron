const express = require("express");
const {
  createPost,
  getFeedPosts,
  likePost,
  getUserPosts
} = require("../controllers/post.js");
const { verifyToken } = require("../middleware/auth.middleware.js");

const router = express.Router();

/* READ */
// Any user (logged in) can see the feed
router.get("/", verifyToken, getFeedPosts);

/* WRITE */
// Only logged in users can post
router.post("/", verifyToken, createPost);

/* UPDATE */
// Like a post
router.patch("/:id/like", verifyToken, likePost);
router.get("/:userId/posts", verifyToken, getUserPosts);

module.exports = router;
