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
    const { sort = "new", category = "all" } = req.query;

    let filter = {};
    if (category !== "all") {
      filter.type = category;
    }

    let sortOption = { createdAt: -1 }; // Default: Newest first
    if (sort === "hot") {
      // Hot: Simple heuristic, e.g., likes - dislikes (could be more complex time-decay)
      // For MongoDB simple sort, we might need an aggregation or just sort by upvoteCount if we maintain it.
      // For now, let's rely on upvoteCount which we should maintain on vote.
      sortOption = { upvoteCount: -1, createdAt: -1 };
    } else if (sort === "top") {
      sortOption = { upvoteCount: -1 };
    }

    const post = await Post.find(filter)
      .sort(sortOption)
      .populate("userId", "username profilePicture badges");

    res.status(200).json(post);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* VOTE POST (Upvote/Downvote) */
const votePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, voteType } = req.body; // voteType: "upvote" | "downvote"

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const isLiked = post.likes.includes(userId);
    const isDisliked = post.dislikes.includes(userId);

    if (voteType === "upvote") {
      if (isLiked) {
        // Toggle off upvote
        post.likes = post.likes.filter((uid) => uid !== userId);
      } else {
        // Add upvote, remove downvote if exists
        post.likes.push(userId);
        if (isDisliked) {
          post.dislikes = post.dislikes.filter((uid) => uid !== userId);
        }
      }
    } else if (voteType === "downvote") {
      if (isDisliked) {
        // Toggle off downvote
        post.dislikes = post.dislikes.filter((uid) => uid !== userId);
      } else {
        // Add downvote, remove upvote if exists
        post.dislikes.push(userId);
        if (isLiked) {
          post.likes = post.likes.filter((uid) => uid !== userId);
        }
      }
    }

    // Update score
    post.upvoteCount = post.likes.length - post.dislikes.length;

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

//GET USER POSTS
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const post = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .populate("userId", "username profilePicture");
    res.status(200).json(post);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

module.exports = { createPost, getFeedPosts, votePost, getUserPosts };
