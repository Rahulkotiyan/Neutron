const Post = require("../models/Post");
const User = require("../models/User");

/* CREATE POST */
const createPost = async (req, res) => {
  try {
    const { userId, content, image, type, isAnonymous } = req.body;

    // Fetch user to ensure validity
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const newPost = new Post({
      userId,
      content,
      image: image || "", // This will be a URL from the frontend upload
      type: type || "General",
      isAnonymous: isAnonymous || false,
      likes: [],
      comments: [],
    });

    await newPost.save();

    // Return the updated feed immediately
    const post = await Post.find().sort({ createdAt: -1 });
    res.status(201).json(post);
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
};

/* GET FEED (Read) */
const getFeedPosts = async (req, res) => {
  try {
    // Return posts sorted by newest first
    const post = await Post.find()
      .sort({ createdAt: -1 })
      .populate("userId", "username profilePicture badges");

    // Note: If post is anonymous, we should sanitize the user data in a real production environment here.
    // For now, the frontend will handle hiding the name based on `isAnonymous`.

    res.status(200).json(post);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* LIKE POST */
const likePost = async (req, res) => {
  try {
    const { id } = req.params; // Post ID
    const { userId } = req.body; // Current User ID

    const post = await Post.findById(id);
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter((id) => id !== userId);
    } else {
      // Like
      post.likes.push(userId);
    }

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

module.exports = { createPost, getFeedPosts, likePost };
