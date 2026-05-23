const express = require("express");
const router = express.Router();
const multer = require("multer");
const groupController = require("../controllers/groupContoller");
const { uploadFile } = require("../controllers/uploadController");
const verifyToken = require("../middleware/authMiddleware");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// ============================================================================
// SPECIFIC ROUTES WITH MULTIPLE PARAMETERS (Most Specific - Define First)
// ============================================================================

// Member-specific routes (/:id/members/:userId/*)
// E2EE: update an existing member's encrypted group key
router.patch("/:id/members/:userId/key", verifyToken, groupController.updateMemberKey);
// Member role assignment
router.patch("/:id/members/:userId/role", verifyToken, groupController.assignMemberRole);
// Membership moderation
router.post("/:id/members/:userId/kick", verifyToken, groupController.kickMember);
router.post("/:id/members/:userId/ban", verifyToken, groupController.banMember);
router.post("/:id/members/:userId/unban", verifyToken, groupController.unbanMember);
// Member management
router.delete("/:id/members/:userId", verifyToken, groupController.removeMember);

// Admin-specific routes (/:id/admins/:userId)
router.delete("/:id/admins/:userId", verifyToken, groupController.removeAdmin);

// Join request-specific routes (/:id/join-requests/:userId/* or /:id/join-requests/:requestId/*)
router.post("/:id/join-requests/:userId/approve", verifyToken, groupController.approveJoinRequest);
router.post("/:id/join-requests/:userId/reject", verifyToken, groupController.rejectJoinRequest);
router.post("/:id/join-requests/:requestId/approve", verifyToken, groupController.approveJoinRequest);
router.post("/:id/join-requests/:requestId/reject", verifyToken, groupController.rejectJoinRequest);

// Channel-specific routes (/:id/channels/:channelId)
router.put("/:id/channels/:channelId", verifyToken, groupController.updateChannel);
router.delete("/:id/channels/:channelId", verifyToken, groupController.deleteChannel);

// Message routes with multiple parameters (/channel/:channelId/messages/:messageId/*)
router.put("/channel/:channelId/messages/:messageId", verifyToken, groupController.editMessage);
router.delete("/channel/:channelId/messages/:messageId", verifyToken, groupController.deleteMessage);
router.post("/channel/:channelId/messages/:messageId/vote", verifyToken, groupController.votePoll);
router.post("/channel/:channelId/messages/:messageId/reactions", verifyToken, groupController.addReaction);
router.delete("/channel/:channelId/messages/:messageId/reactions", verifyToken, groupController.removeReaction);
router.post("/channel/:channelId/messages/:messageId/report", verifyToken, groupController.reportMessage);
router.post("/channel/:channelId/messages/:messageId/pin", verifyToken, groupController.pinMessage);
router.get("/channel/:channelId/messages/:messageId/reads", verifyToken, groupController.getMessageReadBy);

// ============================================================================
// SPECIFIC ROUTES WITH SINGLE PARAMETERS (Specific Actions)
// ============================================================================

// Member routes (/:id/members)
// E2EE: add a member with their encrypted group key
router.post("/:id/members", verifyToken, groupController.addMember);

// Join request routes (/:id/join-requests)
router.get("/:id/join-requests", verifyToken, groupController.getJoinRequests);

// Channel routes (/:id/channels)
router.post("/:id/channels", verifyToken, groupController.createChannel);
router.get("/:id/channels", verifyToken, groupController.getChannels);

// Role routes (/:id/roles)
router.post("/:id/roles", verifyToken, groupController.createRole);
router.post("/:id/roles/assign", verifyToken, groupController.assignRole);
router.get("/:id/roles", verifyToken, groupController.getRoles);

// Admin routes (/:id/admins)
router.post("/:id/admins", verifyToken, groupController.addAdmin);

// Group-specific action routes
router.post("/:id/join", verifyToken, groupController.joinGroup);
router.post("/:id/leave", verifyToken, groupController.leaveGroup);
router.post("/:id/invite", verifyToken, groupController.generateInvite);
router.patch("/:id/settings", verifyToken, groupController.updateGroupSettings);
router.get("/:id/online", verifyToken, groupController.getOnlineUsers);
router.get("/:id/members", verifyToken, groupController.getMembers);

// Message routes with single parameter (/channel/:channelId/messages)
router.get("/channel/:channelId/messages", verifyToken, groupController.getChannelMessages);
router.post("/channel/:channelId/messages", verifyToken, groupController.sendChannelMessage);

// File upload to Supabase Storage (/channel/:channelId/upload)
router.post("/channel/:channelId/upload", verifyToken, upload.single("file"), uploadFile);

// Poll routes (/channel/:channelId/polls)
router.post("/channel/:channelId/polls", verifyToken, groupController.createPoll);

// ============================================================================
// GENERIC ROUTES WITH SINGLE PARAMETERS (Less Specific)
// ============================================================================

// Generic group routes (/:id)
router.get("/:id", verifyToken, groupController.getGroup);
router.delete("/:id", verifyToken, groupController.deleteGroup);

// ============================================================================
// SPECIAL ROUTES (Invite system - no group ID required)
// ============================================================================

router.get("/invite/:inviteCode", groupController.joinByInvite);

// ============================================================================
// ROOT ROUTES (Most Generic - Define Last)
// ============================================================================

// College-specific route
router.get("/college/:college", verifyToken, groupController.getGroupsByCollege);

// Root group routes
router.get("/", verifyToken, groupController.getGroups);
router.post("/", verifyToken, groupController.createGroup);

module.exports = router;
