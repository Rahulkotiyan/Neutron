const router = require("express").Router();
let Post = require("../models/post.model");
const verifyToken = require("../middleware/auth.middleware");

// --- (GET) Get all posts for a college ---
// We get the college from the logged-in user's token
router.get("/", verifyToken, async (req, res) => {
  try {
    const posts = await Post.find({ college: req.user.college })
      .populate("author", "username") // Get author's username
      .sort({ createdAt: -1 }); // Newest first

    res.json(posts);
  } catch (err) {
    res.status(400).json("Error: " + err);
  }
});

// --- (POST) Add a new post ---
router.post("/add", verifyToken, async (req, res) => {
  try {
    const { content } = req.body;
    const author = req.user.userId;
    const college = req.user.college;

    const newPost = new Post({
      content,
      author,
      college,
    });

    await newPost.save();
    res.json("Post added!");
  } catch (err) {
    res.status(400).json("Error: " + err);
  }
});

module.exports = router;
