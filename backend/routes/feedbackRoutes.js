const express = require("express");
const router = express.Router();
const { submitFeedback } = require("../controllers/feedbackController");

// Public on purpose: guests can submit feedback too (userId captured when logged in).
router.post("/feedback", submitFeedback);

module.exports = router;