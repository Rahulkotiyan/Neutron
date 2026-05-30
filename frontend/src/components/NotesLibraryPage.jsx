import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  Upload,
  Trash,
  Eye,
  Heart,
  Message,
  Page,
  OpenBook,
  Medal,
  Calendar,
  User,
  Refresh,
  Filter,
  ArrowDown,
  Xmark,
  Send,
} from "iconoir-react";
import CustomDropdown from "./CustomDropdown";
import CustomModal from "./CustomModal";

const NotesLibraryPage = ({ isSidebarOpen, currentUser, token }) => {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedDocType, setSelectedDocType] = useState("ALL");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("ALL");
  const [selectedCollege, setSelectedCollege] = useState("ALL");
  const [collegesList, setCollegesList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

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
    isGroup: false,
    files: [{ title: "", fileUrl: "", fileName: "" }],
  });
  const [uploadMethod, setUploadMethod] = useState("drive");
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
    fetchFilters();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [notes, searchTerm, selectedSemester, selectedBranch, selectedDocType, selectedGroupFilter, selectedCollege]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/notes`, {
        params: { _t: Date.now() },
        headers,
      });
      
      // Ensure response.data is an array
      if (Array.isArray(response.data)) {
        setNotes(response.data);
      } else {
        console.error("Expected array but got:", response.data);
        setNotes([]);
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
      setNotes([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      setLoadingFilters(true);
      const [collegesRes, branchesRes] = await Promise.all([
        axios.get(`${API_URL}/colleges`),
        axios.get(`${API_URL}/branches`)
      ]);

      if (collegesRes.data.success && Array.isArray(collegesRes.data.data)) {
        setCollegesList(collegesRes.data.data.map(c => c.name));
      }
      
      if (branchesRes.data.success && Array.isArray(branchesRes.data.data)) {
        // Use either code or name, depending on what's used in the notes
        setBranchesList(branchesRes.data.data.map(b => b.code || b.name));
      }
    } catch (err) {
      console.error("Error fetching filters:", err);
    } finally {
      setLoadingFilters(false);
    }
  };

  const filterNotes = () => {
    // Ensure notes is an array before trying to spread it
    if (!Array.isArray(notes)) {
      console.error("Notes is not an array:", notes);
      setFilteredNotes([]);
      return;
    }
    
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

    if (selectedGroupFilter !== "ALL") {
      filtered = filtered.filter(
        (note) => note.isGroup === (selectedGroupFilter === "GROUP"),
      );
    }

    if (selectedCollege !== "ALL") {
      filtered = filtered.filter((note) => note.college === selectedCollege);
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
      setModalConfig({
        isOpen: true,
        title: "Authentication Required",
        message: "Please login to upload notes",
        type: "warning",
      });
      return;
    }

    if (formData.isGroup) {
      const hasEmptyUrl = formData.files.some((file) => !file.fileUrl.trim());
      if (hasEmptyUrl) {
        setModalConfig({
          isOpen: true,
          title: "Missing Information",
          message: "Please provide a Google Drive link for all files in the group",
          type: "warning",
        });
        return;
      }
    } else if (!formData.fileUrl) {
      setModalConfig({
        isOpen: true,
        title: "Missing Link",
        message: "Please enter a Google Drive link",
        type: "warning",
      });
      return;
    }

    try {
      setUploading(true);
      const uploadData = new FormData();

      // Add form fields
      uploadData.append("title", formData.title);
      uploadData.append("description", formData.description);
      uploadData.append("subject", formData.subject);
      uploadData.append("semester", formData.semester);
      uploadData.append("branch", formData.branch);
      uploadData.append("documentType", formData.documentType);
      uploadData.append("isGroup", formData.isGroup);

      if (formData.isGroup) {
        uploadData.append("files", JSON.stringify(formData.files));
      } else {
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
        isGroup: false,
        files: [{ title: "", fileUrl: "", fileName: "" }],
      });
      setModalConfig({
        isOpen: true,
        title: "Success",
        message: "Note uploaded successfully!",
        type: "success",
      });
    } catch (err) {
      console.error("Error uploading note:", err);
      setModalConfig({
        isOpen: true,
        title: "Upload Failed",
        message: "Error uploading note: " + (err.response?.data?.message || err.message),
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSyncDrive = async () => {
    try {
      setSyncing(true);
      const response = await axios.post(`${API_URL}/notes/sync-drive`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setModalConfig({
        isOpen: true,
        title: "Sync Successful",
        message: response.data.message || `Successfully synced ${response.data.count || 0} notes from Google Drive.`,
        type: "success",
      });
      
      // Refresh notes
      fetchNotes();
    } catch (err) {
      console.error("Error syncing with drive:", err);
      setModalConfig({
        isOpen: true,
        title: "Sync Failed",
        message: "Error syncing with Google Drive: " + (err.response?.data?.message || err.message),
        type: "error",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleAddFileRow = () => {
    setFormData({
      ...formData,
      files: [...formData.files, { title: "", fileUrl: "", fileName: "" }],
    });
  };

  const handleRemoveFileRow = (index) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    setFormData({ ...formData, files: newFiles });
  };

  const handleFileChange = (index, field, value) => {
    const newFiles = [...formData.files];
    newFiles[index][field] = value;
    setFormData({ ...formData, files: newFiles });
  };

  const handleViewNote = async (note) => {
    setSelectedNote(note);
    setSelectedFileIndex(note.isGroup ? null : 0);
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
      setModalConfig({
        isOpen: true,
        title: "Login Required",
        message: "Please login to like notes",
        type: "warning",
      });
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
          n._id === noteId
            ? { ...n, likes: response.data.likes, likeCount: response.data.likeCount, hasLiked: response.data.likes.some(l => (l.id || l._id || l) === currentUser._id) }
            : n,
        ),
      );

      if (selectedNote?._id === noteId) {
        setSelectedNote({ ...selectedNote, likes: response.data.likes, likeCount: response.data.likeCount, hasLiked: response.data.likes.some(l => (l.id || l._id || l) === currentUser._id) });
      }
    } catch (err) {
      console.error("Error liking note:", err);
    }
  };

  const handleAddComment = async () => {
    if (!currentUser || !token) {
      setModalConfig({
        isOpen: true,
        title: "Login Required",
        message: "Please login to comment on notes",
        type: "warning",
      });
      return;
    }
    if (!newComment.trim() || !selectedNote) return;

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

  const handleDeleteNote = async (e, noteId) => {
    e.stopPropagation();
    
    
    setModalConfig({
      isOpen: true,
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this note?",
      type: "warning",
      onConfirm: async () => {
        try {
          const response = await axios.delete(`${API_URL}/notes/${noteId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          setNotes(notes.filter((n) => n._id !== noteId));
          if (selectedNote?._id === noteId) {
            setShowViewModal(false);
            setSelectedNote(null);
          }
          // Fetch fresh data from server to ensure consistency
          await fetchNotes();
          setModalConfig({
            isOpen: true,
            title: "Deleted",
            message: "Note deleted successfully",
            type: "success",
          });
        } catch (err) {
          setModalConfig({
            isOpen: true,
            title: "Delete Failed",
            message: "Error deleting note: " + (err.response?.data?.message || err.message),
            type: "error",
          });
        }
      },
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isLikedByUser = (note) => {
    if (!currentUser) return false;
    if (note.hasLiked !== undefined) return note.hasLiked;
    if (!note.likes) return false;
    return note.likes.some(
      (like) =>
        (typeof like === "string" ? like : like.id || like._id || like) ===
        currentUser._id,
    );
  };

  const getLikesCount = (note) => {
    if (note.likeCount !== undefined) return note.likeCount;
    return Array.isArray(note.likes) ? note.likes.length : 0;
  };

  const getFileViewerUrl = (fileUrl) => {
    if (!fileUrl) return "";
    
    // For Google Drive links, convert to embed format
    if (fileUrl.includes("drive.google.com")) {
      const fileId = fileUrl.match(/[-\w]{25,}/)?.[0];
      if (fileId) {
        // Use embed view for better display
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    
    // For direct PDF URLs or other documents, use Google Docs Viewer
    // This works for PDFs, DOCs, DOCX, PPT, PPTX, etc.
    if (fileUrl.endsWith(".pdf") || fileUrl.includes(".pdf") || 
        fileUrl.endsWith(".doc") || fileUrl.endsWith(".docx") ||
        fileUrl.endsWith(".ppt") || fileUrl.endsWith(".pptx") ||
        fileUrl.endsWith(".xls") || fileUrl.endsWith(".xlsx")) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`;
    }
    
    // For other URLs, return as-is
    return fileUrl;
  };

  const hasActiveFilters =
    selectedSemester !== "ALL" ||
    selectedBranch !== "ALL" ||
    selectedDocType !== "ALL" ||
    selectedGroupFilter !== "ALL" ||
    selectedCollege !== "ALL";

  const handleShare = (note) => {
    if (navigator.share) {
      // Native share (mobile)
      navigator
        .share({
          title: note.title || "Check this note",
          text: note.description?.substring(0, 100),
          url: `${window.location.origin}/notes/${note._id}`,
        })
        .catch(() => {});
    } else {
      // Fallback - copy to clipboard
      const shareUrl = `${window.location.origin}/notes/${note._id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setModalConfig({
          isOpen: true,
          title: "Link Copied!",
          message: "Note link copied to clipboard",
          type: "success",
        });
      });
    }
  };


  return (
    <div className="flex w-full min-h-screen bg-black text-zinc-300 selection:bg-amber-500/30">
      <main
        className={`flex-1 w-full overflow-y-auto relative transition-all duration-300 pb-20 md:pb-0 ${isSidebarOpen ? "lg:ml-72" : ""}`}
      >
        {/* Background Ambient Glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-amber-900/20 blur-[120px] rounded-full pointer-events-none opacity-50"></div>

        {/* Hero Header */}
        <div className="relative z-10 pt-4 pb-4 px-4 md:pt-6 md:pb-6 md:px-8 max-w-7xl mx-auto border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black-500/10 border border-white-500/20 text-white-400 text-xs font-bold tracking-wide uppercase mb-4">
                 Study Resources
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

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {currentUser?.isAdmin && (
                <button
                  onClick={handleSyncDrive}
                  disabled={syncing}
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-zinc-800 text-white rounded-full font-bold text-sm transition-all hover:bg-zinc-700 active:scale-95 shrink-0 border border-white/10"
                >
                  <Refresh
                    className={`w-5 h-5 ${syncing ? 'animate-spin' : 'transition-transform group-hover:rotate-180'}`}
                  />
                  <span>{syncing ? 'Syncing...' : 'Sync Drive'}</span>
                </button>
              )}
              
              {/* 
              <button
                onClick={() => {
                  if (!currentUser) {
                    setModalConfig({
                      isOpen: true,
                      title: "Login Required",
                      message: "Please login to contribute notes to the library",
                      type: "warning",
                    });
                  } else {
                    setShowUploadModal(true);
                  }
                }}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-black rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(251,146,60,0.4)] hover:shadow-[0_0_60px_-15px_rgba(251,146,60,0.6)] shrink-0"
              >
                <Upload
                  className="w-5 h-5 transition-transform group-hover:-translate-y-1"
                />
                <span>Share Notes</span>
              </button>
              */}
            </div>
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
                  className="w-4.5 h-4.5 text-zinc-500 group-focus-within:text-white transition-colors"
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

            {/* Desktop Filters / Mobile Toggle - Commented out for now
            <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-2xl relative z-50">
              <div
                className="flex items-center justify-between xl:mb-6 cursor-pointer xl:cursor-auto"
                onClick={() => setShowFilters(!showFilters)}
              >
                <h3 className="text-white font-bold tracking-tight flex items-center gap-2">
                  <Filter className="w-4.5 h-4.5 text-zinc-400" />
                  Filters
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  )}
                </h3>
                <ArrowDown
                  className={`w-5 h-5 xl:hidden text-zinc-500 transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </div>

              <div
                className={`space-y-6 xl:block ${showFilters ? "block pt-6" : "hidden"}`}
              >
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

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase ml-1 block">
                    Branch
                  </label>
                  <CustomDropdown
                    colorScheme="amber"
                    options={[
                      { value: "ALL", label: "All Branches" },
                      ...(branchesList.length > 0 ? branchesList : branches).map((branch) => ({
                        value: branch,
                        label: branch,
                      })),
                    ]}
                    value={selectedBranch}
                    onChange={setSelectedBranch}
                  />
                </div>

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

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase ml-1 block">
                    Institution
                  </label>
                  <CustomDropdown
                    colorScheme="amber"
                    options={[
                      { value: "ALL", label: "All Institutions" },
                      ...collegesList.map((college) => ({
                        value: college,
                        label: college,
                      })),
                    ]}
                    value={selectedCollege}
                    onChange={setSelectedCollege}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase ml-1 block">
                    Format
                  </label>
                  <CustomDropdown
                    colorScheme="amber"
                    options={[
                      { value: "ALL", label: "All Formats" },
                      { value: "SINGLE", label: "Single Notes" },
                      { value: "GROUP", label: "Grouped Notes" },
                    ]}
                    value={selectedGroupFilter}
                    onChange={setSelectedGroupFilter}
                  />
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSelectedSemester("ALL");
                      setSelectedBranch("ALL");
                      setSelectedDocType("ALL");
                      setSelectedGroupFilter("ALL");
                      setSelectedCollege("ALL");
                      setSearchTerm("");
                    }}
                    className="w-full py-3 mt-4 text-sm font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
            */}

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
                  <OpenBook className="w-8 h-8 text-zinc-600" />
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
                      setSelectedGroupFilter("ALL");
                      setSelectedCollege("ALL");
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
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-500 font-medium">
                          {formatDate(note.createdAt)} • {note.views} views
                        </p>
                      </div>

                      {currentUser && currentUser.isAdmin && (
                        <button
                          onClick={(e) => handleDeleteNote(e, note._id)}
                          className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all shrink-0"
                          title="Delete Note"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="p-6 pt-0 flex-1 flex flex-col">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span
                          className="inline-flex items-center border border-white/10 bg-white/5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-zinc-300"
                        >
                          {note.documentType.replace(/_/g, " ")}
                        </span>
                        <span className="inline-flex items-center border border-white/10 bg-white/5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-zinc-300">
                          Sem {note.semester}
                        </span>
                        {note.isGroup && (
                          <span className="inline-flex items-center border border-amber-500/30 bg-amber-500/10 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-amber-500">
                            Group • {note.files?.length || 0} Files
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-white tracking-tight leading-snug mb-3 line-clamp-2">
                        {note.title}
                      </h3>

                      {note.description && !note.description.includes("Automatically synced") && (
                        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 mb-4">
                          {note.description}
                        </p>
                      )}

                      {/* Quick Metadata */}
                      <div className="mt-auto flex flex-wrap gap-2 mb-4">
                        {note.subject && note.subject !== "Drive Sync" && (
                          <span className="text-xs font-semibold bg-black/30 text-zinc-300 rounded-full px-2.5 py-1 border border-white/10">
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
                            if (!currentUser) {
                              setModalConfig({
                                isOpen: true,
                                title: "Login Required",
                                message: "Please login to like notes",
                                type: "warning",
                              });
                              return;
                            }
                            handleLike(note._id);
                          }}
                          className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                            isLikedByUser(note)
                              ? "text-red-500"
                              : "text-zinc-500 hover:text-white"
                          }`}
                        >
                          <Heart
                            className={
                              isLikedByUser(note) ? "fill-current w-4 h-4" : "w-4 h-4"
                            }
                          />
                          {getLikesCount(note)}
                        </button>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                          <Message className="w-4 h-4" />
                          {note.comments?.length || 0}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(note);
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-green-400 hover:bg-green-500/10 px-2 py-1 rounded-full transition-all"
                        >
                          <Send className="w-4 h-4" />
                          <span className="hidden sm:inline">Share</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                        <Eye className="w-4 h-4" />
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
                <Xmark size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-8">

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
                        ... (branchesList.length > 0 ? branchesList : branches).map((branch) => ({
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

                {/* Group Upload Toggle */}
                <div className="flex items-center gap-3 p-4 bg-zinc-900/50 border border-white/10 rounded-xl">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white">Group Notes</h4>
                    <p className="text-xs text-zinc-500">Upload multiple files under one topic</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isGroup: !formData.isGroup })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${formData.isGroup ? 'bg-amber-500' : 'bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.isGroup ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                {/* Google Drive Link Section / Batch Files Section */}
                <div className="space-y-4">
                  {!formData.isGroup ? (
                    <>
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
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest block">
                          Group Files *
                        </label>
                        <button
                          type="button"
                          onClick={handleAddFileRow}
                          className="text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors"
                        >
                          + Add File
                        </button>
                      </div>
                      {formData.files.map((file, index) => (
                        <div key={index} className="p-4 bg-zinc-900/30 border border-white/5 rounded-xl space-y-3 relative">
                          {formData.files.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFileRow(index)}
                              className="absolute top-2 right-2 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-full transition-all"
                            >
                              <Xmark className="w-2.5 h-2.5" />
                            </button>
                          )}
                          <input
                            type="text"
                            placeholder="File Title (e.g., Unit 1 Notes)"
                            value={file.title}
                            onChange={(e) => handleFileChange(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white"
                            required
                          />
                          <input
                            type="url"
                            placeholder="Google Drive Link"
                            value={file.fileUrl}
                            onChange={(e) => handleFileChange(index, 'fileUrl', e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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
                        <Refresh className="w-5 h-5 animate-spin" />
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
                  className={isLikedByUser(selectedNote) ? "fill-current w-5 h-5" : "w-5 h-5"}
                />
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-3 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/10 transition-all"
              >
                <Xmark className="w-5 h-5" />
              </button>
            </div>

            {/* Left Side - Document Viewer */}
            <div className="flex-1 p-8 pt-20 border-r border-white/5">
              <div className="space-y-6">
                {/* Badge and Info */}
                <div>
                  <span
                    className="inline-flex items-center border border-white/10 bg-white/5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-zinc-300"
                  >
                    {selectedNote.documentType.replace(/_/g, " ")}
                  </span>
                  <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
                    {selectedNote.title}
                  </h2>
                  {selectedNote.description && !selectedNote.description.includes("Automatically synced") && (
                    <p className="text-zinc-400 text-lg leading-relaxed">
                      {selectedNote.description}
                    </p>
                  )}
                </div>

                {/* File Viewer Container */}
                <div className="relative">
                  {selectedNote.isGroup && selectedNote.files?.length > 0 && (
                    <div className="mb-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                          Group Resources ({selectedNote.files.length})
                        </h4>
                        {selectedFileIndex !== null && (
                          <button 
                            onClick={() => setSelectedFileIndex(null)}
                            className="text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors"
                          >
                            Back to List
                          </button>
                        )}
                      </div>
                      
                      {selectedFileIndex === null ? (
                        <div className="grid gap-3">
                          {selectedNote.files.map((file, idx) => (
                            <div 
                              key={idx}
                              onClick={() => setSelectedFileIndex(idx)}
                              className="group/file flex items-center gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-amber-500/30 hover:bg-zinc-900 transition-all cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover/file:text-amber-500 transition-colors">
                                <Page className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-bold text-white truncate group-hover/file:text-amber-300 transition-colors">
                                  {file.title || `Resource ${idx + 1}`}
                                </h5>
                                <p className="text-xs text-zinc-500 truncate">
                                  {file.fileName || "View Document"}
                                </p>
                              </div>
                              <div className="px-3 py-1 rounded-lg bg-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider group-hover/file:bg-amber-500/10 group-hover/file:text-amber-500 transition-all">
                                Open
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                          <Page size={16} className="text-amber-500" />
                          <span className="text-xs font-bold text-amber-500 truncate flex-1">
                            Viewing: {selectedNote.files[selectedFileIndex]?.title}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {(selectedFileIndex !== null || !selectedNote.isGroup) && (
                    <div
                      className="relative w-full h-[500px] rounded-2xl border border-white/10 overflow-hidden bg-zinc-950"
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <iframe
                        src={getFileViewerUrl(
                          selectedNote.isGroup 
                            ? selectedNote.files[selectedFileIndex]?.fileUrl 
                            : selectedNote.fileUrl
                        )}
                        className="w-full h-full"
                        title={selectedNote.isGroup ? selectedNote.files[selectedFileIndex]?.title : selectedNote.title}
                        style={{ pointerEvents: "auto" }}
                        allowFullScreen
                        loading="lazy"
                        onError={(e) => {
                          console.error("Error loading document:", e);
                          e.target.style.display = 'none';
                          const errorDiv = e.target.nextElementSibling;
                          if (errorDiv) errorDiv.style.display = 'flex';
                        }}
                      />
                      <div 
                        className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-zinc-400"
                        style={{ display: 'none' }}
                      >
                        <div className="text-center">
                          <Page className="w-12 h-12 text-zinc-600" />
                          <p className="text-sm">Unable to load document</p>
                          <a 
                            href={selectedNote.isGroup ? selectedNote.files[selectedFileIndex]?.fileUrl : selectedNote.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-semibold transition-colors"
                          >
                            Open in New Tab
                          </a>
                        </div>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
                    </div>
                  )}
                  
                  {(!selectedNote.isGroup || selectedFileIndex !== null) && (
                    <p className="text-xs text-zinc-500 mt-3 text-center">
                      Document is view-only. Right-click and download options are
                      restricted.
                    </p>
                  )}
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

                {/* Share Button */}
                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={() => handleShare(selectedNote)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Share This Note
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side - Details and Comments */}
            <div className="w-full md:w-80 flex flex-col bg-zinc-900/50 border-t md:border-t-0 md:border-l border-white/5">
              {/* Document Info */}
              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                <div className="space-y-3 pb-4 border-b border-white/5">
                  {selectedNote.subject && selectedNote.subject !== "Drive Sync" && (
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
                    <Message className="w-4.5 h-4.5" />
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
      {/* Custom Alert/Confirm Modal */}
      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
};

export default NotesLibraryPage;
