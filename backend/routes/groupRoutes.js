const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupContoller");
const verifyToken = require("../middleware/authMiddleware");

// Get all groups
router.get("/", groupController.getGroups);

// Get groups by college
router.get("/college/:college", groupController.getGroupsByCollege);

// Get single group
router.get("/:id", groupController.getGroup);

// Create group (protected)
router.post("/", verifyToken, groupController.createGroup);

// Join group (protected)
router.post("/:id/join", verifyToken, groupController.joinGroup);

// Leave group (protected)
router.post("/:id/leave", verifyToken, groupController.leaveGroup);

// Get group messages
router.get("/:id/messages", groupController.getMessages);

// Send message (protected)
router.post("/:id/messages", verifyToken, groupController.sendMessage);

// Edit message (protected)
router.put(
  "/:id/messages/:messageId",
  verifyToken,
  groupController.editMessage
);

// Delete message (protected)
router.delete(
  "/:id/messages/:messageId",
  verifyToken,
  groupController.deleteMessage
);

module.exports = router;
