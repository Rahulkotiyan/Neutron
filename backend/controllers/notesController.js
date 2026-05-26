const crypto = require('crypto');
const { getDb, schema } = require('../db');
const { eq, and, or, like, inArray, desc, sql, ne } = require('drizzle-orm');

const now = () => new Date().toISOString();

exports.getNotes = async (req, res) => {
  try {
    const { subject, semester, branch, documentType, search, college, isGroup, sortBy = "createdAt" } = req.query;
    const db = getDb();
    const conditions = [eq(schema.notesLibrary.isApproved, 1)];

    if (subject && subject !== "ALL") conditions.push(eq(schema.notesLibrary.subject, subject));
    if (semester && semester !== "ALL") conditions.push(eq(schema.notesLibrary.semester, semester));
    if (branch && branch !== "ALL") conditions.push(eq(schema.notesLibrary.branch, branch));
    if (documentType && documentType !== "ALL") conditions.push(eq(schema.notesLibrary.documentType, documentType));
    if (college) conditions.push(eq(schema.notesLibrary.college, college));
    if (isGroup !== undefined && isGroup !== "ALL") conditions.push(eq(schema.notesLibrary.isGroup, isGroup === "true" ? 1 : 0));

    if (search) {
      conditions.push(or(like(schema.notesLibrary.title, `%${search}%`), like(schema.notesLibrary.description, `%${search}%`), like(schema.notesLibrary.subject, `%${search}%`)));
    }

    let orderField;
    switch (sortBy) {
      case "downloads": orderField = desc(schema.notesLibrary.downloads); break;
      case "rating": orderField = desc(schema.notesLibrary.rating); break;
      default: orderField = desc(schema.notesLibrary.createdAt);
    }

    const notes = await db.select().from(schema.notesLibrary).where(and(...conditions)).orderBy(orderField);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching notes" });
  }
};

exports.getNote = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.update(schema.notesLibrary).set({ views: sql`views + 1` }).where(eq(schema.notesLibrary.id, id));
    const notes = await db.select().from(schema.notesLibrary).where(eq(schema.notesLibrary.id, id)).limit(1);
    if (!notes.length) return res.status(404).json({ message: "Note not found" });
    res.json(notes[0]);
  } catch (err) {
    res.status(500).json({ message: "Error fetching note" });
  }
};

exports.createNote = async (req, res) => {
  try {
    const { title, description, subject, semester, branch, documentType, college, tags, fileUrl: driveFileUrl, fileName: driveFileName, isGroup, files } = req.body;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const id = crypto.randomUUID();
    const ts = now();
    const noteData = {
      id, title, description: description || null, subject, semester, branch: branch || null,
      documentType, college: college || user.college,
      uploaderId: user.id, uploaderName: user.name, uploaderEmail: user.email,
      uploaderAvatar: user.avatar, uploaderCollege: user.college,
      isGroup: (isGroup === "true" || isGroup === true) ? 1 : 0,
      createdAt: ts, updatedAt: ts,
    };

    if (tags) {
      noteData.tags = typeof tags === "string" ? JSON.stringify(tags.split(",").map(t => t.trim()).filter(Boolean)) : JSON.stringify(tags);
    }

    if (noteData.isGroup) {
      let parsedFiles = typeof files === "string" ? JSON.parse(files) : (Array.isArray(files) ? files : []);
      if (!parsedFiles.length) return res.status(400).json({ message: "Group notes must have at least one file" });
      noteData.fileUrl = parsedFiles[0].fileUrl;
      noteData.fileName = parsedFiles[0].fileName || "document.pdf";
      noteData.fileSize = parsedFiles[0].fileSize || 0;
      await db.insert(schema.notesLibrary).values(noteData);
      for (const f of parsedFiles) {
        await db.insert(schema.notesFiles).values({ id: crypto.randomUUID(), noteId: id, title: f.title || title, fileUrl: f.fileUrl, fileName: f.fileName || "document.pdf", fileSize: f.fileSize || 0, createdAt: ts });
      }
    } else {
      if (req.file) {
        noteData.fileUrl = req.file.path;
        noteData.fileName = req.file.originalname;
        noteData.fileSize = req.file.size;
      } else if (driveFileUrl) {
        noteData.fileUrl = driveFileUrl;
        noteData.fileName = driveFileName || "document.pdf";
        noteData.fileSize = 0;
      } else {
        return res.status(400).json({ message: "Either file upload or Google Drive link is required" });
      }
      await db.insert(schema.notesLibrary).values(noteData);
      await db.insert(schema.notesFiles).values({ id: crypto.randomUUID(), noteId: id, title, fileUrl: noteData.fileUrl, fileName: noteData.fileName, fileSize: noteData.fileSize, createdAt: ts });
    }

    const note = (await db.select().from(schema.notesLibrary).where(eq(schema.notesLibrary.id, id)).limit(1))[0];
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: "Error creating note", error: err.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, subject, semester, branch, documentType, tags } = req.body;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const notes = await db.select().from(schema.notesLibrary).where(eq(schema.notesLibrary.id, id)).limit(1);
    const note = notes[0];
    if (!note) return res.status(404).json({ message: "Note not found" });
    if (note.uploaderId !== user.id && !user.isAdmin) return res.status(403).json({ message: "Not authorized to update this note" });

    const updates = { updatedAt: now() };
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (subject) updates.subject = subject;
    if (semester) updates.semester = semester;
    if (branch) updates.branch = branch;
    if (documentType) updates.documentType = documentType;
    if (tags) updates.tags = typeof tags === "string" ? tags : JSON.stringify(tags);
    if (req.file) { updates.fileUrl = req.file.path; updates.fileName = req.file.originalname; updates.fileSize = req.file.size; }

    await db.update(schema.notesLibrary).set(updates).where(eq(schema.notesLibrary.id, id));
    const updated = (await db.select().from(schema.notesLibrary).where(eq(schema.notesLibrary.id, id)).limit(1))[0];
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating note" });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const notes = await db.select().from(schema.notesLibrary).where(eq(schema.notesLibrary.id, id)).limit(1);
    const note = notes[0];
    if (!note) return res.status(404).json({ message: "Note not found" });
    if (note.uploaderId !== user.id && !user.isAdmin) return res.status(403).json({ message: "Not authorized to delete this note" });

    await db.delete(schema.notesFiles).where(eq(schema.notesFiles.noteId, id));
    await db.delete(schema.notesComments).where(eq(schema.notesComments.noteId, id));
    await db.delete(schema.notesLikes).where(eq(schema.notesLikes.noteId, id));
    await db.delete(schema.notesLibrary).where(eq(schema.notesLibrary.id, id));
    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting note" });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const existing = await db.select().from(schema.notesLikes).where(and(eq(schema.notesLikes.noteId, id), eq(schema.notesLikes.userId, user.id))).limit(1);
    if (existing.length) {
      await db.delete(schema.notesLikes).where(and(eq(schema.notesLikes.noteId, id), eq(schema.notesLikes.userId, user.id)));
    } else {
      await db.insert(schema.notesLikes).values({ noteId: id, userId: user.id });
    }

    const likes = await db.select({ id: schema.users.id, name: schema.users.name, avatar: schema.users.avatar })
      .from(schema.notesLikes).leftJoin(schema.users, eq(schema.notesLikes.userId, schema.users.id)).where(eq(schema.notesLikes.noteId, id));
    res.json({ likes, likeCount: likes.length });
  } catch (err) {
    res.status(500).json({ message: "Error toggling like" });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const commentId = crypto.randomUUID();
    await db.insert(schema.notesComments).values({ id: commentId, noteId: id, userId: user.id, userName: user.name, userAvatar: user.avatar, text, createdAt: now() });

    const comments = await db.select().from(schema.notesComments).where(eq(schema.notesComments.noteId, id)).orderBy(desc(schema.notesComments.createdAt));
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ message: "Error adding comment" });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const comments = await db.select().from(schema.notesComments).where(and(eq(schema.notesComments.id, commentId), eq(schema.notesComments.noteId, id))).limit(1);
    const comment = comments[0];
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.userId !== user.id && !user.isAdmin) return res.status(403).json({ message: "Not authorized" });

    await db.delete(schema.notesComments).where(eq(schema.notesComments.id, commentId));
    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting comment" });
  }
};

exports.getUserNotes = async (req, res) => {
  try {
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    if (!users.length) return res.status(404).json({ message: "User not found" });

    const notes = await db.select().from(schema.notesLibrary).where(eq(schema.notesLibrary.uploaderId, users[0].id)).orderBy(desc(schema.notesLibrary.createdAt));
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user notes" });
  }
};

exports.incrementDownloads = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.update(schema.notesLibrary).set({ downloads: sql`downloads + 1` }).where(eq(schema.notesLibrary.id, id));
    const notes = await db.select({ downloads: schema.notesLibrary.downloads }).from(schema.notesLibrary).where(eq(schema.notesLibrary.id, id)).limit(1);
    if (!notes.length) return res.status(404).json({ message: "Note not found" });
    res.json({ downloads: notes[0].downloads });
  } catch (err) {
    res.status(500).json({ message: "Error incrementing downloads" });
  }
};

exports.getNotesBySubject = async (req, res) => {
  try {
    const { subject } = req.params;
    const { semester, branch } = req.query;
    const db = getDb();
    const conditions = [eq(schema.notesLibrary.subject, subject), eq(schema.notesLibrary.isApproved, 1)];
    if (semester) conditions.push(eq(schema.notesLibrary.semester, semester));
    if (branch) conditions.push(eq(schema.notesLibrary.branch, branch));

    const notes = await db.select().from(schema.notesLibrary).where(and(...conditions)).orderBy(desc(schema.notesLibrary.downloads));
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching notes" });
  }
};

exports.syncDriveNotes = async (req, res) => {
  try {
    const db = getDb();
    const users = await db.select().from(schema.users).where(and(eq(schema.users.email, req.user.email), eq(schema.users.isAdmin, 1))).limit(1);
    if (!users.length) return res.status(403).json({ message: "Only administrators can trigger Drive sync." });

    const { syncGoogleDriveNotes } = require("../services/cronService");
    const result = await syncGoogleDriveNotes();
    if (result && result.success) {
      res.json({ message: result.message, count: result.count });
    } else {
      res.status(500).json({ message: result?.message || "Sync failed" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error triggering manual sync" });
  }
};
