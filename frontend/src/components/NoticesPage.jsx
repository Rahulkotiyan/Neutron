import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  X,
  Search,
  Filter,
  Download,
  Heart,
  MessageCircle,
  Share2,
  Pin,
  Loader,
  Trash2,
  Edit2,
  FileText,
  Bell,
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Eye,
  Upload as UploadIcon,
  Megaphone,
  Zap,
} from "lucide-react";

const NoticesPage = ({ isSidebarOpen, currentUser, token }) => {
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [sortBy, setSortBy] = useState("pinned");
  const [newComment, setNewComment] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    noticeType: "NOTICE",
    category: "GENERAL",
    priority: "NORMAL",
    imageUrl: "",
    posterUrl: "",
    eventDate: "",
    location: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    tags: "",
    expiryDate: "",
  });

  const API_URL = "http://localhost:5000/api";
  const noticeTypes = [
    "NOTICE",
    "ANNOUNCEMENT",
    "POSTER",
    "CIRCULAR",
    "EVENT",
    "FEST",
    "ACADEMIC",
  ];
  const categories = [
    "GENERAL",
    "ACADEMIC",
    "PLACEMENT",
    "FEST",
    "CLUB",
    "ADMINISTRATION",
    "HOSTEL",
    "OTHERS",
  ];
  const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"];

  useEffect(() => {
    fetchNotices();
  }, []);

  useEffect(() => {
    filterNotices();
  }, [
    notices,
    searchTerm,
    selectedType,
    selectedCategory,
    selectedPriority,
    sortBy,
  ]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/notices`);
      setNotices(response.data);
    } catch (err) {
      console.error("Error fetching notices:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterNotices = () => {
    let filtered = notices;

    if (selectedType !== "ALL") {
      filtered = filtered.filter(
        (notice) => notice.noticeType === selectedType
      );
    }

    if (selectedCategory !== "ALL") {
      filtered = filtered.filter(
        (notice) => notice.category === selectedCategory
      );
    }

    if (selectedPriority !== "ALL") {
      filtered = filtered.filter(
        (notice) => notice.priority === selectedPriority
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (notice) =>
          notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notice.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          notice.tags?.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Sort
    switch (sortBy) {
      case "priority":
        const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
        filtered.sort(
          (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
        );
        break;
      case "views":
        filtered.sort((a, b) => b.views - a.views);
        break;
      case "likes":
        filtered.sort(
          (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)
        );
        break;
      case "pinned":
      default:
        filtered.sort((a, b) => {
          if (b.pinned !== a.pinned) return b.pinned - a.pinned;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }

    setFilteredNotices(filtered);
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!currentUser || !token) {
      alert("Please login to post notices");
      return;
    }

    try {
      const noticeData = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };

      const response = await axios.post(`${API_URL}/notices`, noticeData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotices([response.data, ...notices]);
      setShowCreateModal(false);
      setFormData({
        title: "",
        description: "",
        noticeType: "NOTICE",
        category: "GENERAL",
        priority: "NORMAL",
        imageUrl: "",
        posterUrl: "",
        eventDate: "",
        location: "",
        contactPerson: "",
        contactPhone: "",
        contactEmail: "",
        tags: "",
        expiryDate: "",
      });
      alert("Notice posted successfully!");
    } catch (err) {
      console.error("Error creating notice:", err);
      alert("Error posting notice");
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;

    try {
      await axios.delete(`${API_URL}/notices/${noticeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotices(notices.filter((n) => n._id !== noticeId));
      setShowDetailModal(false);
      alert("Notice deleted successfully!");
    } catch (err) {
      console.error("Error deleting notice:", err);
      alert("Error deleting notice");
    }
  };

  const handleLike = async (noticeId) => {
    if (!currentUser || !token) {
      alert("Please login to like notices");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/notices/${noticeId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotices(
        notices.map((n) =>
          n._id === noticeId
            ? {
                ...n,
                likes: response.data.likes,
              }
            : n
        )
      );

      if (selectedNotice?._id === noticeId) {
        setSelectedNotice({
          ...selectedNotice,
          likes: response.data.likes,
        });
      }
    } catch (err) {
      console.error("Error liking notice:", err);
    }
  };

  const handleTogglePin = async (noticeId) => {
    if (!currentUser || !token) return;

    try {
      const response = await axios.post(
        `${API_URL}/notices/${noticeId}/pin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotices(
        notices.map((n) =>
          n._id === noticeId
            ? {
                ...n,
                pinned: response.data.pinned,
              }
            : n
        )
      );
    } catch (err) {
      console.error("Error pinning notice:", err);
    }
  };

  const handleAddComment = async (noticeId) => {
    if (!newComment.trim() || !token) return;

    try {
      const response = await axios.post(
        `${API_URL}/notices/${noticeId}/comment`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedNotice({
        ...selectedNotice,
        comments: response.data.comments,
      });
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "HIGH":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "NORMAL":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "LOW":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "ANNOUNCEMENT":
        return <Megaphone size={16} />;
      case "POSTER":
        return <FileText size={16} />;
      case "CIRCULAR":
        return <Bell size={16} />;
      case "EVENT":
        return <Calendar size={16} />;
      case "FEST":
        return <Zap size={16} />;
      case "ACADEMIC":
        return <FileText size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-full h-full flex-1 overflow-auto bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-300 my-10">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-white/5 bg-zinc-950/80 backdrop-blur">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                📢 Official Notices
              </h1>
              <p className="text-zinc-400">
                College announcements, posters, circulars & event updates
              </p>
            </div>
            {currentUser && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-red-500/50 whitespace-nowrap"
              >
                <Plus size={20} />
                Post Notice
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-3.5 text-zinc-500"
              />
              <input
                type="text"
                placeholder="Search notices by title or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-white placeholder-zinc-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Type Filter */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">
                  TYPE
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-white transition-colors"
                >
                  <option value="ALL">All Types</option>
                  {noticeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">
                  CATEGORY
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-white transition-colors"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">
                  PRIORITY
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-white transition-colors"
                >
                  <option value="ALL">All Priorities</option>
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">
                  SORT BY
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-white transition-colors"
                >
                  <option value="pinned">Pinned First</option>
                  <option value="priority">By Priority</option>
                  <option value="views">Most Viewed</option>
                  <option value="likes">Most Liked</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="flex items-end justify-between">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">
                    RESULTS
                  </label>
                  <p className="text-lg font-bold text-red-400">
                    {filteredNotices.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-6 max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader size={40} className="animate-spin text-red-500" />
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={48} className="mx-auto text-zinc-600 mb-4" />
            <p className="text-xl text-zinc-400">No notices found</p>
            <p className="text-zinc-500 mt-2">
              {currentUser
                ? "Be the first to post a notice!"
                : "Login to post notices"}
            </p>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            {filteredNotices.map((notice) => (
              <div
                key={notice._id}
                onClick={() => {
                  setSelectedNotice(notice);
                  setShowDetailModal(true);
                }}
                className="group bg-gradient-to-r from-zinc-900/50 to-zinc-800/50 border border-white/10 rounded-xl overflow-hidden hover:border-red-500/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-red-500/10 hover:-translate-y-1"
              >
                <div className="p-5 flex gap-5">
                  {/* Poster/Image */}
                  {notice.posterUrl && (
                    <div className="hidden md:block w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={notice.posterUrl}
                        alt={notice.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(
                            notice.priority
                          )}`}
                        >
                          {notice.priority}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border border-white/20 bg-white/5 text-zinc-300">
                          {getTypeIcon(notice.noticeType)}
                          {notice.noticeType}
                        </div>
                        {notice.pinned && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border border-yellow-500/30 bg-yellow-500/10 text-yellow-300">
                            <Pin size={12} />
                            Pinned
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-red-300 transition-colors line-clamp-2 mb-2">
                      {notice.title}
                    </h3>
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-3">
                      {notice.description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 text-xs text-zinc-500 mb-3">
                      {notice.eventDate && (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(notice.eventDate)}
                        </div>
                      )}
                      {notice.location && (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          {notice.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Eye size={14} />
                        {notice.views} views
                      </div>
                    </div>

                    {/* Uploader Info & Stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {notice.publisher?.avatar ? (
                          <img
                            src={notice.publisher.avatar}
                            alt={notice.publisher.name}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                            {notice.publisher?.name?.charAt(0) || "P"}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-white">
                            {notice.publisher?.name || "Anonymous"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {formatDate(notice.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 text-center">
                        <div>
                          <Heart
                            size={14}
                            className="mx-auto text-zinc-500 mb-1"
                          />
                          <p className="text-xs font-semibold text-white">
                            {notice.likes?.length || 0}
                          </p>
                        </div>
                        <div>
                          <MessageCircle
                            size={14}
                            className="mx-auto text-zinc-500 mb-1"
                          />
                          <p className="text-xs font-semibold text-white">
                            {notice.comments?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Notice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/20 rounded-2xl p-6 w-full max-w-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                Post Official Notice
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Notice Title *"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-white placeholder-zinc-500"
                  required
                />

                <select
                  value={formData.noticeType}
                  onChange={(e) =>
                    setFormData({ ...formData, noticeType: e.target.value })
                  }
                  className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-white"
                  required
                >
                  <option value="">Select Notice Type</option>
                  {noticeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-white"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-white"
                >
                  <option value="LOW">Low Priority</option>
                  <option value="NORMAL">Normal Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <textarea
                placeholder="Description/Content *"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-white placeholder-zinc-500 h-28 resize-none"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="url"
                  placeholder="Poster Image URL"
                  value={formData.posterUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, posterUrl: e.target.value })
                  }
                  className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-white placeholder-zinc-500"
                />

                <input
                  type="datetime-local"
                  placeholder="Event Date & Time"
                  value={formData.eventDate}
                  onChange={(e) =>
                    setFormData({ ...formData, eventDate: e.target.value })
                  }
                  className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-white placeholder-zinc-500"
                />

                <input
                  type="text"
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-white placeholder-zinc-500"
                />

                <input
                  type="text"
                  placeholder="Contact Person"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                  className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-white placeholder-zinc-500"
                />

                <input
                  type="tel"
                  placeholder="Contact Phone"
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPhone: e.target.value })
                  }
                  className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-white placeholder-zinc-500"
                />

                <input
                  type="email"
                  placeholder="Contact Email"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                  className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-white placeholder-zinc-500"
                />
              </div>

              <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-white placeholder-zinc-500"
              />

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-zinc-800 text-white rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all"
                >
                  Post Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedNotice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/20 rounded-2xl w-full max-w-3xl my-8 overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 bg-zinc-950 border-b border-white/10 p-6 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(
                      selectedNotice.priority
                    )}`}
                  >
                    {selectedNotice.priority}
                  </span>
                  <span className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border border-white/20 bg-white/5 text-zinc-300">
                    {selectedNotice.noticeType}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedNotice.title}
                </h2>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
              {/* Poster Image */}
              {selectedNotice.posterUrl && (
                <div className="rounded-xl overflow-hidden">
                  <img
                    src={selectedNotice.posterUrl}
                    alt={selectedNotice.title}
                    className="w-full h-auto max-h-64 object-cover"
                  />
                </div>
              )}

              {/* Description */}
              <p className="text-zinc-300 text-lg">
                {selectedNotice.description}
              </p>

              {/* Event Details */}
              {(selectedNotice.eventDate ||
                selectedNotice.location ||
                selectedNotice.contactPerson) && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                  <p className="font-bold text-white mb-3">Event Details</p>
                  {selectedNotice.eventDate && (
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-red-400" />
                      <div>
                        <p className="text-xs text-zinc-500">Date & Time</p>
                        <p className="text-white">
                          {new Date(selectedNotice.eventDate).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedNotice.location && (
                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-red-400" />
                      <div>
                        <p className="text-xs text-zinc-500">Location</p>
                        <p className="text-white">{selectedNotice.location}</p>
                      </div>
                    </div>
                  )}
                  {selectedNotice.contactPerson && (
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-red-400" />
                      <div>
                        <p className="text-xs text-zinc-500">Contact Person</p>
                        <p className="text-white">
                          {selectedNotice.contactPerson}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedNotice.contactPhone && (
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-red-400" />
                      <div>
                        <p className="text-xs text-zinc-500">Phone</p>
                        <p className="text-white">
                          {selectedNotice.contactPhone}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedNotice.contactEmail && (
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-red-400" />
                      <div>
                        <p className="text-xs text-zinc-500">Email</p>
                        <p className="text-white">
                          {selectedNotice.contactEmail}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Publisher */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs text-zinc-400 mb-2">Posted by</p>
                <div className="flex items-center gap-3">
                  {selectedNotice.publisher?.avatar ? (
                    <img
                      src={selectedNotice.publisher.avatar}
                      alt={selectedNotice.publisher.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-bold">
                      {selectedNotice.publisher?.name?.charAt(0) || "P"}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-white">
                      {selectedNotice.publisher?.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(selectedNotice.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Eye, label: "Views", value: selectedNotice.views },
                  {
                    icon: Heart,
                    label: "Likes",
                    value: selectedNotice.likes?.length || 0,
                  },
                  {
                    icon: MessageCircle,
                    label: "Comments",
                    value: selectedNotice.comments?.length || 0,
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 rounded-lg p-3 text-center border border-white/10"
                  >
                    <stat.icon
                      size={18}
                      className="mx-auto text-red-400 mb-2"
                    />
                    <p className="text-sm font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-zinc-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Comments */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">
                  Comments ({selectedNotice.comments?.length || 0})
                </h3>
                <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                  {selectedNotice.comments?.map((comment) => (
                    <div
                      key={comment._id}
                      className="bg-white/5 rounded-lg p-3 border border-white/10"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {comment.userAvatar ? (
                          <img
                            src={comment.userAvatar}
                            alt={comment.userName}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
                            {comment.userName?.charAt(0)}
                          </div>
                        )}
                        <p className="font-semibold text-sm text-white">
                          {comment.userName}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                      <p className="text-sm text-zinc-300">{comment.text}</p>
                    </div>
                  ))}
                </div>

                {currentUser && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-white placeholder-zinc-500 text-sm"
                    />
                    <button
                      onClick={() => handleAddComment(selectedNotice._id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors text-sm"
                    >
                      Post
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-zinc-950 border-t border-white/10 p-6 flex gap-3 flex-wrap">
              <button
                onClick={() => handleLike(selectedNotice._id)}
                className={`flex-1 min-w-32 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                  currentUser && selectedNotice.likes?.includes(currentUser._id)
                    ? "bg-red-500/30 text-red-300 border border-red-500/50"
                    : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                }`}
              >
                <Heart
                  size={18}
                  fill={
                    currentUser &&
                    selectedNotice.likes?.includes(currentUser._id)
                      ? "currentColor"
                      : "none"
                  }
                />
                Like
              </button>

              {currentUser &&
                selectedNotice.publisher._id === currentUser._id && (
                  <>
                    <button
                      onClick={() => handleTogglePin(selectedNotice._id)}
                      className="flex-1 min-w-32 py-3 bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 rounded-lg font-semibold hover:bg-yellow-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Pin size={18} />
                      {selectedNotice.pinned ? "Unpin" : "Pin"}
                    </button>
                    <button
                      onClick={() => handleDeleteNotice(selectedNotice._id)}
                      className="flex-1 min-w-32 py-3 bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg font-semibold hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} />
                      Delete
                    </button>
                  </>
                )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 min-w-32 px-6 py-3 bg-zinc-800 text-white rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticesPage;
