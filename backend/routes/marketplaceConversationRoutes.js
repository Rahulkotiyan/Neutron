const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { uploadListing } = require("../middleware/uploadMiddleware");
const {
  getUserConversations,
  getConversation,
  startConversation,
  sendMessage,
  makeOffer,
  acceptOffer,
  completeConversation,
  getUnreadCount,
  deleteConversation
} = require("../controllers/marketplaceConversationController");

// All routes are protected
router.use(authMiddleware);

// Conversation management
router.get("/", getUserConversations);
router.get("/unread/count", getUnreadCount);
router.post("/", startConversation);
router.get("/:id", getConversation);
router.post("/:id/message", uploadListing.single("image"), sendMessage);
router.post("/:id/offer", makeOffer);
router.post("/:id/offer/:messageId/accept", acceptOffer);
router.post("/:id/complete", completeConversation);
router.delete("/:id", deleteConversation);

module.exports = router;
