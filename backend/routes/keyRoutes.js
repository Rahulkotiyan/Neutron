const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const keyController = require("../controllers/keyController");

// Upload / update own public key
router.post("/upload", verifyToken, keyController.uploadPublicKey);

// Fetch another user's public key
router.get("/:userId", verifyToken, keyController.getUserPublicKey);

// Fetch all member public keys for a group (for key distribution)
router.get("/group/:groupId", verifyToken, keyController.getGroupMemberPublicKeys);

// Store an encrypted AES key for a target member
router.post("/group/:groupId/distribute", verifyToken, keyController.distributeGroupKey);

module.exports = router;
