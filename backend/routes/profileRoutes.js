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

module.exports = router;
