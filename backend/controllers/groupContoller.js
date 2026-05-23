const { Group, User, Message, Notification } = require("../models/Schema");
const { getIO } = require("../socket/socketHandler");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// ─── Multer ────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|mp4|mp3|pdf|doc|docx|txt|zip/.test(
      path.extname(file.originalname).toLowerCase()
    );
    ok ? cb(null, true) : cb(new Error("Invalid file type"));
  },
});

// ─── E2EE Membership & Permissions Helpers ─────────────────────────────────
// members is now [{userId, roleId, encryptedGroupKey, joinedAt}]

/** Check if a userId is in the members array */
const isMember = (group, userId) =>
  (group.members || []).some((m) => m.userId.toString() === userId.toString());

/** Extract all userId ObjectIds from the members array */
const memberUserIds = (group) => group.members.map((m) => m.userId);

/** Get a member entry for a given userId */
const getMemberEntry = (group, userId) =>
  group.members.find((m) => m.userId.toString() === userId.toString());

/** Resolve a member's primary role (via members.roleId) */
const getMemberRole = (group, userId) => {
  const member = getMemberEntry(group, userId);
  if (!member || !member.roleId) return null;
  return group.roles.id(member.roleId) || null;
};

/**
 * Check if a user has a specific permission within the group.
 * Owner and admins are treated as having all permissions.
 */
const hasGroupPermission = (group, userId, permission) => {
  const uid = userId.toString();

  if (group.owner.toString() === uid) return true;
  if (group.admins.some((a) => a.toString() === uid)) return true;

  const role = getMemberRole(group, userId);
  if (!role || !Array.isArray(role.permissions)) return false;

  if (role.permissions.includes("*")) return true;
  return role.permissions.includes(permission);
};

// ─── getGroupsByCollege ────────────────────────────────────────────────────
exports.getGroupsByCollege = async (req, res) => {
  try {
    const { college } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const groups = await Group.find({ college })
      .populate("members.userId", "name avatar handle")
      .populate("owner", "name avatar")
      .populate("admins", "name avatar")
      .sort({ createdAt: -1 });

    const groupsWithUserData = groups.map((group) => {
      const g = group.toObject();
      return {
        ...g,
        memberCount: g.members.length,
        isOwner: g.owner._id.toString() === user._id.toString(),
        isAdmin: g.admins.some((a) => a._id.toString() === user._id.toString()),
        isMember: isMember(group, user._id),
      };
    });

    res.status(200).json({
      success: true,
      data: groupsWithUserData,
      message: "Groups fetched successfully"
    });
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching groups",
      error: err.message
    });
  }
};

// ─── getGroups ────────────────────────────────────────────────────────────
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("members.userId", "name avatar handle")
      .populate("owner", "name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: groups,
      message: "Groups fetched successfully"
    });
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching groups",
      error: err.message
    });
  }
};

// ─── getGroup ─────────────────────────────────────────────────────────────
exports.getGroup = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    const group = await Group.findById(req.params.id)
      .populate("members.userId", "name avatar handle email")
      .populate("owner", "name avatar");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    res.status(200).json({
      success: true,
      data: group,
      message: "Group fetched successfully"
    });
  } catch (err) {
    console.error("Error fetching group:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching group",
      error: err.message
    });
  }
};

// ─── getChannelMessages ───────────────────────────────────────────────────
exports.getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid channel ID"
      });
    }

    const { limit = 100, pinned, withAttachments } = req.query;

    const query = { channel: channelId, deleted: { $ne: true } };
    if (pinned === "true") query.pinned = true;
    if (withAttachments === "true") query["attachments.0"] = { $exists: true };

    const messages = await Message.find(query)
      .populate("user", "name avatar handle")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: messages.reverse(),
      message: "Messages fetched successfully"
    });
  } catch (err) {
    console.error("Error getting channel messages:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching messages",
      error: err.message
    });
  }
};

// ─── sendChannelMessage ───────────────────────────────────────────────────
exports.sendChannelMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, type = "DEFAULT", mentions = [], attachments = [] } = req.body;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid channel ID"
      });
    }

    if (!content && !req.body.text) {
      return res.status(400).json({
        success: false,
        message: "Message content is required"
      });
    }

    const user = await User.findOne({ email: req.user.email });

    const group = await Group.findOne({ "channels._id": channelId });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Channel not found"
      });
    }

    if (!isMember(group, user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this group"
      });
    }

    // Granular permission: can this member send messages here?
    if (!hasGroupPermission(group, user._id, "SEND_MESSAGES")) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to send messages"
      });
    }

    const message = await Message.create({
      group: group._id,
      channel: channelId,
      user: user._id,
      content: content || req.body.text,
      type,
      mentions,
      attachments,
      timestamp: new Date(),
    });

    const populated = await Message.findById(message._id).populate("user", "name avatar handle");

    group.stats.lastActivity = new Date();
    await group.save();

    try {
      const io = getIO();
      io.to(`channel_${channelId}`).emit("new_message", populated);
    } catch { }

    res.status(201).json({
      success: true,
      data: populated,
      message: "Message sent successfully"
    });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({
      success: false,
      message: "Error sending message",
      error: err.message
    });
  }
};

// ─── createGroup ──────────────────────────────────────────────────────────
exports.createGroup = async (req, res) => {
  try {
    const { name, description, type, college, icon, banner, joinPolicy, messagePermission } = req.body;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      console.warn("User not found during group creation", {
        operation: "createGroup",
        userEmail: req.user?.email,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    if (!name || !name.trim()) {
      console.warn("Group name validation failed", {
        operation: "createGroup",
        userEmail: req.user?.email,
        userId: user._id,
        providedName: name,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        message: "Group name is required",
        code: "INVALID_GROUP_NAME"
      });
    }

    // Create default channels with messagePermission for general channel
    const defaultChannels = [
      { 
        name: "general", 
        type: "TEXT", 
        position: 0, 
        messagePermissions: messagePermission || "everyone",
        createdBy: user._id 
      },
      { 
        name: "announcements", 
        type: "ANNOUNCEMENT", 
        position: 1, 
        messagePermissions: "admin",
        createdBy: user._id 
      }
    ];

    const defaultRoles = [
      {
        name: "Owner",
        color: "#F472B6",
        position: 100,
        permissions: ["*"],
      },
      {
        name: "Admin",
        color: "#8B5CF6",
        position: 50,
        permissions: [
          "MANAGE_CHANNELS",
          "KICK_MEMBERS",
          "BAN_MEMBERS",
          "ADD_MEMBERS",
          "DELETE_MESSAGES",
          "PIN_MESSAGES",
          "SEND_MESSAGES",
        ],
      },
      {
        name: "Moderator",
        color: "#3B82F6",
        position: 25,
        permissions: [
          "MANAGE_MESSAGES",
          "MUTE_MEMBERS",
          "DELETE_MESSAGES",
          "PIN_MESSAGES",
          "SEND_MESSAGES",
        ],
      },
      {
        name: "Member",
        color: "#10B981",
        position: 0,
        permissions: ["SEND_MESSAGES", "READ_MESSAGES"],
      },
    ];

    // Creator is the first member — encryptedGroupKey will be set separately
    // via POST /api/groups/:id/members (key distribution step)
    const newGroup = await Group.create({
      name,
      description,
      type: type || "CLUB",
      college: college || user.college,
      owner: user._id,
      admins: [user._id],
      members: [{ userId: user._id, joinedAt: new Date() }],
      icon,
      banner,
      joinPolicy: joinPolicy || "PUBLIC",
      channels: defaultChannels,
      roles: defaultRoles,
      isEncrypted: true,
      stats: { memberCount: 1, activeMembers: 1, lastActivity: new Date() },
    });

    console.info("Group created successfully", {
      operation: "createGroup",
      userEmail: req.user?.email,
      userId: user._id,
      groupId: newGroup._id,
      groupName: name,
      timestamp: new Date().toISOString()
    });

    const populated = await Group.findById(newGroup._id)
      .populate("members.userId", "name avatar handle")
      .populate("owner", "name avatar")
      .populate("admins", "name avatar");

    res.status(201).json({
      success: true,
      data: populated,
      message: "Group created successfully"
    });
  } catch (err) {
    console.error("Error in createGroup operation", {
      operation: "createGroup",
      userEmail: req.user?.email,
      userId: req.user?.email ? "pending lookup" : "unknown",
      groupName: req.body?.name,
      errorMessage: err.message,
      errorCode: err.code,
      errorName: err.name,
      stack: err.stack,
      requestBody: {
        name: req.body?.name,
        type: req.body?.type,
        college: req.body?.college
      },
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: "Failed to create group. Please try again.",
      error: err.message,
      code: "GROUP_CREATION_ERROR"
    });
  }
};

// ─── deleteGroup ───────────────────────────────────────────────────────────
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    // Only group owner can delete group
    if (group.owner.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only group owner can delete this group"
      });
    }

    // Delete all messages associated with this group
    await Message.deleteMany({ group: id });

    // Delete the group
    await Group.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Group deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting group:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting group",
      error: err.message
    });
  }
};

// ─── addMember (E2EE key distribution) ───────────────────────────────────
/**
 * POST /api/groups/:id/members
 * Body: { userId, encryptedGroupKey }
 * The caller (group admin/owner) has already encrypted the AES group key
 * with the target user's RSA public key before calling this endpoint.
 */
exports.addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, encryptedGroupKey } = req.body;
    const caller = await User.findOne({ email: req.user.email });

    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn("Invalid group ID in addMember", {
        operation: "addMember",
        userEmail: req.user?.email,
        groupId: id,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
        code: "INVALID_GROUP_ID"
      });
    }

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.warn("Invalid user ID in addMember", {
        operation: "addMember",
        userEmail: req.user?.email,
        callerId: caller?._id,
        groupId: id,
        providedUserId: userId,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
        code: "INVALID_USER_ID"
      });
    }

    // Get the group
    const group = await Group.findById(id);
    if (!group) {
      console.warn("Group not found in addMember", {
        operation: "addMember",
        userEmail: req.user?.email,
        callerId: caller?._id,
        groupId: id,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: "Group not found",
        code: "GROUP_NOT_FOUND"
      });
    }

    // Only owner or admins can add members
    const isAdminCaller =
      group.owner.toString() === caller._id.toString() ||
      group.admins.some((a) => a.toString() === caller._id.toString());

    // OR: the user is adding themselves via the join flow
    const isSelf = userId.toString() === caller._id.toString();

    if (!isAdminCaller && !isSelf) {
      console.warn("Insufficient permissions in addMember", {
        operation: "addMember",
        userEmail: req.user?.email,
        callerId: caller?._id,
        groupId: id,
        targetUserId: userId,
        isAdminCaller,
        isSelf,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
        code: "INSUFFICIENT_PERMISSIONS"
      });
    }

    // Check if user is already a member
    if (isMember(group, userId)) {
      console.warn("User already a member in addMember", {
        operation: "addMember",
        userEmail: req.user?.email,
        callerId: caller?._id,
        groupId: id,
        targetUserId: userId,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        message: "User is already a member",
        code: "ALREADY_MEMBER"
      });
    }

    // Verify target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      console.warn("Target user not found in addMember", {
        operation: "addMember",
        userEmail: req.user?.email,
        callerId: caller?._id,
        groupId: id,
        targetUserId: userId,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: "Target user not found",
        code: "USER_NOT_FOUND"
      });
    }

    // Add member to group
    group.members.push({ userId, encryptedGroupKey: encryptedGroupKey || null, joinedAt: new Date() });
    group.stats.memberCount = group.members.length;
    await group.save();

    console.info("Member added successfully", {
      operation: "addMember",
      userEmail: req.user?.email,
      callerId: caller._id,
      groupId: id,
      targetUserId: userId,
      hasEncryptedKey: !!encryptedGroupKey,
      timestamp: new Date().toISOString()
    });

    // Notify group
    try {
      const io = getIO();
      io.to(`group_${id}`).emit("group_updated", { groupId: id });
    } catch (socketErr) {
      console.warn("Socket notification failed in addMember", {
        operation: "addMember",
        groupId: id,
        error: socketErr.message
      });
    }

    res.status(201).json({
      success: true,
      data: { userId },
      message: "Member added successfully"
    });
  } catch (err) {
    console.error("Error in addMember operation", {
      operation: "addMember",
      userEmail: req.user?.email,
      callerId: "pending lookup",
      groupId: req.params?.id,
      targetUserId: req.body?.userId,
      errorMessage: err.message,
      errorCode: err.code,
      errorName: err.name,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: "Failed to add member to group. Please try again.",
      error: err.message,
      code: "ADD_MEMBER_ERROR"
    });
  }
};

// ─── updateMemberKey ──────────────────────────────────────────────────────
/**
 * PATCH /api/groups/:id/members/:userId/key
 * Body: { encryptedGroupKey }
 * Sets / updates the encryptedGroupKey for an existing member.
 * Used after key re-generation or when distributing a key post-join.
 */
exports.updateMemberKey = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { encryptedGroupKey } = req.body;
    const caller = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isAdminCaller =
      group.owner.toString() === caller._id.toString() ||
      group.admins.some((a) => a.toString() === caller._id.toString());
    const isSelf = userId === caller._id.toString();

    if (!isAdminCaller && !isSelf)
      return res.status(403).json({ message: "Insufficient permissions" });

    const memberEntry = group.members.find((m) => m.userId.toString() === userId);
    if (!memberEntry) return res.status(404).json({ message: "Member not found in group" });

    memberEntry.encryptedGroupKey = encryptedGroupKey;
    await group.save();

    res.json({ message: "Key updated" });
  } catch (err) {
    res.status(500).json({ message: "Error updating member key" });
  }
};

// ─── assignMemberRole ─────────────────────────────────────────────────────
/**
 * PATCH /api/groups/:id/members/:userId/role
 * Body: { roleId }
 * Assigns a role to a member in the group.
 * Only group owner or admins can assign roles.
 */
exports.assignMemberRole = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { roleId } = req.body;
    const caller = await User.findOne({ email: req.user.email });

    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn("Invalid group ID in assignMemberRole", {
        operation: "assignMemberRole",
        userEmail: req.user?.email,
        groupId: id,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
        code: "INVALID_GROUP_ID"
      });
    }

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.warn("Invalid user ID in assignMemberRole", {
        operation: "assignMemberRole",
        userEmail: req.user?.email,
        callerId: caller?._id,
        groupId: id,
        providedUserId: userId,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
        code: "INVALID_USER_ID"
      });
    }

    // Validate roleId if provided
    if (roleId && !mongoose.Types.ObjectId.isValid(roleId)) {
      console.warn("Invalid role ID in assignMemberRole", {
        operation: "assignMemberRole",
        userEmail: req.user?.email,
        callerId: caller?._id,
        groupId: id,
        targetUserId: userId,
        providedRoleId: roleId,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        message: "Invalid role ID",
        code: "INVALID_ROLE_ID"
      });
    }

    // Get the group
    const group = await Group.findById(id);
    if (!group) {
      console.warn("Group not found in assignMemberRole", {
        operation: "assignMemberRole",
        userEmail: req.user?.email,
        callerId: caller?._id,
        groupId: id,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: "Group not found",
        code: "GROUP_NOT_FOUND"
      });
    }

    // Check if caller is owner or admin
    const isAdminCaller =
      group.owner.toString() === caller._id.toString() ||
      group.admins.some((a) => a.toString() === caller._id.toString());

    if (!isAdminCaller) {
      console.warn("Insufficient permissions in assignMemberRole", {
        operation: "assignMemberRole",
        userEmail: req.user?.email,
        callerId: caller._id,
        groupId: id,
        targetUserId: userId,
        isOwner: group.owner.toString() === caller._id.toString(),
        isAdmin: group.admins.some((a) => a.toString() === caller._id.toString()),
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({
        success: false,
        message: "Only group owner or admins can assign roles",
        code: "INSUFFICIENT_PERMISSIONS"
      });
    }

    // Check if user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      console.warn("Target user not found in assignMemberRole", {
        operation: "assignMemberRole",
        userEmail: req.user?.email,
        callerId: caller._id,
        groupId: id,
        targetUserId: userId,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    // Check if user is a member
    const memberEntry = getMemberEntry(group, userId);
    if (!memberEntry) {
      console.warn("User is not a member in assignMemberRole", {
        operation: "assignMemberRole",
        userEmail: req.user?.email,
        callerId: caller._id,
        groupId: id,
        targetUserId: userId,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        message: "User is not a member of this group",
        code: "NOT_A_MEMBER"
      });
    }

    // If roleId is provided, validate that the role exists in the group
    if (roleId) {
      const roleExists = group.roles.some((r) => r._id.toString() === roleId);
      if (!roleExists) {
        console.warn("Role not found in assignMemberRole", {
          operation: "assignMemberRole",
          userEmail: req.user?.email,
          callerId: caller._id,
          groupId: id,
          targetUserId: userId,
          providedRoleId: roleId,
          availableRoles: group.roles.map(r => ({ id: r._id, name: r.name })),
          timestamp: new Date().toISOString()
        });
        return res.status(404).json({
          success: false,
          message: "Role not found in this group",
          code: "ROLE_NOT_FOUND"
        });
      }
    }

    // Update the member's roleId
    const previousRoleId = memberEntry.roleId;
    memberEntry.roleId = roleId || null;
    await group.save();

    console.info("Member role updated successfully", {
      operation: "assignMemberRole",
      userEmail: req.user?.email,
      callerId: caller._id,
      groupId: id,
      targetUserId: userId,
      previousRoleId,
      newRoleId: roleId,
      timestamp: new Date().toISOString()
    });

    // Emit event
    try {
      const io = getIO();
      io.to(`group_${id}`).emit("member_role_updated", { userId, roleId });
    } catch (socketErr) {
      console.warn("Socket notification failed in assignMemberRole", {
        operation: "assignMemberRole",
        groupId: id,
        error: socketErr.message
      });
    }

    // Return updated member data
    res.status(200).json({
      success: true,
      data: {
        userId: memberEntry.userId,
        roleId: memberEntry.roleId,
        joinedAt: memberEntry.joinedAt
      },
      message: "Member role updated successfully"
    });
  } catch (err) {
    console.error("Error in assignMemberRole operation", {
      operation: "assignMemberRole",
      userEmail: req.user?.email,
      callerId: "pending lookup",
      groupId: req.params?.id,
      targetUserId: req.params?.userId,
      roleId: req.body?.roleId,
      errorMessage: err.message,
      errorCode: err.code,
      errorName: err.name,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: "Failed to assign role to member. Please try again.",
      error: err.message,
      code: "ASSIGN_ROLE_ERROR"
    });
  }
};

// ─── joinGroup ────────────────────────────────────────────────────────────
exports.joinGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    if (isMember(group, user._id)) {
      return res.status(400).json({
        success: false,
        message: "Already a member"
      });
    }

    // Banned users cannot join at all
    if ((group.bannedUsers || []).some((u) => u.toString() === user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: "You are banned from this group"
      });
    }

    // Handle join policy
    if (group.joinPolicy === "INVITE_ONLY") {
      return res.status(403).json({
        success: false,
        message: "This group is invite-only. Ask an admin for an invite link."
      });
    }

    if (group.joinPolicy === "APPROVAL_REQUIRED") {
      const existingRequests = group.joinRequests || [];
      const alreadyRequested = existingRequests.some(
        (r) => r.userId.toString() === user._id.toString()
      );
      if (!alreadyRequested) {
        group.joinRequests = existingRequests;
        group.joinRequests.push({ userId: user._id });
        await group.save();

        // Notify owner and admins about the join request
        const recipients = [
          group.owner,
          ...(group.admins || []),
        ].map((id) => id.toString());
        const uniqueRecipients = [...new Set(recipients)].filter(
          (id) => id !== user._id.toString()
        );

        const title = `Join request for ${group.name}`;
        const message = `${user.name || "A student"} wants to join "${group.name}".`;

        await Promise.all(
          uniqueRecipients.map((recipientId) =>
            Notification.create({
              recipient: recipientId,
              sender: user._id,
              type: "GROUP_INVITE",
              title,
              message,
              relatedEntity: {
                entityType: "GROUP",
                entityId: group._id,
              },
            })
          )
        );
      }
      return res.status(202).json({
        success: true,
        message: "Join request sent. An admin must approve your request."
      });
    }

    // PUBLIC: add member without a key; the admin will distribute the key separately
    group.members.push({ userId: user._id, joinedAt: new Date() });
    group.stats.memberCount = group.members.length;
    await group.save();

    const updated = await Group.findById(id)
      .populate("members.userId", "name avatar handle")
      .populate("owner", "name avatar");

    res.status(200).json({
      success: true,
      data: updated,
      message: "Joined group successfully"
    });
  } catch (err) {
    console.error("Error joining group:", err);
    res.status(500).json({
      success: false,
      message: "Error joining group",
      error: err.message
    });
  }
};

// ─── leaveGroup ───────────────────────────────────────────────────────────
exports.leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    if (!isMember(group, user._id)) {
      return res.status(400).json({
        success: false,
        message: "Not a member"
      });
    }

    group.members = group.members.filter((m) => m.userId.toString() !== user._id.toString());
    group.admins = group.admins.filter((a) => a.toString() !== user._id.toString());
    group.moderators = group.moderators.filter((m) => m.toString() !== user._id.toString());
    group.stats.memberCount = group.members.length;
    await group.save();

    res.status(200).json({
      success: true,
      message: "Left group successfully"
    });
  } catch (err) {
    console.error("Error leaving group:", err);
    res.status(500).json({
      success: false,
      message: "Error leaving group",
      error: err.message
    });
  }
};

// ─── getMembers ───────────────────────────────────────────────────────────
exports.getMembers = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    const group = await Group.findById(req.params.id).populate(
      "members.userId",
      "name avatar handle email"
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    // Return the full members array (includes encryptedGroupKey per member)
    const members = group.members.map((m) => ({
      ...m.toObject(),
      user: m.userId, // convenience alias
    }));

    res.status(200).json({
      success: true,
      data: { members, totalMembers: members.length },
      message: "Members fetched successfully"
    });
  } catch (err) {
    console.error("Error getting members:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching members",
      error: err.message
    });
  }
};

// ─── getMessages (by group) ───────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { channelId, limit = 50, before, after } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    if (channelId && !mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid channel ID"
      });
    }

    const user = await User.findOne({ email: req.user.email });
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    if (!isMember(group, user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this group"
      });
    }

    let query = { group: id };
    if (channelId) query.channel = channelId;
    if (before) query.createdAt = { $lt: new Date(before) };
    else if (after) query.createdAt = { $gt: new Date(after) };

    const messages = await Message.find(query)
      .populate("user", "name avatar handle")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: messages.reverse(),
      message: "Messages fetched successfully"
    });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching messages",
      error: err.message
    });
  }
};

// ─── sendMessage (by group id) ────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, channelId, type = "DEFAULT", embeds, attachments, mentions, reference } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    if (channelId && !mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid channel ID"
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Message content is required"
      });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    if (!isMember(group, user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this group"
      });
    }

    if (!hasGroupPermission(group, user._id, "SEND_MESSAGES")) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to send messages"
      });
    }

    const message = await Message.create({
      group: id,
      channel: channelId || group.channels[0]._id,
      user: user._id,
      content,
      type,
      embeds: embeds || [],
      attachments: attachments || [],
      mentions: mentions || { users: [], roles: [], channels: [], everyone: false, repliedUser: false },
      reference: reference || null,
      timestamp: new Date(),
    });

    group.stats.messageCount += 1;
    group.stats.lastActivity = new Date();
    await group.save();

    const populated = await Message.findById(message._id).populate("user", "name avatar handle");
    res.status(201).json({
      success: true,
      data: populated,
      message: "Message sent successfully"
    });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({
      success: false,
      message: "Error sending message",
      error: err.message
    });
  }
};

// ─── editMessage ──────────────────────────────────────────────────────────
exports.editMessage = async (req, res) => {
  try {
    const { channelId, messageId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid channel ID"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID"
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required"
      });
    }

    const user = await User.findOne({ email: req.user.email });

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    const group = await Group.findOne({ "channels._id": channelId });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    const isAdmin =
      group.owner.toString() === user._id.toString() ||
      group.admins.some((a) => a.toString() === user._id.toString());

    if (message.user.toString() !== user._id.toString() && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Can only edit your own messages"
      });
    }

    if (content !== undefined) message.content = content;
    message.edited = true;
    message.editedTimestamp = new Date();
    await message.save();

    const updated = await Message.findById(messageId).populate("user", "name avatar handle");
    res.status(200).json({
      success: true,
      data: updated,
      message: "Message edited successfully"
    });
  } catch (err) {
    console.error("Error editing message:", err);
    res.status(500).json({
      success: false,
      message: "Error editing message",
      error: err.message
    });
  }
};

// ─── deleteMessage ────────────────────────────────────────────────────────
exports.deleteMessage = async (req, res) => {
  try {
    const { channelId, messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid channel ID"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID"
      });
    }

    const user = await User.findOne({ email: req.user.email });

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    const group = await Group.findOne({ "channels._id": channelId });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    const isOwner = message.user.toString() === user._id.toString();
    const canModerate = hasGroupPermission(group, user._id, "DELETE_MESSAGES");

    if (!isOwner && !canModerate) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this message"
      });
    }

    // Soft delete: clear content and mark as deleted
    await Message.findByIdAndUpdate(messageId, {
      content: "",
      ciphertext: null,
      iv: null,
      attachments: [],
      poll: null,
      embeds: [],
      deleted: true,
      deletedTimestamp: new Date(),
    });

    try {
      const io = getIO();
      io.to(`channel_${channelId}`).emit("message_deleted", { messageId, channelId });
    } catch (err) {
      console.error("Socket emit error in deleteMessage:", err);
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting message",
      error: err.message
    });
  }
};

// ─── addReaction ──────────────────────────────────────────────────────────
exports.addReaction = async (req, res) => {
  try {
    const { channelId, messageId } = req.params;
    const { emoji } = req.body;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid channel ID"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID"
      });
    }

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: "Emoji is required"
      });
    }

    const user = await User.findOne({ email: req.user.email });

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    const group = await Group.findOne({ "channels._id": channelId });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    if (!isMember(group, user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not a member"
      });
    }

    if (!message.reactions) message.reactions = [];
    const existing = message.reactions.find((r) => r.emoji === emoji);
    if (existing) {
      if (!existing.users.includes(user._id)) {
        existing.users.push(user._id);
        existing.count++;
      }
    } else {
      message.reactions.push({ emoji, count: 1, users: [user._id] });
    }

    await message.save();
    res.status(200).json({
      success: true,
      data: message.reactions,
      message: "Reaction added successfully"
    });
  } catch (err) {
    console.error("Error adding reaction:", err);
    res.status(500).json({
      success: false,
      message: "Error adding reaction",
      error: err.message
    });
  }
};

// ─── removeReaction ───────────────────────────────────────────────────────
exports.removeReaction = async (req, res) => {
  try {
    const { channelId, messageId } = req.params;
    const { emoji } = req.body;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid channel ID"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID"
      });
    }

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: "Emoji is required"
      });
    }

    const user = await User.findOne({ email: req.user.email });

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    const reaction = message.reactions?.find((r) => r.emoji === emoji);
    if (reaction) {
      reaction.users = reaction.users.filter((uid) => uid.toString() !== user._id.toString());
      reaction.count--;
      if (reaction.count <= 0)
        message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
    }

    await message.save();
    res.status(200).json({
      success: true,
      data: message.reactions,
      message: "Reaction removed successfully"
    });
  } catch (err) {
    console.error("Error removing reaction:", err);
    res.status(500).json({
      success: false,
      message: "Error removing reaction",
      error: err.message
    });
  }
};

// ─── pinMessage ───────────────────────────────────────────────────────────
exports.pinMessage = async (req, res) => {
  try {
    const { channelId, messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid channel ID"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID"
      });
    }

    const user = await User.findOne({ email: req.user.email });

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    const group = await Group.findOne({ "channels._id": channelId });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    if (!hasGroupPermission(group, user._id, "PIN_MESSAGES")) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to pin messages"
      });
    }

    // Toggle pin
    message.pinned = !message.pinned;
    message.pinnedAt = message.pinned ? new Date() : undefined;
    message.pinnedBy = message.pinned ? user._id : undefined;
    await message.save();

    res.status(200).json({
      success: true,
      data: message,
      message: message.pinned ? "Message pinned successfully" : "Message unpinned successfully"
    });
  } catch (err) {
    console.error("Error pinning message:", err);
    res.status(500).json({
      success: false,
      message: "Error pinning message",
      error: err.message
    });
  }
};

/**
 * POST /api/groups/channel/:channelId/polls
 * Body: { question, options: [string], multiple, closesAt }
 */
exports.createPoll = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { question, options, multiple = false, closesAt } = req.body;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid channel ID"
      });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Poll requires a question and at least two options"
      });
    }

    const group = await Group.findOne({ "channels._id": channelId });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Channel not found"
      });
    }

    if (!isMember(group, user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this group"
      });
    }

    if (!hasGroupPermission(group, user._id, "SEND_MESSAGES")) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to create polls"
      });
    }

    const pollOptions = options.map((label, idx) => ({
      id: `${Date.now()}_${idx}`,
      label,
      votes: [],
    }));

    const message = await Message.create({
      group: group._id,
      channel: channelId,
      user: user._id,
      type: "POLL",
      content: "",
      poll: {
        question,
        multiple: !!multiple,
        closesAt: closesAt ? new Date(closesAt) : null,
        options: pollOptions,
      },
      timestamp: new Date(),
    });

    const populated = await Message.findById(message._id).populate("user", "name avatar handle");

    try {
      const io = getIO();
      io.to(`channel_${channelId}`).emit("new_message", populated);
    } catch { }

    res.status(201).json({
      success: true,
      data: populated,
      message: "Poll created successfully"
    });
  } catch (err) {
    console.error("createPoll error:", err);
    res.status(500).json({
      success: false,
      message: "Error creating poll",
      error: err.message
    });
  }
};

/**
 * POST /api/groups/channel/:channelId/messages/:messageId/vote
 * Body: { optionId }
 */
exports.votePoll = async (req, res) => {
  try {
    const { channelId, messageId } = req.params;
    const { optionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid channel ID"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID"
      });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!optionId) {
      return res.status(400).json({
        success: false,
        message: "optionId is required"
      });
    }

    const group = await Group.findOne({ "channels._id": channelId });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Channel not found"
      });
    }

    if (!isMember(group, user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this group"
      });
    }

    const message = await Message.findById(messageId);
    if (!message || message.channel.toString() !== channelId.toString()) {
      return res.status(404).json({
        success: false,
        message: "Poll not found"
      });
    }

    if (message.type !== "POLL" || !message.poll) {
      return res.status(400).json({
        success: false,
        message: "Message is not a poll"
      });
    }

    if (message.poll.closesAt && message.poll.closesAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Poll is closed"
      });
    }

    const poll = message.poll;
    const userIdStr = user._id.toString();

    // If single-choice, remove user from all options first
    if (!poll.multiple) {
      poll.options.forEach((opt) => {
        opt.votes = opt.votes.filter((v) => v.toString() !== userIdStr);
      });
    }

    const target = poll.options.find((opt) => opt.id === optionId);
    if (!target) {
      return res.status(404).json({
        success: false,
        message: "Option not found"
      });
    }

    const alreadyVoted = target.votes.some((v) => v.toString() === userIdStr);
    if (alreadyVoted) {
      // Unvote
      target.votes = target.votes.filter((v) => v.toString() !== userIdStr);
    } else {
      target.votes.push(user._id);
    }

    await message.save();

    const updated = await Message.findById(messageId).populate("user", "name avatar handle");

    try {
      const io = getIO();
      io.to(`channel_${channelId}`).emit("poll_updated", {
        messageId,
        poll: updated.poll,
      });
    } catch { }

    res.status(200).json({
      success: true,
      data: updated.poll,
      message: "Vote recorded successfully"
    });
  } catch (err) {
    console.error("votePoll error:", err);
    res.status(500).json({
      success: false,
      message: "Error voting on poll",
      error: err.message
    });
  }
};

// ─── createChannel ────────────────────────────────────────────────────────
exports.createChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, description, position, messagePermissions } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isAdmin =
      group.owner.toString() === user._id.toString() ||
      group.admins.some((a) => a.toString() === user._id.toString());
    if (!isAdmin) return res.status(403).json({ message: "Only admins can create channels" });

    const newChannel = {
      name,
      type: type || "TEXT",
      description,
      position: position || group.channels.length,
      messagePermissions: messagePermissions || "everyone",
      createdAt: new Date(),
      createdBy: user._id,
    };
    group.channels.push(newChannel);
    await group.save();

    const ch = group.channels[group.channels.length - 1];
    try { getIO().to(`group_${id}`).emit("channel_created", ch); } catch { }

    res.status(201).json(ch);
  } catch (err) {
    console.error("Error creating channel:", err);
    res.status(500).json({ message: "Error creating channel" });
  }
};

// ─── getChannels ──────────────────────────────────────────────────────────
exports.getChannels = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group.channels);
  } catch (err) {
    res.status(500).json({ message: "Error fetching channels" });
  }
};

// ─── updateChannel ────────────────────────────────────────────────────────
exports.updateChannel = async (req, res) => {
  try {
    const { id, channelId } = req.params;
    const { name, type, description, position, messagePermissions } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isAdmin =
      group.owner.toString() === user._id.toString() ||
      group.admins.some((a) => a.toString() === user._id.toString());
    if (!isAdmin) return res.status(403).json({ message: "Only admins can update channels" });

    const channel = group.channels.id(channelId);
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    if (name !== undefined) channel.name = name;
    if (type !== undefined) channel.type = type;
    if (description !== undefined) channel.description = description;
    if (position !== undefined) channel.position = position;
    if (messagePermissions !== undefined) channel.messagePermissions = messagePermissions;

    await group.save();
    res.json(channel);
  } catch (err) {
    console.error("Error updating channel:", err);
    res.status(500).json({ message: "Error updating channel" });
  }
};

// ─── deleteChannel ────────────────────────────────────────────────────────
exports.deleteChannel = async (req, res) => {
  try {
    const { id, channelId } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isAdmin =
      group.owner.toString() === user._id.toString() ||
      group.admins.some((a) => a.toString() === user._id.toString());
    if (!isAdmin) return res.status(403).json({ message: "Only admins can delete channels" });

    const idx = group.channels.findIndex((c) => c._id.toString() === channelId);
    if (idx === -1) return res.status(404).json({ message: "Channel not found" });

    group.channels.splice(idx, 1);
    await group.save();
    res.json({ message: "Channel deleted" });
  } catch (err) {
    console.error("Error deleting channel:", err);
    res.status(500).json({ message: "Error deleting channel" });
  }
};

// ─── createRole ───────────────────────────────────────────────────────────
exports.createRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, position, permissions, mentionable, hoist } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.owner.toString() !== user._id.toString())
      return res.status(403).json({ message: "Only owner can create roles" });

    const newRole = {
      name, color: color || "#99AAB5", position: position || 0,
      permissions: permissions || [], mentionable: mentionable || false, hoist: hoist || false
    };
    group.roles.push(newRole);
    await group.save();
    res.status(201).json(group.roles[group.roles.length - 1]);
  } catch (err) {
    console.error("Error creating role:", err);
    res.status(500).json({ message: "Error creating role" });
  }
};

// ─── assignRole ───────────────────────────────────────────────────────────
exports.assignRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, roleId } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isAdmin =
      group.owner.toString() === user._id.toString() ||
      group.admins.some((a) => a.toString() === user._id.toString());
    if (!isAdmin) return res.status(403).json({ message: "Insufficient permissions" });

    const memberEntry = group.members.find((m) => m.userId.toString() === userId);
    if (memberEntry) memberEntry.roleId = roleId;

    await group.save();
    res.json({ message: "Role assigned" });
  } catch (err) {
    console.error("Error assigning role:", err);
    res.status(500).json({ message: "Error assigning role" });
  }
};

// ─── getRoles ─────────────────────────────────────────────────────────────
exports.getRoles = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group.roles || []);
  } catch (err) {
    res.status(500).json({ message: "Error fetching roles" });
  }
};

// ─── generateInvite ───────────────────────────────────────────────────────
exports.generateInvite = async (req, res) => {
  try {
    const { id } = req.params;
    const { maxUses = 10, expiresIn = 86400 } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isAdmin =
      group.owner.toString() === user._id.toString() ||
      group.admins.some((a) => a.toString() === user._id.toString());
    if (!isAdmin) return res.status(403).json({ message: "Insufficient permissions" });

    const inviteCode = Math.random().toString(36).substring(2, 15);
    if (!group.invites) group.invites = [];
    group.invites.push({
      code: inviteCode,
      groupId: group._id,
      maxUses,
      expiresIn: new Date(Date.now() + expiresIn * 1000),
      createdBy: user._id,
      uses: 0,
    });
    await group.save();

    res.json({ inviteCode, maxUses, expiresIn });
  } catch (err) {
    console.error("Error generating invite:", err);
    res.status(500).json({ message: "Error generating invite" });
  }
};

// ─── joinByInvite ─────────────────────────────────────────────────────────
exports.joinByInvite = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const group = await Group.findOne({ "invites.code": inviteCode });
    if (!group) return res.status(404).json({ message: "Invalid invite code" });

    const invite = group.invites.find((inv) => inv.code === inviteCode);
    if (invite.expiresIn < new Date()) return res.status(400).json({ message: "Invite has expired" });
    if (invite.uses >= invite.maxUses) return res.status(400).json({ message: "Invite has reached maximum uses" });
    if (isMember(group, user._id)) return res.status(400).json({ message: "Already a member" });

    // Banned users cannot join even with an invite
    if ((group.bannedUsers || []).some((u) => u.toString() === user._id.toString()))
      return res.status(403).json({ message: "You are banned from this group" });

    group.members.push({ userId: user._id, joinedAt: new Date() });
    invite.uses += 1;
    group.stats.memberCount = group.members.length;
    await group.save();

    const updated = await Group.findById(group._id)
      .populate("members.userId", "name avatar handle")
      .populate("owner", "name avatar");

    res.json(updated);
  } catch (err) {
    console.error("Error joining by invite:", err);
    res.status(500).json({ message: "Error joining group" });
  }
};

// ─── getOnlineUsers ───────────────────────────────────────────────────────
exports.getOnlineUsers = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate("members.userId", "name avatar handle");
    if (!group) return res.status(404).json({ message: "Group not found" });

    const userList = group.members.map((m) => ({ ...m.userId.toObject(), status: "online" }));
    res.json(userList.slice(0, Math.max(1, Math.floor(userList.length * 0.5))));
  } catch (err) {
    console.error("Error getting online users:", err);
    res.status(500).json({ message: "Error getting online users" });
  }
};

// ─── Join Requests (Approval Mode) ────────────────────────────────────────

/**
 * GET /api/groups/:id/join-requests
 * List pending join requests for a group (admins/owner only).
 */
exports.getJoinRequests = async (req, res) => {
  try {
    const { id } = req.params;
    const caller = await User.findOne({ email: req.user.email });
    const group = await Group.findById(id).populate("joinRequests.userId", "name avatar handle email");
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isAdminCaller =
      group.owner.toString() === caller._id.toString() ||
      group.admins.some((a) => a.toString() === caller._id.toString());

    if (!isAdminCaller)
      return res.status(403).json({ message: "Only group admins can view join requests" });

    res.json({ joinRequests: group.joinRequests || [] });
  } catch (err) {
    console.error("getJoinRequests error:", err);
    res.status(500).json({ message: "Error fetching join requests" });
  }
};

/**
 * POST /api/groups/:id/join-requests/:userId/approve
 * Approve a join request (owner/admin only).
 */
exports.approveJoinRequest = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const caller = await User.findOne({ email: req.user.email });
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isAdminCaller =
      group.owner.toString() === caller._id.toString() ||
      group.admins.some((a) => a.toString() === caller._id.toString());

    if (!isAdminCaller)
      return res.status(403).json({ message: "Only group admins can approve requests" });

    const reqIndex = group.joinRequests.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );
    if (reqIndex === -1)
      return res.status(404).json({ message: "Join request not found" });

    // If user is banned, do not approve
    if (group.bannedUsers.some((u) => u.toString() === userId.toString()))
      return res.status(403).json({ message: "User is banned from this group" });

    if (!isMember(group, userId)) {
      group.members.push({ userId, joinedAt: new Date() });
      group.stats.memberCount = group.members.length;
    }

    group.joinRequests.splice(reqIndex, 1);
    await group.save();

    res.json({ message: "Join request approved", userId });
  } catch (err) {
    console.error("approveJoinRequest error:", err);
    res.status(500).json({ message: "Error approving join request" });
  }
};

/**
 * POST /api/groups/:id/join-requests/:userId/reject
 * Reject a join request (owner/admin only).
 */
exports.rejectJoinRequest = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const caller = await User.findOne({ email: req.user.email });
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isAdminCaller =
      group.owner.toString() === caller._id.toString() ||
      group.admins.some((a) => a.toString() === caller._id.toString());

    if (!isAdminCaller)
      return res.status(403).json({ message: "Only group admins can reject requests" });

    group.joinRequests = group.joinRequests.filter(
      (r) => r.userId.toString() !== userId.toString()
    );
    await group.save();

    res.json({ message: "Join request rejected", userId });
  } catch (err) {
    console.error("rejectJoinRequest error:", err);
    res.status(500).json({ message: "Error rejecting join request" });
  }
};

// ─── Membership moderation: Kick / Ban ─────────────────────────────────────

/**
 * POST /api/groups/:id/members/:userId/kick
 * Remove a member from the group (admin/owner or role with KICK_MEMBERS).
 */
exports.kickMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const caller = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const callerId = caller._id.toString();
    const isOwnerCaller = group.owner.toString() === callerId;
    const isAdminCaller = group.admins.some((a) => a.toString() === callerId);
    const hasKickPermission = hasGroupPermission(group, caller._id, "KICK_MEMBERS");

    if (!isOwnerCaller && !isAdminCaller && !hasKickPermission)
      return res.status(403).json({ message: "Insufficient permissions to kick members" });

    // Cannot kick the owner
    if (group.owner.toString() === userId.toString())
      return res.status(400).json({ message: "Cannot remove the group owner" });

    const wasMember = isMember(group, userId);
    if (!wasMember)
      return res.status(404).json({ message: "User is not a member of this group" });

    group.members = group.members.filter((m) => m.userId.toString() !== userId.toString());
    group.admins = group.admins.filter((a) => a.toString() !== userId.toString());
    group.moderators = group.moderators.filter((m) => m.toString() !== userId.toString());
    group.memberRoles = group.memberRoles.filter(
      (mr) => mr.userId.toString() !== userId.toString()
    );
    group.stats.memberCount = group.members.length;
    await group.save();

    res.json({ message: "Member removed from group", userId });
  } catch (err) {
    console.error("kickMember error:", err);
    res.status(500).json({ message: "Error removing member" });
  }
};

/**
 * POST /api/groups/:id/members/:userId/ban
 * Ban a user from the group (kicks if present + adds to bannedUsers).
 */
exports.banMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const caller = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const callerId = caller._id.toString();
    const isOwnerCaller = group.owner.toString() === callerId;
    const isAdminCaller = group.admins.some((a) => a.toString() === callerId);
    const hasBanPermission = hasGroupPermission(group, caller._id, "BAN_MEMBERS");

    if (!isOwnerCaller && !isAdminCaller && !hasBanPermission)
      return res.status(403).json({ message: "Insufficient permissions to ban members" });

    // Cannot ban the owner
    if (group.owner.toString() === userId.toString())
      return res.status(400).json({ message: "Cannot ban the group owner" });

    // Remove from members/admins/moderators if currently present
    const wasMember = isMember(group, userId);
    if (wasMember) {
      group.members = group.members.filter((m) => m.userId.toString() !== userId.toString());
      group.admins = group.admins.filter((a) => a.toString() !== userId.toString());
      group.moderators = group.moderators.filter((m) => m.toString() !== userId.toString());
      group.memberRoles = group.memberRoles.filter(
        (mr) => mr.userId.toString() !== userId.toString()
      );
      group.stats.memberCount = group.members.length;
    }

    if (!group.bannedUsers.some((u) => u.toString() === userId.toString()))
      group.bannedUsers.push(userId);

    await group.save();

    res.json({ message: "User banned from group", userId });
  } catch (err) {
    console.error("banMember error:", err);
    res.status(500).json({ message: "Error banning member" });
  }
};

/**
 * POST /api/groups/:id/members/:userId/unban
 * Remove a user from the bannedUsers list.
 */
exports.unbanMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const caller = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const callerId = caller._id.toString();
    const isOwnerCaller = group.owner.toString() === callerId;
    const isAdminCaller = group.admins.some((a) => a.toString() === callerId);
    const hasBanPermission = hasGroupPermission(group, caller._id, "BAN_MEMBERS");

    if (!isOwnerCaller && !isAdminCaller && !hasBanPermission)
      return res.status(403).json({ message: "Insufficient permissions to unban members" });

    group.bannedUsers = group.bannedUsers.filter(
      (u) => u.toString() !== userId.toString()
    );
    await group.save();

    res.json({ message: "User unbanned from group", userId });
  } catch (err) {
    console.error("unbanMember error:", err);
    res.status(500).json({ message: "Error unbanning member" });
  }
};

// ─── Group settings (join policy) ─────────────────────────────────────────

/**
 * PATCH /api/groups/:id/settings
 * Update high-level group settings like joinPolicy.
 */
exports.updateGroupSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { joinPolicy } = req.body;
    const caller = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const callerId = caller._id.toString();
    const isOwnerCaller = group.owner.toString() === callerId;
    const isAdminCaller = group.admins.some((a) => a.toString() === callerId);

    if (!isOwnerCaller && !isAdminCaller)
      return res.status(403).json({ message: "Only owner or admins can update settings" });

    if (joinPolicy && ["PUBLIC", "INVITE_ONLY", "APPROVAL_REQUIRED"].includes(joinPolicy)) {
      group.joinPolicy = joinPolicy;
    }

    await group.save();
    res.json({ message: "Group settings updated", settings: { joinPolicy: group.joinPolicy } });
  } catch (err) {
    console.error("updateGroupSettings error:", err);
    res.status(500).json({ message: "Error updating settings" });
  }
};

// ─── handleFileUpload ─────────────────────────────────────────────────────
exports.uploadFile = upload.single("file");

exports.handleFileUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { channelId } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const group = await Group.findOne({ "channels._id": channelId });
    if (!group) return res.status(404).json({ message: "Channel not found" });
    if (!isMember(group, user._id))
      return res.status(403).json({ message: "Not a member" });

    const attachment = {
      id: Date.now().toString(),
      filename: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
      contentType: req.file.mimetype,
    };
    res.json(attachment);
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).json({ message: "Error uploading file" });
  }
};

// ─── approveJoinRequest ──────────────────────────────────────────────────────────
exports.approveJoinRequest = async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check if user is admin
    const isAdmin = group.owner.toString() === user._id.toString() ||
      group.admins.some(a => a.toString() === user._id.toString());
    if (!isAdmin) return res.status(403).json({ message: "Only admins can approve join requests" });

    // Find the join request
    const requestIndex = group.joinRequests.findIndex(req => req._id.toString() === requestId);
    if (requestIndex === -1) return res.status(404).json({ message: "Join request not found" });

    const joinRequest = group.joinRequests[requestIndex];

    // Check if user is already a member
    const isAlreadyMember = group.members.some(m => m.userId.toString() === joinRequest.userId.toString());
    if (isAlreadyMember) {
      // Remove the request and return
      group.joinRequests.splice(requestIndex, 1);
      await group.save();
      return res.status(400).json({ message: "User is already a member" });
    }

    // Add user to members
    group.members.push({
      userId: joinRequest.userId,
      roleId: null,
      encryptedGroupKey: null,
      joinedAt: new Date(),
    });

    // Remove the request
    group.joinRequests.splice(requestIndex, 1);

    await group.save();

    // Emit event for real-time updates
    try {
      getIO().to(`group_${id}`).emit("member_joined", { userId: joinRequest.userId });
    } catch (err) {
      console.warn("Socket emit failed:", err.message);
    }

    res.json({ message: "Join request approved" });
  } catch (err) {
    console.error("Error approving join request:", err);
    res.status(500).json({ message: "Error approving join request" });
  }
};

// ─── rejectJoinRequest ──────────────────────────────────────────────────────────
exports.rejectJoinRequest = async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check if user is admin
    const isAdmin = group.owner.toString() === user._id.toString() ||
      group.admins.some(a => a.toString() === user._id.toString());
    if (!isAdmin) return res.status(403).json({ message: "Only admins can reject join requests" });

    // Find and remove the join request
    const requestIndex = group.joinRequests.findIndex(req => req._id.toString() === requestId);
    if (requestIndex === -1) return res.status(404).json({ message: "Join request not found" });

    group.joinRequests.splice(requestIndex, 1);
    await group.save();

    res.json({ message: "Join request rejected" });
  } catch (err) {
    console.error("Error rejecting join request:", err);
    res.status(500).json({ message: "Error rejecting join request" });
  }
};

// ─── addAdmin ──────────────────────────────────────────────────────────────────
exports.addAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Only owner can add admins
    if (group.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Only the group owner can add admins" });
    }

    // Check if user is already an admin
    if (group.admins.some(a => a.toString() === userId)) {
      return res.status(400).json({ message: "User is already an admin" });
    }

    // Check if user is a member
    const isMember = group.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      return res.status(400).json({ message: "User must be a member before becoming an admin" });
    }

    // Add to admins
    group.admins.push(userId);
    await group.save();

    // Emit event
    try {
      getIO().to(`group_${id}`).emit("admin_added", { userId });
    } catch (err) {
      console.warn("Socket emit failed:", err.message);
    }

    res.json({ message: "Admin added successfully" });
  } catch (err) {
    console.error("Error adding admin:", err);
    res.status(500).json({ message: "Error adding admin" });
  }
};

// ─── removeAdmin ───────────────────────────────────────────────────────────────
exports.removeAdmin = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Only owner can remove admins
    if (group.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Only the group owner can remove admins" });
    }

    // Cannot remove owner
    if (group.owner.toString() === userId) {
      return res.status(400).json({ message: "Cannot remove the group owner from admins" });
    }

    // Check if user is an admin
    const adminIndex = group.admins.findIndex(a => a.toString() === userId);
    if (adminIndex === -1) {
      return res.status(400).json({ message: "User is not an admin" });
    }

    // Remove from admins
    group.admins.splice(adminIndex, 1);
    await group.save();

    // Emit event
    try {
      getIO().to(`group_${id}`).emit("admin_removed", { userId });
    } catch (err) {
      console.warn("Socket emit failed:", err.message);
    }

    res.json({ message: "Admin removed successfully" });
  } catch (err) {
    console.error("Error removing admin:", err);
    res.status(500).json({ message: "Error removing admin" });
  }
};

// ─── removeMember ──────────────────────────────────────────────────────────────
exports.removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check if user is admin or owner
    const isAdmin = group.owner.toString() === user._id.toString() ||
      group.admins.some(a => a.toString() === user._id.toString());
    if (!isAdmin) return res.status(403).json({ message: "Only admins can remove members" });

    // Cannot remove owner
    if (group.owner.toString() === userId) {
      return res.status(400).json({ message: "Cannot remove the group owner" });
    }

    // Find and remove member
    const memberIndex = group.members.findIndex(m => m.userId.toString() === userId);
    if (memberIndex === -1) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Remove from members
    group.members.splice(memberIndex, 1);

    // Also remove from admins if they were an admin
    group.admins = group.admins.filter(a => a.toString() !== userId);

    await group.save();

    // Emit event
    try {
      getIO().to(`group_${id}`).emit("member_removed", { userId });
    } catch (err) {
      console.warn("Socket emit failed:", err.message);
    }

    res.json({ message: "Member removed successfully" });
  } catch (err) {
    console.error("Error removing member:", err);
    res.status(500).json({ message: "Error removing member" });
  }
};

// ─── reportMessage ─────────────────────────────────────────────────────
exports.reportMessage = async (req, res) => {
  try {
    const { id, channelId, messageId } = req.params;
    const { reason } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check if user is a member
    const isMember = group.members.some(m => m.userId.toString() === user._id.toString());
    if (!isMember) return res.status(403).json({ message: "Only group members can report messages" });

    // Here you would typically save the report to a reports collection
    // For now, we'll just log it and emit an event for moderation

    // Emit event for real-time moderation alerts
    try {
      getIO().to(`group_${id}`).emit("message_reported", {
        messageId,
        reportedBy: user._id,
        reason,
        channelId,
      });
    } catch (err) {
      console.warn("Socket emit failed:", err.message);
    }

    res.json({ message: "Message reported successfully" });
  } catch (err) {
    console.error("Error reporting message:", err);
    res.status(500).json({ message: "Error reporting message" });
  }
};

// ─── getMessageReadBy ──────────────────────────────────────────────────────
exports.getMessageReadBy = async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, message: "Invalid message ID" });
    }

    const message = await Message.findById(messageId).populate("readBy.userId", "name avatar");
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    res.json({ success: true, data: message.readBy || [] });
  } catch (err) {
    console.error("Error getting message reads:", err);
    res.status(500).json({ success: false, message: "Error fetching read receipts" });
  }
};
