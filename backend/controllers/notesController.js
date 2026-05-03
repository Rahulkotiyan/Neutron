const { NotesLibrary, User } = require("../models/Schema");

// Get all notes with filters
exports.getNotes = async (req, res) => {
  try {
    const {
      subject,
      semester,
      branch,
      documentType,
      search,
      college,
      isGroup,
      sortBy = "createdAt",
    } = req.query;

    let filter = { isApproved: true };

    if (subject && subject !== "ALL") filter.subject = subject;
    if (semester && semester !== "ALL") filter.semester = semester;
    if (branch && branch !== "ALL") filter.branch = branch;
    if (documentType && documentType !== "ALL")
      filter.documentType = documentType;
    if (college) filter.college = college;
    if (isGroup !== undefined && isGroup !== "ALL") {
      filter.isGroup = isGroup === "true";
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    let sortOption = {};
    switch (sortBy) {
      case "downloads":
        sortOption = { downloads: -1 };
        break;
      case "rating":
        sortOption = { rating: -1 };
        break;
      case "likes":
        sortOption = { likes: -1 };
        break;
      case "recent":
      default:
        sortOption = { createdAt: -1 };
    }

    const notes = await NotesLibrary.find(filter)
      .sort(sortOption)
      .populate("uploader._id", "name email avatar college")
      .populate("likes", "name");

    res.json(notes);
  } catch (err) {
    console.error("Error fetching notes:", err);
    res.status(500).json({ message: "Error fetching notes" });
  }
};

// Get single note
exports.getNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await NotesLibrary.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate("uploader._id", "name email avatar college")
      .populate("likes", "name avatar")
      .populate("comments.user", "name avatar");

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(note);
  } catch (err) {
    console.error("Error fetching note:", err);
    res.status(500).json({ message: "Error fetching note" });
  }
};

// Create note (protected) - supports both file upload and Google Drive links
exports.createNote = async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      semester,
      branch,
      documentType,
      college,
      tags,
      fileUrl: driveFileUrl,
      fileName: driveFileName,
      isGroup,
      files,
    } = req.body;

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ message: "Note uploading is strictly limited to administrators." });
    }

    let noteData = {
      title,
      description,
      subject,
      semester,
      branch,
      documentType,
      college: college || user.college,
      isGroup: isGroup === "true" || isGroup === true,
      uploader: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        college: user.college,
      },
    };

    // Parse tags if string
    if (tags) {
      if (typeof tags === "string") {
        noteData.tags = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag);
      } else if (Array.isArray(tags)) {
        noteData.tags = tags;
      }
    }

    if (noteData.isGroup) {
      // Handle Group Upload
      let parsedFiles = [];
      if (typeof files === "string") {
        parsedFiles = JSON.parse(files);
      } else if (Array.isArray(files)) {
        parsedFiles = files;
      }

      if (!parsedFiles || parsedFiles.length === 0) {
        return res.status(400).json({ message: "Group notes must have at least one file" });
      }

      noteData.files = parsedFiles.map(f => ({
        title: f.title || title,
        fileUrl: f.fileUrl,
        fileName: f.fileName || "document.pdf",
        fileSize: f.fileSize || 0
      }));

      // For backwards compatibility and main entry
      noteData.fileUrl = noteData.files[0].fileUrl;
      noteData.fileName = noteData.files[0].fileName;
    } else {
      // Handle Single File Upload
      if (req.file) {
        noteData.fileUrl = req.file.path;
        noteData.fileName = req.file.originalname;
        noteData.fileSize = req.file.size;
      } else if (driveFileUrl) {
        noteData.fileUrl = driveFileUrl;
        noteData.fileName = driveFileName || "document.pdf";
        noteData.fileSize = 0;
      } else {
        return res.status(400).json({
          message: "Either file upload or Google Drive link is required",
        });
      }
      noteData.files = [{
        title: title,
        fileUrl: noteData.fileUrl,
        fileName: noteData.fileName,
        fileSize: noteData.fileSize
      }];
    }

    const note = await NotesLibrary.create(noteData);
    res.status(201).json(note);
  } catch (err) {
    console.error("Error creating note:", err);
    res
      .status(500)
      .json({ message: "Error creating note", error: err.message });
  }
};

// Update note (protected)
exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      subject,
      semester,
      branch,
      documentType,
      tags,
    } = req.body;

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const note = await NotesLibrary.findById(id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.uploader._id.toString() !== user._id.toString() && !user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this note" });
    }

    // Handle file update from Cloudinary
    let fileUrl = note.fileUrl;
    let fileName = note.fileName;
    let fileSize = note.fileSize;

    if (req.file) {
      fileUrl = req.file.path; // Cloudinary URL
      fileName = req.file.originalname;
      fileSize = req.file.size;
    }

    const updatedNote = await NotesLibrary.findByIdAndUpdate(
      id,
      {
        title,
        description,
        subject,
        semester,
        branch,
        documentType,
        fileUrl,
        fileName,
        fileSize,
        tags,
        updatedAt: Date.now(),
      },
      { new: true }
    )
      .populate("uploader._id", "name email avatar college")
      .populate("likes", "name");

    res.json(updatedNote);
  } catch (err) {
    console.error("Error updating note:", err);
    res.status(500).json({ message: "Error updating note" });
  }
};

// Delete note (protected)
exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const note = await NotesLibrary.findById(id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.uploader._id.toString() !== user._id.toString() && !user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this note" });
    }

    await NotesLibrary.findByIdAndDelete(id);
    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("Error deleting note:", err);
    res.status(500).json({ message: "Error deleting note" });
  }
};

// Like/Unlike note (protected)
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const note = await NotesLibrary.findById(id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const likeIndex = note.likes.indexOf(user._id);

    if (likeIndex === -1) {
      note.likes.push(user._id);
    } else {
      note.likes.splice(likeIndex, 1);
    }

    await note.save();
    await note.populate("likes", "name avatar");

    res.json({ likes: note.likes, likeCount: note.likes.length });
  } catch (err) {
    console.error("Error toggling like:", err);
    res.status(500).json({ message: "Error toggling like" });
  }
};

// Add comment to note (protected)
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const note = await NotesLibrary.findById(id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const comment = {
      user: user._id,
      userName: user.name,
      userAvatar: user.avatar,
      text,
    };

    note.comments.push(comment);
    await note.save();
    await note.populate("comments.user", "name avatar");

    res.json({ comments: note.comments });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Error adding comment" });
  }
};

// Delete comment from note (protected)
exports.deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const note = await NotesLibrary.findById(id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const commentIndex = note.comments.findIndex(
      (c) => c._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (note.comments[commentIndex].user.toString() !== user._id.toString() && !user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    note.comments.splice(commentIndex, 1);
    await note.save();

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: "Error deleting comment" });
  }
};

// Get user's uploaded notes (protected)
exports.getUserNotes = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const notes = await NotesLibrary.find({ "uploader._id": user._id })
      .sort({ createdAt: -1 })
      .populate("uploader._id", "name email avatar college")
      .populate("likes", "name");

    res.json(notes);
  } catch (err) {
    console.error("Error fetching user notes:", err);
    res.status(500).json({ message: "Error fetching user notes" });
  }
};

// Increment downloads count
exports.incrementDownloads = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await NotesLibrary.findByIdAndUpdate(
      id,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({ downloads: note.downloads });
  } catch (err) {
    console.error("Error incrementing downloads:", err);
    res.status(500).json({ message: "Error incrementing downloads" });
  }
};

// Get notes by subject (public)
exports.getNotesBySubject = async (req, res) => {
  try {
    const { subject } = req.params;
    const { semester, branch } = req.query;

    let filter = { subject, isApproved: true };
    if (semester) filter.semester = semester;
    if (branch) filter.branch = branch;

    const notes = await NotesLibrary.find(filter)
      .sort({ downloads: -1 })
      .populate("uploader._id", "name avatar")
      .populate("likes", "name");

    res.json(notes);
  } catch (err) {
    console.error("Error fetching notes by subject:", err);
    res.status(500).json({ message: "Error fetching notes" });
  }
};
