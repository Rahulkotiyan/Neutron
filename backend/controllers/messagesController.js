const mongoose = require("mongoose");
const { User } = require("../models/Schema");

// Message schema for direct messages
const DirectMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
});

// Conversation schema
const ConversationSchema = new mongoose.Schema({
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ],
  lastMessage: { type: String },
  lastMessageTime: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

const Conversation = mongoose.model("Conversation", ConversationSchema);
const DirectMessage = mongoose.model("DirectMessage", DirectMessageSchema);

// Get all conversations for a user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "name avatar")
      .sort({ lastMessageTime: -1 });

    // Transform the response
    const transformedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId,
      );

      return {
        _id: conv._id,
        participantName: otherParticipant?.name || "Unknown",
        participantAvatar: otherParticipant?.avatar || "",
        participantId: otherParticipant?._id,
        lastMessage: conv.lastMessage || "",
        lastMessageTime: conv.lastMessageTime,
        unreadCount: 0, // Can be implemented later
      };
    });

    res.json({ conversations: transformedConversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res
      .status(500)
      .json({ message: "Error fetching conversations", error: error.message });
  }
};

// Get messages from a conversation
exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify user is part of this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({ message: "Conversation not found" });
    }

    const messages = await DirectMessage.find({
      conversationId,
    }).sort({ timestamp: 1 });

    // Mark messages as read
    await DirectMessage.updateMany(
      { conversationId, senderId: { $ne: userId } },
      { isRead: true },
    );

    res.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res
      .status(500)
      .json({ message: "Error fetching messages", error: error.message });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    const userId = req.user.id;

    if (!text || !conversationId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Verify user is part of this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({ message: "Conversation not found" });
    }

    // Create the message
    const message = new DirectMessage({
      conversationId,
      senderId: userId,
      text,
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = text;
    conversation.lastMessageTime = new Date();
    await conversation.save();

    res.json({ message });
  } catch (error) {
    console.error("Error sending message:", error);
    res
      .status(500)
      .json({ message: "Error sending message", error: error.message });
  }
};

// Start a new conversation or get existing one
exports.startConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user.id;

    if (userId === recipientId) {
      return res.status(400).json({ message: "Cannot message yourself" });
    }

    // Check if conversation exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] },
    });

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [userId, recipientId],
      });
      await conversation.save();
    }

    res.json({ conversationId: conversation._id });
  } catch (error) {
    console.error("Error starting conversation:", error);
    res
      .status(500)
      .json({ message: "Error starting conversation", error: error.message });
  }
};

// Delete a conversation
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({ message: "Conversation not found" });
    }

    // Delete all messages in this conversation
    await DirectMessage.deleteMany({ conversationId });

    // Delete the conversation
    await Conversation.findByIdAndDelete(conversationId);

    res.json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res
      .status(500)
      .json({ message: "Error deleting conversation", error: error.message });
  }
};
