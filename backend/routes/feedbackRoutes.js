const express = require("express");
const router = express.Router();
const { submitFeedback } = require("../controllers/feedbackController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/feedback", authMiddleware, submitFeedback);

module.exports = router;
