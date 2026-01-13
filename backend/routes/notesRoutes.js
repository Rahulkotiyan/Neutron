const express = require("express");
const router = express.Router();
const notesController = require("../controllers/notesController");
const verifyToken = require("../middleware/authMiddleware");
const { uploadNote } = require("../middleware/uploadMiddleware");

// Public routes
router.get("/", notesController.getNotes);
router.get("/:id", notesController.getNote);
router.get("/subject/:subject", notesController.getNotesBySubject);

// Protected routes
// Create note - file upload is optional (can use Google Drive link instead)
router.post(
  "/",
  verifyToken,
  uploadNote.single("file"),
  notesController.createNote
);
router.put(
  "/:id",
  verifyToken,
  uploadNote.single("file"),
  notesController.updateNote
);
router.delete("/:id", verifyToken, notesController.deleteNote);
router.post("/:id/like", verifyToken, notesController.toggleLike);
router.post("/:id/comment", verifyToken, notesController.addComment);
router.delete(
  "/:id/comment/:commentId",
  verifyToken,
  notesController.deleteComment
);
router.post("/:id/download", notesController.incrementDownloads);
router.get("/user/my-notes", verifyToken, notesController.getUserNotes);

module.exports = router;
