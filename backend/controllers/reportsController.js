const { Report, Post, User, Notification } = require("../models/Schema");

// Submit a report
const submitReport = async (req, res) => {
  try {
    const { target_id, target_type, reason } = req.body;
    const reporter_id = req.user.id;

    // Check if user has already reported this item
    const existingReport = await Report.findOne({
      reporter_id,
      target_id,
      target_type,
    });

    if (existingReport) {
      return res.status(400).json({
        message: "You have already reported this content.",
      });
    }

    // Create the report
    const report = new Report({
      reporter_id,
      target_id,
      target_type,
      reason,
    });

    await report.save();

    // Check threshold logic (5 reports auto-flag)
    const reportCount = await Report.countDocuments({
      target_id,
      target_type: "post", // For now, only posts have threshold
      status: "PENDING",
    });

    if (target_type === "post" && reportCount >= 5) {
      await Post.findByIdAndUpdate(target_id, {
        moderation_status: "FLAGGED",
      });
    }

    res.status(201).json({
      message: "Report submitted successfully. Thank you for helping keep our community safe.",
    });
  } catch (error) {
    console.error("Error submitting report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get pending reports for admin
const getPendingReports = async (req, res) => {
  try {
    // Check if user is admin (you might want to add role-based auth)
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const reports = await Report.find({ status: "PENDING" })
      .populate("reporter_id", "name email")
      .populate({
        path: "target_id",
        select: "title desc image author moderation_status",
        populate: {
          path: "author",
          select: "name email",
        },
      })
      .sort({ created_at: -1 });

    // Group reports by target_id to show count and reasons
    const groupedReports = {};
    reports.forEach((report) => {
      const key = report.target_id._id.toString();
      if (!groupedReports[key]) {
        groupedReports[key] = {
          target: report.target_id,
          target_type: report.target_type,
          reports: [],
          reasons: {},
        };
      }
      groupedReports[key].reports.push(report);
      groupedReports[key].reasons[report.reason] =
        (groupedReports[key].reasons[report.reason] || 0) + 1;
    });

    const result = Object.values(groupedReports).map((group) => ({
      ...group,
      reportCount: group.reports.length,
      topReason: Object.keys(group.reasons).reduce((a, b) =>
        group.reasons[a] > group.reasons[b] ? a : b
      ),
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Resolve a report
const resolveReport = async (req, res) => {
  try {
    const { report_id, action } = req.body;

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const report = await Report.findById(report_id).populate("target_id");
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    let updateData = {};
    let notificationMessage = "";

    switch (action) {
      case "KEEP":
        updateData.status = "DISMISSED";
        notificationMessage = "The content you reported has been reviewed and determined to be acceptable.";
        break;
      case "REMOVE":
        updateData.status = "RESOLVED";
        if (report.target_type === "post") {
          await Post.findByIdAndUpdate(report.target_id._id, {
            moderation_status: "REMOVED",
          });
        }
        notificationMessage = "The content you reported has been removed for violating community guidelines.";
        break;
      case "BAN_USER":
        updateData.status = "RESOLVED";
        if (report.target_type === "post") {
          await Post.findByIdAndUpdate(report.target_id._id, {
            moderation_status: "REMOVED",
          });
          // Ban the author
          await User.findByIdAndUpdate(report.target_id.author, {
            isActive: false,
          });
        }
        notificationMessage = "The content you reported has been removed and the user has been banned.";
        break;
      default:
        return res.status(400).json({ message: "Invalid action" });
    }

    // Update all reports for this target
    await Report.updateMany(
      { target_id: report.target_id._id, status: "PENDING" },
      updateData
    );

    // Send notification to reporter
    const notification = new Notification({
      user: report.reporter_id,
      type: "REPORT_RESOLVED",
      title: "Report Resolution",
      message: notificationMessage,
      data: {
        report_id: report._id,
        target_id: report.target_id._id,
        action,
      },
    });
    await notification.save();

    res.json({ message: "Report resolved successfully" });
  } catch (error) {
    console.error("Error resolving report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  submitReport,
  getPendingReports,
  resolveReport,
};
