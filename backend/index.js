const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const multer =require("multer");
const path= require("path");
const {register} = require("./controllers/auth")
const {createPost} = require("./controllers/post")
const {verifyToken} = require("./middleware/auth.middleware")

// Import DB Connection
const connectDB = require("./config/db");

//File storage multer
const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,"public/assets");
    },
    filename:function(req,file,cb){
        cb(null,file.originalname);
    },
});
const upload = multer({storage});


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
app.use(express.json()); // Body parser for JSON
app.use(helmet()); // Security headers
app.use(morgan("common")); // Logger
app.use(cors()); // Allow Cross-Origin requests (frontend to backend)

// Route Middleware
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);
app.use("/api/market", marketRoute);
app.use("/api/resources", resourceRoute);

// Base Route
app.get("/", (req, res) => {
  res.send("Neutron API is running...");
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.post("/api/auth/register", upload.single("picture"), register);
app.post("/api/posts", verifyToken, upload.single("picture"), createPost);