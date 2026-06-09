const { sendReportToDiscord } = require('../utils/discordWebhook');

const submitReport = async (req, res) => {
  try {
    const { target_id, target_type, reason, additional_info } = req.body;
    if (!target_id || !target_type || !reason) return res.status(400).json({ message: "Missing required fields" });

    await sendReportToDiscord({
      targetType: target_type,
      targetId: target_id,
      reason,
      additionalInfo: additional_info || null,
      reporter: req.user.name || req.user.email,
    });

    res.status(201).json({ message: "Report submitted. Our team will review it." });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit report" });
  }
};

module.exports = { submitReport };
