const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const verifyToken = require("../middleware/authMiddleware");
const { uploadProfile } = require("../middleware/uploadMiddleware");

// Get user profile (protected)
router.get("/", verifyToken, profileController.getUserProfile);

// Update user profile (protected) - with optional avatar upload
router.put(
  "/",
  verifyToken,
  uploadProfile.single("avatar"),
  profileController.updateUserProfile
);

// Get user stats (followers, following, posts count)
router.get("/stats", verifyToken, profileController.getUserStats);

// Follow user
router.post("/follow", verifyToken, profileController.followUser);

// Unfollow user
router.post("/unfollow", verifyToken, profileController.unfollowUser);

// Get another user's profile by ID (protected)
router.get("/:userId", verifyToken, profileController.getUserProfileById);

// Get another user's stats by ID (protected)
router.get("/:userId/stats", verifyToken, profileController.getUserStatsById);

// Follow user by ID (protected)
router.post("/:userId/follow", verifyToken, profileController.followUserById);

// Unfollow user by ID (protected)
router.post(
  "/:userId/unfollow",
  verifyToken,
  profileController.unfollowUserById
);

module.exports = router;
