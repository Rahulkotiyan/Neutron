const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const { User, Group, Message } = require("../models/Schema");

let io;

const initializeSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "http://localhost:5173", // Allow frontend
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    // ─── Auth middleware ──────────────────────────────────────────────────────
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error("Authentication error"));

            const decoded = jwt.verify(token, process.env.JWT_SECRET || "neutron_secret_key");
            const user = await User.findById(decoded._id).select("-password");
            if (!user) return next(new Error("User not found"));

            socket.user = user;
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`✅ Connected: ${socket.user.name} (${socket.user._id})`);

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

        // ── E2EE Message sending ────────────────────────────────────────────
        /**
         * Payload: {
         *   groupId:    string,
         *   channelId:  string,
         *   ciphertext: string,   // base64 AES-GCM encrypted text
         *   iv:         string,   // base64 IV
         *   type:       "ENCRYPTED" | "SYSTEM" (optional, defaults to ENCRYPTED)
         * }
         */
        socket.on("send_message", async (payload, ack) => {
            try {
                const { groupId, channelId, ciphertext, iv, type = "ENCRYPTED" } = payload;

                if (!groupId || !channelId || !ciphertext || !iv) {
                    if (ack) ack({ error: "Missing required fields" });
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
                    if (!memberEntry || !memberEntry.roleId) return true; // fallback to allow if no role set
                    const role = group.roles.id(memberEntry.roleId);
                    if (!role || !Array.isArray(role.permissions)) return true;
                    if (role.permissions.includes("*")) return true;
                    return role.permissions.includes("SEND_MESSAGES");
                })();

                if (!hasSendPermission) {
                    if (ack) ack({ error: "You don't have permission to send messages in this group" });
                    return;
                }

                // Persist the encrypted message
                const message = await Message.create({
                    group: groupId,
                    channel: channelId,
                    user: socket.user._id,
                    ciphertext,
                    iv,
                    content: "", // intentionally empty — actual content is encrypted
                    type,
                });

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
                    ciphertext,
                    iv,
                    type,
                    timestamp: message.timestamp,
                    user: {
                        _id: socket.user._id,
                        name: socket.user.name,
                        avatar: socket.user.avatar,
                    },
                };

                io.to(`channel_${channelId}`).emit("new_message", outPayload);

                // Acknowledge success back to sender
                if (ack) ack({ success: true, messageId: message._id });
            } catch (err) {
                console.error("send_message error:", err);
                if (ack) ack({ error: "Server error while sending message" });
            }
        });

        // ── Message reactions ─────────────────────────────────────────────────
        socket.on("add_reaction", async ({ messageId, channelId, emoji }) => {
            try {
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

        socket.on("disconnect", () => {
            console.log(`❌ Disconnected: ${socket.user.name}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
};

module.exports = { initializeSocket, getIO };
