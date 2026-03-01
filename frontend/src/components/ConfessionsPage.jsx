import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  X,
  Search,
  Heart,
  Message,
  Trash,
  Eye,
  Send,
  ShieldLoading,
  Label,
  Lock,
  CheckCircle,
  Clock,
  Filter,
  ArrowDown,
  ShieldAlert,
} from "iconoir-react";
import CustomDropdown from "./CustomDropdown";

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
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confessionToDelete, setConfessionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
            tag.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
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
        },
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
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setConfessions(
        confessions.map((c) => (c._id === id ? response.data : c)),
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
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const updatedConfession = await axios.get(`${API_URL}/confessions/${id}`);
      setConfessions(
        confessions.map((c) => (c._id === id ? updatedConfession.data : c)),
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
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const updatedConfession = await axios.get(
        `${API_URL}/confessions/${confessionId}`,
      );
      setConfessions(
        confessions.map((c) =>
          c._id === confessionId ? updatedConfession.data : c,
        ),
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
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setConfessions(
        confessions.map((c) => (c._id === id ? response.data : c)),
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
      PERSONAL: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
      RELATIONSHIP: "bg-zinc-400/20 text-zinc-200 border-zinc-400/30",
      ACADEMIC: "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",
      WORK: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
      FAMILY: "bg-zinc-400/20 text-zinc-200 border-zinc-400/30",
      HEALTH: "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",
      FINANCIAL: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
      OTHER: "bg-zinc-400/20 text-zinc-200 border-zinc-400/30",
    };
    return colors[category] || colors.OTHER;
  };

  const hasActiveFilters =
    selectedCategory !== "ALL" || sortBy !== "recent" || searchTerm !== "";

  return (
    <div className="flex w-full min-h-screen bg-black text-zinc-300 selection:bg-zinc-500/30">
      <main
        className={`flex-1 w-full overflow-y-auto relative transition-all duration-300 ${isSidebarOpen ? "lg:ml-72" : ""}`}
      >
        {/* Background Ambient Glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-zinc-900/20 blur-[120px] rounded-full pointer-events-none opacity-50"></div>

        {/* Hero Header */}
        <div className="relative z-10 pt-4 pb-4 px-4 md:pt-6 md:pb-6 md:px-8 max-w-7xl mx-auto border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black-500/10 border border-white-500/20 text-white-400 text-xs font-bold tracking-wide uppercase mb-4">
                 Private Thoughts
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3">
                Anonymous
                <br />
                Confessions
              </h1>
              <p className="text-zinc-400 text-lg max-w-xl">
                Share your thoughts, secrets, and experiences anonymously. A
                safe space for genuine conversations.
              </p>
            </div>

            {currentUser && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] shrink-0"
              >
                <Plus
                  iconSize={20}
                  className="transition-transform group-hover:rotate-90"
                />
                <span>Share Confession</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col xl:flex-row gap-8 items-start">
          {/* Left Column: Filters (Sticky on Desktop) */}
          <div className="w-full xl:w-72 xl:sticky xl:top-8 shrink-0 space-y-6">
            {/* Search Bar */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search
                  iconSize={18}
                  className="text-zinc-500 group-focus-within:text-white transition-colors"
                />
              </div>
              <input
                type="text"
                placeholder="Search confessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900/80 border border-white/10 hover:border-white/20 text-white rounded-2xl pl-11 pr-4 py-4 outline-none focus:border-white/40 focus:bg-zinc-900 transition-all placeholder:text-zinc-600 shadow-xl"
              />
            </div>

            {/* Desktop Filters / Mobile Toggle */}
            <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-2xl">
              <div
                className="flex items-center justify-between xl:mb-6 cursor-pointer xl:cursor-auto"
                onClick={() => setShowFilters(!showFilters)}
              >
                <h3 className="text-white font-bold tracking-tight flex items-center gap-2">
                  <Filter iconSize={18} className="text-zinc-400" />
                  Filters & Sorting
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  )}
                </h3>
                <ArrowDown
                  iconSize={20}
                  className={`xl:hidden text-zinc-500 transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </div>

              <div
                className={`space-y-6 xl:block ${showFilters ? "block pt-6" : "hidden"}`}
              >
                {/* Filter Selects */}
                {[
                  {
                    label: "Category",
                    value: selectedCategory,
                    setter: setSelectedCategory,
                    options: categories,
                    allLabel: "All Categories",
                  },
                  {
                    label: "Sort By",
                    value: sortBy,
                    setter: setSortBy,
                    options: [
                      "recent",
                      "popular",
                      "mostCommented",
                      "mostViewed",
                    ],
                    labels: {
                      recent: "Most Recent",
                      popular: "Most Liked",
                      mostCommented: "Most Commented",
                      mostViewed: "Most Viewed",
                    },
                    allLabel: "Most Recent (Default)",
                  },
                ].map((filter, idx) => (
                  <div key={idx} className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase ml-1 block">
                      {filter.label}
                    </label>
                    <CustomDropdown
                      options={[
                        {
                          value: filter.label === "Sort By" ? "recent" : "ALL",
                          label: filter.allLabel,
                        },
                        ...filter.options.map((opt) => ({
                          value: opt,
                          label: filter.labels ? filter.labels[opt] : opt,
                        })),
                      ]}
                      value={filter.value}
                      onChange={(value) => filter.setter(value)}
                    />
                  </div>
                ))}

                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSelectedCategory("ALL");
                      setSortBy("recent");
                      setSearchTerm("");
                    }}
                    className="w-full py-3 mt-4 text-sm font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>

            <div className="hidden xl:block text-zinc-500 text-xs font-medium px-4">
              Showing{" "}
              <strong className="text-white">
                {filteredConfessions.length}
              </strong>{" "}
              confessions
            </div>
          </div>

          {/* Right Column: Confessions Feed */}
          <div className="flex-1 w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-4 border-zinc-800 border-t-zinc-400 rounded-full animate-spin"></div>
                <p className="text-zinc-500 font-medium tracking-tight animate-pulse">
                  Fetching confessions...
                </p>
              </div>
            ) : filteredConfessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-white/5 rounded-3xl bg-zinc-900/20 backdrop-blur-sm">
                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
                  <Lock iconSize={32} className="text-zinc-600" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                  Nothing found
                </h3>
                <p className="text-zinc-500 max-w-md mx-auto">
                  We couldn't find any confessions matching your current
                  filters. Try tweaking your search or check back later!
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSelectedCategory("ALL");
                      setSortBy("recent");
                      setSearchTerm("");
                    }}
                    className="mt-6 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-semibold transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 w-full">
                {filteredConfessions.map((confession) => (
                  <div
                    key={confession._id}
                    onClick={() => {
                      setSelectedConfession(confession);
                      setShowDetailModal(true);
                    }}
                    className="group relative flex flex-col bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-4xl overflow-hidden hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-xl hover:border-white/20"
                  >
                    {/* Header Area */}
                    <div className="p-6 pb-4 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-600 flex items-center justify-center shrink-0 border border-white/10 font-bold text-white text-sm">
                          A
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-tight group-hover:text-zinc-200 transition-colors">
                            Anonymous
                          </p>
                          <p className="text-xs text-zinc-500 font-medium">
                            {formatDate(confession.createdAt)} •{" "}
                            {confession.views} views
                          </p>
                        </div>
                      </div>
                      {currentUser && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfessionToDelete(confession._id);
                            setShowDeleteConfirm(true);
                          }}
                          className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center shrink-0 transition-all border border-transparent hover:border-red-500/30"
                          title="Delete Confession"
                        >
                          <Trash iconSize={14} />
                        </button>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="p-6 pt-0 flex-1 flex flex-col">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span
                          className={`inline-flex items-center border rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${getCategoryColor(
                            confession.category,
                          )}`}
                        >
                          {confession.category}
                        </span>
                        {confession.isResolved && (
                          <span className="inline-flex items-center gap-1 border border-green-500/50 bg-green-500/20 text-green-400 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                            <CheckCircle iconSize={10} />
                            Resolved
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-white tracking-tight leading-snug mb-3 line-clamp-2">
                        {confession.confession.substring(0, 60) + "..."}
                      </h3>

                      <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2 mb-4">
                        {confession.confession}
                      </p>

                      {/* Tags */}
                      {confession.tags && confession.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {confession.tags.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2.5 py-1 bg-zinc-500/20 text-zinc-300 rounded-full flex items-center gap-1 truncate"
                            >
                              <Label iconSize={10} />
                              {tag}
                            </span>
                          ))}
                          {confession.tags.length > 2 && (
                            <span className="text-xs px-2.5 py-1 text-zinc-500">
                              +{confession.tags.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Stats */}
                    <div className="px-6 py-4 border-t border-white/5 bg-black/20 flex items-center justify-between">
                      <div className="flex gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(confession._id);
                          }}
                          className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                            confession.likes?.includes(currentUser?._id)
                              ? "text-red-500"
                              : "text-zinc-500 hover:text-white"
                          }`}
                        >
                          <Heart
                            iconSize={16}
                            className={
                              confession.likes?.includes(currentUser?._id)
                                ? "fill-current"
                                : ""
                            }
                          />
                          {confession.likes?.length || 0}
                        </button>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                          <Message iconSize={16} />
                          {confession.comments?.length || 0}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                        <Eye iconSize={16} />
                        {confession.views}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-zinc-950 border border-white/10 rounded-4xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="sticky top-0 bg-zinc-950 border-b border-white/10 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Lock iconSize={24} />
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
                  <X iconSize={24} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateConfession} className="p-6 space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Category
                  </label>
                  <CustomDropdown
                    options={categories.map((cat) => ({
                      value: cat,
                      label: cat,
                    }))}
                    value={formData.category}
                    onChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  />
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
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-zinc-500 text-white placeholder-zinc-500 resize-none"
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
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-zinc-500 text-white placeholder-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-zinc-600 hover:bg-zinc-500 text-white rounded-lg font-semibold transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-500/30 text-zinc-200 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-white transition-colors"
                        >
                          <X iconSize={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-4 border-t border-white/10">
                  <button
                    type="submit"
                    className="w-full py-3 bg-zinc-600 hover:bg-zinc-500 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Send iconSize={18} />
                    Post Anonymously
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedConfession && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
            <div className="w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-4xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 my-auto flex flex-col md:flex-row">
              <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                {currentUser && (
                  <button
                    onClick={() => {
                      setConfessionToDelete(selectedConfession._id);
                      setShowDeleteConfirm(true);
                    }}
                    className="p-2 rounded-full bg-black/50 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 backdrop-blur-md transition-all transform hover:scale-110"
                    title="Delete Confession"
                  >
                    <Trash iconSize={20} />
                  </button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 rounded-full bg-black/50 hover:bg-white/10 text-white backdrop-blur-md transition-all transform hover:scale-110"
                >
                  <X iconSize={20} />
                </button>
              </div>

              {/* Left Side: Metadata and Status */}
              <div className="w-full md:w-2/5 md:min-h-[600px] bg-zinc-950 border-r border-white/5 p-8 flex flex-col justify-center md:justify-start">
                <div className="md:pt-12">
                  <div className="w-16 h-16 rounded-full bg-zinc-600 flex items-center justify-center mb-6 font-bold text-white text-xl shadow-lg">
                    A
                  </div>

                  <div className="mb-8">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                      Posted By
                    </p>
                    <p className="text-lg font-bold text-white">Anonymous</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {formatDate(selectedConfession.createdAt)}
                    </p>
                  </div>

                  {/* Category */}
                  <div className="mb-8">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
                      Category
                    </p>
                    <span
                      className={`inline-flex items-center border rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase ${getCategoryColor(
                        selectedConfession.category,
                      )}`}
                    >
                      {selectedConfession.category}
                    </span>
                  </div>

                  {/* Status */}
                  {selectedConfession.isResolved && (
                    <div className="mb-8">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
                        Status
                      </p>
                      <div className="flex items-center gap-2 text-green-400 font-semibold">
                        <CheckCircle iconSize={18} className="fill-current" />
                        Resolved
                      </div>
                    </div>
                  )}

                  {/* Views */}
                  <div className="mb-8">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
                      Engagement
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Eye iconSize={16} className="text-zinc-400 mb-1" />
                        <p className="text-lg font-bold text-white">
                          {selectedConfession.views}
                        </p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                          Views
                        </p>
                      </div>
                      <div>
                        <Heart iconSize={16} className="text-zinc-400 mb-1" />
                        <p className="text-lg font-bold text-white">
                          {selectedConfession.likes?.length || 0}
                        </p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                          Likes
                        </p>
                      </div>
                      <div>
                        <Message
                          iconSize={16}
                          className="text-zinc-400 mb-1"
                        />
                        <p className="text-lg font-bold text-white">
                          {selectedConfession.comments?.length || 0}
                        </p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                          Comments
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Content */}
              <div className="flex-1 p-8 md:p-10 flex flex-col h-full max-h-[85vh] overflow-y-auto">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white tracking-tight leading-tight mb-6">
                    {selectedConfession.confession.substring(0, 100)}...
                  </h2>

                  <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap mb-8 text-lg">
                    {selectedConfession.confession}
                  </div>
                </div>

                {/* Tags */}
                {selectedConfession.tags &&
                  selectedConfession.tags.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                      <h4 className="text-sm font-bold text-white tracking-tight mb-4">
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedConfession.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-md bg-zinc-500/20 border border-zinc-500/30 text-xs text-zinc-300 font-medium"
                          >
                            #{tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Stats and Actions */}
                <div className="flex items-center gap-6 border-y border-white/5 py-4 mb-8">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(selectedConfession._id);
                    }}
                    className="group flex items-center gap-2"
                  >
                    <div
                      className={`p-2 rounded-full transition-colors ${
                        selectedConfession.likes?.includes(currentUser?._id)
                          ? "bg-red-500/10"
                          : "bg-white/5 group-hover:bg-red-500/10"
                      }`}
                    >
                      <Heart
                        iconSize={20}
                        className={
                          selectedConfession.likes?.includes(currentUser?._id)
                            ? "fill-red-500 text-red-500"
                            : "text-zinc-400 group-hover:text-red-400"
                        }
                      />
                    </div>
                    <span className="font-bold text-white">
                      {selectedConfession.likes?.length || 0}
                    </span>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-white/5">
                      <Message iconSize={20} className="text-zinc-400" />
                    </div>
                    <span className="font-bold text-white">
                      {selectedConfession.comments?.length || 0}
                    </span>
                  </div>
                  {currentUser && (
                    <button
                      onClick={() =>
                        handleToggleResolved(selectedConfession._id)
                      }
                      className={`ml-auto flex items-center gap-2 group ${
                        selectedConfession.isResolved
                          ? "text-green-400"
                          : "text-zinc-400 group-hover:text-green-400"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-full transition-colors ${
                          selectedConfession.isResolved
                            ? "bg-green-500/10"
                            : "bg-white/5 group-hover:bg-green-500/10"
                        }`}
                      >
                        <CheckCircle
                          iconSize={20}
                          className={
                            selectedConfession.isResolved
                              ? "fill-green-500 text-green-500"
                              : ""
                          }
                        />
                      </div>
                      <span className="font-bold text-sm">
                        {selectedConfession.isResolved
                          ? "Resolved"
                          : "Mark Resolved"}
                      </span>
                    </button>
                  )}
                </div>

                {/* Comments Section */}
                <div className="mt-auto">
                  <h4 className="text-white font-bold tracking-tight mb-4">
                    Discussion
                  </h4>

                  {currentUser && (
                    <div className="flex gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10 mt-1">
                        <div className="w-full h-full bg-zinc-600 flex items-center justify-center text-white font-bold text-xs">
                          Y
                        </div>
                      </div>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            handleAddComment(selectedConfession._id)
                          }
                          className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-xl pl-4 pr-16 py-3 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30 transition-all placeholder:text-zinc-600"
                        />
                        <button
                          onClick={() =>
                            handleAddComment(selectedConfession._id)
                          }
                          disabled={!newComment.trim()}
                          className="absolute right-2 top-1.5 px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg disabled:opacity-50 transition-all disabled:cursor-not-allowed"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedConfession.comments?.length === 0 ? (
                      <p className="text-sm text-zinc-500 italic text-center py-4">
                        No comments yet. Start the conversation anonymously!
                      </p>
                    ) : (
                      selectedConfession.comments?.map((comment) => (
                        <div key={comment._id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-zinc-600 flex items-center justify-center text-white font-bold text-xs">
                            A
                          </div>
                          <div className="flex-1">
                            <div className="bg-zinc-900 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3">
                              <p className="text-xs font-bold text-zinc-400 mb-1">
                                Anonymous
                              </p>
                              <p className="text-sm text-zinc-300">
                                {comment.text}
                              </p>
                            </div>
                            <p className="text-[10px] text-zinc-600 mt-1 ml-2">
                              {formatDate(comment.createdAt)}
                            </p>
                            {currentUser && (
                              <button
                                onClick={() =>
                                  handleDeleteComment(
                                    selectedConfession._id,
                                    comment._id,
                                  )
                                }
                                className="text-[10px] text-red-400 hover:text-red-300 transition-colors mt-1 ml-2"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-120 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 md:p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                  <ShieldAlert iconSize={32} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Delete Confession?
                </h3>
                <p className="text-zinc-400 mb-8 text-sm">
                  This action cannot be undone. This will permanently remove
                  your confession from the timeline.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setConfessionToDelete(null);
                    }}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!confessionToDelete) return;
                      setIsDeleting(true);
                      try {
                        await axios.delete(
                          `${API_URL}/confessions/${confessionToDelete}`,
                          { headers: { Authorization: `Bearer ${token}` } },
                        );
                        setConfessions(
                          confessions.filter(
                            (c) => c._id !== confessionToDelete,
                          ),
                        );
                        setShowDetailModal(false);
                        setShowDeleteConfirm(false);
                        setConfessionToDelete(null);
                      } catch (err) {
                        console.error("Error deleting confession:", err);
                        alert("Failed to delete confession");
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    disabled={isDeleting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <ShieldLoading iconSize={16} className="animate-spin" />
                      </>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ConfessionsPage;
