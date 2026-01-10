const { LostFound, User } = require("../models/Schema");

// Get all lost & found posts with filters
exports.getLostFoundPosts = async (req, res) => {
  try {
    const { type, category, status, search, college } = req.query;
    let filter = {};

    if (type && type !== "ALL") filter.type = type;
    if (category && category !== "ALL") filter.category = category;
    if (status) filter.status = status;
    if (college) filter.college = college;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { itemName: { $regex: search, $options: "i" } },
      ];
    }

    const posts = await LostFound.find(filter)
      .sort({ createdAt: -1 })
      .populate("poster._id", "name email phoneNumber avatar college");

    res.json(posts);
  } catch (err) {
    console.error("Error fetching lost & found posts:", err);
    res.status(500).json({ message: "Error fetching posts" });
  }
};

// Get single post
exports.getLostFoundPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await LostFound.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate("poster._id", "name email phoneNumber avatar college");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ message: "Error fetching post" });
  }
};

// Create lost & found post (protected)
exports.createLostFoundPost = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      category,
      location,
      date,
      itemName,
      color,
      distinguishingMarks,
      college,
    } = req.body;

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle image upload from Cloudinary
    let imageUrl = req.body.image || null;
    if (req.file) {
      imageUrl = req.file.path; // Cloudinary URL
    }

    const post = await LostFound.create({
      title,
      description,
      type,
      category,
      image: imageUrl,
      location,
      date,
      itemName,
      color,
      distinguishingMarks,
      college: college || user.college,
      poster: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        college: user.college,
      },
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("Error creating post:", err);
    res
      .status(500)
      .json({ message: "Error creating post", error: err.message });
  }
};

// Add response to lost & found post (protected)
exports.addResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, phoneNumber } = req.body;

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await LostFound.findByIdAndUpdate(
      id,
      {
        $push: {
          responses: {
            user: user._id,
            message,
            phoneNumber,
            createdAt: Date.now(),
          },
        },
      },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    console.error("Error adding response:", err);
    res.status(500).json({ message: "Error adding response" });
  }
};

// Update post status (protected)
exports.updatePostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await LostFound.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.poster._id.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this post" });
    }

    post.status = status;
    post.updatedAt = Date.now();
    await post.save();

    res.json(post);
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ message: "Error updating post" });
  }
};

// Delete post (protected)
exports.deleteLostFoundPost = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await LostFound.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.poster._id.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    await LostFound.findByIdAndDelete(id);
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: "Error deleting post" });
  }
};

// Get user's own posts (protected)
exports.getUserPosts = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const posts = await LostFound.find({ "poster._id": user._id }).sort({
      createdAt: -1,
    });

    res.json(posts);
  } catch (err) {
    console.error("Error fetching user posts:", err);
    res.status(500).json({ message: "Error fetching posts" });
  }
};
