const express = require("express");
const router = express.Router();
const notesController = require("../controllers/notesController");
const verifyToken = require("../middleware/authMiddleware");

// Public routes
router.get("/", notesController.getNotes);
router.get("/:id", notesController.getNote);
router.get("/subject/:subject", notesController.getNotesBySubject);

// Protected routes
router.post("/", verifyToken, notesController.createNote);
router.put("/:id", verifyToken, notesController.updateNote);
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
