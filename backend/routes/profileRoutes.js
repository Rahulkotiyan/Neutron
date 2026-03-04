const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const verifyToken = require("../middleware/authMiddleware");
const { uploadProfile } = require("../middleware/uploadMiddleware");

// Create user profile (protected) - with optional avatar upload
router.post(
  "/create",
  verifyToken,
  uploadProfile.fields([
    { name: "avatar", maxCount: 1 },
  ]),
  profileController.createProfile
);

// Get user profile (protected)
router.get("/", verifyToken, profileController.getUserProfile);

// Update user profile (protected) - with optional avatar and banner upload
router.put(
  "/",
  verifyToken,
  uploadProfile.fields([
    { name: "avatar", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  profileController.updateUserProfile
);

// Get user stats (followers, following, posts count)
router.get("/stats", verifyToken, profileController.getUserStats);

// Follow user
router.post("/follow", verifyToken, profileController.followUser);

// Unfollow user
router.post("/unfollow", verifyToken, profileController.unfollowUser);

// Get activity and content
router.get("/activity", verifyToken, profileController.getUserActivity);
router.get("/activity/:userId", verifyToken, profileController.getUserActivity);
router.get("/content", verifyToken, profileController.getUserContent);
router.get("/content/:userId", verifyToken, profileController.getUserContent);

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
