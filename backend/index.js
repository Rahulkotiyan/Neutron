const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { register } = require("./controllers/auth")
const { createPost } = require("./controllers/post")
const { verifyToken } = require("./middleware/auth.middleware")
const { createMarketItem } = require("./controllers/market");
const { uploadResource } = require("./controllers/resources");
const adminRoute = require("./routes/admin");
const userRoutes = require("./routes/users.js");

// Import DB Connection
const connectDB = require("./config/db");

//File storage multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/assets");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});
const upload = multer({ storage });


// Import Routes
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const marketRoute = require("./routes/market");
const resourceRoute = require("./routes/resources");

// Configuration
dotenv.config();
connectDB(); // Connect to MongoDB

const app = express();

// Middleware
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(cors());

// Routes
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);
app.use("/api/market", marketRoute);
app.use("/api/resources", resourceRoute);
app.use("/api/events", require("./routes/events"));
app.use("/api/groups", require("./routes/groups"));

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.post("/api/auth/register", upload.single("picture"), register);
app.post("/api/posts", verifyToken, upload.single("picture"), createPost);

/* ROUTES WITH FILES */
app.post("/api/auth/register", upload.single("picture"), register);
app.post("/api/posts", verifyToken, upload.single("picture"), createPost);

// --- NEW ADDITIONS FOR PHASE 5 ---
app.post("/api/market", verifyToken, upload.single("picture"), createMarketItem);
app.post("/api/resources", verifyToken, upload.single("file"), uploadResource);

app.use("/api/admin", adminRoute);
app.use("/api/users", userRoutes);