const { Group, User, Message } = require("../models/Schema");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mp3|pdf|doc|docx|txt|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get all groups for a user's college
exports.getGroupsByCollege = async (req, res) => {
  try {
    const { college } = req.params;
    const user = await User.findOne({ email: req.user.email });
    
    const groups = await Group.find({ college })
      .populate("members", "name avatar handle")
      .populate("owner", "name avatar")
      .populate("admins", "name avatar")
      .populate("moderators", "name avatar")
      .sort({ createdAt: -1 });
    
    // Add user-specific data
    const groupsWithUserData = groups.map(group => ({
      ...group.toObject(),
      memberCount: group.members.length,
      onlineCount: Math.floor(group.members.length * 0.3), // Mock online count
      isOwner: group.owner._id.toString() === user._id.toString(),
      isAdmin: group.admins.some(admin => admin._id.toString() === user._id.toString()),
      isModerator: group.moderators.some(mod => mod._id.toString() === user._id.toString()),
      isMember: group.members.some(member => member._id.toString() === user._id.toString()),
    }));
    
    res.json(groupsWithUserData);
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ message: "Error fetching groups" });
  }
};

// Get all groups
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("members", "name avatar handle")
      .populate("owner", "name avatar")
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: "Error fetching groups" });
  }
};

// Get single group details
exports.getGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id)
      .populate("members", "name avatar handle email")
      .populate("owner", "name avatar");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: "Error fetching group" });
  }
};

// Create group
exports.createGroup = async (req, res) => {
  try {
    const { name, description, type, college, icon, banner } = req.body;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create default channels
    const defaultChannels = [
      { name: "general", type: "TEXT", position: 0, createdBy: user._id },
      { name: "announcements", type: "ANNOUNCEMENT", position: 1, createdBy: user._id },
      { name: "general", type: "VOICE", position: 2, createdBy: user._id }
    ];

    // Create default roles
    const defaultRoles = [
      { name: "Admin", color: "#F472B6", position: 100, permissions: ["ADMINISTRATOR"] },
      { name: "Moderator", color: "#60A5FA", position: 50, permissions: ["MANAGE_MESSAGES", "KICK_MEMBERS"] },
      { name: "Member", color: "#99AAB5", position: 0, permissions: [] }
    ];

    const newGroup = await Group.create({
      name,
      description,
      type: type || "COLLEGE",
      college: college || user.college,
      owner: user._id,
      admins: [user._id],
      members: [user._id],
      icon,
      banner,
      channels: defaultChannels,
      roles: defaultRoles,
      memberRoles: [{
        userId: user._id,
        roleIds: [defaultRoles[0]._id], // Give admin role to owner
        joinedAt: new Date()
      }],
      stats: {
        memberCount: 1,
        activeMembers: 1,
        lastActivity: new Date()
      }
    });

    const populatedGroup = await Group.findById(newGroup._id)
      .populate("members", "name avatar handle")
      .populate("owner", "name avatar")
      .populate("admins", "name avatar")
      .populate("moderators", "name avatar");

    res.status(201).json(populatedGroup);
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ message: "Error creating group" });
  }
};

// Join group
exports.joinGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.members.includes(user._id)) {
      return res.status(400).json({ message: "Already a member" });
    }

    group.members.push(user._id);
    await group.save();

    const updatedGroup = await Group.findById(id)
      .populate("members", "name avatar handle")
      .populate("owner", "name avatar");

    res.json(updatedGroup);
  } catch (err) {
    console.error("Error joining group:", err);
    res.status(500).json({ message: "Error joining group" });
  }
};

// Leave group
exports.leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(user._id)) {
      return res.status(400).json({ message: "Not a member" });
    }

    group.members.pull(user._id);
    await group.save();

    const updatedGroup = await Group.findById(id)
      .populate("members", "name avatar handle")
      .populate("owner", "name avatar");

    res.json(updatedGroup);
  } catch (err) {
    console.error("Error leaving group:", err);
    res.status(500).json({ message: "Error leaving group" });
  }
};

// Get group messages
exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { channelId, limit = 50, before, after } = req.query;
    const user = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(user._id)) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    let query = { group: id };
    if (channelId) {
      query.channel = channelId;
    }

    if (before) {
      query.timestamp = { $lt: new Date(before) };
    } else if (after) {
      query.timestamp = { $gt: new Date(after) };
    }

    const messages = await Message.find(query)
      .populate("user", "name avatar handle")
      .populate("mentions.users", "name avatar handle")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(messages.reverse());
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Error fetching messages" });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, channelId, type = "DEFAULT", embeds, attachments, mentions, reference } = req.body;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(user._id)) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    // Check channel permissions
    if (channelId) {
      const channel = group.channels.id(channelId);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
    }

    const message = await Message.create({
      group: id,
      channel: channelId || group.channels[0]._id,
      user: user._id,
      content,
      type,
      embeds: embeds || [],
      attachments: attachments || [],
      mentions: mentions || {
        users: [],
        roles: [],
        channels: [],
        everyone: false,
        repliedUser: false
      },
      reference: reference || null,
      timestamp: new Date(),
      stats: {
        viewCount: 0,
        clickCount: 0,
        reactionCount: 0
      }
    });

    // Update group stats
    group.stats.messageCount += 1;
    group.stats.lastActivity = new Date();
    await group.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("user", "name avatar handle")
      .populate("mentions.users", "name avatar handle");

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ message: "Error sending message" });
  }
};

// Edit message
exports.editMessage = async (req, res) => {
  try {
    const { id, messageId } = req.params;
    const { content, embeds, attachments } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check permissions (user can edit their own message, admins can edit any)
    const group = await Group.findById(id);
    const isAdmin = group.owner.toString() === user._id.toString() || 
                   group.admins.some(admin => admin.toString() === user._id.toString());

    if (message.user.toString() !== user._id.toString() && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Can only edit your own messages" });
    }

    if (content !== undefined) message.content = content;
    if (embeds !== undefined) message.embeds = embeds;
    if (attachments !== undefined) message.attachments = attachments;
    message.edited = true;
    message.editedTimestamp = new Date();
    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate("user", "name avatar handle")
      .populate("mentions.users", "name avatar handle");

    res.json(updatedMessage);
  } catch (err) {
    console.error("Error editing message:", err);
    res.status(500).json({ message: "Error editing message" });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { id, messageId } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check permissions (user can delete their own message, admins can delete any)
    const group = await Group.findById(id);
    const isAdmin = group.owner.toString() === user._id.toString() || 
                   group.admins.some(admin => admin.toString() === user._id.toString());

    if (message.user.toString() !== user._id.toString() && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Can only delete your own messages" });
    }

    // Soft delete
    message.deleted = true;
    message.deletedTimestamp = new Date();
    message.content = "[This message has been deleted]";
    await message.save();

    res.json({ message: "Message deleted" });
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).json({ message: "Error deleting message" });
  }
};

// Add reaction to message
exports.addReaction = async (req, res) => {
  try {
    const { id, messageId } = req.params;
    const { emoji } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const group = await Group.findById(id);
    if (!group.members.includes(user._id)) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    if (!message.reactions) message.reactions = [];
    
    const existingReaction = message.reactions.find(r => r.emoji === emoji);
    if (existingReaction) {
      if (!existingReaction.users.includes(user._id)) {
        existingReaction.users.push(user._id);
        existingReaction.count++;
      }
    } else {
      message.reactions.push({
        emoji,
        count: 1,
        users: [user._id],
        me: true
      });
    }

    await message.save();
    res.json(message.reactions);
  } catch (err) {
    console.error("Error adding reaction:", err);
    res.status(500).json({ message: "Error adding reaction" });
  }
};

// Remove reaction from message
exports.removeReaction = async (req, res) => {
  try {
    const { id, messageId } = req.params;
    const { emoji } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const reaction = message.reactions.find(r => r.emoji === emoji);
    if (reaction) {
      reaction.users = reaction.users.filter(userId => userId.toString() !== user._id.toString());
      reaction.count--;
      
      if (reaction.count === 0) {
        message.reactions = message.reactions.filter(r => r.emoji !== emoji);
      }
    }

    await message.save();
    res.json(message.reactions);
  } catch (err) {
    console.error("Error removing reaction:", err);
    res.status(500).json({ message: "Error removing reaction" });
  }
};

// Pin message
exports.pinMessage = async (req, res) => {
  try {
    const { id, messageId } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const group = await Group.findById(id);
    const isAdmin = group.owner.toString() === user._id.toString() || 
                   group.admins.some(admin => admin.toString() === user._id.toString());

    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can pin messages" });
    }

    message.pinned = true;
    message.pinnedAt = new Date();
    message.pinnedBy = user._id;
    await message.save();

    res.json(message);
  } catch (err) {
    console.error("Error pinning message:", err);
    res.status(500).json({ message: "Error pinning message" });
  }
};

// Create channel
exports.createChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, categoryId, description, position } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isAdmin = group.owner.toString() === user._id.toString() || 
                   group.admins.some(admin => admin.toString() === user._id.toString());

    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can create channels" });
    }

    const newChannel = {
      name,
      type: type || "TEXT",
      categoryId,
      description,
      position: position || group.channels.length,
      createdAt: new Date(),
      createdBy: user._id
    };

    group.channels.push(newChannel);
    await group.save();

    res.status(201).json(group.channels[group.channels.length - 1]);
  } catch (err) {
    console.error("Error creating channel:", err);
    res.status(500).json({ message: "Error creating channel" });
  }
};

// Create role
exports.createRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, position, permissions, mentionable, hoist } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isAdmin = group.owner.toString() === user._id.toString();
    if (!isAdmin) {
      return res.status(403).json({ message: "Only owner can create roles" });
    }

    const newRole = {
      name,
      color: color || "#99AAB5",
      position: position || 0,
      permissions: permissions || [],
      mentionable: mentionable || false,
      hoist: hoist || false,
      createdAt: new Date()
    };

    group.roles.push(newRole);
    await group.save();

    res.status(201).json(group.roles[group.roles.length - 1]);
  } catch (err) {
    console.error("Error creating role:", err);
    res.status(500).json({ message: "Error creating role" });
  }
};

// Upload file attachment
exports.uploadFile = upload.single('file');

exports.handleFileUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const attachment = {
      id: Date.now().toString(),
      filename: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
      contentType: req.file.mimetype
    };

    res.json(attachment);
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).json({ message: "Error uploading file" });
  }
};

// Get online users
exports.getOnlineUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id).populate("members", "name avatar handle");
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Mock online users (in real app, use WebSocket or presence system)
    const onlineUsers = group.members.slice(0, Math.floor(group.members.length * 0.3)).map(member => ({
      ...member.toObject(),
      status: 'online',
      game: 'Studying',
      customStatus: 'Available to help'
    }));

    res.json(onlineUsers);
  } catch (err) {
    console.error("Error getting online users:", err);
    res.status(500).json({ message: "Error getting online users" });
  }
};

// Boost server
exports.boostServer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(user._id)) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    // Mock boost logic (in real app, handle payment/subscription)
    group.settings.boostCount += 1;
    group.settings.boostLevel = Math.floor(group.settings.boostCount / 2);
    await group.save();

    res.json({ 
      message: "Server boosted successfully!",
      boostLevel: group.settings.boostLevel,
      boostCount: group.settings.boostCount
    });
  } catch (err) {
    console.error("Error boosting server:", err);
    res.status(500).json({ message: "Error boosting server" });
  }
};
