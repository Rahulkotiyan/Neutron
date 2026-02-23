const express = require("express");
const router = express.Router();
const messagesController = require("../controllers/messagesController");
const verifyToken = require("../middleware/authMiddleware");

// Get all conversations for the logged-in user
router.get("/conversations", verifyToken, messagesController.getConversations);

// Get messages from a specific conversation
router.get(
  "/conversation/:conversationId",
  verifyToken,
  messagesController.getConversationMessages,
);

// Send a message to a conversation
router.post("/send", verifyToken, messagesController.sendMessage);

// Start a new conversation
router.post("/start", verifyToken, messagesController.startConversation);

// Delete a conversation
router.delete(
  "/conversation/:conversationId",
  verifyToken,
  messagesController.deleteConversation,
);

module.exports = router;
