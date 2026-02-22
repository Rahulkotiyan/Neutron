import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  Upload,
  X,
  Eye,
  Heart,
  MessageCircle,
  FileText,
  BookOpen,
  Award,
  Calendar,
  User,
  Loader,
  Filter,
  ChevronDown,
} from "lucide-react";
import CustomDropdown from "./CustomDropdown";

const NotesLibraryPage = ({ isSidebarOpen, currentUser, token }) => {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedDocType, setSelectedDocType] = useState("ALL");

  // Upload form
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    semester: "",
    branch: "",
    documentType: "NOTES",
    fileUrl: "",
    fileName: "",
  });
  const [uploadMethod, setUploadMethod] = useState("device");
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [newComment, setNewComment] = useState("");

  const API_URL = "http://localhost:5000/api";

  const branches = [
    "CSE",
    "ECE",
    "EEE",
    "ME",
    "CE",
    "IT",
    "AIML",
    "DS",
    "CSBS",
    "AERO",
    "AUTO",
    "BIOTECH",
  ];
  const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"];
  const documentTypes = ["NOTES", "SYLLABUS", "PAST_PAPERS"];
  const subjects = [
    "Data Structures",
    "Algorithms",
    "Database Management",
    "Web Development",
    "Mobile Development",
    "Machine Learning",
    "Operating Systems",
    "Computer Networks",
    "Software Engineering",
    "Object Oriented Programming",
    "Python Programming",
    "Java Programming",
    "C Programming",
  ];

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [notes, searchTerm, selectedSemester, selectedBranch, selectedDocType]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/notes`);
      setNotes(response.data);
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterNotes = () => {
    let filtered = [...notes];

    if (selectedSemester !== "ALL") {
      filtered = filtered.filter((note) => note.semester === selectedSemester);
    }

    if (selectedBranch !== "ALL") {
      filtered = filtered.filter((note) => note.branch === selectedBranch);
    }

    if (selectedDocType !== "ALL") {
      filtered = filtered.filter(
        (note) => note.documentType === selectedDocType,
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.subject?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredNotes(filtered);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!currentUser || !token) {
      alert("Please login to upload notes");
      return;
    }

    if (uploadMethod === "device" && !selectedFile) {
      alert("Please select a file");
      return;
    }

    if (uploadMethod === "drive" && !formData.fileUrl) {
      alert("Please enter a Google Drive link");
      return;
    }

    try {
      setUploading(true);
      const uploadData = new FormData();

      if (uploadMethod === "device" && selectedFile) {
        uploadData.append("file", selectedFile);
      }

      // Add form fields
      uploadData.append("title", formData.title);
      uploadData.append("description", formData.description);
      uploadData.append("subject", formData.subject);
      uploadData.append("semester", formData.semester);
      uploadData.append("branch", formData.branch);
      uploadData.append("documentType", formData.documentType);

      if (uploadMethod === "drive") {
        uploadData.append("fileUrl", formData.fileUrl);
        uploadData.append("fileName", formData.fileName || "document.pdf");
      }

      const response = await axios.post(`${API_URL}/notes`, uploadData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setNotes([response.data, ...notes]);
      setShowUploadModal(false);
      setFormData({
        title: "",
        description: "",
        subject: "",
        semester: "",
        branch: "",
        documentType: "NOTES",
        fileUrl: "",
        fileName: "",
      });
      setSelectedFile(null);
      alert("Note uploaded successfully!");
    } catch (err) {
      console.error("Error uploading note:", err);
      alert(
        "Error uploading note: " + (err.response?.data?.message || err.message),
      );
    } finally {
      setUploading(false);
    }
  };

  const handleViewNote = async (note) => {
    setSelectedNote(note);
    setShowViewModal(true);

    // Increment views
    try {
      await axios.get(`${API_URL}/notes/${note._id}`);
    } catch (err) {
      console.error("Error updating views:", err);
    }
  };

  const handleLike = async (noteId) => {
    if (!currentUser || !token) {
      alert("Please login to like notes");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/notes/${noteId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setNotes(
        notes.map((n) =>
          n._id === noteId ? { ...n, likes: response.data.likes } : n,
        ),
      );

      if (selectedNote?._id === noteId) {
        setSelectedNote({ ...selectedNote, likes: response.data.likes });
      }
    } catch (err) {
      console.error("Error liking note:", err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !token || !selectedNote) return;

    try {
      const response = await axios.post(
        `${API_URL}/notes/${selectedNote._id}/comment`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setSelectedNote({ ...selectedNote, comments: response.data.comments });
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const getDocTypeIcon = (type) => {
    switch (type) {
      case "NOTES":
        return <FileText className="w-4 h-4" />;
      case "SYLLABUS":
        return <BookOpen className="w-4 h-4" />;
      case "PAST_PAPERS":
        return <Award className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getDocTypeColor = (type) => {
    switch (type) {
      case "NOTES":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "SYLLABUS":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "PAST_PAPERS":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isLikedByUser = (note) => {
    if (!currentUser || !note.likes) return false;
    // Handle both cases: array of IDs or array of user objects
    return note.likes.some(
      (like) =>
        (typeof like === "string" ? like : like._id || like) ===
        currentUser._id,
    );
  };

  const getLikesCount = (note) => {
    return Array.isArray(note.likes) ? note.likes.length : 0;
  };

  const getFileViewerUrl = (fileUrl) => {
    // For Google Drive links, convert to embed format (restricts downloads better)
    if (fileUrl?.includes("drive.google.com")) {
      const fileId = fileUrl.match(/[-\w]{25,}/)?.[0];
      if (fileId) {
        // Use embed view which has better download restrictions
        return `https://drive.google.com/file/d/${fileId}/preview?usp=embed`;
      }
    }
    // For PDFs from Cloudinary or other sources, use Google Docs Viewer
    // This embeds the PDF and has limited download options
    if (fileUrl?.endsWith(".pdf") || fileUrl?.includes(".pdf")) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    }
    return fileUrl;
  };

  const hasActiveFilters =
    selectedSemester !== "ALL" ||
    selectedBranch !== "ALL" ||
    selectedDocType !== "ALL";

  // Authentication check - only logged-in users can access
  if (!currentUser || !token) {
    return (
      <div className="flex w-full min-h-screen bg-black text-zinc-300 items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
            <BookOpen size={40} className="text-amber-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Login Required</h2>
          <p className="text-zinc-400 mb-8">
            You need to be logged in to access the Notes Library. Please login
            to view and share study materials with the community.
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold rounded-lg hover:scale-105 transition-transform"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen bg-black text-zinc-300 selection:bg-amber-500/30">
      <main
        className={`flex-1 w-full overflow-y-auto relative transition-all duration-300 ${isSidebarOpen ? "lg:ml-72" : ""}`}
      >
        {/* Background Ambient Glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-amber-900/20 blur-[120px] rounded-full pointer-events-none opacity-50"></div>

        {/* Hero Header */}
        <div className="relative z-10 pt-4 pb-4 px-4 md:pt-6 md:pb-6 md:px-8 max-w-7xl mx-auto border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-wide uppercase mb-4">
                <BookOpen size={14} /> Study Resources
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3">
                Notes Library
                <br />
                Hub
              </h1>
              <p className="text-zinc-400 text-lg max-w-xl">
                Access and share comprehensive study materials, syllabus
                documents, and past exam papers. Learn from your peers and
                contribute to the community.
              </p>
            </div>

            {currentUser && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-black rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(251,146,60,0.4)] hover:shadow-[0_0_60px_-15px_rgba(251,146,60,0.6)] shrink-0"
              >
                <Upload
                  size={20}
                  className="transition-transform group-hover:-translate-y-1"
                />
                <span>Share Notes</span>
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
                placeholder="Search notes..."
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
                  Filters
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
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
                {/* Filter Dropdown 1: Semester */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase ml-1 block">
                    Semester
                  </label>
                  <CustomDropdown
                    colorScheme="amber"
                    options={[
                      { value: "ALL", label: "All Semesters" },
                      ...semesters.map((sem) => ({
                        value: sem,
                        label: `Semester ${sem}`,
                      })),
                    ]}
                    value={selectedSemester}
                    onChange={setSelectedSemester}
                  />
                </div>

                {/* Filter Dropdown 2: Branch */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase ml-1 block">
                    Branch
                  </label>
                  <CustomDropdown
                    colorScheme="amber"
                    options={[
                      { value: "ALL", label: "All Branches" },
                      ...branches.map((branch) => ({
                        value: branch,
                        label: branch,
                      })),
                    ]}
                    value={selectedBranch}
                    onChange={setSelectedBranch}
                  />
                </div>

                {/* Filter Dropdown 3: Document Type */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase ml-1 block">
                    Type
                  </label>
                  <CustomDropdown
                    colorScheme="amber"
                    options={[
                      { value: "ALL", label: "All Types" },
                      ...documentTypes.map((type) => ({
                        value: type,
                        label: type.replace(/_/g, " "),
                      })),
                    ]}
                    value={selectedDocType}
                    onChange={setSelectedDocType}
                  />
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSelectedSemester("ALL");
                      setSelectedBranch("ALL");
                      setSelectedDocType("ALL");
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
              <strong className="text-white">{filteredNotes.length}</strong>{" "}
              notes
            </div>
          </div>

          {/* Right Column: Notes Feed */}
          <div className="flex-1 w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-4 border-zinc-800 border-t-amber-500 rounded-full animate-spin"></div>
                <p className="text-zinc-500 font-medium tracking-tight animate-pulse">
                  Fetching notes...
                </p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-white/5 rounded-3xl bg-zinc-900/20 backdrop-blur-sm">
                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
                  <BookOpen size={32} className="text-zinc-600" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                  Nothing found
                </h3>
                <p className="text-zinc-500 max-w-md mx-auto">
                  We couldn't find any notes matching your current filters. Try
                  tweaking your search or check back later!
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSelectedSemester("ALL");
                      setSelectedBranch("ALL");
                      setSelectedDocType("ALL");
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
                {filteredNotes.map((note) => (
                  <div
                    key={note._id}
                    onClick={() => handleViewNote(note)}
                    className={`group relative flex flex-col bg-zinc-900/40 backdrop-blur-md border rounded-[2rem] overflow-hidden hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-xl ${"border-white/5 hover:border-amber-500/30"}`}
                  >
                    {/* Header Area */}
                    <div className="p-6 pb-4 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10">
                          {note.uploader?.avatar ? (
                            <img
                              src={note.uploader.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                              {note.uploader?.name?.charAt(0) || "U"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-tight group-hover:text-amber-300 transition-colors">
                            {note.uploader?.name || "Anonymous"}
                          </p>
                          <p className="text-xs text-zinc-500 font-medium">
                            {formatDate(note.createdAt)} • {note.views} views
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 pt-0 flex-1 flex flex-col">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span
                          className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${getDocTypeColor(
                            note.documentType,
                          )}`}
                        >
                          {getDocTypeIcon(note.documentType)}
                          {note.documentType.replace(/_/g, " ")}
                        </span>
                        <span className="inline-flex items-center border border-white/10 bg-white/5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-zinc-300">
                          Sem {note.semester}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-white tracking-tight leading-snug mb-3 line-clamp-2">
                        {note.title}
                      </h3>

                      <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 mb-4">
                        {note.description}
                      </p>

                      {/* Quick Metadata */}
                      <div className="mt-auto flex flex-wrap gap-2 mb-4">
                        {note.subject && (
                          <span className="text-xs font-semibold bg-black/30 text-amber-300 rounded-full px-2.5 py-1 border border-amber-500/20">
                            {note.subject}
                          </span>
                        )}
                        {note.branch && (
                          <span className="text-xs font-semibold bg-black/30 text-zinc-300 rounded-full px-2.5 py-1 border border-white/10">
                            {note.branch}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Stats */}
                    <div className="px-6 py-4 border-t border-white/5 bg-black/20 flex items-center justify-between">
                      <div className="flex gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(note._id);
                          }}
                          className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                            isLikedByUser(note)
                              ? "text-red-500"
                              : "text-zinc-500 hover:text-white"
                          }`}
                        >
                          <Heart
                            size={16}
                            className={
                              isLikedByUser(note) ? "fill-current" : ""
                            }
                          />
                          {getLikesCount(note)}
                        </button>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                          <MessageCircle size={16} />
                          {note.comments?.length || 0}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                        <Eye size={16} />
                        {note.views || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[110] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl relative overflow-hidden my-auto animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="sticky top-0 bg-zinc-950 border-b border-white/10 px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Share Your Notes
                </h2>
                <p className="text-zinc-400 text-sm">
                  Contribute to the community by uploading study materials
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-8">
              {/* Upload Method Selector */}
              <div className="mb-8">
                <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3 block">
                  Upload Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUploadMethod("device")}
                    className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                      uploadMethod === "device"
                        ? "border-amber-500 bg-amber-500/10 text-amber-400"
                        : "border-white/10 bg-zinc-800 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    <Upload size={20} className="mx-auto mb-2" />
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethod("drive")}
                    className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                      uploadMethod === "drive"
                        ? "border-amber-500 bg-amber-500/10 text-amber-400"
                        : "border-white/10 bg-zinc-800 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    <FileText size={20} className="mx-auto mb-2" />
                    Google Drive Link
                  </button>
                </div>
              </div>

              <form onSubmit={handleUpload} className="space-y-6">
                {/* Title Input */}
                <div>
                  <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">
                    Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Data Structures - Sorting Algorithms"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-zinc-600"
                    required
                  />
                </div>

                {/* Description Textarea */}
                <div>
                  <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Add details about the notes, topics covered, etc."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-zinc-600 h-20 resize-none"
                  />
                </div>

                {/* Subject and Semester Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">
                      Subject *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Data Structures"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-zinc-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">
                      Semester *
                    </label>
                    <CustomDropdown
                      colorScheme="amber"
                      options={[
                        { value: "", label: "Select Semester" },
                        ...semesters.map((sem) => ({
                          value: sem,
                          label: `Semester ${sem}`,
                        })),
                      ]}
                      value={formData.semester}
                      onChange={(value) =>
                        setFormData({ ...formData, semester: value })
                      }
                    />
                  </div>
                </div>

                {/* Branch and Type Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">
                      Branch
                    </label>
                    <CustomDropdown
                      colorScheme="amber"
                      options={[
                        { value: "", label: "Select Branch" },
                        ...branches.map((branch) => ({
                          value: branch,
                          label: branch,
                        })),
                      ]}
                      value={formData.branch}
                      onChange={(value) =>
                        setFormData({ ...formData, branch: value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">
                      Type
                    </label>
                    <CustomDropdown
                      colorScheme="amber"
                      options={documentTypes.map((type) => ({
                        value: type,
                        label: type.replace(/_/g, " "),
                      }))}
                      value={formData.documentType}
                      onChange={(value) =>
                        setFormData({ ...formData, documentType: value })
                      }
                    />
                  </div>
                </div>

                {/* File Upload Section */}
                {uploadMethod === "device" ? (
                  <div>
                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3 block">
                      Select File *
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setSelectedFile(file);
                        }}
                        className="w-full px-4 py-3 bg-zinc-900/50 border-2 border-dashed border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-500 file:text-white cursor-pointer hover:border-amber-500/30 transition-colors"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                        required
                      />
                      <p className="text-xs text-zinc-500 mt-2">
                        Supported formats: PDF, DOC, DOCX, PPT, XLS
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">
                        Google Drive Link *
                      </label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/file/d/..."
                        value={formData.fileUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, fileUrl: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-zinc-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">
                        File Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Sorting_Algorithms.pdf"
                        value={formData.fileName}
                        onChange={(e) =>
                          setFormData({ ...formData, fileName: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-zinc-600"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold transition-colors"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-black rounded-xl font-semibold transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Share Notes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedNote && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
          <div className="w-full max-w-5xl bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 my-auto flex flex-col md:flex-row">
            {/* Modal Header - Sticky */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
              <button
                onClick={() => handleLike(selectedNote._id)}
                className={`p-3 rounded-full font-semibold transition-all ${
                  isLikedByUser(selectedNote)
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/10"
                }`}
              >
                <Heart
                  size={20}
                  className={isLikedByUser(selectedNote) ? "fill-current" : ""}
                />
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-3 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Left Side - Document Viewer */}
            <div className="flex-1 p-8 pt-20 border-r border-white/5">
              <div className="space-y-6">
                {/* Badge and Info */}
                <div>
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border mb-4 ${getDocTypeColor(
                      selectedNote.documentType,
                    )}`}
                  >
                    {getDocTypeIcon(selectedNote.documentType)}
                    {selectedNote.documentType.replace(/_/g, " ")}
                  </span>
                  <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
                    {selectedNote.title}
                  </h2>
                  <p className="text-zinc-400 text-lg leading-relaxed">
                    {selectedNote.description}
                  </p>
                </div>

                {/* File Viewer Container */}
                <div className="relative">
                  <div
                    className="relative w-full h-[500px] rounded-2xl border border-white/10 overflow-hidden bg-zinc-950"
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <iframe
                      src={getFileViewerUrl(selectedNote.fileUrl)}
                      className="w-full h-full"
                      title={selectedNote.title}
                      style={{ pointerEvents: "auto" }}
                    />
                    <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-3 text-center">
                    Document is view-only. Right-click and download options are
                    restricted.
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {selectedNote.views || 0}
                    </div>
                    <div className="text-xs text-zinc-500">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {getLikesCount(selectedNote)}
                    </div>
                    <div className="text-xs text-zinc-500">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {selectedNote.comments?.length || 0}
                    </div>
                    <div className="text-xs text-zinc-500">Comments</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Details and Comments */}
            <div className="w-full md:w-80 flex flex-col bg-zinc-900/50 border-t md:border-t-0 md:border-l border-white/5">
              {/* Uploader Info */}
              <div className="p-6 border-b border-white/5">
                <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-3">
                  Uploaded By
                </p>
                <div className="flex items-center gap-3">
                  {selectedNote.uploader?.avatar ? (
                    <img
                      src={selectedNote.uploader.avatar}
                      alt={selectedNote.uploader.name}
                      className="w-12 h-12 rounded-full border border-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg border border-white/10">
                      {selectedNote.uploader?.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                      {selectedNote.uploader?.name || "Anonymous"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(selectedNote.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Info */}
              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                <div className="space-y-3 pb-4 border-b border-white/5">
                  {selectedNote.subject && (
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">
                        Subject
                      </p>
                      <p className="text-sm text-white font-medium">
                        {selectedNote.subject}
                      </p>
                    </div>
                  )}
                  {selectedNote.semester && (
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">
                        Semester
                      </p>
                      <p className="text-sm text-white font-medium">
                        Semester {selectedNote.semester}
                      </p>
                    </div>
                  )}
                  {selectedNote.branch && (
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">
                        Branch
                      </p>
                      <p className="text-sm text-white font-medium">
                        {selectedNote.branch}
                      </p>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <MessageCircle size={18} />
                    Comments
                  </h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                    {selectedNote.comments?.length === 0 ? (
                      <p className="text-sm text-zinc-500 text-center py-6">
                        No comments yet
                      </p>
                    ) : (
                      selectedNote.comments?.map((comment) => (
                        <div
                          key={comment._id}
                          className="bg-zinc-800/50 rounded-lg p-3 border border-white/5"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                              {comment.userName?.charAt(0) || "U"}
                            </div>
                            <span className="font-semibold text-xs text-white">
                              {comment.userName}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {comment.text}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {currentUser && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleAddComment()
                        }
                        className="flex-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white text-sm"
                      />
                      <button
                        onClick={handleAddComment}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors text-sm"
                      >
                        Post
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 border-t border-white/5">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesLibraryPage;
