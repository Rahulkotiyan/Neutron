const crypto = require('crypto');
const { getDb, schema } = require('../db');
const { eq, and, inArray, sql } = require('drizzle-orm');

const now = () => new Date().toISOString();

const submitReport = async (req, res) => {
  try {
    const { target_id, target_type, reason } = req.body;
    const reporter_id = req.user.id;
    const db = getDb();

    const existing = await db.select().from(schema.reports)
      .where(and(eq(schema.reports.reporterId, reporter_id), eq(schema.reports.targetId, target_id), eq(schema.reports.targetType, target_type)))
      .limit(1);
    if (existing.length) return res.status(400).json({ message: "You have already reported this content." });

    const id = crypto.randomUUID();
    await db.insert(schema.reports).values({ id, reporterId: reporter_id, targetId: target_id, targetType: target_type, reason, createdAt: now() });

    const admins = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.isAdmin, 1));
    if (admins.length > 0) {
      for (const admin of admins) {
        await db.insert(schema.notifications).values({
          id: crypto.randomUUID(), recipient: admin.id, sender: reporter_id,
          type: "SYSTEM", title: "New Report Submitted",
          message: `A new report has been submitted for a ${target_type}. Reason: ${reason}.`,
          relatedEntityType: target_type.toUpperCase(), relatedEntityId: target_id,
          createdAt: now(),
        });
      }
    }

    const reportCount = (await db.select({ count: sql`COUNT(*)` }).from(schema.reports)
      .where(and(eq(schema.reports.targetId, target_id), eq(schema.reports.targetType, "post"), eq(schema.reports.status, "PENDING")))
    )[0].count;

    if (target_type === "post" && parseInt(reportCount) >= 5) {
      await db.update(schema.posts).set({ moderationStatus: "FLAGGED" }).where(eq(schema.posts.id, target_id));
    }

    res.status(201).json({ message: "Report submitted successfully. Thank you for helping keep our community safe." });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getPendingReports = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: "Access denied" });
    const db = getDb();

    const reports = await db.select({
      id: schema.reports.id, reporterId: schema.reports.reporterId,
      targetId: schema.reports.targetId, targetType: schema.reports.targetType,
      reason: schema.reports.reason, status: schema.reports.status,
      createdAt: schema.reports.createdAt,
      reporterName: schema.users.name, reporterEmail: schema.users.email,
    }).from(schema.reports)
      .leftJoin(schema.users, eq(schema.reports.reporterId, schema.users.id))
      .where(eq(schema.reports.status, "PENDING"));

    const groupedReports = {};
    for (const report of reports) {
      const key = report.targetId;
      if (!groupedReports[key]) {
        groupedReports[key] = { target: null, target_type: report.targetType, reports: [], reasons: {} };
      }
      groupedReports[key].reports.push(report);
      groupedReports[key].reasons[report.reason] = (groupedReports[key].reasons[report.reason] || 0) + 1;
    }

    const result = await Promise.all(Object.entries(groupedReports).map(async ([targetId, group]) => {
      let target = null;
      if (group.target_type === "post") {
        const posts = await db.select({
          id: schema.posts.id, title: schema.posts.title, desc: schema.posts.desc,
          image: schema.posts.image, author: schema.posts.author,
          moderationStatus: schema.posts.moderationStatus, createdAt: schema.posts.createdAt,
          authorName: schema.users.name, authorEmail: schema.users.email, authorHandle: schema.users.handle,
        }).from(schema.posts)
          .leftJoin(schema.users, eq(schema.posts.author, schema.users.id))
          .where(eq(schema.posts.id, targetId)).limit(1);
        target = posts[0] || null;
      }

      const topReason = Object.keys(group.reasons).reduce((a, b) => group.reasons[a] > group.reasons[b] ? a : b);
      const reporters = group.reports.map(r => ({
        _id: r.reporterId, name: r.reporterName, email: r.reporterEmail, reportedAt: r.createdAt, reason: r.reason,
      }));
      const dates = group.reports.map(r => new Date(r.createdAt)).sort((a, b) => a - b);

      return { ...group, target, reportCount: group.reports.length, topReason, allReasons: group.reasons, reporters, firstReported: dates[0].toISOString(), latestReported: dates[dates.length - 1].toISOString() };
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const resolveReport = async (req, res) => {
  try {
    const { target_id, action } = req.body;
    if (!req.user.isAdmin) return res.status(403).json({ message: "Access denied" });
    const db = getDb();

    const reports = await db.select().from(schema.reports)
      .where(and(eq(schema.reports.targetId, target_id), eq(schema.reports.status, "PENDING"))).limit(1);
    const report = reports[0];
    if (!report) return res.status(404).json({ message: "Report not found" });

    let updateData = {};
    let notificationMessage = "";
    let notifyAuthor = false;
    let authorId = null;

    switch (action) {
      case "KEEP":
        updateData = { status: "DISMISSED" };
        notificationMessage = "The content you reported has been reviewed and determined to be acceptable.";
        break;
      case "WARN":
        updateData = { status: "RESOLVED" };
        notificationMessage = "Your post has received a warning due to reported content. Please review community guidelines.";
        notifyAuthor = true;
        break;
      case "REMOVE":
        updateData = { status: "RESOLVED" };
        if (report.targetType === "post") {
          await db.update(schema.posts).set({ moderationStatus: "REMOVED" }).where(eq(schema.posts.id, report.targetId));
          const post = (await db.select({ author: schema.posts.author }).from(schema.posts).where(eq(schema.posts.id, report.targetId)).limit(1))[0];
          authorId = post?.author;
        }
        notificationMessage = "The content you reported has been removed for violating community guidelines.";
        break;
      case "SUSPEND":
        updateData = { status: "RESOLVED" };
        if (report.targetType === "post") {
          await db.update(schema.posts).set({ moderationStatus: "REMOVED" }).where(eq(schema.posts.id, report.targetId));
          const post = (await db.select({ author: schema.posts.author }).from(schema.posts).where(eq(schema.posts.id, report.targetId)).limit(1))[0];
          authorId = post?.author;
          if (post?.author) {
            await db.update(schema.users).set({ isActive: 0, suspendedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }).where(eq(schema.users.id, post.author));
          }
        }
        notificationMessage = "Your account has been temporarily suspended. Contact support for reinstatement.";
        notifyAuthor = true;
        break;
      case "BAN_USER":
        updateData = { status: "RESOLVED" };
        if (report.targetType === "post") {
          await db.update(schema.posts).set({ moderationStatus: "REMOVED" }).where(eq(schema.posts.id, report.targetId));
          const post = (await db.select({ author: schema.posts.author }).from(schema.posts).where(eq(schema.posts.id, report.targetId)).limit(1))[0];
          authorId = post?.author;
          if (post?.author) {
            await db.update(schema.users).set({ isActive: 0, suspendedUntil: null }).where(eq(schema.users.id, post.author));
          }
        }
        notificationMessage = "The content you reported has been removed and the user has been banned.";
        break;
      default:
        return res.status(400).json({ message: "Invalid action" });
    }

    const ts = now();
    await db.update(schema.reports).set({ ...updateData }).where(and(eq(schema.reports.targetId, target_id), eq(schema.reports.status, "PENDING")));

    if (notifyAuthor && authorId) {
      await db.insert(schema.notifications).values({
        id: crypto.randomUUID(), recipient: authorId, sender: req.user.id,
        type: "SYSTEM", title: "Content Moderation Notice",
        message: notificationMessage, createdAt: ts,
      });
    } else if (!notifyAuthor) {
      await db.insert(schema.notifications).values({
        id: crypto.randomUUID(), recipient: report.reporterId, sender: req.user.id,
        type: "SYSTEM", title: "Report Resolution",
        message: notificationMessage, createdAt: ts,
      });
    }

    res.json({ message: "Report resolved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { submitReport, getPendingReports, resolveReport };
