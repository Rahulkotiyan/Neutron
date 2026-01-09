require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db.js");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const groupRoutes = require("./routes/groupRoutes");
const listingRoutes = require("./routes/listingRoutes");
const eventRoutes = require("./routes/eventRoutes");
const seedRoutes = require("./routes/seedRoutes");
const profileRoutes = require("./routes/profileRoutes");
const lostFoundRoutes = require("./routes/lostFoundRoutes");
const timetableRoutes = require("./routes/timetableRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

// Mount Routes
// Note: Some routes are mounted at /api directly, others at specific endpoints
app.use("/api", authRoutes); // handles /api/register, /api/login, etc.
app.use("/api/posts", postRoutes); // handles /api/posts
app.use("/api/groups", groupRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/lost-found", lostFoundRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/seed", seedRoutes);
app.use("/api/profile", profileRoutes);

// Start Server
app.listen(PORT, () => console.log(`🚀 Neutron Core Online: ${PORT}`));
