const { User, Group } = require("../models/Schema");
const mongoose = require('mongoose');

/**
 * POST /api/keys/upload
 * Upload / update the authenticated user's RSA-OAEP public key.
 * Body: { publicKey: "<JWK JSON string>" }
 */
const uploadPublicKey = async (req, res) => {
    try {
        const { publicKey } = req.body;
        if (!publicKey) {
            return res.status(400).json({ success: false, message: "publicKey is required" });
        }

        // Very light validation – ensure it's valid JSON and contains the key_ops / kty fields
        try {
            const parsed = JSON.parse(publicKey);
            if (!parsed.kty) throw new Error("Invalid JWK");
        } catch {
            return res.status(400).json({ success: false, message: "publicKey must be a valid JWK JSON string" });
        }

        await User.findByIdAndUpdate(req.user._id, { publicKey });
        res.status(200).json({ success: true, message: "Public key updated" });
    } catch (err) {
        console.error("Error uploading public key:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

/**
 * GET /api/keys/:userId
 * Fetch a single user's public key (used by group admin during key distribution).
 */
const getUserPublicKey = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        const user = await User.findById(req.params.userId).select("publicKey name");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (!user.publicKey) {
            return res.status(404).json({ success: false, message: "User has no public key registered" });
        }

        res.status(200).json({
            success: true,
            data: { userId: user._id, name: user.name, publicKey: user.publicKey },
            message: "Public key fetched successfully"
        });
    } catch (err) {
        console.error("Error fetching user public key:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

/**
 * GET /api/keys/group/:groupId
 * Fetch public keys for ALL members of a group.
 * Used when creating a group or inviting a new member to distribute encrypted group keys.
 */
const getGroupMemberPublicKeys = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.groupId)) {
            return res.status(400).json({ success: false, message: "Invalid group ID" });
        }

        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        // Check requesting user is a member or admin
        const requesterId = req.user._id.toString();
        const isMember = group.members.some((m) => m.userId.toString() === requesterId);
        const isAdmin = group.admins.some((a) => a.toString() === requesterId);
        const isOwner = group.owner.toString() === requesterId;

        if (!isMember && !isAdmin && !isOwner) {
            return res.status(403).json({ success: false, message: "Not a member of this group" });
        }

        // Collect all unique user ids from members + admins + owner
        const memberIds = group.members.map((m) => m.userId);

        const users = await User.find(
            { _id: { $in: memberIds } },
            "publicKey name avatar"
        );

        const keys = users.map((u) => ({
            userId: u._id,
            name: u.name,
            avatar: u.avatar,
            publicKey: u.publicKey || null,
        }));

        res.status(200).json({
            success: true,
            data: { groupId: group._id, members: keys },
            message: "Group member public keys fetched successfully"
        });
    } catch (err) {
        console.error("Error fetching group member public keys:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

/**
 * POST /api/keys/group/:groupId/distribute
 * Store the AES group key (already RSA-OAEP encrypted) for a specific member.
 * Body: { targetUserId: "<id>", encryptedGroupKey: "<base64>" }
 * Only allowed by group owner or admins.
 */
const distributeGroupKey = async (req, res) => {
    try {
        const { targetUserId, encryptedGroupKey } = req.body;
        if (!targetUserId || !encryptedGroupKey) {
            return res.status(400).json({ success: false, message: "targetUserId and encryptedGroupKey are required" });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.groupId)) {
            return res.status(400).json({ success: false, message: "Invalid group ID" });
        }

        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({ success: false, message: "Invalid target user ID" });
        }

        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        const requesterId = req.user._id.toString();
        const isOwner = group.owner.toString() === requesterId;
        const isAdmin = group.admins.some((a) => a.toString() === requesterId);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Only group owner or admins can distribute keys" });
        }

        // Upsert the member entry
        const memberIndex = group.members.findIndex(
            (m) => m.userId.toString() === targetUserId
        );

        if (memberIndex === -1) {
            // Add new member entry
            group.members.push({ userId: targetUserId, encryptedGroupKey });
        } else {
            group.members[memberIndex].encryptedGroupKey = encryptedGroupKey;
        }

        group.isEncrypted = true;
        await group.save();

        res.status(200).json({ success: true, message: "Group key distributed" });
    } catch (err) {
        console.error("Error distributing group key:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

module.exports = {
    uploadPublicKey,
    getUserPublicKey,
    getGroupMemberPublicKeys,
    distributeGroupKey,
};
