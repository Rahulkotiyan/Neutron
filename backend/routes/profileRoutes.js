const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const verifyToken = require("../middleware/authMiddleware");

// Get user profile (protected)
router.get("/", verifyToken, profileController.getUserProfile);

// Update user profile (protected)
router.put("/", verifyToken, profileController.updateUserProfile);

module.exports = router;
