const router = require("express").Router();
let Resource = require("../models/resource.model");
const verifyToken = require("../middleware/auth.middleware");

// --- (GET) Get all resources for a college ---
router.get("/", verifyToken, async (req, res) => {
  try {
    // You can add query params later: /api/resources?subject=Math
    const query = { college: req.user.college };
    if (req.query.subject) {
      query.subject = req.query.subject;
    }

    const resources = await Resource.find(query)
      .populate("author", "username")
      .sort({ createdAt: -1 });

    res.json(resources);
  } catch (err) {
    res.status(400).json("Error: " + err);
  }
});

// --- (POST) Add a new resource ---
router.post("/add", verifyToken, async (req, res) => {
  try {
    const { title, description, subject, semester, fileUrl } = req.body;

    const newResource = new Resource({
      title,
      description,
      subject,
      semester,
      fileUrl,
      author: req.user.userId,
      college: req.user.college,
    });

    await newResource.save();
    res.json("Resource added!");
  } catch (err) {
    res.status(400).json("Error: " + err);
  }
});

module.exports = router;
