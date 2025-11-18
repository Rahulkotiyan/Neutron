const router = require("express").Router();
let Resource = require("../models/resource.model");
const verifyToken = require("../middleware/auth.middleware");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// 1. CLOUDINARY CONFIGURATION
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "neutron_resources",
    resource_type: "auto",
  },
});

const upload = multer({ storage: storage });

// --- HELPER ---
const getCollegeFromRequest = (req) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.college;
    } catch (e) {
      return req.headers["x-college"];
    }
  }
  return req.headers["x-college"];
};

// --- 1. GET RESOURCES (With Branch Filter) ---
router.get("/", async (req, res) => {
  try {
    const college = getCollegeFromRequest(req);

    if (!college) {
      return res.status(400).json("Error: No college specified.");
    }

    const query = { college: college };

    // --- FILTERS ---
    if (req.query.subject)
      query.subject = { $regex: req.query.subject, $options: "i" };
    if (req.query.semester) query.semester = req.query.semester;
    // New Branch Filter
    if (req.query.branch) query.branch = req.query.branch;

    const resources = await Resource.find(query)
      .populate("author", "username _id")
      .sort({ createdAt: -1 });

    res.json(resources);
  } catch (err) {
    console.error("GET /resources error:", err);
    res.status(400).json("Error: " + err);
  }
});

// --- 2. ADD RESOURCE (Captures Branch) ---
router.post(
  "/add",
  verifyToken,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error("Cloudinary Upload Error:", err);
        return res
          .status(500)
          .json({ error: "File upload failed: " + err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided." });
      }

      // Get 'branch' from body
      const { title, description, subject, semester, branch } = req.body;

      const newResource = new Resource({
        title,
        description,
        subject,
        semester,
        branch, // Save the branch
        fileUrl: req.file.path,
        publicId: req.file.filename,
        author: req.user.userId,
        college: req.user.college,
      });

      await newResource.save();
      res.status(201).json("Resource added!");
    } catch (err) {
      console.error("Database Save Error:", err);
      res.status(400).json({ error: err.message });
    }
  }
);

// --- 3. DELETE RESOURCE ---
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) return res.status(404).json("Resource not found.");

    if (resource.author.toString() !== req.user.userId) {
      return res.status(403).json("User not authorized.");
    }

    if (resource.publicId) {
      try {
        await cloudinary.uploader.destroy(resource.publicId);
      } catch (cloudErr) {
        console.error("Cloudinary delete warning:", cloudErr);
      }
    }

    await resource.deleteOne();
    res.json("Resource deleted.");
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
