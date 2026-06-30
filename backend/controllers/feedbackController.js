const { v4: uuidv4 } = require('uuid');
const { getDb, schema } = require('../db');
const { sendFeedbackToDiscord } = require('../utils/discordWebhook');

const submitFeedback = async (req, res) => {
  try {
    const { name, email, category, message, rating } = req.body;
    if (!name || !category || !message) return res.status(400).json({ message: "Name, category, and message are required" });

    const validCategories = ["bug", "feature", "improvement", "general", "other"];
    if (!validCategories.includes(category)) return res.status(400).json({ message: "Invalid category" });

    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    const feedback = {
      id,
      userId: req.user?.id || null,
      name,
      email: email || null,
      category,
      message,
      rating: rating ? Math.min(5, Math.max(1, parseInt(rating))) : null,
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
