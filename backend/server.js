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
