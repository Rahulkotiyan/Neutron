const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { User, Group, Message } = require("../models/Schema");

let io;

const initializeSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: process.env.NODE_ENV === 'production' 
                ? process.env.FRONTEND_URL || process.env.ALLOWED_ORIGINS?.split(',') || []
                : ["http://localhost:5173", "http://localhost:3000"],
            methods: ["GET", "POST"],
            credentials: true,
        },
        // Security configurations
        maxHttpBufferSize: 1e6, // 1MB max message size
        pingTimeout: 60000, // 60 seconds
        pingInterval: 25000, // 25 seconds
        transports: ['websocket', 'polling'], // Allow fallback to polling
    });

    // Set connection limits
    io.sockets.setMaxListeners(50);

    // ─── Auth middleware ──────────────────────────────────────────────────────
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error("Authentication error"));

            // Enforce JWT_SECRET environment variable for security
            if (!process.env.JWT_SECRET) {
                throw new Error("JWT_SECRET environment variable is required for socket authentication");
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded._id).select("-password");
            if (!user) return next(new Error("User not found"));

            socket.user = user;
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {

        // User's own notification room
        socket.join(socket.user._id.toString());

        // ── Room management ──────────────────────────────────────────────────

        socket.on("join_group", (groupId) => {
            socket.join(`group_${groupId}`);
        });

        socket.on("leave_group", (groupId) => {
            socket.leave(`group_${groupId}`);
        });

        socket.on("join_channel", (channelId) => {
            socket.join(`channel_${channelId}`);
        });

        socket.on("leave_channel", (channelId) => {
            socket.leave(`channel_${channelId}`);
        });

        // ── Typing indicators ────────────────────────────────────────────────

        socket.on("typing", ({ channelId }) => {
            socket.to(`channel_${channelId}`).emit("user_typing", {
                userId: socket.user._id,
                name: socket.user.name,
                channelId,
            });
        });

        socket.on("stop_typing", ({ channelId }) => {
            socket.to(`channel_${channelId}`).emit("user_stop_typing", {
                userId: socket.user._id,
                channelId,
            });
        });

        // ── Message sending (E2EE + plain text) ────────────────────────────
        /**
         * Payload: {
         *   groupId:    string,
         *   channelId:  string,
         *   content?:   string,   // plain text (for DEFAULT type)
         *   ciphertext?: string,  // base64 AES-GCM encrypted text (for ENCRYPTED)
         *   iv?:         string,  // base64 IV (for ENCRYPTED)
         *   type:       "DEFAULT" | "ENCRYPTED" | "SYSTEM" (optional, defaults to DEFAULT)
         * }
         */
        socket.on("send_message", async (payload, ack) => {
            try {
                const { groupId, channelId, content, ciphertext, iv, type = "DEFAULT", attachments = [] } = payload;

                if (!groupId || !channelId) {
                    if (ack) ack({ error: "Missing required fields" });
                    return;
                }

                if (type === "ENCRYPTED" && (!ciphertext || !iv)) {
                    if (ack) ack({ error: "Missing ciphertext or iv for encrypted message" });
                    return;
                }

                if (type === "DEFAULT" && !content) {
                    if (ack) ack({ error: "Missing message content" });
                    return;
                }

                // Verify the sender is a member of this group and has permission to send
                const group = await Group.findById(groupId).select("members admins owner roles");
                if (!group) {
                    if (ack) ack({ error: "Group not found" });
                    return;
                }

                const senderId = socket.user._id.toString();
                const isMember = group.members.some((m) => m.userId.toString() === senderId);
                const isAdmin = group.admins.some((a) => a.toString() === senderId);
                const isOwner = group.owner.toString() === senderId;

                if (!isMember && !isAdmin && !isOwner) {
                    if (ack) ack({ error: "Not a member of this group" });
                    return;
                }

                // Granular permission: check SEND_MESSAGES based on member role
                const hasSendPermission = (() => {
                    if (isOwner || isAdmin) return true;
                    const memberEntry = group.members.find((m) => m.userId.toString() === senderId);
                    if (!memberEntry || !memberEntry.roleId) return true;
                    const role = group.roles.id(memberEntry.roleId);
                    if (!role || !Array.isArray(role.permissions)) return true;
                    if (role.permissions.includes("*")) return true;
                    return role.permissions.includes("SEND_MESSAGES");
                })();

                if (!hasSendPermission) {
                    if (ack) ack({ error: "You don't have permission to send messages in this group" });
                    return;
                }

                // Persist the message
                const msgData = {
                    group: groupId,
                    channel: channelId,
                    user: socket.user._id,
                    type,
                };

                if (type === "ENCRYPTED") {
                    msgData.ciphertext = ciphertext;
                    msgData.iv = iv;
                    msgData.content = "";
                } else {
                    msgData.content = content;
                }

                if (attachments.length > 0) msgData.attachments = attachments;

                const message = await Message.create(msgData);

                // Update group stats
                await Group.findByIdAndUpdate(groupId, {
                    $inc: { "stats.messageCount": 1 },
                    "stats.lastActivity": new Date(),
                });

                // Broadcast to everyone in the channel room
                const outPayload = {
                    _id: message._id,
                    group: groupId,
                    channel: channelId,
                    content: msgData.content,
                    ciphertext: msgData.ciphertext || null,
                    iv: msgData.iv || null,
                    type,
                    createdAt: message.createdAt,
                    attachments: message.attachments || [],
                    user: {
                        _id: socket.user._id,
                        name: socket.user.name,
                        avatar: socket.user.avatar,
                    },
                };

                socket.to(`channel_${channelId}`).emit("new_message", outPayload);

                // Acknowledge success back to sender
                if (ack) ack({ success: true, messageId: message._id, createdAt: message.createdAt });
            } catch (err) {
                console.error("send_message error:", err);
                if (ack) ack({ error: "Server error while sending message" });
            }
        });

        // ── Message reactions ─────────────────────────────────────────────────
        socket.on("add_reaction", async ({ messageId, channelId, emoji }) => {
            try {
                // Input validation
                if (!messageId || !channelId || !emoji) {
                    return;
                }

                // Validate ObjectId format
                if (!mongoose.Types.ObjectId.isValid(messageId)) {
                    return;
                }

                const message = await Message.findByIdAndUpdate(
                    messageId,
                    { $addToSet: { "reactions.$[el].users": socket.user._id } },
                    { arrayFilters: [{ "el.emoji": emoji }], new: true }
                );
                io.to(`channel_${channelId}`).emit("reaction_updated", { messageId, reactions: message?.reactions });
            } catch (err) {
                console.error("add_reaction error:", err);
            }
        });

        // ── Post rooms ───────────────────────────────────────────────────────

        socket.on("join_post", (postId) => {
            socket.join(`post_${postId}`);
        });

        socket.on("leave_post", (postId) => {
            socket.leave(`post_${postId}`);
        });

        // ── Read receipts ─────────────────────────────────────────────────────
        socket.on("message_read", async ({ channelId, messageIds }) => {
            try {
                if (!channelId || !messageIds || !Array.isArray(messageIds)) return;
                const userId = socket.user._id;
                // Broadcast to channel that this user has read these messages
                socket.to(`channel_${channelId}`).emit("messages_read", {
                    userId,
                    messageIds,
                    channelId,
                    readAt: new Date(),
                });
            } catch (err) {
                console.error("message_read error:", err);
            }
        });

        // ── Message delivery confirmation ──────────────────────────────────────
        socket.on("messages_delivered", ({ channelId, messageIds }) => {
            socket.to(`channel_${channelId}`).emit("messages_delivered_ack", {
                userId: socket.user._id,
                messageIds,
                channelId,
            });
        });

        socket.on("disconnect", () => {
        });
    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
};

module.exports = { initializeSocket, getIO };
