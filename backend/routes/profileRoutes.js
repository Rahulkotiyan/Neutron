const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const verifyToken = require("../middleware/authMiddleware");
const { uploadProfile } = require("../middleware/uploadMiddleware");
const { processImage, validateImageUpload } = require("../middleware/imageProcessing");
const { cacheMiddleware, clearOnSuccess } = require("../middleware/simpleCache");

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
router.get("/", verifyToken, cacheMiddleware(30000), profileController.getUserProfile);

// Update user profile (protected) - with optional avatar and banner upload
router.put(
  "/",
  verifyToken,
  clearOnSuccess(req => `/api/profile|${req.user._id}`),
  uploadProfile.fields([
    { name: "avatar", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  validateImageUpload,
  processImage,
  profileController.updateUserProfile
);

// Get user stats (followers, following, posts count)
router.get("/stats", verifyToken, cacheMiddleware(30000), profileController.getUserStats);

// Follow user
router.post("/follow", verifyToken, clearOnSuccess(req => `/api/profile|${req.user._id}`), profileController.followUser);

// Unfollow user
router.post("/unfollow", verifyToken, clearOnSuccess(req => `/api/profile|${req.user._id}`), profileController.unfollowUser);

// Get activity and content
router.get("/activity", verifyToken, cacheMiddleware(30000), profileController.getUserActivity);
router.get("/activity/:userId", verifyToken, cacheMiddleware(30000), profileController.getUserActivity);
router.get("/content", verifyToken, cacheMiddleware(30000), profileController.getUserContent);
router.get("/content/:userId", verifyToken, cacheMiddleware(30000), profileController.getUserContent);

// Get another user's profile by ID (protected)
router.get("/:userId", verifyToken, cacheMiddleware(30000), profileController.getUserProfileById);

// Get another user's stats by ID (protected)
router.get("/:userId/stats", verifyToken, cacheMiddleware(30000), profileController.getUserStatsById);

// Follow user by ID (protected)
router.post("/:userId/follow", verifyToken, clearOnSuccess(req => `/api/profile|${req.user._id}`), profileController.followUserById);

// Unfollow user by ID (protected)
router.post(
  "/:userId/unfollow",
  verifyToken,
  clearOnSuccess(req => `/api/profile|${req.user._id}`),
  profileController.unfollowUserById
);

module.exports = router;
