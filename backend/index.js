require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db.js");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const groupRoutes = require("./routes/groupRoutes");
const listingRoutes = require("./routes/listingRoutes");
const enhancedListingRoutes = require("./routes/enhancedListingRoutes");
const marketplaceConversationRoutes = require("./routes/marketplaceConversationRoutes");
const profileRoutes = require("./routes/profileRoutes");
const lostFoundRoutes = require("./routes/lostFoundRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const notesRoutes = require("./routes/notesRoutes");
const searchRoutes = require("./routes/searchRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const messagesRoutes = require("./routes/messagesRoutes");
const collegeRoutes = require("./routes/collegeRoutes");
const branchRoutes = require("./routes/branchRoutes");
const keyRoutes = require("./routes/keyRoutes");

const http = require("http");
const { initializeSocket } = require("./socket/socketHandler");
const examNotificationScheduler = require("./services/examNotificationScheduler");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Socket.io
initializeSocket(server);

// Connect Database
connectDB();

// Start Exam Notification Scheduler
examNotificationScheduler.start();

// Mount Routes
// Note: Some routes are mounted at /api directly, others at specific endpoints
app.use("/api/auth", authRoutes); // handles /api/register, /api/login, etc.
app.use("/api/posts", postRoutes); // handles /api/posts
app.use("/api/groups", groupRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/enhanced-listings", enhancedListingRoutes);
app.use("/api/marketplace-conversations", marketplaceConversationRoutes);
app.use("/api/lost-found", lostFoundRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api", reportsRoutes);
app.use("/api/keys", keyRoutes);   // E2EE key exchange

// Start Server
server.listen(PORT, () => console.log(`🚀 Neutron Core Online: ${PORT}`));
