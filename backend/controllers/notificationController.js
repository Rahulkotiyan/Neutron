const crypto = require('crypto');
const { getDb, schema } = require('../db');
const { eq, and, lt, desc, sql } = require('drizzle-orm');

const now = () => new Date().toISOString();

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { cursor, limit = 20 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 50);
    const db = getDb();

    const conditions = [eq(schema.notifications.recipient, userId)];
    if (cursor) conditions.push(lt(schema.notifications.createdAt, cursor));

    const notifications = await db.select({
      id: schema.notifications.id, recipient: schema.notifications.recipient,
      sender: schema.notifications.sender, type: schema.notifications.type,
      title: schema.notifications.title, message: schema.notifications.message,
      relatedEntityType: schema.notifications.relatedEntityType,
      relatedEntityId: schema.notifications.relatedEntityId,
      isRead: schema.notifications.isRead, readAt: schema.notifications.readAt,
      createdAt: schema.notifications.createdAt,
      senderName: schema.users.name, senderAvatar: schema.users.avatar,
      senderHandle: schema.users.handle,
    }).from(schema.notifications)
      .leftJoin(schema.users, eq(schema.notifications.sender, schema.users.id))
      .where(and(...conditions))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limitNum + 1);

    const hasMore = notifications.length > limitNum;
    const toReturn = hasMore ? notifications.slice(0, limitNum) : notifications;

    const formatted = toReturn.map(n => ({
      _id: n.id, recipient: n.recipient, sender: { _id: n.sender, name: n.senderName, avatar: n.senderAvatar, handle: n.senderHandle },
      type: n.type, title: n.title, message: n.message,
      relatedEntity: n.relatedEntityType ? { entityType: n.relatedEntityType, entityId: n.relatedEntityId } : undefined,
      isRead: n.isRead === 1, readAt: n.readAt, createdAt: n.createdAt,
    }));

    const unread = await db.select({ count: sql`COUNT(*)` }).from(schema.notifications)
      .where(and(eq(schema.notifications.recipient, userId), eq(schema.notifications.isRead, 0)));
    const unreadCount = unread[0]?.count || 0;

    const nextCursor = toReturn.length > 0 ? toReturn[toReturn.length - 1].createdAt : null;
    res.json({ notifications: formatted, unreadCount, hasMore, nextCursor });
  } catch (err) {
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id || req.user.id;
    const db = getDb();

    const result = await db.update(schema.notifications)
      .set({ isRead: 1, readAt: now() })
      .where(and(eq(schema.notifications.id, notificationId), eq(schema.notifications.recipient, userId)));

    if (result.changes === 0) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Error marking notification as read" });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const db = getDb();

    await db.update(schema.notifications)
      .set({ isRead: 1, readAt: now() })
      .where(and(eq(schema.notifications.recipient, userId), eq(schema.notifications.isRead, 0)));

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Error marking all notifications as read" });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id || req.user.id;
    const db = getDb();

    const result = await db.delete(schema.notifications)
      .where(and(eq(schema.notifications.id, notificationId), eq(schema.notifications.recipient, userId)));

    if (result.changes === 0) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting notification" });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const db = getDb();

    const unread = await db.select({ count: sql`COUNT(*)` }).from(schema.notifications)
      .where(and(eq(schema.notifications.recipient, userId), eq(schema.notifications.isRead, 0)));

    res.json({ unreadCount: unread[0]?.count || 0 });
  } catch (err) {
    res.status(500).json({ message: "Error fetching unread count" });
  }
};
