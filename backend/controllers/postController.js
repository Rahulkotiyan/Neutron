const { Post, User, Notification } = require("../models/Schema");

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

// Get Global Feed (all colleges - includes both global and campus-specific posts)
exports.getGlobalFeed = async (req, res) => {
  try {
    const { cursor, limit = 20 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 50); // Max 50 posts per request

    // Build query
    const query = {};
    if (cursor) {
      // Cursor-based pagination using createdAt timestamp
      query.createdAt = { $lt: new Date(cursor) };
    }

    // Fetch posts with pagination
    const posts = await Post.find(query)
      .populate("author", "name handle avatar")
      .populate("comments.user", "name handle avatar")
      .sort({ createdAt: -1 })
      .limit(limitNum + 1); // Fetch one extra to determine if there are more posts

    // Check if there are more posts
    const hasMore = posts.length > limitNum;
    const postsToReturn = hasMore ? posts.slice(0, limitNum) : posts;

    // Get next cursor (timestamp of the last post)
    const nextCursor = postsToReturn.length > 0 ? postsToReturn[postsToReturn.length - 1].createdAt.toISOString() : null;

    res.json({
      posts: postsToReturn,
      hasMore,
      nextCursor
    });
  } catch (err) {
    console.error("Error fetching global feed:", err);
    res.status(500).json({ message: "Error fetching global feed" });
  }
};

// Get College-Specific Feed
exports.getCollegeFeed = async (req, res) => {
  try {
    const { college } = req.params;
    const { cursor, limit = 20 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 50); // Max 50 posts per request

    if (!college) {
      return res.status(400).json({ message: "College parameter required" });
    }

    // Build query
    const query = { college };
    if (cursor) {
      // Cursor-based pagination using createdAt timestamp
      query.createdAt = { $lt: new Date(cursor) };
    }

    // Fetch posts with pagination
    const posts = await Post.find(query)
      .populate("author", "name handle avatar")
      .populate("comments.user", "name handle avatar")
      .sort({ createdAt: -1 })
      .limit(limitNum + 1); // Fetch one extra to determine if there are more posts

    // Check if there are more posts
    const hasMore = posts.length > limitNum;
    const postsToReturn = hasMore ? posts.slice(0, limitNum) : posts;

    // Get next cursor (timestamp of the last post)
    const nextCursor = postsToReturn.length > 0 ? postsToReturn[postsToReturn.length - 1].createdAt.toISOString() : null;

    res.json({
      posts: postsToReturn,
      hasMore,
      nextCursor
    });
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

    // Check daily posting limit
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const postsToday = await Post.countDocuments({
      author: user._id,
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    const limit = 1; // 1 post per day
    if (postsToday >= limit) {
      return res.status(429).json({
        message: "Daily posting limit reached. You can post again tomorrow.",
        limit,
        postsToday,
        nextReset: endOfDay.toISOString()
      });
    }

    // Handle file upload if present
    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path; // Cloudinary returns the URL in req.file.path
    }

    const newPost = await Post.create({
      title,
      desc,
      image: imageUrl, // Store Cloudinary URL
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
    const post = await Post.findById(id).populate('author', 'name email');

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(user._id);

    if (isLiked) {
      post.likes.pull(user._id);
    } else {
      post.likes.push(user._id);
      
      // Create notification for post author (if not liking own post)
      if (post.author._id.toString() !== user._id.toString()) {
        await Notification.create({
          recipient: post.author._id,
          sender: user._id,
          type: "LIKE",
          title: "New Like",
          message: `${user.name} liked your post`,
          relatedEntity: {
            entityType: "POST",
            entityId: post._id
          }
        });
      }
    }

    await post.save();
    res.json({ likes: post.likes, likesCount: post.likes.length });
  } catch (e) {
    console.error("Error liking post:", e);
    res.status(500).json({ message: e.message });
  }
};

// Toggle Dislike
exports.dislikePost = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isDisliked = post.dislikes.includes(user._id);

    if (isDisliked) {
      post.dislikes.pull(user._id);
    } else {
      // If user liked the post, remove like
      if (post.likes.includes(user._id)) {
        post.likes.pull(user._id);
      }
      post.dislikes.push(user._id);
    }

    await post.save();
    res.json({ dislikes: post.dislikes, dislikesCount: post.dislikes.length, likes: post.likes });
  } catch (e) {
    console.error("Error disliking post:", e);
    res.status(500).json({ message: e.message });
  }
};

// Add Comment
exports.commentPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const post = await Post.findById(id).populate('author', 'name email');
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
    
    // Create notification for post author (if not commenting on own post)
    if (post.author._id.toString() !== user._id.toString()) {
      await Notification.create({
        recipient: post.author._id,
        sender: user._id,
        type: "COMMENT",
        title: "New Comment",
        message: `${user.name} commented: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        relatedEntity: {
          entityType: "POST",
          entityId: post._id
        }
      });
    }

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

// Get user's posts
exports.getUserPosts = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const posts = await Post.find({ author: user._id })
      .populate("author", "name handle avatar")
      .populate("comments.user", "name handle avatar")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("Error fetching user posts:", err);
    res.status(500).json({ message: "Error fetching user posts" });
  }
};

// Get posts for a specific user by ID
exports.getUserPostsById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const posts = await Post.find({ author: userId })
      .populate("author", "name handle avatar")
      .populate("comments.user", "name handle avatar")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("Error fetching user posts:", err);
    res.status(500).json({ message: "Error fetching user posts" });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is the author
    if (post.author.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own posts" });
    }

    await Post.findByIdAndDelete(id);
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: "Error deleting post" });
  }
};

// Check user's daily posting limit
exports.checkDailyPostingLimit = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get today's start and end
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Count posts created by this user today
    const postsToday = await Post.countDocuments({
      author: user._id,
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    const limit = 1; // 1 post per day
    const canPost = postsToday < limit;
    const postsRemaining = Math.max(0, limit - postsToday);

    res.json({
      canPost,
      postsToday,
      postsRemaining,
      limit,
      nextReset: endOfDay.toISOString()
    });
  } catch (err) {
    console.error("Error checking daily posting limit:", err);
    res.status(500).json({ message: "Error checking posting limit" });
  }
};

// Increment post views
exports.incrementViews = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Increment views count
    post.views = (post.views || 0) + 1;
    await post.save();

    res.json({ views: post.views });
  } catch (err) {
    console.error("Error incrementing views:", err);
    res.status(500).json({ message: "Error incrementing views" });
  }
};
