require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db.js");
const { 
  staticAssetCache, 
  apiCache, 
  longTermCache,
  negotiatedCache,
  noCache,
  securityHeaders,
  conditionalCache,
  devCacheBust
} = require("./middleware/cacheMiddleware");
const {
  apiRateLimit,
  authRateLimit,
  uploadRateLimit,
  searchRateLimit,
  createPostRateLimit,
  readRateLimit,
  messageRateLimit
} = require("./middleware/rateLimiterSimple");

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
app.use(securityHeaders);
app.use(cors());
app.use(express.json());

// Development cache busting
app.use(devCacheBust);

// Apply general API rate limiting
app.use('/api', apiRateLimit);

// Serve static files with advanced caching
app.use(express.static('public', staticAssetCache));

// Initialize Socket.io
initializeSocket(server);

// Connect Database
connectDB();

// Start Exam Notification Scheduler
examNotificationScheduler.start();

// Mount Routes with advanced caching strategies and specific rate limiting
app.use("/api/auth", authRateLimit, noCache, authRoutes);

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!", timestamp: new Date() });
});

// Posts endpoint with read/write separation
app.use("/api/posts", readRateLimit, negotiatedCache, postRoutes);
app.post("/api/posts", createPostRateLimit, noCache, postRoutes);
app.put("/api/posts", createPostRateLimit, noCache, postRoutes);
app.delete("/api/posts", createPostRateLimit, noCache, postRoutes);

app.use("/api/groups", apiRateLimit, apiCache, groupRoutes);
app.use("/api/listings", apiRateLimit, apiCache, listingRoutes);
app.use("/api/enhanced-listings", apiRateLimit, apiCache, enhancedListingRoutes);
app.use("/api/marketplace-conversations", messageRateLimit, noCache, marketplaceConversationRoutes);
app.use("/api/lost-found", apiRateLimit, apiCache, lostFoundRoutes);
app.use("/api/timetable", apiRateLimit, apiCache, timetableRoutes);
app.use("/api/profile", apiRateLimit, noCache, profileRoutes);
app.use("/api/notes", uploadRateLimit, negotiatedCache, notesRoutes);
app.use("/api/search", searchRateLimit, apiCache, searchRoutes);
app.use("/api/payment", authRateLimit, noCache, paymentRoutes);
app.use("/api/notifications", messageRateLimit, noCache, notificationRoutes);
app.use("/api/messages", messageRateLimit, noCache, messagesRoutes);
app.use("/api/colleges", apiRateLimit, longTermCache, collegeRoutes);
app.use("/api/branches", apiRateLimit, longTermCache, branchRoutes);
app.use("/api", apiRateLimit, noCache, reportsRoutes);
app.use("/api/keys", authRateLimit, noCache, keyRoutes);

// Start Server
server.listen(PORT, () => {});
