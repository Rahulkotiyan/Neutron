const { Post, User, Notification } = require("../models/Schema");
const mongoose = require("mongoose");
const { getIO } = require("../socket/socketHandler");

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

    // Filter out deleted comments from each post
    const postsWithFilteredComments = posts.map(post => {
      const postObj = post.toObject();
      if (postObj.comments) {
        postObj.comments = postObj.comments.filter(c => !c.isDeleted);
      }
      return postObj;
    });

    res.json(postsWithFilteredComments);
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

    // Filter out deleted comments from each post
    const filteredPosts = postsToReturn.map(post => {
      const postObj = post.toObject();
      if (postObj.comments) {
        postObj.comments = postObj.comments.filter(c => !c.isDeleted);
      }
      return postObj;
    });

    // Get next cursor (timestamp of the last post)
    const nextCursor = postsToReturn.length > 0 ? postsToReturn[postsToReturn.length - 1].createdAt.toISOString() : null;

    res.json({
      posts: filteredPosts,
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

    // Filter out deleted comments from each post
    const filteredPosts = postsToReturn.map(post => {
      const postObj = post.toObject();
      if (postObj.comments) {
        postObj.comments = postObj.comments.filter(c => !c.isDeleted);
      }
      return postObj;
    });

    // Get next cursor (timestamp of the last post)
    const nextCursor = postsToReturn.length > 0 ? postsToReturn[postsToReturn.length - 1].createdAt.toISOString() : null;

    res.json({
      posts: filteredPosts,
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
    const { title, desc, tag, college, poll, location, scheduledAt } = req.body;

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
      poll: poll ? JSON.parse(poll) : undefined,
      location: location ? JSON.parse(location) : undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
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

// Add Comment (Enhanced with Image Support)
exports.commentPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const user = await User.findOne({ email: req.user.email });

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    if (text.length > 280) {
      return res.status(400).json({ message: "Comment cannot exceed 280 characters" });
    }

    const post = await Post.findById(id).populate('author', 'name email');
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Handle image upload if present
    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path; // Cloudinary returns the URL in req.file.path
    }

    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      user: user._id,
      text: text.trim(),
      createdAt: new Date(),
      likes: [],
      replies: [],
      isDeleted: false,
      reports: [],
      image: imageUrl // Add image field
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

    // Return the newly added comment
    const addedComment = updatedPost.comments[updatedPost.comments.length - 1];

    // Emit socket event for real-time updates
    try {
      const io = getIO();
      io.to(`post_${id}`).emit("new_comment", {
        postId: id,
        comment: addedComment
      });
    } catch (socketErr) {
      console.error("Socket emission failed for comment:", socketErr);
    }

    res.json(addedComment);
  } catch (e) {
    console.error("Error commenting on post:", e);
    res.status(500).json({ message: e.message });
  }
};

// Reply to a comment (Enhanced with Image Support)
exports.replyToComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { text } = req.body;
    const user = await User.findOne({ email: req.user.email });

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Reply text is required" });
    }

    if (text.length > 280) {
      return res.status(400).json({ message: "Reply cannot exceed 280 characters" });
    }

    const post = await Post.findById(id).populate('author', 'name email');
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Find the parent comment
    const parentComment = post.comments.id(commentId);
    if (!parentComment) {
      return res.status(404).json({ message: "Parent comment not found" });
    }

    // Handle image upload if present
    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path; // Cloudinary returns the URL in req.file.path
    }

    const newReply = {
      _id: new mongoose.Types.ObjectId(),
      user: user._id,
      text: text.trim(),
      createdAt: new Date(),
      likes: [],
      parentComment: commentId,
      image: imageUrl // Add image field
    };

    parentComment.replies.push(newReply);
    await post.save();

    // Create notification for parent comment author (if not replying to own comment)
    if (parentComment.user.toString() !== user._id.toString()) {
      await Notification.create({
        recipient: parentComment.user,
        sender: user._id,
        type: "REPLY",
        title: "New Reply",
        message: `${user.name} replied to your comment: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        relatedEntity: {
          entityType: "COMMENT",
          entityId: commentId
        }
      });
    }

    // Re-fetch to populate the reply author
    const updatedPost = await Post.findById(id).populate(
      "comments.user comments.replies.user",
      "name handle avatar"
    );

    // Find and return the newly added reply
    const updatedParentComment = updatedPost.comments.id(commentId);
    const addedReply = updatedParentComment.replies[updatedParentComment.replies.length - 1];

    // Emit socket event for real-time updates
    try {
      const io = getIO();
      io.to(`post_${id}`).emit("new_reply", {
        postId: id,
        commentId: commentId,
        reply: addedReply
      });
    } catch (socketErr) {
      console.error("Socket emission failed for reply:", socketErr);
    }

    res.json(addedReply);
  } catch (e) {
    console.error("Error replying to comment:", e);
    res.status(500).json({ message: e.message });
  }
};

// Like/Unlike a comment
exports.likeComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const isLiked = comment.likes.includes(user._id);

    if (isLiked) {
      comment.likes.pull(user._id);
    } else {
      comment.likes.push(user._id);
    }

    await post.save();
    res.json({ likes: comment.likes, likesCount: comment.likes.length });
  } catch (e) {
    console.error("Error liking comment:", e);
    res.status(500).json({ message: e.message });
  }
};

// Like/Unlike a reply
exports.likeReply = async (req, res) => {
  try {
    const { id, commentId, replyId } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    const isLiked = reply.likes.includes(user._id);

    if (isLiked) {
      reply.likes.pull(user._id);
    } else {
      reply.likes.push(user._id);
    }

    await post.save();
    res.json({ likes: reply.likes, likesCount: reply.likes.length });
  } catch (e) {
    console.error("Error liking reply:", e);
    res.status(500).json({ message: e.message });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user is the author of the comment
    if (comment.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own comments" });
    }

    // Remove the comment
    comment.remove();
    await post.save();
    res.json({ message: "Comment deleted successfully" });
  } catch (e) {
    console.error("Error deleting comment:", e);
    res.status(500).json({ message: e.message });
  }
};

// Delete a reply
exports.deleteReply = async (req, res) => {
  try {
    const { id, commentId, replyId } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    // Check if user is the author of the reply
    if (reply.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own replies" });
    }

    // Remove the reply
    reply.remove();
    await post.save();
    res.json({ message: "Reply deleted successfully" });
  } catch (e) {
    console.error("Error deleting reply:", e);
    res.status(500).json({ message: e.message });
  }
};

// Report a comment
exports.reportComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { reason } = req.body;
    const user = await User.findOne({ email: req.user.email });

    if (!reason) {
      return res.status(400).json({ message: "Report reason is required" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user already reported this comment
    const existingReport = comment.reports.find(
      report => report.reporter.toString() === user._id.toString()
    );

    if (existingReport) {
      return res.status(400).json({ message: "You have already reported this comment" });
    }

    // Add report
    comment.reports.push({
      reporter: user._id,
      reason,
      createdAt: new Date()
    });

    await post.save();
    res.json({ message: "Comment reported successfully" });
  } catch (e) {
    console.error("Error reporting comment:", e);
    res.status(500).json({ message: e.message });
  }
};

// Get comments for a post
exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate("comments.user", "name handle avatar")
      .populate("comments.replies.user", "name handle avatar")
      .sort({ "comments.createdAt": -1 });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Filter out deleted comments and sort by newest first
    const activeComments = post.comments
      .filter(comment => !comment.isDeleted)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(activeComments);
  } catch (e) {
    console.error("Error fetching comments:", e);
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

    // Filter out deleted comments from each post
    const filteredPosts = posts.map(post => {
      const postObj = post.toObject();
      if (postObj.comments) {
        postObj.comments = postObj.comments.filter(c => !c.isDeleted);
      }
      return postObj;
    });

    res.json(filteredPosts);
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

    // Filter out deleted comments from each post
    const filteredPosts = posts.map(post => {
      const postObj = post.toObject();
      if (postObj.comments) {
        postObj.comments = postObj.comments.filter(c => !c.isDeleted);
      }
      return postObj;
    });

    res.json(filteredPosts);
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

    // Emit socket event for real-time updates
    try {
      const io = getIO();
      io.to(`post_${id}`).emit("view_update", {
        postId: id,
        views: post.views
      });
    } catch (socketErr) {
      console.error("Socket emission failed for views:", socketErr);
    }

    res.json({ views: post.views });
  } catch (err) {
    console.error("Error incrementing views:", err);
    res.status(500).json({ message: "Error incrementing views" });
  }
};
// Vote in a Poll
exports.votePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { optionIndex } = req.body;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await Post.findById(id);
    if (!post || !post.poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Check if user already voted in this poll
    let userVoted = false;
    post.poll.options.forEach(option => {
      if (option.votes.includes(user._id)) {
        userVoted = true;
      }
    });

    if (userVoted) {
      return res.status(400).json({ message: "User already voted" });
    }

    if (optionIndex < 0 || optionIndex >= post.poll.options.length) {
      return res.status(400).json({ message: "Invalid option index" });
    }

    post.poll.options[optionIndex].votes.push(user._id);
    await post.save();

    const populatedPost = await Post.findById(id).populate(
      "author",
      "name handle avatar"
    );

    res.json(populatedPost);
  } catch (e) {
    console.error("Error voting on poll:", e);
    res.status(500).json({ message: e.message });
  }
};
