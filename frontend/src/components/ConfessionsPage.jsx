import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  X,
  Search,
  Heart,
  MessageCircle,
  Trash2,
  Eye,
  Send,
  Loader,
  Tag,
  Lock,
  CheckCircle,
  Clock,
} from "lucide-react";

const ConfessionsPage = ({ isSidebarOpen, currentUser, token }) => {
  const [confessions, setConfessions] = useState([]);
  const [filteredConfessions, setFilteredConfessions] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedConfession, setSelectedConfession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("recent");
  const [newComment, setNewComment] = useState("");

  const [formData, setFormData] = useState({
    confession: "",
    category: "PERSONAL",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  const API_URL = "http://localhost:5000/api";
  const categories = [
    "PERSONAL",
    "RELATIONSHIP",
    "ACADEMIC",
    "WORK",
    "FAMILY",
    "HEALTH",
    "FINANCIAL",
    "OTHER",
  ];

  // Fetch all confessions
  useEffect(() => {
    fetchConfessions();
  }, []);

  // Filter and sort confessions
  useEffect(() => {
    filterConfessions();
  }, [confessions, searchTerm, selectedCategory, sortBy]);

  const fetchConfessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/confessions`);
      setConfessions(response.data.confessions || response.data);
    } catch (err) {
      console.error("Error fetching confessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterConfessions = () => {
    let filtered = [...confessions];

    if (selectedCategory !== "ALL") {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.confession.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.tags?.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Sort
    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => b.likes.length - a.likes.length);
        break;
      case "mostCommented":
        filtered.sort((a, b) => b.comments.length - a.comments.length);
        break;
      case "mostViewed":
        filtered.sort((a, b) => b.views - a.views);
        break;
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredConfessions(filtered);
  };

  const handleCreateConfession = async (e) => {
    e.preventDefault();

    if (!formData.confession.trim()) {
      alert("Please write a confession");
      return;
    }

    try {
      const confessionPayload = {
        confession: formData.confession,
        category: formData.category,
        tags: formData.tags,
      };

      const response = await axios.post(
        `${API_URL}/confessions`,
        confessionPayload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setConfessions([response.data, ...confessions]);
      setFormData({ confession: "", category: "PERSONAL", tags: [] });
      setTagInput("");
      setShowCreateModal(false);
    } catch (err) {
      console.error("Error creating confession:", err);
      alert("Failed to post confession");
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleLike = async (id) => {
    if (!currentUser) {
      alert("Please log in to like");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/confessions/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConfessions(
        confessions.map((c) => (c._id === id ? response.data : c))
      );
      if (selectedConfession?._id === id) {
        setSelectedConfession(response.data);
      }
    } catch (err) {
      console.error("Error liking confession:", err);
    }
  };

  const handleDeleteConfession = async (id) => {
    if (!window.confirm("Are you sure you want to delete this confession?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/confessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setConfessions(confessions.filter((c) => c._id !== id));
      setShowDetailModal(false);
    } catch (err) {
      console.error("Error deleting confession:", err);
      alert("Failed to delete confession or you are not authorized");
    }
  };

  const handleAddComment = async (id) => {
    if (!currentUser) {
      alert("Please log in to comment");
      return;
    }

    if (!newComment.trim()) {
      alert("Please write a comment");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/confessions/${id}/comment`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedConfession = await axios.get(`${API_URL}/confessions/${id}`);
      setConfessions(
        confessions.map((c) => (c._id === id ? updatedConfession.data : c))
      );
      if (selectedConfession?._id === id) {
        setSelectedConfession(updatedConfession.data);
      }
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleDeleteComment = async (confessionId, commentId) => {
    if (!window.confirm("Delete your comment?")) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/confessions/${confessionId}/comment/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedConfession = await axios.get(
        `${API_URL}/confessions/${confessionId}`
      );
      setConfessions(
        confessions.map((c) =>
          c._id === confessionId ? updatedConfession.data : c
        )
      );
      if (selectedConfession?._id === confessionId) {
        setSelectedConfession(updatedConfession.data);
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const handleToggleResolved = async (id) => {
    try {
      const response = await axios.post(
        `${API_URL}/confessions/${id}/resolve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConfessions(
        confessions.map((c) => (c._id === id ? response.data : c))
      );
      if (selectedConfession?._id === id) {
        setSelectedConfession(response.data);
      }
    } catch (err) {
      console.error("Error toggling resolved:", err);
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const confDate = new Date(date);
    const diff = now - confDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return confDate.toLocaleDateString();
  };

  const getCategoryColor = (category) => {
    const colors = {
      PERSONAL: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      RELATIONSHIP: "bg-pink-500/20 text-pink-300 border-pink-500/30",
      ACADEMIC: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      WORK: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      FAMILY: "bg-green-500/20 text-green-300 border-green-500/30",
      HEALTH: "bg-red-500/20 text-red-300 border-red-500/30",
      FINANCIAL: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      OTHER: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
    };
    return colors[category] || colors.OTHER;
  };

  return (
    <div className="w-full h-full flex-1 overflow-auto bg-zinc-900 my-12">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-zinc-950 border-b border-white/10 backdrop-blur-xl">
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Lock size={28} className="text-purple-400" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Confessions
                </h1>
                <p className="text-xs md:text-sm text-zinc-400">
                  Share your thoughts anonymously
                </p>
              </div>
            </div>
            {currentUser && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all whitespace-nowrap"
              >
                <Plus size={20} />
                Post Confession
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div className="md:col-span-1">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-3 text-zinc-500"
                />
                <input
                  type="text"
                  placeholder="Search confessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-zinc-500 transition-colors"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-white transition-colors"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-white transition-colors"
              >
                <option value="recent">Recent</option>
                <option value="popular">Most Liked</option>
                <option value="mostCommented">Most Commented</option>
                <option value="mostViewed">Most Viewed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Confessions List */}
      <div className="p-4 md:p-6 max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader size={32} className="text-purple-400 animate-spin" />
          </div>
        ) : filteredConfessions.length === 0 ? (
          <div className="text-center py-12">
            <Lock size={48} className="text-zinc-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-white mb-2">
              No confessions yet
            </p>
            <p className="text-zinc-400">
              Be the first to share something anonymously
            </p>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            {filteredConfessions.map((confession) => (
              <div
                key={confession._id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer group"
                onClick={() => {
                  setSelectedConfession(confession);
                  setShowDetailModal(true);
                }}
              >
                {/* Header with Category and Time */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getCategoryColor(
                        confession.category
                      )}`}
                    >
                      {confession.category}
                    </span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(confession.createdAt)}
                    </span>
                  </div>
                  {confession.isResolved && (
                    <div className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                      <CheckCircle size={14} />
                      Resolved
                    </div>
                  )}
                </div>

                {/* Confession Text */}
                <p className="text-white mb-3 line-clamp-3 group-hover:line-clamp-none transition-all">
                  {confession.confession}
                </p>

                {/* Tags */}
                {confession.tags && confession.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {confession.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full flex items-center gap-1"
                      >
                        <Tag size={12} />
                        {tag}
                      </span>
                    ))}
                    {confession.tags.length > 3 && (
                      <span className="text-xs text-zinc-500">
                        +{confession.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-zinc-400 border-t border-white/10 pt-3">
                  <div className="flex items-center gap-1">
                    <Eye size={14} />
                    <span>{confession.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart size={14} />
                    <span>{confession.likes?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle size={14} />
                    <span>{confession.comments?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-white/20 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-zinc-950 border-b border-white/10 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Lock size={24} />
                Post Confession
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    confession: "",
                    category: "PERSONAL",
                    tags: [],
                  });
                  setTagInput("");
                }}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateConfession} className="p-6 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Confession Text */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Your Confession
                </label>
                <textarea
                  value={formData.confession}
                  onChange={(e) =>
                    setFormData({ ...formData, confession: e.target.value })
                  }
                  placeholder="Share what's on your mind. This will be posted anonymously."
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-zinc-500 resize-none"
                  rows={6}
                />
                <p className="text-xs text-zinc-500 mt-1">
                  {formData.confession.length}/5000 characters
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Tags (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                    className="flex-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-white/10">
                <button
                  type="submit"
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  Post Anonymously
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedConfession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-white/20 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-zinc-950 border-b border-white/10 p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={20} className="text-purple-400" />
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold border ${getCategoryColor(
                    selectedConfession.category
                  )}`}
                >
                  {selectedConfession.category}
                </span>
                {selectedConfession.isResolved && (
                  <div className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                    <CheckCircle size={14} />
                    Resolved
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Confession Text */}
              <div>
                <p className="text-lg text-white leading-relaxed">
                  {selectedConfession.confession}
                </p>
                <p className="text-xs text-zinc-500 mt-2">
                  Posted {formatDate(selectedConfession.createdAt)}
                </p>
              </div>

              {/* Tags */}
              {selectedConfession.tags &&
                selectedConfession.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedConfession.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full flex items-center gap-1"
                      >
                        <Tag size={12} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="text-center">
                  <Eye size={18} className="text-blue-400 mx-auto mb-2" />
                  <p className="text-lg font-bold text-white">
                    {selectedConfession.views}
                  </p>
                  <p className="text-xs text-zinc-500">Views</p>
                </div>
                <div className="text-center">
                  <Heart size={18} className="text-red-400 mx-auto mb-2" />
                  <p className="text-lg font-bold text-white">
                    {selectedConfession.likes?.length || 0}
                  </p>
                  <p className="text-xs text-zinc-500">Likes</p>
                </div>
                <div className="text-center">
                  <MessageCircle
                    size={18}
                    className="text-purple-400 mx-auto mb-2"
                  />
                  <p className="text-lg font-bold text-white">
                    {selectedConfession.comments?.length || 0}
                  </p>
                  <p className="text-xs text-zinc-500">Comments</p>
                </div>
              </div>

              {/* Comments */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">
                  Comments ({selectedConfession.comments?.length || 0})
                </h3>
                <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                  {selectedConfession.comments &&
                  selectedConfession.comments.length > 0 ? (
                    selectedConfession.comments.map((comment) => (
                      <div
                        key={comment._id}
                        className="bg-white/5 rounded-lg p-3 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-zinc-500">
                            Anonymous • {formatDate(comment.createdAt)}
                          </p>
                          {currentUser && (
                            <button
                              onClick={() =>
                                handleDeleteComment(
                                  selectedConfession._id,
                                  comment._id
                                )
                              }
                              className="text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-zinc-300">{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500">No comments yet</p>
                  )}
                </div>

                {currentUser && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment anonymously..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-zinc-500 text-sm"
                    />
                    <button
                      onClick={() => handleAddComment(selectedConfession._id)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors text-sm"
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
                onClick={() => handleLike(selectedConfession._id)}
                className={`flex-1 min-w-32 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                  currentUser &&
                  selectedConfession.likes?.includes(currentUser._id)
                    ? "bg-red-500/30 text-red-300 border border-red-500/50"
                    : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                }`}
              >
                <Heart
                  size={18}
                  fill={
                    currentUser &&
                    selectedConfession.likes?.includes(currentUser._id)
                      ? "currentColor"
                      : "none"
                  }
                />
                Like
              </button>

              {currentUser && (
                <>
                  <button
                    onClick={() => handleToggleResolved(selectedConfession._id)}
                    className={`flex-1 min-w-32 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                      selectedConfession.isResolved
                        ? "bg-green-500/20 text-green-300 border border-green-500/50"
                        : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                    }`}
                  >
                    <CheckCircle size={18} />
                    {selectedConfession.isResolved
                      ? "Mark Unresolved"
                      : "Mark Resolved"}
                  </button>

                  <button
                    onClick={() =>
                      handleDeleteConfession(selectedConfession._id)
                    }
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

export default ConfessionsPage;
