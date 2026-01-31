const { MarketplaceConversation, Listing, User, MarketplaceReview } = require("../models/Schema");

// Get all conversations for a user
exports.getUserConversations = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const conversations = await MarketplaceConversation.find({
      "participants.user": user._id
    })
    .populate("listing", "title price thumbnail images")
    .populate("participants.user", "name avatar")
    .populate("lastMessage.sender", "name avatar")
    .sort({ "lastMessage.createdAt": -1 });

    res.json(conversations);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ message: "Error fetching conversations" });
  }
};

// Get single conversation with messages
exports.getConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const conversation = await MarketplaceConversation.findById(id)
      .populate("listing", "title price thumbnail images seller")
      .populate("participants.user", "name avatar phoneNumber email")
      .populate("messages.sender", "name avatar");

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.user._id.toString() === user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized to view this conversation" });
    }

    // Mark messages as read
    conversation.messages.forEach(message => {
      if (message.sender._id.toString() !== user._id.toString() && !message.isRead) {
        message.isRead = true;
        message.readAt = new Date();
      }
    });

    await conversation.save();
    res.json(conversation);
  } catch (err) {
    console.error("Error fetching conversation:", err);
    res.status(500).json({ message: "Error fetching conversation" });
  }
};

// Start new conversation
exports.startConversation = async (req, res) => {
  try {
    const { listingId, message } = req.body;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Check if conversation already exists
    let conversation = await MarketplaceConversation.findOne({
      listing: listingId,
      "participants.user": { $all: [user._id, listing.seller._id] }
    });

    if (conversation) {
      // Add new message to existing conversation
      conversation.messages.push({
        sender: user._id,
        content: message,
        type: "TEXT",
        createdAt: new Date()
      });

      conversation.lastMessage = {
        sender: user._id,
        content: message,
        createdAt: new Date()
      };

      await conversation.save();
    } else {
      // Create new conversation
      conversation = await MarketplaceConversation.create({
        listing: listingId,
        participants: [
          { user: user._id, role: "BUYER" },
          { user: listing.seller._id, role: "SELLER" }
        ],
        messages: [{
          sender: user._id,
          content: message,
          type: "TEXT",
          createdAt: new Date()
        }],
        lastMessage: {
          sender: user._id,
          content: message,
          createdAt: new Date()
        }
      });
    }

    const populatedConversation = await MarketplaceConversation.findById(conversation._id)
      .populate("listing", "title price thumbnail")
      .populate("participants.user", "name avatar")
      .populate("messages.sender", "name avatar");

    res.status(201).json(populatedConversation);
  } catch (err) {
    console.error("Error starting conversation:", err);
    res.status(500).json({ message: "Error starting conversation" });
  }
};

// Send message in conversation
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, type = "TEXT", offerAmount } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const conversation = await MarketplaceConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.user.toString() === user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized to send messages in this conversation" });
    }

    const messageData = {
      sender: user._id,
      content,
      type,
      createdAt: new Date()
    };

    if (type === "OFFER" && offerAmount) {
      messageData.offerAmount = parseFloat(offerAmount);
    }

    // Handle file upload for image messages
    if (req.file && type === "IMAGE") {
      messageData.attachmentUrl = req.file.path;
    }

    conversation.messages.push(messageData);
    conversation.lastMessage = {
      sender: user._id,
      content,
      createdAt: new Date()
    };

    await conversation.save();

    const populatedMessage = {
      ...messageData,
      sender: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar
      }
    };

    res.json(populatedMessage);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ message: "Error sending message" });
  }
};

// Make offer
exports.makeOffer = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { offerAmount, message } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const conversation = await MarketplaceConversation.findById(conversationId)
      .populate("listing");

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Check if user is buyer
    const buyerParticipant = conversation.participants.find(
      p => p.user.toString() === user._id.toString() && p.role === "BUYER"
    );

    if (!buyerParticipant) {
      return res.status(403).json({ message: "Only buyers can make offers" });
    }

    const offerMessage = {
      sender: user._id,
      content: message || `Offer: $${offerAmount}`,
      type: "OFFER",
      offerAmount: parseFloat(offerAmount),
      createdAt: new Date()
    };

    conversation.messages.push(offerMessage);
    conversation.lastMessage = {
      sender: user._id,
      content: offerMessage.content,
      createdAt: new Date()
    };

    await conversation.save();

    res.json(offerMessage);
  } catch (err) {
    console.error("Error making offer:", err);
    res.status(500).json({ message: "Error making offer" });
  }
};

// Accept offer
exports.acceptOffer = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const conversation = await MarketplaceConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Check if user is seller
    const sellerParticipant = conversation.participants.find(
      p => p.user.toString() === user._id.toString() && p.role === "SELLER"
    );

    if (!sellerParticipant) {
      return res.status(403).json({ message: "Only sellers can accept offers" });
    }

    const offerMessage = conversation.messages.id(messageId);
    if (!offerMessage || offerMessage.type !== "OFFER") {
      return res.status(404).json({ message: "Offer not found" });
    }

    // Update conversation status
    conversation.dealStatus = "AGREED";
    conversation.finalPrice = offerMessage.offerAmount;

    // Add acceptance message
    conversation.messages.push({
      sender: user._id,
      content: `Offer accepted! Final price: $${offerMessage.offerAmount}`,
      type: "TEXT",
      createdAt: new Date()
    });

    await conversation.save();

    res.json({ 
      message: "Offer accepted successfully",
      finalPrice: offerMessage.offerAmount
    });
  } catch (err) {
    console.error("Error accepting offer:", err);
    res.status(500).json({ message: "Error accepting offer" });
  }
};

// Mark conversation as completed
exports.completeConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { rating, review, meetingLocation } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const conversation = await MarketplaceConversation.findById(conversationId)
      .populate("listing");

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.user.toString() === user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized" });
    }

    conversation.dealStatus = "COMPLETED";
    conversation.meetingLocation = meetingLocation;

    await conversation.save();

    // Create review if provided
    if (rating && review) {
      const otherParticipant = conversation.participants.find(
        p => p.user.toString() !== user._id.toString()
      );

      const userRole = conversation.participants.find(
        p => p.user.toString() === user._id.toString()
      ).role;

      await MarketplaceReview.create({
        listing: conversation.listing._id,
        reviewer: user._id,
        reviewee: otherParticipant.user,
        rating: parseInt(rating),
        title: `Review for ${userRole === "BUYER" ? "seller" : "buyer"}`,
        comment: review,
        transactionType: userRole
      });

      // Update seller's total sales and rating
      if (userRole === "BUYER") {
        const seller = await User.findById(otherParticipant.user);
        if (seller) {
          seller.totalSales = (seller.totalSales || 0) + 1;
          
          // Update average rating
          const reviews = await MarketplaceReview.find({
            reviewee: seller._id,
            transactionType: "SELLER"
          });
          
          if (reviews.length > 0) {
            const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            seller.rating = avgRating;
          }
          
          await seller.save();
        }
      }
    }

    res.json({ message: "Conversation completed successfully" });
  } catch (err) {
    console.error("Error completing conversation:", err);
    res.status(500).json({ message: "Error completing conversation" });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    const conversations = await MarketplaceConversation.find({
      "participants.user": user._id,
      "messages.isRead": false
    });

    let unreadCount = 0;
    conversations.forEach(conversation => {
      conversation.messages.forEach(message => {
        if (!message.isRead && message.sender.toString() !== user._id.toString()) {
          unreadCount++;
        }
      });
    });

    res.json({ unreadCount });
  } catch (err) {
    console.error("Error getting unread count:", err);
    res.status(500).json({ message: "Error getting unread count" });
  }
};

// Delete conversation
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const conversation = await MarketplaceConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.user.toString() === user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized to delete this conversation" });
    }

    await MarketplaceConversation.findByIdAndDelete(conversationId);
    res.json({ message: "Conversation deleted successfully" });
  } catch (err) {
    console.error("Error deleting conversation:", err);
    res.status(500).json({ message: "Error deleting conversation" });
  }
};
