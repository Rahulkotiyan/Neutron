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
router.get("/:id/channels", verifyToken, groupController.getChannels);
router.put("/:id/channels/:channelId", verifyToken, groupController.updateChannel);
router.delete("/:id/channels/:channelId", verifyToken, groupController.deleteChannel);

// Role routes
router.post("/:id/roles", verifyToken, groupController.createRole);
router.post("/:id/roles/assign", verifyToken, groupController.assignRole);
router.get("/:id/roles", verifyToken, groupController.getRoles);

// Message routes (updated to use channel-specific endpoints)
router.get("/channel/:channelId/messages", verifyToken, groupController.getChannelMessages);
router.post("/channel/:channelId/messages", verifyToken, groupController.sendChannelMessage);
router.put("/channel/:channelId/messages/:messageId", verifyToken, groupController.editMessage);
router.delete("/channel/:channelId/messages/:messageId", verifyToken, groupController.deleteMessage);

// Message reactions
router.post("/channel/:channelId/messages/:messageId/reactions", verifyToken, groupController.addReaction);
router.delete("/channel/:channelId/messages/:messageId/reactions", verifyToken, groupController.removeReaction);

// Message pinning
router.post("/channel/:channelId/messages/:messageId/pin", verifyToken, groupController.pinMessage);

// File upload
router.post("/channel/:channelId/upload", verifyToken, groupController.uploadFile, groupController.handleFileUpload);

// Invite system
router.post("/:id/invite", verifyToken, groupController.generateInvite);
router.get("/invite/:inviteCode", groupController.joinByInvite);

// Server features
router.get("/:id/online", verifyToken, groupController.getOnlineUsers);
router.get("/:id/members", verifyToken, groupController.getMembers);

module.exports = router;
