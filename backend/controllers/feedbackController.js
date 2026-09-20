const { v4: uuidv4 } = require('uuid');
const { getDb, schema } = require('../db');
const { sendFeedbackToDiscord } = require('../utils/discordWebhook');

const MAX_MESSAGE_LENGTH = 2000;
const MAX_NAME_LENGTH = 100;

const submitFeedback = async (req, res) => {
  try {
    const name = (req.body.name || "").trim().slice(0, MAX_NAME_LENGTH);
    const email = (req.body.email || "").trim().slice(0, 200) || null;
    const category = req.body.category;
    const message = (req.body.message || "").trim();
    const rating = req.body.rating;

    if (!name || !category || !message) return res.status(400).json({ message: "Name, category, and message are required" });
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` });
    }

    const validCategories = ["bug", "feature", "improvement", "general", "other"];
    if (!validCategories.includes(category)) return res.status(400).json({ message: "Invalid category" });

    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    const feedback = {
      id,
      // req.user is present only when a logged-in user submits (auth is optional now).
      userId: req.user?.id || req.user?._id || null,
      name,
      email,
      category,
      message,
      rating: rating != null ? Math.min(5, Math.max(1, parseInt(rating))) : null,
      createdAt: now,
    };

    await db.insert(schema.feedback).values(feedback);

    await sendFeedbackToDiscord(feedback);

    res.status(201).json({ message: "Feedback submitted. Thank you!" });
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({ message: "Failed to submit feedback" });
  }
};

module.exports = { submitFeedback };