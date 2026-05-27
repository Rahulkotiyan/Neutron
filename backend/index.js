require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initializeDatabase } = require("./db");
const { 
  staticAssetCache, 
  apiCache, 
  longTermCache,
  negotiatedCache,
  noCache,
  securityHeaders,
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

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const profileRoutes = require("./routes/profileRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const notesRoutes = require("./routes/notesRoutes");
const searchRoutes = require("./routes/searchRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const collegeRoutes = require("./routes/collegeRoutes");
const branchRoutes = require("./routes/branchRoutes");
const toolsRoutes = require("./routes/toolsRoutes");

const http = require("http");
const { initializeSocket } = require("./socket/socketHandler");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(securityHeaders);
app.use(cors());
app.use(express.json());
app.use(devCacheBust);
app.use('/api', apiRateLimit);
app.use(express.static('public', staticAssetCache));

initializeSocket(server);

// Initialize Turso database
initializeDatabase();
console.log("Turso database initialized");

app.use("/api/auth", authRateLimit, noCache, authRoutes);

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!", timestamp: new Date() });
});

app.use("/api/posts", readRateLimit, negotiatedCache, postRoutes);
app.post("/api/posts", createPostRateLimit, noCache, postRoutes);
app.put("/api/posts", createPostRateLimit, noCache, postRoutes);
app.delete("/api/posts", createPostRateLimit, noCache, postRoutes);

app.use("/api/timetable", apiRateLimit, apiCache, timetableRoutes);
app.use("/api/profile", apiRateLimit, noCache, profileRoutes);
app.use("/api/notes", readRateLimit, negotiatedCache, notesRoutes);
app.use("/api/search", searchRateLimit, apiCache, searchRoutes);
app.use("/api/notifications", messageRateLimit, noCache, notificationRoutes);
app.use("/api/colleges", apiRateLimit, longTermCache, collegeRoutes);
app.use("/api/branches", apiRateLimit, longTermCache, branchRoutes);
app.use("/api", apiRateLimit, noCache, reportsRoutes);
app.use("/api/tools", apiRateLimit, longTermCache, toolsRoutes);

const { startCronJobs } = require('./services/cronService');

server.listen(PORT, () => {
  startCronJobs();
});
