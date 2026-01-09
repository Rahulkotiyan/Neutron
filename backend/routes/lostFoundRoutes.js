const express = require("express");
const router = express.Router();
const lostFoundController = require("../controllers/lostFoundController");
const verifyToken = require("../middleware/authMiddleware");

// Public routes
router.get("/", lostFoundController.getLostFoundPosts);
router.get("/:id", lostFoundController.getLostFoundPost);

// Protected routes
router.post("/", verifyToken, lostFoundController.createLostFoundPost);
router.post("/:id/responses", verifyToken, lostFoundController.addResponse);
router.put("/:id/status", verifyToken, lostFoundController.updatePostStatus);
router.delete("/:id", verifyToken, lostFoundController.deleteLostFoundPost);
router.get("/user/my-posts", verifyToken, lostFoundController.getUserPosts);

module.exports = router;
