import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  X,
  Search,
  Filter,
  Heart,
  MessageCircle,
  Pin,
  Loader,
  Trash2,
  FileText,
  Bell,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Eye,
  Megaphone,
  Zap,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import CreateNoticeModal from "./CreateNoticeModal";
import CustomDropdown from "./CustomDropdown";
import { useSocket } from "../context/SocketContext";

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
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [noticeToast, setNoticeToast] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const { socket } = useSocket();

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

  // Listen for real-time notice notifications from socket
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (data) => {
      if (data.type === "NOTICE") {
        setNoticeToast(data);
        // Auto-dismiss after 5s
        setTimeout(() => setNoticeToast(null), 5000);
      }
    };
    socket.on("new_notification", handleNewNotification);
    return () => socket.off("new_notification", handleNewNotification);
  }, [socket]);

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

    if (selectedType !== "ALL")
      filtered = filtered.filter((n) => n.noticeType === selectedType);
    if (selectedCategory !== "ALL")
      filtered = filtered.filter((n) => n.category === selectedCategory);
    if (selectedPriority !== "ALL")
      filtered = filtered.filter((n) => n.priority === selectedPriority);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (notice) =>
          notice.title.toLowerCase().includes(term) ||
          notice.description?.toLowerCase().includes(term) ||
          notice.tags?.some((tag) => tag.toLowerCase().includes(term)),
      );
    }

    switch (sortBy) {
      case "priority":
        const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
        filtered.sort(
          (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
        );
        break;
      case "views":
        filtered.sort((a, b) => b.views - a.views);
        break;
      case "likes":
        filtered.sort(
          (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0),
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

  const handleNoticeCreated = (newNotice) => {
    setNotices([newNotice, ...notices]);
    // Optional: Add a toast notification here instead of alert for nicer UX
  };

  const handleDeleteNotice = (noticeId) => {
    setNoticeToDelete(noticeId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteNotice = async () => {
    if (!noticeToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/notices/${noticeToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotices(notices.filter((n) => n._id !== noticeToDelete));
      setShowDetailModal(false);
      setShowDeleteConfirm(false);
      setNoticeToDelete(null);
    } catch (err) {
      console.error("Error deleting notice:", err);
      alert("Error deleting notice");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLike = async (noticeId, e) => {
    if (e) e.stopPropagation();
    if (!currentUser || !token) return alert("Please login to like notices");

    try {
      const response = await axios.post(
        `${API_URL}/notices/${noticeId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setNotices(
        notices.map((n) =>
          n._id === noticeId ? { ...n, likes: response.data.likes } : n,
        ),
      );
      if (selectedNotice?._id === noticeId) {
        setSelectedNotice({ ...selectedNotice, likes: response.data.likes });
      }
    } catch (err) {
      console.error("Error liking notice:", err);
    }
  };

  const handleAddComment = async (noticeId) => {
    if (!newComment.trim() || !token) return;
    try {
      const response = await axios.post(
        `${API_URL}/notices/${noticeId}/comment`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSelectedNotice({
        ...selectedNotice,
        comments: response.data.comments,
      });
      setNewComment("");
      // Update main list as well to reflect comment count
      setNotices(
        notices.map((n) =>
          n._id === noticeId ? { ...n, comments: response.data.comments } : n,
        ),
      );
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "NORMAL":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "LOW":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "ANNOUNCEMENT":
        return <Megaphone size={14} />;
      case "POSTER":
        return <FileText size={14} />;
      case "CIRCULAR":
        return <Bell size={14} />;
      case "EVENT":
        return <Calendar size={14} />;
      case "FEST":
        return <Zap size={14} />;
      case "ACADEMIC":
        return <FileText size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const hasActiveFilters =
    selectedType !== "ALL" ||
    selectedCategory !== "ALL" ||
    selectedPriority !== "ALL" ||
    sortBy !== "pinned";

  return (
    <div className="flex w-full min-h-screen bg-black text-zinc-300 selection:bg-red-500/30">
      <main
        className={`flex-1 w-full overflow-y-auto relative transition-all duration-300 ${isSidebarOpen ? "lg:ml-72" : ""}`}
      >
        {/* Real-time Notice Toast */}
        {noticeToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex items-center gap-3 bg-zinc-900 border border-red-500/40 shadow-2xl shadow-red-900/20 rounded-2xl px-5 py-3.5 max-w-sm">
              <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <Megaphone size={18} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-0.5">
                  {noticeToast.title}
                </p>
                <p className="text-sm text-zinc-300 font-medium leading-tight truncate">
                  {noticeToast.message}
                </p>
              </div>
              <button
                onClick={() => setNoticeToast(null)}
                className="text-zinc-600 hover:text-white transition-colors shrink-0 ml-1"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        {/* Background Ambient Glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-red-900/20 blur-[120px] rounded-full pointer-events-none opacity-50"></div>

        {/* Hero Header */}
        <div className="relative z-10 pt-4 pb-4 px-4 md:pt-6 md:pb-6 md:px-8 max-w-7xl mx-auto border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black-500/10 border border-gray-500/20 text-gray-400 text-xs font-bold tracking-wide uppercase mb-4">
                <Zap size={14} /> Campus Updates
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3">
                Official
                <br />
                Notices Hub
              </h1>
              <p className="text-zinc-400 text-lg max-w-xl">
                Stay in the loop with the latest campus announcements, event
                posters, circulars, and academic updates.
              </p>
            </div>

            {currentUser && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] shrink-0"
              >
                <Plus
                  size={20}
                  className="transition-transform group-hover:rotate-90"
                />
                <span>Publish Notice</span>
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
                  size={18}
                  className="text-zinc-500 group-focus-within:text-white transition-colors"
                />
              </div>
              <input
                type="text"
                placeholder="Search notices..."
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
                  <Filter size={18} className="text-zinc-400" />
                  Filters & Sorting
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  )}
                </h3>
                <ChevronDown
                  size={20}
                  className={`xl:hidden text-zinc-500 transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </div>

              <div
                className={`space-y-6 xl:block ${showFilters ? "block pt-6" : "hidden"}`}
              >
                {/* Filter Selects */}
                {[
                  {
                    label: "Notice Type",
                    value: selectedType,
                    setter: setSelectedType,
                    options: noticeTypes,
                    allLabel: "All Types",
                  },
                  {
                    label: "Category",
                    value: selectedCategory,
                    setter: setSelectedCategory,
                    options: categories,
                    allLabel: "All Categories",
                  },
                  {
                    label: "Priority",
                    value: selectedPriority,
                    setter: setSelectedPriority,
                    options: priorities,
                    allLabel: "All Priorities",
                  },
                  {
                    label: "Sort By",
                    value: sortBy,
                    setter: setSortBy,
                    options: ["priority", "views", "likes"],
                    labels: {
                      priority: "Highest Priority",
                      views: "Most Viewed",
                      likes: "Most Liked",
                    },
                    allLabel: "Pinned First (Default)",
                  },
                ].map((filter, idx) => (
                  <div key={idx} className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase ml-1 block">
                      {filter.label}
                    </label>
                    <CustomDropdown
                      colorScheme="red"
                      options={[
                        {
                          value: filter.label === "Sort By" ? "pinned" : "ALL",
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
                      setSelectedType("ALL");
                      setSelectedCategory("ALL");
                      setSelectedPriority("ALL");
                      setSortBy("pinned");
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
              <strong className="text-white">{filteredNotices.length}</strong>{" "}
              notices
            </div>
          </div>

          {/* Right Column: Notice Feed */}
          <div className="flex-1 w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-4 border-zinc-800 border-t-red-500 rounded-full animate-spin"></div>
                <p className="text-zinc-500 font-medium tracking-tight animate-pulse">
                  Fetching notices...
                </p>
              </div>
            ) : filteredNotices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-white/5 rounded-3xl bg-zinc-900/20 backdrop-blur-sm">
                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
                  <Bell size={32} className="text-zinc-600" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                  Nothing found
                </h3>
                <p className="text-zinc-500 max-w-md mx-auto">
                  We couldn't find any notices matching your current filters.
                  Try tweaking your search or check back later!
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSelectedType("ALL");
                      setSelectedCategory("ALL");
                      setSelectedPriority("ALL");
                      setSortBy("pinned");
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
                {filteredNotices.map((notice) => (
                  <div
                    key={notice._id}
                    onClick={() => {
                      setSelectedNotice(notice);
                      setShowDetailModal(true);
                    }}
                    className={`group relative flex flex-col bg-zinc-900/40 backdrop-blur-md border rounded-[2rem] overflow-hidden hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-xl ${
                      notice.pinned
                        ? "border-red-500/30 bg-red-950/10 hover:border-red-500/60 shadow-red-900/5"
                        : "border-white/5 hover:border-white/20"
                    }`}
                  >
                    {/* Pinned Indicator Glow */}
                    {notice.pinned && (
                      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>
                    )}

                    {/* Header Area */}
                    <div className="p-6 pb-4 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10">
                          {notice.publisher?.avatar ? (
                            <img
                              src={notice.publisher.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-white text-sm font-bold">
                              {notice.publisher?.name?.charAt(0) || "P"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-tight group-hover:text-red-300 transition-colors">
                            {notice.publisher?.name || "Anonymous"}
                          </p>
                          <p className="text-xs text-zinc-500 font-medium">
                            {formatDate(notice.createdAt)} • {notice.views}{" "}
                            views
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {notice.pinned && (
                          <div
                            className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0"
                            title="Pinned Notice"
                          >
                            <Pin size={16} className="fill-current" />
                          </div>
                        )}
                        {currentUser &&
                          notice.publisher &&
                          // The backend nests the populated object under publisher._id
                          String(
                            notice.publisher?._id?._id ||
                              notice.publisher?._id ||
                              notice.publisher,
                          ) === String(currentUser._id || currentUser.id) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotice(notice._id);
                              }}
                              className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center shrink-0 transition-all border border-transparent hover:border-red-500/30"
                              title="Delete Notice"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 pt-0 flex-1 flex flex-col">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span
                          className={`inline-flex items-center border rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${getPriorityColor(notice.priority)}`}
                        >
                          {notice.priority}
                        </span>
                        <span className="inline-flex items-center gap-1.5 border border-white/10 bg-white/5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-zinc-300">
                          {getTypeIcon(notice.noticeType)}
                          {notice.noticeType}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-white tracking-tight leading-snug mb-3 line-clamp-2">
                        {notice.title}
                      </h3>

                      <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 mb-4">
                        {notice.description}
                      </p>

                      {/* Quick Metadata */}
                      {notice.eventDate && (
                        <div className="mt-auto flex items-center gap-2 text-xs font-semibold text-zinc-300 bg-black/30 rounded-lg p-2.5 border border-white/5 w-fit">
                          <Calendar size={14} className="text-red-400" />
                          {new Date(notice.eventDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Optional Image Thumbnail Preview (if present) */}
                    {notice.posterUrl && (
                      <div
                        className="h-40 w-full bg-zinc-950 overflow-hidden relative cursor-zoom-in group/img"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxUrl(notice.posterUrl);
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent z-10"></div>
                        <img
                          src={notice.posterUrl}
                          alt=""
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                        />
                        <div className="absolute inset-0 z-20 flex items-end justify-end p-3 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200">
                          <div className="bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-white text-[10px] font-bold">
                            <Eye size={11} /> Expand
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer Stats */}
                    <div className="px-6 py-4 border-t border-white/5 bg-black/20 flex items-center justify-between">
                      <div className="flex gap-4">
                        <button
                          onClick={(e) => handleLike(notice._id, e)}
                          className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                            notice.likes?.includes(currentUser?._id)
                              ? "text-red-500"
                              : "text-zinc-500 hover:text-white"
                          }`}
                        >
                          <Heart
                            size={16}
                            className={
                              notice.likes?.includes(currentUser?._id)
                                ? "fill-current"
                                : ""
                            }
                          />
                          {notice.likes?.length || 0}
                        </button>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                          <MessageCircle size={16} />
                          {notice.comments?.length || 0}
                        </div>
                      </div>
                      {notice.attachments?.length > 0 && (
                        <div
                          className="text-zinc-500"
                          title={`${notice.attachments.length} Attachments`}
                        >
                          <FileText size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <CreateNoticeModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          currentUser={currentUser}
          token={token}
          onNoticeCreated={handleNoticeCreated}
        />

        {/* Redesigned Detail Modal */}
        {showDetailModal && selectedNotice && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
            <div className="w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 my-auto flex flex-col md:flex-row">
              <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                {currentUser &&
                  selectedNotice.publisher &&
                  // The backend nests the populated object under publisher._id
                  String(
                    selectedNotice.publisher?._id?._id ||
                      selectedNotice.publisher?._id ||
                      selectedNotice.publisher,
                  ) === String(currentUser._id || currentUser.id) && (
                    <button
                      onClick={() => handleDeleteNotice(selectedNotice._id)}
                      className="p-2 rounded-full bg-black/50 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 backdrop-blur-md transition-all transform hover:scale-110"
                      title="Delete Notice"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 rounded-full bg-black/50 hover:bg-white/10 text-white backdrop-blur-md transition-all transform hover:scale-110"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Left/Top Area: Image/Poster */}
              {selectedNotice.posterUrl && (
                <div
                  className="w-full md:w-2/5 md:min-h-[600px] bg-zinc-900 relative cursor-zoom-in group/modal"
                  onClick={() => setLightboxUrl(selectedNotice.posterUrl)}
                >
                  <img
                    src={selectedNotice.posterUrl}
                    alt={selectedNotice.title}
                    className="w-full h-64 md:h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent md:hidden"></div>
                  {/* Expand hint */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/modal:opacity-100 transition-opacity duration-200 bg-black/20">
                    <div className="bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 text-white text-xs font-semibold">
                      <Eye size={14} /> View full image
                    </div>
                  </div>
                </div>
              )}

              {/* Right/Bottom Area: Details */}
              <div
                className={`flex-1 p-8 md:p-10 flex flex-col h-full max-h-[85vh] overflow-y-auto ${!selectedNotice.posterUrl ? "max-w-3xl mx-auto" : ""}`}
              >
                <div className="flex items-center gap-3 mb-6">
                  {selectedNotice.publisher?.avatar ? (
                    <img
                      src={selectedNotice.publisher.avatar}
                      alt=""
                      className="w-12 h-12 rounded-full border border-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedNotice.publisher?.name?.charAt(0) || "P"}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-white leading-tight">
                      {selectedNotice.publisher?.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(selectedNotice.createdAt)} •{" "}
                      {selectedNotice.views} views
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className={`inline-flex items-center border rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase ${getPriorityColor(selectedNotice.priority)}`}
                  >
                    {selectedNotice.priority} PRIORITY
                  </span>
                  <span className="inline-flex items-center gap-1.5 border border-white/10 bg-white/5 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-zinc-300">
                    {getTypeIcon(selectedNotice.noticeType)}
                    {selectedNotice.noticeType}
                  </span>
                </div>

                <h2 className="text-3xl font-bold text-white tracking-tight leading-tight mb-6">
                  {selectedNotice.title}
                </h2>

                <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap mb-8">
                  {selectedNotice.description}
                </div>

                {/* Event / Metadata Block */}
                {(selectedNotice.eventDate ||
                  selectedNotice.location ||
                  selectedNotice.contactPerson ||
                  selectedNotice.tags?.length > 0) && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 space-y-4">
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      Additional Details
                    </h4>

                    {selectedNotice.eventDate && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                          <Calendar size={16} className="text-red-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            Date & Time
                          </p>
                          <p className="text-sm text-zinc-200 font-medium">
                            {new Date(
                              selectedNotice.eventDate,
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedNotice.location && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                          <MapPin size={16} className="text-red-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            Location
                          </p>
                          <p className="text-sm text-zinc-200 font-medium">
                            {selectedNotice.location}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedNotice.contactPerson && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                          <Phone size={16} className="text-red-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            Contact
                          </p>
                          <p className="text-sm text-zinc-200 font-medium whitespace-nowrap">
                            {selectedNotice.contactPerson}{" "}
                            {selectedNotice.contactPhone &&
                              `• ${selectedNotice.contactPhone}`}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedNotice.tags?.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        {selectedNotice.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-md bg-zinc-900 border border-white/5 text-xs text-zinc-400"
                          >
                            #{tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Status and Actions */}
                <div className="flex items-center gap-6 border-y border-white/5 py-4 mb-8">
                  <button
                    onClick={(e) => handleLike(selectedNotice._id, e)}
                    className="group flex items-center gap-2"
                  >
                    <div
                      className={`p-2 rounded-full transition-colors ${selectedNotice.likes?.includes(currentUser?._id) ? "bg-red-500/10" : "bg-white/5 group-hover:bg-red-500/10"}`}
                    >
                      <Heart
                        size={20}
                        className={
                          selectedNotice.likes?.includes(currentUser?._id)
                            ? "fill-red-500 text-red-500"
                            : "text-zinc-400 group-hover:text-red-400"
                        }
                      />
                    </div>
                    <span className="font-bold text-white">
                      {selectedNotice.likes?.length || 0}
                    </span>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-white/5">
                      <MessageCircle size={20} className="text-zinc-400" />
                    </div>
                    <span className="font-bold text-white">
                      {selectedNotice.comments?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="mt-auto">
                  <h4 className="text-white font-bold tracking-tight mb-4">
                    Discussion
                  </h4>

                  {currentUser && (
                    <div className="flex gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10 mt-1">
                        {currentUser.avatar ? (
                          <img src={currentUser.avatar} alt="" />
                        ) : (
                          <div className="w-full h-full bg-zinc-800" />
                        )}
                      </div>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            handleAddComment(selectedNotice._id)
                          }
                          className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-xl pl-4 pr-16 py-3 text-sm outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all placeholder:text-zinc-600"
                        />
                        <button
                          onClick={() => handleAddComment(selectedNotice._id)}
                          disabled={!newComment.trim()}
                          className="absolute right-2 top-1.5 px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg disabled:opacity-50 transition-all"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedNotice.comments?.length === 0 ? (
                      <p className="text-sm text-zinc-500 italic text-center py-4">
                        No comments yet. Start the conversation!
                      </p>
                    ) : (
                      selectedNotice.comments?.map((comment) => (
                        <div key={comment._id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-zinc-800">
                            {comment.userAvatar && (
                              <img src={comment.userAvatar} alt="" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="bg-zinc-900 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3">
                              <p className="text-xs font-bold text-white mb-1">
                                {comment.userName}
                              </p>
                              <p className="text-sm text-zinc-300">
                                {comment.text}
                              </p>
                            </div>
                            <p className="text-[10px] text-zinc-600 mt-1 ml-2">
                              {formatDate(comment.createdAt)}
                            </p>
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
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 md:p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                  <AlertTriangle size={32} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Delete Notice?
                </h3>
                <p className="text-zinc-400 mb-8 text-sm">
                  This action cannot be undone. This will permanently remove
                  your notice from the timeline.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setNoticeToDelete(null);
                    }}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteNotice}
                    disabled={isDeleting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <Loader size={16} className="animate-spin" />
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

        {/* Fullscreen Image Lightbox */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
              onClick={() => setLightboxUrl(null)}
            >
              <X size={22} />
            </button>
            <img
              src={lightboxUrl}
              alt="Full view"
              className="max-w-full max-h-[92vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default NoticesPage;
