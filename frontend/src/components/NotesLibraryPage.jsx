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
  Star,
  Loader,
  Trash2,
  Edit2,
  FileText,
  BookOpen,
  Award,
  TrendingUp,
  Eye,
  Upload as UploadIcon,
  ChevronDown,
} from "lucide-react";

const NotesLibraryPage = ({ isSidebarOpen, currentUser, token }) => {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [selectedDocType, setSelectedDocType] = useState("ALL");
  const [sortBy, setSortBy] = useState("recent");
  const [newComment, setNewComment] = useState("");
  const [userNotes, setUserNotes] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    semester: "",
    branch: "",
    documentType: "NOTES",
    fileUrl: "",
    fileName: "",
    tags: "",
  });
  const [uploadMethod, setUploadMethod] = useState("device"); // 'device' or 'drive'
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const API_URL = "http://localhost:5000/api";
  const subjects = [
    "Data Structures",
    "Algorithms",
    "Database Management",
    "Web Development",
    "Mobile Development",
    "Machine Learning",
    "Artificial Intelligence",
    "Cloud Computing",
    "Cybersecurity",
    "Software Engineering",
    "Operating Systems",
    "Computer Networks",
    "Discrete Mathematics",
    "Advanced Java",
    "Python Programming",
    "C Programming",
  ];
  const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"];
  const documentTypes = [
    "NOTES",
    "PAST_PAPERS",
    "MODEL_PAPERS",
    "SYLLABUS",
    "MODULES",
    "OTHER",
  ];

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [
    notes,
    searchTerm,
    selectedSubject,
    selectedSemester,
    selectedDocType,
    sortBy,
  ]);

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
    let filtered = notes;

    if (selectedSubject !== "ALL") {
      filtered = filtered.filter((note) => note.subject === selectedSubject);
    }

    if (selectedSemester !== "ALL") {
      filtered = filtered.filter((note) => note.semester === selectedSemester);
    }

    if (selectedDocType !== "ALL") {
      filtered = filtered.filter(
        (note) => note.documentType === selectedDocType
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case "downloads":
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "likes":
        filtered.sort((a, b) => b.likes.length - a.likes.length);
        break;
      case "views":
        filtered.sort((a, b) => b.views - a.views);
        break;
      case "recent":
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredNotes(filtered);
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!currentUser || !token) {
      alert("Please login to upload notes");
      return;
    }

    // Validate based on upload method
    if (uploadMethod === "device" && !selectedFile) {
      alert("Please select a file from your device");
      return;
    }

    if (uploadMethod === "drive" && !formData.fileUrl) {
      alert("Please enter a Google Drive link");
      return;
    }

    try {
      setUploading(true);
      let fileUrl = formData.fileUrl;
      let fileName = formData.fileName;

      // Handle device file upload
      if (uploadMethod === "device" && selectedFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", selectedFile);

        try {
          // Using a simple approach - convert to base64 or use your backend file storage
          const reader = new FileReader();
          reader.onload = async (event) => {
            fileUrl = event.target.result; // Base64 string
            fileName = selectedFile.name;

            const noteData = {
              ...formData,
              fileUrl,
              fileName,
              tags: formData.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag),
            };

            try {
              const response = await axios.post(`${API_URL}/notes`, noteData, {
                headers: { Authorization: `Bearer ${token}` },
              });

              setNotes([response.data, ...notes]);
              setShowCreateModal(false);
              setFormData({
                title: "",
                description: "",
                subject: "",
                semester: "",
                branch: "",
                documentType: "NOTES",
                fileUrl: "",
                fileName: "",
                tags: "",
              });
              setSelectedFile(null);
              setUploading(false);
              alert("Note uploaded successfully!");
            } catch (err) {
              console.error("Error creating note:", err);
              alert("Error uploading note");
              setUploading(false);
            }
          };
          reader.readAsDataURL(selectedFile);
        } catch (err) {
          console.error("Error reading file:", err);
          alert("Error reading file");
          setUploading(false);
        }
      } else {
        // Handle Google Drive link
        const noteData = {
          ...formData,
          fileUrl,
          fileName: fileName || "document.pdf",
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag),
        };

        const response = await axios.post(`${API_URL}/notes`, noteData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setNotes([response.data, ...notes]);
        setShowCreateModal(false);
        setFormData({
          title: "",
          description: "",
          subject: "",
          semester: "",
          branch: "",
          documentType: "NOTES",
          fileUrl: "",
          fileName: "",
          tags: "",
        });
        setSelectedFile(null);
        setUploading(false);
        alert("Note uploaded successfully!");
      }
    } catch (err) {
      console.error("Error creating note:", err);
      alert("Error uploading note");
      setUploading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      await axios.delete(`${API_URL}/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(notes.filter((n) => n._id !== noteId));
      setShowDetailModal(false);
      alert("Note deleted successfully!");
    } catch (err) {
      console.error("Error deleting note:", err);
      alert("Error deleting note");
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotes(
        notes.map((n) =>
          n._id === noteId
            ? {
                ...n,
                likes: response.data.likes,
              }
            : n
        )
      );

      if (selectedNote?._id === noteId) {
        setSelectedNote({
          ...selectedNote,
          likes: response.data.likes,
        });
      }
    } catch (err) {
      console.error("Error liking note:", err);
    }
  };

  const handleDownload = async (noteId, fileUrl, fileName) => {
    try {
      await axios.post(
        `${API_URL}/notes/${noteId}/download`,
        {},
        { headers: { Authorization: `Bearer ${token || ""}` } }
      );

      // Simulate file download
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName;
      link.click();
    } catch (err) {
      console.error("Error downloading note:", err);
    }
  };

  const handleAddComment = async (noteId) => {
    if (!newComment.trim() || !token) return;

    try {
      const response = await axios.post(
        `${API_URL}/notes/${noteId}/comment`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedNote({
        ...selectedNote,
        comments: response.data.comments,
      });
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const getDocTypeColor = (docType) => {
    switch (docType) {
      case "NOTES":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "PAST_PAPERS":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "MODEL_PAPERS":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "SYLLABUS":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "MODULES":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getDocTypeIcon = (docType) => {
    switch (docType) {
      case "NOTES":
        return <FileText size={16} />;
      case "PAST_PAPERS":
        return <Award size={16} />;
      case "MODEL_PAPERS":
        return <BookOpen size={16} />;
      case "SYLLABUS":
        return <FileText size={16} />;
      case "MODULES":
        return <FileText size={16} />;
      default:
        return <FileText size={16} />;
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
    <div className="w-full flex-1 overflow-auto bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-300 my-10">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-white/5 bg-zinc-950/80 backdrop-blur">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                📚 Notes Library
              </h1>
              <p className="text-zinc-400">
                Share & access study materials, past papers & resources
              </p>
            </div>
            {currentUser && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-blue-500/50"
              >
                <UploadIcon size={20} />
                Upload Notes
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
                placeholder="Search by title, subject, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-zinc-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Subject Filter */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">
                  SUBJECT
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white transition-colors"
                >
                  <option value="ALL">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester Filter */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">
                  SEMESTER
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white transition-colors"
                >
                  <option value="ALL">All Semesters</option>
                  {semesters.map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Type Filter */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">
                  TYPE
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white transition-colors"
                >
                  <option value="ALL">All Types</option>
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, " ")}
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
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white transition-colors"
                >
                  <option value="recent">Most Recent</option>
                  <option value="downloads">Most Downloaded</option>
                  <option value="rating">Top Rated</option>
                  <option value="likes">Most Liked</option>
                  <option value="views">Most Viewed</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="flex items-end justify-between">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">
                    RESULTS
                  </label>
                  <p className="text-lg font-bold text-blue-400">
                    {filteredNotes.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader size={40} className="animate-spin text-blue-500" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen size={48} className="mx-auto text-zinc-600 mb-4" />
            <p className="text-xl text-zinc-400">No notes found</p>
            <p className="text-zinc-500 mt-2">
              {currentUser
                ? "Be the first to upload notes!"
                : "Login to upload notes"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNotes.map((note) => (
              <div
                key={note._id}
                onClick={() => setSelectedNote(note)}
                className="group bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1"
              >
                {/* Card Header with Badge */}
                <div className="relative p-5 pb-3 border-b border-white/5">
                  <div className="flex justify-between items-start mb-3">
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getDocTypeColor(
                        note.documentType
                      )}`}
                    >
                      {getDocTypeIcon(note.documentType)}
                      {note.documentType.replace(/_/g, " ")}
                    </div>
                    <div className="text-right text-xs text-zinc-500">
                      Sem {note.semester}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                    {note.title}
                  </h3>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-sm text-zinc-400 line-clamp-2">
                      {note.description || "No description provided"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">
                        {note.subject}
                      </span>
                      {note.branch && (
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
                          {note.branch}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Uploader Info */}
                  <div className="flex items-center gap-3 py-3 border-t border-b border-white/5">
                    {note.uploader?.avatar ? (
                      <img
                        src={note.uploader.avatar}
                        alt={note.uploader.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {note.uploader?.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-white">
                        {note.uploader?.name || "Anonymous"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatDate(note.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white/5 rounded-lg py-2">
                      <Eye size={14} className="mx-auto text-zinc-500 mb-1" />
                      <p className="text-xs font-semibold text-white">
                        {note.views}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg py-2">
                      <Download
                        size={14}
                        className="mx-auto text-zinc-500 mb-1"
                      />
                      <p className="text-xs font-semibold text-white">
                        {note.downloads}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg py-2">
                      <Heart size={14} className="mx-auto text-zinc-500 mb-1" />
                      <p className="text-xs font-semibold text-white">
                        {note.likes?.length || 0}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg py-2">
                      <Star size={14} className="mx-auto text-zinc-500 mb-1" />
                      <p className="text-xs font-semibold text-white">
                        {note.rating?.toFixed(1) || "0"}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(note._id, note.fileUrl, note.fileName);
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 text-sm"
                    >
                      <Download size={14} />
                      Download
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(note._id);
                      }}
                      className={`w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 text-sm ${
                        currentUser && note.likes?.includes(currentUser._id)
                          ? "bg-red-500/30 text-red-300 border border-red-500/50"
                          : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                      }`}
                    >
                      <Heart
                        size={14}
                        fill={
                          currentUser && note.likes?.includes(currentUser._id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                      Like
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/20 rounded-2xl p-6 w-full max-w-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Upload Notes</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedFile(null);
                }}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Upload Method Selector */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setUploadMethod("device")}
                className={`p-4 rounded-lg border-2 transition-all font-semibold flex items-center justify-center gap-2 ${
                  uploadMethod === "device"
                    ? "border-blue-500 bg-blue-500/10 text-blue-300"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"
                }`}
              >
                <UploadIcon size={20} />
                Upload from Device
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod("drive")}
                className={`p-4 rounded-lg border-2 transition-all font-semibold flex items-center justify-center gap-2 ${
                  uploadMethod === "drive"
                    ? "border-blue-500 bg-blue-500/10 text-blue-300"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"
                }`}
              >
                <FileText size={20} />
                Google Drive Link
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Note Title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-zinc-500"
                  required
                />

                <select
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>

                <select
                  value={formData.semester}
                  onChange={(e) =>
                    setFormData({ ...formData, semester: e.target.value })
                  }
                  className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  required
                >
                  <option value="">Select Semester</option>
                  {semesters.map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>

                <select
                  value={formData.documentType}
                  onChange={(e) =>
                    setFormData({ ...formData, documentType: e.target.value })
                  }
                  className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  required
                >
                  <option value="">Select Document Type</option>
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Branch (Optional)"
                  value={formData.branch}
                  onChange={(e) =>
                    setFormData({ ...formData, branch: e.target.value })
                  }
                  className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-zinc-500"
                />
              </div>

              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-zinc-500 h-24 resize-none"
              />

              {/* File Upload Section */}
              {uploadMethod === "device" ? (
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-3">
                    Select File
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          setFormData({
                            ...formData,
                            fileName: file.name,
                          });
                        }
                      }}
                      className="hidden"
                      id="file-input"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                    />
                    <label
                      htmlFor="file-input"
                      className="w-full px-4 py-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-dashed border-blue-500/50 rounded-lg cursor-pointer hover:border-blue-400 transition-colors flex flex-col items-center justify-center"
                    >
                      <UploadIcon size={32} className="text-blue-400 mb-2" />
                      <p className="text-white font-semibold">
                        {selectedFile
                          ? selectedFile.name
                          : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        PDF, DOC, PPT, XLS up to 50MB
                      </p>
                    </label>
                  </div>
                  {selectedFile && (
                    <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-between">
                      <p className="text-sm text-green-300">
                        ✓ File selected: {selectedFile.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-green-300 hover:text-red-300 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-3">
                    Google Drive Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing"
                    value={formData.fileUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, fileUrl: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-zinc-500 text-sm"
                    required
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    💡 Tip: Make sure the file is accessible and shared publicly
                    or with limited access
                  </p>
                </div>
              )}

              <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-zinc-500"
              />

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedFile(null);
                  }}
                  className="flex-1 px-4 py-3 bg-zinc-800 text-white rounded-lg font-semibold hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadIcon size={18} />
                      Upload Notes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedNote && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/20 rounded-2xl w-full max-w-3xl my-8 overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 bg-zinc-950 border-b border-white/10 p-6 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getDocTypeColor(
                      selectedNote.documentType
                    )}`}
                  >
                    {getDocTypeIcon(selectedNote.documentType)}
                    {selectedNote.documentType.replace(/_/g, " ")}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedNote.title}
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
              {/* Info */}
              <div>
                <p className="text-zinc-300 mb-4">{selectedNote.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded border border-blue-500/30">
                    {selectedNote.subject}
                  </span>
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded border border-purple-500/30">
                    Semester {selectedNote.semester}
                  </span>
                  {selectedNote.branch && (
                    <span className="text-xs bg-orange-500/20 text-orange-300 px-3 py-1 rounded border border-orange-500/30">
                      {selectedNote.branch}
                    </span>
                  )}
                </div>
              </div>

              {/* Uploader */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs text-zinc-400 mb-2">Uploaded by</p>
                <div className="flex items-center gap-3">
                  {selectedNote.uploader?.avatar ? (
                    <img
                      src={selectedNote.uploader.avatar}
                      alt={selectedNote.uploader.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {selectedNote.uploader?.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-white">
                      {selectedNote.uploader?.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(selectedNote.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  {
                    icon: Eye,
                    label: "Views",
                    value: selectedNote.views,
                  },
                  {
                    icon: Download,
                    label: "Downloads",
                    value: selectedNote.downloads,
                  },
                  {
                    icon: Heart,
                    label: "Likes",
                    value: selectedNote.likes?.length || 0,
                  },
                  {
                    icon: Star,
                    label: "Rating",
                    value: selectedNote.rating?.toFixed(1) || "0",
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 rounded-lg p-3 text-center border border-white/10"
                  >
                    <stat.icon
                      size={18}
                      className="mx-auto text-blue-400 mb-2"
                    />
                    <p className="text-sm font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-zinc-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Comments */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">
                  Comments ({selectedNote.comments?.length || 0})
                </h3>
                <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                  {selectedNote.comments?.map((comment) => (
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
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
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
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-zinc-500 text-sm"
                    />
                    <button
                      onClick={() => handleAddComment(selectedNote._id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
                    >
                      Post
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-zinc-950 border-t border-white/10 p-6 flex gap-3">
              <button
                onClick={() =>
                  handleDownload(
                    selectedNote._id,
                    selectedNote.fileUrl,
                    selectedNote.fileName
                  )
                }
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Download size={18} />
                Download
              </button>
              <button
                onClick={() => handleLike(selectedNote._id)}
                className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                  currentUser && selectedNote.likes?.includes(currentUser._id)
                    ? "bg-red-500/30 text-red-300 border border-red-500/50"
                    : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                }`}
              >
                <Heart
                  size={18}
                  fill={
                    currentUser && selectedNote.likes?.includes(currentUser._id)
                      ? "currentColor"
                      : "none"
                  }
                />
                Like
              </button>
              {currentUser && selectedNote.uploader._id === currentUser._id && (
                <button
                  onClick={() => handleDeleteNote(selectedNote._id)}
                  className="px-6 py-3 bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg font-semibold hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-3 bg-zinc-800 text-white rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
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

export default NotesLibraryPage;
