const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupContoller");
const verifyToken = require("../middleware/authMiddleware");

// Group routes
router.get("/college/:college", verifyToken, groupController.getGroupsByCollege);
router.get("/", verifyToken, groupController.getGroups);
router.get("/:id", verifyToken, groupController.getGroup);
router.post("/", verifyToken, groupController.createGroup);
router.post("/:id/join", verifyToken, groupController.joinGroup);
router.post("/:id/leave", verifyToken, groupController.leaveGroup);

// Channel routes
router.post("/:id/channels", verifyToken, groupController.createChannel);

// Role routes
router.post("/:id/roles", verifyToken, groupController.createRole);

// Message routes
router.get("/:id/messages", verifyToken, groupController.getMessages);
router.post("/:id/messages", verifyToken, groupController.sendMessage);
router.put("/:id/messages/:messageId", verifyToken, groupController.editMessage);
router.delete("/:id/messages/:messageId", verifyToken, groupController.deleteMessage);

// Message reactions
router.post("/:id/messages/:messageId/reactions", verifyToken, groupController.addReaction);
router.delete("/:id/messages/:messageId/reactions", verifyToken, groupController.removeReaction);

// Message pinning
router.post("/:id/messages/:messageId/pin", verifyToken, groupController.pinMessage);

// File upload
router.post("/:id/upload", verifyToken, groupController.uploadFile, groupController.handleFileUpload);

// Server features
router.get("/:id/online", verifyToken, groupController.getOnlineUsers);
router.post("/:id/boost", verifyToken, groupController.boostServer);

module.exports = router;
