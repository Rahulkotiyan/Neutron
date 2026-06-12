import { useState, useEffect, useRef, memo } from "react";
import { BellNotification, Check, DoubleCheck, Trash, Xmark, Refresh } from "iconoir-react";
import axios from "axios";
import { API_URL } from "../utils/api";

const NotificationsDropdown = ({ user, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user && isOpen) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data.notifications);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/notifications/unread-count`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_URL}/notifications/read-all`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true, readAt: new Date() })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId),
      );
      const deletedNotif = notifications.find((n) => n._id === notificationId);
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "LIKE":
        return "❤️";
      case "COMMENT":
        return "💬";
      case "FOLLOW":
        return "👥";
      case "MENTION":
        return "🔔";
      case "POST":
        return "📝";
      case "MESSAGE":
        return "✉️";
      case "GROUP_INVITE":
        return "🎯";
      case "SYSTEM":
        return "⚙️";
      default:
        return "📢";
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed top-16 left-4 right-4 sm:right-4 sm:left-auto sm:w-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 z-50 max-h-96 overflow-hidden max-w-sm"
      ref={dropdownRef}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <BellNotification size={18} className="text-blue-400" />
          <h3 className="font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-[0.65rem] sm:text-xs md:text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-zinc-400 hover:text-white transition-colors"
              title="Mark all as read"
            >
              <DoubleCheck size={16} />
            </button>
          )}
          <button
            onClick={() => {
              setIsOpen(false);
              onClose();
            }}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <Xmark size={16} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto max-h-80">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Refresh size={20} className="animate-spin text-zinc-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center p-8 text-zinc-500">
            <BellNotification size={32} className="mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 hover:bg-zinc-800/50 transition-colors ${
                  !notification.isRead ? "bg-blue-500/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-lg sm:text-xl md:text-xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm md:text-sm font-medium text-white">
                          {notification.title}
                        </p>
                        <p className="text-[0.65rem] sm:text-xs md:text-xs text-zinc-400 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {notification.sender && (
                            <div className="flex items-center gap-1">
                              <img
                                src={
                                  notification.sender.avatar ||
                                  "https://api.dicebear.com/7.x/avataaars/svg?seed=User"
                                }
                                alt={notification.sender.name}
                                className="w-4 h-4 rounded-full"
                              />
                              <span className="text-[0.65rem] sm:text-xs md:text-xs text-zinc-500">
                                {notification.sender.name}
                              </span>
                            </div>
                          )}
                          <span className="text-[0.65rem] sm:text-xs md:text-xs text-zinc-500">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="text-zinc-400 hover:text-white transition-colors"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="text-zinc-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(NotificationsDropdown);
