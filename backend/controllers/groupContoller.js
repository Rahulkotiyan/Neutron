const { Group, User, Message } = require("../models/Schema");

// Get all groups for a user's college
exports.getGroupsByCollege = async (req, res) => {
  try {
    const { college } = req.params;
    const groups = await Group.find({ college })
      .populate("members", "name avatar handle")
      .populate("owner", "name avatar")
      .sort({ createdAt: -1 });
    res.json(groups);
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
    const { name, description, type, college } = req.body;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newGroup = await Group.create({
      name,
      description,
      type: type || "COLLEGE",
      college: college || user.college,
      owner: user._id,
      members: [user._id],
    });

    const populatedGroup = await Group.findById(newGroup._id)
      .populate("members", "name avatar handle")
      .populate("owner", "name avatar");

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
    const limit = req.query.limit || 50;

    const messages = await Message.find({ group: id })
      .populate("user", "name avatar handle")
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
    const { text } = req.body;
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

    const message = await Message.create({
      group: id,
      user: user._id,
      text,
      timestamp: new Date(),
    });

    const populatedMessage = await Message.findById(message._id).populate(
      "user",
      "name avatar handle"
    );

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
    const { text } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.user.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Can only edit your own messages" });
    }

    message.text = text;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    const updatedMessage = await Message.findById(messageId).populate(
      "user",
      "name avatar handle"
    );

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

    if (message.user.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Can only delete your own messages" });
    }

    await Message.findByIdAndDelete(messageId);
    res.json({ message: "Message deleted" });
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).json({ message: "Error deleting message" });
  }
};
