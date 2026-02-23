const crypto = require("crypto");
const db = require("../models/Schema");

const Confessions = db.Confessions;
const User = db.User;

// Generate hash for user (for anonymous identification)
const generateUserHash = (userId) => {
  const secret = process.env.JWT_SECRET || "your-secret-key";
  return crypto
    .createHmac("sha256", secret)
    .update(userId.toString())
    .digest("hex")
    .substring(0, 12);
};

// Get all confessions with filtering and sorting
const getConfessions = async (req, res) => {
  try {
    const {
      category,
      sortBy = "recent",
      search,
      page = 1,
      limit = 20,
    } = req.query;

    let filter = {};
    if (category && category !== "ALL") {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { confession: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    let confessions = await Confessions.find(filter)
      .select("-userId -confessionHash -comments.userHash")
      .lean();

    // Sort
    switch (sortBy) {
      case "recent":
        confessions.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
        break;
      case "popular":
        confessions.sort((a, b) => b.likes.length - a.likes.length);
        break;
      case "mostCommented":
        confessions.sort((a, b) => b.comments.length - a.comments.length);
        break;
      case "mostViewed":
        confessions.sort((a, b) => b.views - a.views);
        break;
      default:
        confessions.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
    }

    // Pagination
    const skip = (page - 1) * limit;
    const paginated = confessions.slice(skip, skip + parseInt(limit));

    res.json({
      confessions: paginated,
      total: confessions.length,
      page: parseInt(page),
      pages: Math.ceil(confessions.length / parseInt(limit)),
    });
  } catch (err) {
    console.error("Error fetching confessions:", err);
    res.status(500).json({ message: "Error fetching confessions" });
  }
};

// Get single confession
const getConfession = async (req, res) => {
  try {
    const { id } = req.params;

    const confession = await Confessions.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true },
    ).select("-userId -confessionHash -comments.userHash");

    if (!confession) {
      return res.status(404).json({ message: "Confession not found" });
    }

    res.json(confession);
  } catch (err) {
    console.error("Error fetching confession:", err);
    res.status(500).json({ message: "Error fetching confession" });
  }
};

// Create confession (anonymous)
const createConfession = async (req, res) => {
  try {
    const { confession, category = "PERSONAL", tags = [] } = req.body;
    const userId = req.user._id;

    if (!confession || confession.trim().length === 0) {
      return res.status(400).json({ message: "Confession cannot be empty" });
    }

    const confessionHash = generateUserHash(userId);

    const newConfession = new Confessions({
      confession,
      category,
      tags: tags.filter((t) => t.trim().length > 0),
      userId,
      confessionHash,
    });

    await newConfession.save();

    // Return without revealing userId or hash
    const confessionData = newConfession.toObject();
    delete confessionData.userId;
    delete confessionData.confessionHash;

    res.status(201).json(confessionData);
  } catch (err) {
    console.error("Error creating confession:", err);
    res.status(500).json({ message: "Error creating confession" });
  }
};

// Update confession (only if owner)
const updateConfession = async (req, res) => {
  try {
    const { id } = req.params;
    const { confession, category, tags } = req.body;
    const userId = req.user._id;

    const existingConfession = await Confessions.findById(id);
    if (!existingConfession) {
      return res.status(404).json({ message: "Confession not found" });
    }

    const confessionHash = generateUserHash(userId);
    if (existingConfession.confessionHash !== confessionHash) {
      return res.status(403).json({
        message: "Not authorized to update this confession",
      });
    }

    if (confession) existingConfession.confession = confession;
    if (category) existingConfession.category = category;
    if (tags) existingConfession.tags = tags.filter((t) => t.trim().length > 0);
    existingConfession.updatedAt = new Date();

    await existingConfession.save();

    const confessionData = existingConfession.toObject();
    delete confessionData.userId;
    delete confessionData.confessionHash;

    res.json(confessionData);
  } catch (err) {
    console.error("Error updating confession:", err);
    res.status(500).json({ message: "Error updating confession" });
  }
};

// Delete confession (only if owner)
const deleteConfession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const confession = await Confessions.findById(id);
    if (!confession) {
      return res.status(404).json({ message: "Confession not found" });
    }

    const confessionHash = generateUserHash(userId);
    if (confession.confessionHash !== confessionHash) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this confession" });
    }

    await Confessions.findByIdAndDelete(id);
    res.json({ message: "Confession deleted successfully" });
  } catch (err) {
    console.error("Error deleting confession:", err);
    res.status(500).json({ message: "Error deleting confession" });
  }
};

// Toggle like
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const confession = await Confessions.findById(id);
    if (!confession) {
      return res.status(404).json({ message: "Confession not found" });
    }

    const likeIndex = confession.likes.indexOf(userId);
    if (likeIndex > -1) {
      confession.likes.splice(likeIndex, 1);
    } else {
      confession.likes.push(userId);
    }

    await confession.save();

    const confessionData = confession.toObject();
    delete confessionData.userId;
    delete confessionData.confessionHash;
    delete confessionData.comments;

    res.json(confessionData);
  } catch (err) {
    console.error("Error toggling like:", err);
    res.status(500).json({ message: "Error toggling like" });
  }
};

// Add comment (anonymous)
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const confession = await Confessions.findById(id);
    if (!confession) {
      return res.status(404).json({ message: "Confession not found" });
    }

    const userHash = generateUserHash(userId);
    const comment = {
      _id: new (require("mongoose").Types.ObjectId)(),
      text,
      userHash,
      createdAt: new Date(),
    };

    confession.comments.push(comment);
    await confession.save();

    // Return only text and createdAt for comments
    const commentData = {
      _id: comment._id,
      text: comment.text,
      createdAt: comment.createdAt,
    };

    res.status(201).json(commentData);
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Error adding comment" });
  }
};

// Delete comment (only if commenter)
const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user._id;

    const confession = await Confessions.findById(id);
    if (!confession) {
      return res.status(404).json({ message: "Confession not found" });
    }

    const comment = confession.comments.find(
      (c) => c._id.toString() === commentId,
    );
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const userHash = generateUserHash(userId);
    if (comment.userHash !== userHash) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    confession.comments = confession.comments.filter(
      (c) => c._id.toString() !== commentId,
    );
    await confession.save();

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: "Error deleting comment" });
  }
};

// Toggle resolved status (owner only)
const toggleResolved = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const confession = await Confessions.findById(id);
    if (!confession) {
      return res.status(404).json({ message: "Confession not found" });
    }

    const confessionHash = generateUserHash(userId);
    if (confession.confessionHash !== confessionHash) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this confession" });
    }

    confession.isResolved = !confession.isResolved;
    await confession.save();

    const confessionData = confession.toObject();
    delete confessionData.userId;
    delete confessionData.confessionHash;
    delete confessionData.comments;

    res.json(confessionData);
  } catch (err) {
    console.error("Error toggling resolved:", err);
    res.status(500).json({ message: "Error toggling resolved" });
  }
};

// Get confessions by category
const getConfessionsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { sortBy = "recent", page = 1, limit = 20 } = req.query;

    const confessions = await Confessions.find({ category })
      .select("-userId -confessionHash -comments.userHash")
      .lean();

    // Sort
    switch (sortBy) {
      case "popular":
        confessions.sort((a, b) => b.likes.length - a.likes.length);
        break;
      case "mostCommented":
        confessions.sort((a, b) => b.comments.length - a.comments.length);
        break;
      case "mostViewed":
        confessions.sort((a, b) => b.views - a.views);
        break;
      default:
        confessions.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
    }

    const skip = (page - 1) * limit;
    const paginated = confessions.slice(skip, skip + parseInt(limit));

    res.json({
      confessions: paginated,
      total: confessions.length,
      page: parseInt(page),
      pages: Math.ceil(confessions.length / parseInt(limit)),
    });
  } catch (err) {
    console.error("Error fetching confessions by category:", err);
    res.status(500).json({ message: "Error fetching confessions" });
  }
};

module.exports = {
  getConfessions,
  getConfession,
  createConfession,
  updateConfession,
  deleteConfession,
  toggleLike,
  addComment,
  deleteComment,
  toggleResolved,
  getConfessionsByCategory,
};
