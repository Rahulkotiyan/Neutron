const { Post, User } = require("../models/Schema");

// Get Posts with College Filtering
exports.getPosts = async (req, res) => {
  try {
    const { tag, college } = req.query;

    // Build filter object
    const filter = {};
    if (tag) filter.tag = tag;

    // If college is specified, filter by that college
    // If college is "Global" or not specified, show all posts
    if (college && college !== "Global") {
      filter.college = college;
    }

    const posts = await Post.find(filter)
      .populate("author", "name handle avatar")
      .populate("comments.user", "name handle avatar")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Error fetching posts" });
  }
};

// Get Global Feed (all colleges)
exports.getGlobalFeed = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name handle avatar")
      .populate("comments.user", "name handle avatar")
      .sort({ createdAt: -1 })
      .limit(50); // Limit for performance

    res.json(posts);
  } catch (err) {
    console.error("Error fetching global feed:", err);
    res.status(500).json({ message: "Error fetching global feed" });
  }
};

// Get College-Specific Feed
exports.getCollegeFeed = async (req, res) => {
  try {
    const { college } = req.params;

    if (!college) {
      return res.status(400).json({ message: "College parameter required" });
    }

    const posts = await Post.find({ college })
      .populate("author", "name handle avatar")
      .populate("comments.user", "name handle avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (err) {
    console.error("Error fetching college feed:", err);
    res.status(500).json({ message: "Error fetching college feed" });
  }
};

// Create Post
exports.createPost = async (req, res) => {
  try {
    const { title, desc, tag, college } = req.body;

    if (!req.user || !req.user.email) {
      console.log("❌ Error: req.user is undefined. Middleware did not run.");
      return res
        .status(401)
        .json({ message: "Unauthorized: User not identified" });
    }

    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newPost = await Post.create({
      title,
      desc,
      tag: tag || "GENERAL",
      author: user._id,
      college: college || "Global", // Default to Global if not specified
      createdAt: new Date(),
    });

    const populatedPost = await Post.findById(newPost._id).populate(
      "author",
      "name handle avatar"
    );

    res.status(201).json(populatedPost);
  } catch (e) {
    console.error("Error creating post:", e);
    res.status(500).json({ message: e.message });
  }
};

// Toggle Like
exports.likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(user._id);

    if (isLiked) {
      post.likes.pull(user._id);
    } else {
      post.likes.push(user._id);
    }

    await post.save();
    res.json({ likes: post.likes, likesCount: post.likes.length });
  } catch (e) {
    console.error("Error liking post:", e);
    res.status(500).json({ message: e.message });
  }
};

// Add Comment
exports.commentPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = {
      user: user._id,
      text,
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    // Re-fetch to populate the new comment author
    const updatedPost = await Post.findById(id).populate(
      "comments.user",
      "name handle avatar"
    );

    res.json(updatedPost.comments);
  } catch (e) {
    console.error("Error commenting on post:", e);
    res.status(500).json({ message: e.message });
  }
};

// Repost
exports.repostPost = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.reposts.includes(user._id)) {
      return res.status(400).json({ message: "Already reposted" });
    }

    post.reposts.push(user._id);
    await post.save();

    res.json({ reposts: post.reposts, repostsCount: post.reposts.length });
  } catch (e) {
    console.error("Error reposting:", e);
    res.status(500).json({ message: e.message });
  }
};

// Get list of all colleges (for dropdown/filter)
exports.getColleges = async (req, res) => {
  try {
    const colleges = await Post.distinct("college");
    res.json(colleges.filter((c) => c && c !== "Global"));
  } catch (err) {
    console.error("Error fetching colleges:", err);
    res.status(500).json({ message: "Error fetching colleges" });
  }
};
