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

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error("Authentication error"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || "neutron_secret_key");
            const user = await User.findById(decoded._id).select("-password");

            if (!user) {
                return next(new Error("User not found"));
            }

            socket.user = user;
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.user.name} (${socket.user._id})`);

        // Join user to their own room for private notifications
        socket.join(socket.user._id.toString());

        // Update user status
        socket.on("status_change", async (status) => {
            // Broadcast status change to user's friends/groups if needed
            // For now just log it
            console.log(`User ${socket.user.name} is now ${status}`);
        });

        // Join a group/server room
        socket.on("join_group", (groupId) => {
            socket.join(`group_${groupId}`);
            console.log(`User ${socket.user.name} joined group ${groupId}`);
        });

        // Leave a group/server room
        socket.on("leave_group", (groupId) => {
            socket.leave(`group_${groupId}`);
            console.log(`User ${socket.user.name} left group ${groupId}`);
        });

        // Join a specific channel
        socket.on("join_channel", (channelId) => {
            socket.join(`channel_${channelId}`);
            console.log(`User ${socket.user.name} joined channel ${channelId}`);
        });

        // Leave a specific channel
        socket.on("leave_channel", (channelId) => {
            socket.leave(`channel_${channelId}`);
            console.log(`User ${socket.user.name} left channel ${channelId}`);
        });

        // Typing indicators
        socket.on("typing", ({ channelId, groupId }) => {
            socket.to(`channel_${channelId}`).emit("user_typing", {
                userId: socket.user._id,
                name: socket.user.name,
                channelId
            });
        });

        socket.on("stop_typing", ({ channelId }) => {
            socket.to(`channel_${channelId}`).emit("user_stop_typing", {
                userId: socket.user._id,
                channelId
            });
        });

        // Post-specific rooms for comments/replies
        socket.on("join_post", (postId) => {
            socket.join(`post_${postId}`);
            console.log(`User ${socket.user.name} joined room for post ${postId}`);
        });

        socket.on("leave_post", (postId) => {
            socket.leave(`post_${postId}`);
            console.log(`User ${socket.user.name} left room for post ${postId}`);
        });

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.user.name}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initializeSocket, getIO };
