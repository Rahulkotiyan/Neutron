const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config(); // Loads .env variables

const app = express();
const port = process.env.PORT || 5000;

// --- Middleware ---
// Allow cross-origin requests (from your React app)
app.use(cors());
// Allow the server to accept JSON in request bodies
app.use(express.json());

// --- Database Connection ---
const uri = process.env.ATLAS_URI;
mongoose.connect(uri);
const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB database connection established successfully!");
});

// --- API Routes ---
// We will create these files next
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/posts", require("./routes/post.routes"));
app.use("/api/resources", require("./routes/resource.routes"));
app.use("/api/placements", require("./routes/placement.routes"));

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

// src/server.js
require('dotenv').config(); // Load environment variables
const { server, io } = require('./app'); // Import server and io from app.js
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.REACT_APP_CLIENT_URL || 'http://localhost:3000'; // Define CLIENT_URL

// Connect to database
connectDB();

// Socket.IO event handling (placeholder for now, will be built out in Phase 2)
io.on('connection', (socket) => {
  console.log('A user connected via WebSocket:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected from WebSocket:', socket.id);
  });

  // You can add basic test events here
  socket.on('test_message', (msg) => {
    console.log('Received test message:', msg);
    socket.emit('test_response', `Server received: ${msg}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
  console.log(`Frontend expected at: ${CLIENT_URL}`);
});