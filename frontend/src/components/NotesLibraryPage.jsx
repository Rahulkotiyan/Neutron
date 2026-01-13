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
} from "lucide-react";

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
        (note) => note.documentType === selectedDocType
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.subject?.toLowerCase().includes(searchTerm.toLowerCase())
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
      alert("Error uploading note: " + (err.response?.data?.message || err.message));
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotes(
        notes.map((n) =>
          n._id === noteId ? { ...n, likes: response.data.likes } : n
        )
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
        { headers: { Authorization: `Bearer ${token}` } }
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
        (typeof like === "string" ? like : like._id || like) === currentUser._id
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

  return (
    <div className={`w-full min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white pt-16 transition-all duration-300 ${
      isSidebarOpen ? "lg:ml-72" : "lg:ml-0"
    }`}>
      {/* Header */}
      <div className="sticky top-16 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Notes Library
              </h1>
              <p className="text-zinc-400 mt-1">
                Access and share study materials, syllabus, and question papers
              </p>
            </div>
            {currentUser && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/20"
              >
                <Upload className="w-5 h-5" />
                Upload
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="mt-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search notes, subjects, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-900/50 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500/50 text-white placeholder-zinc-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Semester
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500/50 text-white"
                >
                  <option value="ALL">All Semesters</option>
                  {semesters.map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Branch
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500/50 text-white"
                >
                  <option value="ALL">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Type
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500/50 text-white"
                >
                  <option value="ALL">All Types</option>
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 mx-auto text-zinc-700 mb-4" />
            <p className="text-xl text-zinc-400">No notes found</p>
            <p className="text-zinc-500 mt-2">
              {currentUser
                ? "Be the first to upload notes!"
                : "Login to upload and access notes"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note._id}
                className="group bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden hover:border-blue-500/30 transition-all cursor-pointer"
                onClick={() => handleViewNote(note)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getDocTypeColor(
                        note.documentType
                      )}`}
                    >
                      {getDocTypeIcon(note.documentType)}
                      {note.documentType.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-zinc-500">
                      Sem {note.semester}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {note.title}
                  </h3>

                  <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                    {note.description || "No description"}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {note.subject && (
                      <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">
                        {note.subject}
                      </span>
                    )}
                    {note.branch && (
                      <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">
                        {note.branch}
                      </span>
                    )}
                  </div>

                  {/* Uploader Info */}
                  <div className="flex items-center gap-2 mb-4 pt-3 border-t border-white/5">
                    {note.uploader?.avatar ? (
                      <img
                        src={note.uploader.avatar}
                        alt={note.uploader.name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {note.uploader?.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {note.uploader?.name || "Anonymous"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatDate(note.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {note.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {getLikesCount(note)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(note._id);
                      }}
                      className={`p-2 rounded-lg transition-all ${
                        isLikedByUser(note)
                          ? "text-red-400 bg-red-500/10"
                          : "text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isLikedByUser(note) ? "fill-current" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="sticky top-0 bg-zinc-900 border-b border-white/10 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Upload Notes</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setUploadMethod("device")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    uploadMethod === "device"
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-white/10 bg-zinc-800 text-zinc-400"
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod("drive")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    uploadMethod === "drive"
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-white/10 bg-zinc-800 text-zinc-400"
                  }`}
                >
                  Google Drive Link
                </button>
              </div>

              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                required
              />

              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white h-24 resize-none"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Subject"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-zinc-500"
                  required
                />

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
                  value={formData.branch}
                  onChange={(e) =>
                    setFormData({ ...formData, branch: e.target.value })
                  }
                  className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                >
                  <option value="">Select Branch (Optional)</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
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
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              {uploadMethod === "device" ? (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select File
                  </label>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedFile(file);
                    }}
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white cursor-pointer"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Google Drive Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/file/d/..."
                    value={formData.fileUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, fileUrl: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="File Name (optional)"
                    value={formData.fileName}
                    onChange={(e) =>
                      setFormData({ ...formData, fileName: e.target.value })
                    }
                    className="w-full mt-2 px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
                      Upload
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedNote && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-zinc-900 border-b border-white/10 p-6 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getDocTypeColor(
                      selectedNote.documentType
                    )}`}
                  >
                    {getDocTypeIcon(selectedNote.documentType)}
                    {selectedNote.documentType.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm text-zinc-400">
                    Semester {selectedNote.semester}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedNote.title}
                </h2>
                <p className="text-zinc-400">{selectedNote.description}</p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-zinc-400 hover:text-white ml-4"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Uploader Info */}
              <div className="mb-6 bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs text-zinc-400 mb-3">Uploaded by</p>
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
                  <div className="flex-1">
                    <p className="font-semibold text-white">
                      {selectedNote.uploader?.name || "Anonymous"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {selectedNote.uploader?.email && (
                        <span>{selectedNote.uploader.email}</span>
                      )}
                      {selectedNote.uploader?.college && (
                        <span className="ml-2">• {selectedNote.uploader.college}</span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Uploaded on {formatDate(selectedNote.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* File Viewer */}
              <div className="mb-6 bg-zinc-950 rounded-lg border border-white/10 p-4">
                <div 
                  className="relative w-full h-[600px] rounded-lg border border-white/10 overflow-hidden"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <iframe
                    src={getFileViewerUrl(selectedNote.fileUrl)}
                    className="w-full h-full"
                    title={selectedNote.title}
                    style={{ pointerEvents: 'auto' }}
                  />
                </div>
                <div className="mt-4 flex items-center justify-end">
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {selectedNote.views || 0} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {getLikesCount(selectedNote)} likes
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-2 text-center">
                  Document is view-only. Right-click and download options are disabled.
                </p>
              </div>

              {/* Comments */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Comments ({selectedNote.comments?.length || 0})
                </h3>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {selectedNote.comments?.map((comment) => (
                    <div
                      key={comment._id}
                      className="bg-zinc-800/50 rounded-lg p-4 border border-white/5"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {comment.userName?.charAt(0) || "U"}
                        </div>
                        <span className="font-semibold text-sm">
                          {comment.userName}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {formatDate(comment.createdAt)}
                        </span>
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
                      onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                      className="flex-1 px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                    />
                    <button
                      onClick={handleAddComment}
                      className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      Post
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-white/10 p-6 flex gap-3">
              <button
                onClick={() => handleLike(selectedNote._id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  isLikedByUser(selectedNote)
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/10"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${
                    isLikedByUser(selectedNote) ? "fill-current" : ""
                  }`}
                />
                Like
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="flex-1 px-6 py-3 bg-zinc-800 text-white rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
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