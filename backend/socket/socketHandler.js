const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const { getDb, schema } = require("../db");
const { eq } = require("drizzle-orm");

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
        maxHttpBufferSize: 1e6,
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket', 'polling'],
    });

    io.sockets.setMaxListeners(50);

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error("Authentication error"));
            if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is required for socket authentication");

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const db = getDb();
            const users = await db.select().from(schema.users).where(eq(schema.users.id, decoded._id)).limit(1);
            if (!users.length) return next(new Error("User not found"));

            socket.user = users[0];
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        socket.join(socket.user.id);

        socket.on("join_post", (postId) => {
            socket.join(`post_${postId}`);
        });

        socket.on("leave_post", (postId) => {
            socket.leave(`post_${postId}`);
        });

    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
};

module.exports = { initializeSocket, getIO };
