const { Post } = require("../models/Schema");

exports.getPosts = async (req, res) => {
  try {
    const { tag } = req.query;
    const filter = tag ? { tag } : {};
    const posts = await Post.find(filter).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching posts" });
  }
};

exports.createPost = async (req, res) => {
  try {
    const newPost = await Post.create(req.body);
    res.json(newPost);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
