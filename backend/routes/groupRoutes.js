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
// E2EE: add a member with their encrypted group key
router.post("/:id/members", verifyToken, groupController.addMember);
// E2EE: update an existing member's encrypted group key
router.patch("/:id/members/:userId/key", verifyToken, groupController.updateMemberKey);
// Membership moderation
router.post("/:id/members/:userId/kick", verifyToken, groupController.kickMember);
router.post("/:id/members/:userId/ban", verifyToken, groupController.banMember);
router.post("/:id/members/:userId/unban", verifyToken, groupController.unbanMember);

// Join requests (approval-required groups)
router.get("/:id/join-requests", verifyToken, groupController.getJoinRequests);
router.post("/:id/join-requests/:userId/approve", verifyToken, groupController.approveJoinRequest);
router.post("/:id/join-requests/:userId/reject", verifyToken, groupController.rejectJoinRequest);

// Group-level settings (join policy etc.)
router.patch("/:id/settings", verifyToken, groupController.updateGroupSettings);

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

// Poll routes
router.post("/channel/:channelId/polls", verifyToken, groupController.createPoll);
router.post(
  "/channel/:channelId/messages/:messageId/vote",
  verifyToken,
  groupController.votePoll
);

// Message reactions
router.post("/channel/:channelId/messages/:messageId/reactions", verifyToken, groupController.addReaction);
router.delete("/channel/:channelId/messages/:messageId/reactions", verifyToken, groupController.removeReaction);

// Message reporting and moderation
router.post("/channel/:channelId/messages/:messageId/report", verifyToken, groupController.reportMessage);

// Message pinning
router.post("/channel/:channelId/messages/:messageId/pin", verifyToken, groupController.pinMessage);

// File upload
router.post("/channel/:channelId/upload", verifyToken, groupController.uploadFile, groupController.handleFileUpload);

// Invite system
router.post("/:id/invite", verifyToken, groupController.generateInvite);
router.get("/invite/:inviteCode", groupController.joinByInvite);

// Join request management
router.post("/:id/join-requests/:requestId/approve", verifyToken, groupController.approveJoinRequest);
router.post("/:id/join-requests/:requestId/reject", verifyToken, groupController.rejectJoinRequest);

// Admin management
router.post("/:id/admins", verifyToken, groupController.addAdmin);
router.delete("/:id/admins/:userId", verifyToken, groupController.removeAdmin);

// Member management
router.delete("/:id/members/:userId", verifyToken, groupController.removeMember);

// Server features
router.get("/:id/online", verifyToken, groupController.getOnlineUsers);
router.get("/:id/members", verifyToken, groupController.getMembers);

module.exports = router;
