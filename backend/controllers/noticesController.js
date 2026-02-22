const { Notices, User, Notification } = require("../models/Schema");
const { getIO } = require("../socket/socketHandler");

// Get all notices with filters
exports.getNotices = async (req, res) => {
  try {
    const {
      noticeType,
      category,
      priority,
      search,
      college,
      sortBy = "createdAt",
      pinned = false,
    } = req.query;

    let filter = { status: "PUBLISHED" };

    if (noticeType && noticeType !== "ALL") filter.noticeType = noticeType;
    if (category && category !== "ALL") filter.category = category;
    if (priority && priority !== "ALL") filter.priority = priority;
    if (college) filter.college = college;
    if (pinned === "true") filter.pinned = true;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    let sortOption = {};
    switch (sortBy) {
      case "priority":
        const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
        sortOption = { priority: 1, createdAt: -1 };
        break;
      case "views":
        sortOption = { views: -1 };
        break;
      case "likes":
        sortOption = { likes: -1 };
        break;
      case "pinned":
        sortOption = { pinned: -1, createdAt: -1 };
        break;
      case "recent":
      default:
        sortOption = { pinned: -1, createdAt: -1 };
    }

    const notices = await Notices.find(filter)
      .sort(sortOption)
      .populate("publisher._id", "name email avatar department college")
      .populate("likes", "name")
      .populate("comments.user", "name avatar");

    res.json(notices);
  } catch (err) {
    console.error("Error fetching notices:", err);
    res.status(500).json({ message: "Error fetching notices" });
  }
};

// Get single notice
exports.getNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Notices.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate("publisher._id", "name email avatar department college")
      .populate("likes", "name avatar")
      .populate("comments.user", "name avatar");

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    res.json(notice);
  } catch (err) {
    console.error("Error fetching notice:", err);
    res.status(500).json({ message: "Error fetching notice" });
  }
};

// Create notice (protected)
exports.createNotice = async (req, res) => {
  try {
    const {
      title,
      description,
      noticeType,
      category,
      priority,
      imageUrl,
      posterUrl,
      attachments,
      eventDate,
      location,
      contactPerson,
      contactPhone,
      contactEmail,
      college,
      tags,
      expiryDate,
    } = req.body;

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle file upload from Cloudinary
    let fileUrl = imageUrl || posterUrl || null;
    if (req.file) {
      fileUrl = req.file.path; // Cloudinary URL
    }

    const notice = await Notices.create({
      title,
      description,
      noticeType,
      category,
      priority,
      imageUrl: fileUrl,
      posterUrl: fileUrl,
      attachments: attachments || [],
      eventDate,
      location,
      contactPerson,
      contactPhone,
      contactEmail,
      college: college || user.college,
      tags: tags || [],
      expiryDate,
      publisher: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        department: user.department,
        college: user.college,
      },
    });

    // Respond immediately — don't block on notifications
    res.status(201).json(notice);

    // Fire college-wide notifications in the background
    setImmediate(async () => {
      try {
        const college = notice.college || user.college;

        // Get all users in the same college, excluding the publisher
        const collegeUsers = await User.find(
          { college, _id: { $ne: user._id } },
          "_id"
        ).lean();

        if (collegeUsers.length === 0) return;

        const notificationTitle = `📢 New ${notice.noticeType || "Notice"}`;
        const notificationMessage = `${user.name} posted: "${notice.title}"`;

        // Bulk-create DB notifications
        const notificationDocs = collegeUsers.map((u) => ({
          recipient: u._id,
          sender: user._id,
          type: "NOTICE",
          title: notificationTitle,
          message: notificationMessage,
          relatedEntity: {
            entityType: "NOTICE",
            entityId: notice._id,
          },
          isRead: false,
          createdAt: new Date(),
        }));

        await Notification.insertMany(notificationDocs, { ordered: false });

        // Emit real-time socket event to each online recipient
        let io;
        try {
          io = getIO();
        } catch (_) {
          // Socket not initialised – skip real-time, DB notifications already saved
          return;
        }

        const payload = {
          type: "NOTICE",
          title: notificationTitle,
          message: notificationMessage,
          notice: {
            _id: notice._id,
            title: notice.title,
            noticeType: notice.noticeType,
            priority: notice.priority,
          },
          sender: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
          },
          createdAt: new Date(),
        };

        collegeUsers.forEach((u) => {
          io.to(u._id.toString()).emit("new_notification", payload);
        });

        console.log(
          `✅ Notice notifications sent to ${collegeUsers.length} users in ${college}`
        );
      } catch (notifErr) {
        console.error("Error sending notice notifications:", notifErr);
      }
    });

  } catch (err) {
    console.error("Error creating notice:", err);
    res
      .status(500)
      .json({ message: "Error creating notice", error: err.message });
  }
};

// Update notice (protected)
exports.updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      noticeType,
      category,
      priority,
      imageUrl,
      posterUrl,
      attachments,
      eventDate,
      location,
      contactPerson,
      contactPhone,
      contactEmail,
      tags,
      status,
      expiryDate,
    } = req.body;

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const notice = await Notices.findById(id);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    if (notice.publisher._id.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this notice" });
    }

    // Handle file update from Cloudinary
    let fileUrl = imageUrl || posterUrl || notice.imageUrl;
    if (req.file) {
      fileUrl = req.file.path; // Cloudinary URL
    }

    const updatedNotice = await Notices.findByIdAndUpdate(
      id,
      {
        title,
        description,
        noticeType,
        category,
        priority,
        imageUrl: fileUrl,
        posterUrl: fileUrl,
        attachments,
        eventDate,
        location,
        contactPerson,
        contactPhone,
        contactEmail,
        tags,
        status,
        expiryDate,
        updatedAt: Date.now(),
      },
      { new: true }
    )
      .populate("publisher._id", "name email avatar department college")
      .populate("likes", "name");

    res.json(updatedNotice);
  } catch (err) {
    console.error("Error updating notice:", err);
    res.status(500).json({ message: "Error updating notice" });
  }
};

// Delete notice (protected)
exports.deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const notice = await Notices.findById(id);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    if (notice.publisher._id.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this notice" });
    }

    await Notices.findByIdAndDelete(id);
    res.json({ message: "Notice deleted successfully" });
  } catch (err) {
    console.error("Error deleting notice:", err);
    res.status(500).json({ message: "Error deleting notice" });
  }
};

// Like/Unlike notice (protected)
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const notice = await Notices.findById(id);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    const likeIndex = notice.likes.indexOf(user._id);

    if (likeIndex === -1) {
      notice.likes.push(user._id);
    } else {
      notice.likes.splice(likeIndex, 1);
    }

    await notice.save();
    await notice.populate("likes", "name avatar");

    res.json({ likes: notice.likes, likeCount: notice.likes.length });
  } catch (err) {
    console.error("Error toggling like:", err);
    res.status(500).json({ message: "Error toggling like" });
  }
};

// Share notice (protected)
exports.toggleShare = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const notice = await Notices.findById(id);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    const shareIndex = notice.shares.indexOf(user._id);

    if (shareIndex === -1) {
      notice.shares.push(user._id);
    } else {
      notice.shares.splice(shareIndex, 1);
    }

    await notice.save();

    res.json({ shares: notice.shares, shareCount: notice.shares.length });
  } catch (err) {
    console.error("Error toggling share:", err);
    res.status(500).json({ message: "Error toggling share" });
  }
};

// Add comment to notice (protected)
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const notice = await Notices.findById(id);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    const comment = {
      user: user._id,
      userName: user.name,
      userAvatar: user.avatar,
      text,
    };

    notice.comments.push(comment);
    await notice.save();
    await notice.populate("comments.user", "name avatar");

    res.json({ comments: notice.comments });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Error adding comment" });
  }
};

// Delete comment from notice (protected)
exports.deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const notice = await Notices.findById(id);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    const commentIndex = notice.comments.findIndex(
      (c) => c._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (notice.comments[commentIndex].user.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    notice.comments.splice(commentIndex, 1);
    await notice.save();

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: "Error deleting comment" });
  }
};

// Pin/Unpin notice (admin only - for now anyone can pin their own)
exports.togglePin = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const notice = await Notices.findById(id);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    if (notice.publisher._id.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to pin this notice" });
    }

    notice.pinned = !notice.pinned;
    await notice.save();

    res.json({ pinned: notice.pinned });
  } catch (err) {
    console.error("Error toggling pin:", err);
    res.status(500).json({ message: "Error toggling pin" });
  }
};

// Get user's posted notices (protected)
exports.getUserNotices = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const notices = await Notices.find({ "publisher._id": user._id })
      .sort({ createdAt: -1 })
      .populate("publisher._id", "name email avatar department college")
      .populate("likes", "name");

    res.json(notices);
  } catch (err) {
    console.error("Error fetching user notices:", err);
    res.status(500).json({ message: "Error fetching user notices" });
  }
};

// Get notices by category (public)
exports.getNoticesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const notices = await Notices.find({
      category,
      status: "PUBLISHED",
    })
      .sort({ pinned: -1, createdAt: -1 })
      .populate("publisher._id", "name avatar")
      .populate("likes", "name");

    res.json(notices);
  } catch (err) {
    console.error("Error fetching notices by category:", err);
    res.status(500).json({ message: "Error fetching notices" });
  }
};

// Get featured/pinned notices
exports.getFeaturedNotices = async (req, res) => {
  try {
    const notices = await Notices.find({
      pinned: true,
      status: "PUBLISHED",
    })
      .limit(10)
      .sort({ createdAt: -1 })
      .populate("publisher._id", "name avatar")
      .populate("likes", "name");

    res.json(notices);
  } catch (err) {
    console.error("Error fetching featured notices:", err);
    res.status(500).json({ message: "Error fetching featured notices" });
  }
};
