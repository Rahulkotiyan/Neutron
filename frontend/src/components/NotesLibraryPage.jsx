import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  Upload,
  Refresh,
  Filter,
  ArrowDown,
  FireFlame,
  Clock,
  OpenBook,
} from "iconoir-react";
import CustomModal from "./CustomModal";
import NoteCard from "./NoteCard";
import NoteUploadModal from "./NoteUploadModal";
import NoteViewModal from "./NoteViewModal";
import FilterBottomSheet from "./FilterBottomSheet";
import { API_URL } from "../utils/api";

const NotesLibraryPage = ({ isSidebarOpen, currentUser, token }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: "", message: "", type: "info", onConfirm: null });

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedDocType, setSelectedDocType] = useState("ALL");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("ALL");
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const semesters = ["1","2","3","4","5","6","7","8"];
  const documentTypes = ["NOTES","SYLLABUS","PAST_PAPERS"];

  const branches = ["CSE","ECE","EEE","ME","CE","IT","AIML","DS","CSBS","AERO","AUTO","BIOTECH"];

  const handleFilterChange = (key, value) => {
    if (key === "semester") setSelectedSemester(value);
    else if (key === "branch") setSelectedBranch(value);
    else if (key === "docType") setSelectedDocType(value);
    else if (key === "group") setSelectedGroupFilter(value);
  };

  useEffect(() => { fetchNotes(true); }, [selectedSemester, selectedBranch, selectedDocType, selectedGroupFilter, searchTerm, sortBy]);

  const fetchNotes = async (reset = false) => {
    try {
      if (reset) { setLoading(true); setNotes([]); } else setLoadingMore(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const params = { _t: Date.now(), limit: 20 };
      if (!reset && nextCursor) params.cursor = nextCursor;
      if (selectedSemester !== "ALL") params.semester = selectedSemester;
      if (selectedBranch !== "ALL") params.branch = selectedBranch;
      if (selectedDocType !== "ALL") params.documentType = selectedDocType;
      if (selectedGroupFilter !== "ALL") params.isGroup = selectedGroupFilter === "GROUP" ? "true" : "false";
      if (searchTerm) params.search = searchTerm;
      if (sortBy) params.sortBy = sortBy;
      const res = await axios.get(`${API_URL}/notes`, { params, headers });
      if (res.data?.notes) {
        if (reset) setNotes(res.data.notes);
        else setNotes(prev => [...prev, ...res.data.notes]);
        setHasMore(res.data.hasMore);
        setNextCursor(res.data.nextCursor);
      } else { setNotes([]); setHasMore(false); setNextCursor(null); }
    } catch (err) {
      console.error("Error fetching notes:", err);
      setNotes([]); setHasMore(false); setNextCursor(null);
    } finally {
      setLoading(false); setLoadingMore(false);
    }
  };

  const handleViewNote = async (note) => {
    setSelectedNote(note);
    setSelectedFileIndex(note.isGroup ? null : 0);
    setShowViewModal(true);
    try { await axios.get(`${API_URL}/notes/${note._id}`); } catch (err) { console.error("Error updating views:", err); }
  };

  const handleLike = async (noteId) => {
    if (!currentUser || !token) {
      setModalConfig({ isOpen: true, title: "Login Required", message: "Please login to like notes", type: "warning" });
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/notes/${noteId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotes(notes.map(n => n._id === noteId ? { ...n, likes: res.data.likes, likeCount: res.data.likeCount, hasLiked: res.data.likes.some(l => (l.id || l._id || l) === currentUser._id) } : n));
      if (selectedNote?._id === noteId) {
        setSelectedNote({ ...selectedNote, likes: res.data.likes, likeCount: res.data.likeCount, hasLiked: res.data.likes.some(l => (l.id || l._id || l) === currentUser._id) });
      }
    } catch (err) { console.error("Error liking note:", err); }
  };

  const handleDeleteNote = (e, noteId) => {
    e.stopPropagation();
    setModalConfig({
      isOpen: true, title: "Confirm Deletion", message: "Are you sure you want to delete this note?", type: "warning",
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/notes/${noteId}`, { headers: { Authorization: `Bearer ${token}` } });
          setNotes(notes.filter(n => n._id !== noteId));
          if (selectedNote?._id === noteId) { setShowViewModal(false); setSelectedNote(null); }
          await fetchNotes();
          setModalConfig({ isOpen: true, title: "Deleted", message: "Note deleted successfully", type: "success" });
        } catch (err) {
          setModalConfig({ isOpen: true, title: "Delete Failed", message: "Error deleting note: " + (err.response?.data?.message || err.message), type: "error" });
        }
      },
    });
  };

  const handleShare = (note) => {
    const url = `${window.location.origin}/notes/${note._id}`;
    if (navigator.share) {
      navigator.share({ title: note.title, text: note.description?.substring(0, 100), url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => setModalConfig({ isOpen: true, title: "Link Copied!", message: "Note link copied to clipboard", type: "success" }));
    }
  };

  const handleSyncDrive = async () => {
    try {
      setSyncing(true);
      const res = await axios.post(`${API_URL}/notes/sync-drive`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setModalConfig({ isOpen: true, title: "Sync Successful", message: res.data.message || `Synced ${res.data.count || 0} notes.`, type: "success" });
      fetchNotes();
    } catch (err) {
      setModalConfig({ isOpen: true, title: "Sync Failed", message: "Error syncing with Google Drive: " + (err.response?.data?.message || err.message), type: "error" });
    } finally { setSyncing(false); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const isLikedByUser = (note) => {
    if (!currentUser) return false;
    if (note.hasLiked !== undefined) return note.hasLiked;
    return note.likes?.some(l => (typeof l === "string" ? l : l.id || l._id || l) === currentUser._id);
  };

  const getLikesCount = (note) => note.likeCount ?? (Array.isArray(note.likes) ? note.likes.length : 0);

  const activeFilterChips = [
    { key: "semester", label: selectedSemester !== "ALL" ? `Sem ${selectedSemester}` : null, onClear: () => setSelectedSemester("ALL") },
    { key: "branch", label: selectedBranch !== "ALL" ? selectedBranch : null, onClear: () => setSelectedBranch("ALL") },
    { key: "docType", label: selectedDocType !== "ALL" ? selectedDocType.replace(/_/g, " ") : null, onClear: () => setSelectedDocType("ALL") },
    { key: "group", label: selectedGroupFilter !== "ALL" ? (selectedGroupFilter === "GROUP" ? "Group" : "Single") : null, onClear: () => setSelectedGroupFilter("ALL") },
  ].filter(c => c.label);

  const [showSortDropdown, setShowSortDropdown] = useState(false);

  return (
    <div className="flex w-full h-screen bg-black text-zinc-300 selection:bg-amber-500/30">
      <main className={`flex-1 w-full overflow-y-auto no-scrollbar relative z-0 transition-all duration-300 pb-20 md:pb-0 ${isSidebarOpen ? "lg:ml-72" : ""}`}>
        {/* Ambient Glow - hidden on mobile */}
        <div className="hidden md:block fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-amber-900/20 blur-[120px] rounded-full pointer-events-none opacity-50" />

        {/* Hero Header - collapsed on mobile */}
        <div className="relative z-10 pt-3 pb-3 px-4 md:pt-6 md:pb-6 md:px-8 max-w-7xl mx-auto border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black-500/10 border border-white-500/20 text-white-400 text-[10px] md:text-xs font-bold tracking-wide uppercase mb-2 md:mb-4">
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
            <div className="flex flex-row gap-2 md:gap-4 items-center">
              {/* Upload button - disabled for now, can be re-enabled in the future
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 md:px-8 py-2.5 md:py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-black rounded-full font-bold text-xs md:text-sm transition-all hover:from-amber-500 hover:to-orange-600 active:scale-95 shadow-lg shadow-amber-500/20"
              >
                <Upload className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Upload</span>
              </button>
              */}
              {currentUser?.isAdmin && (
                <button onClick={handleSyncDrive} disabled={syncing}
                  className="inline-flex items-center justify-center gap-2 px-4 md:px-8 py-2.5 md:py-4 bg-zinc-800 text-white rounded-full font-bold text-xs md:text-sm transition-all hover:bg-zinc-700 active:scale-95 border border-white/10">
                  <Refresh className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">{syncing ? "Syncing..." : "Sync"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8">
          {/* Search + Filter Bar */}
          <div className="flex flex-col gap-3 mb-4 md:mb-6">
            <div className="flex justify-center">
              <div className="relative group w-full max-w-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type="text" placeholder="Search notes..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-white/10 hover:border-white/20 text-white rounded-full pl-10 pr-4 py-2.5 outline-none focus:border-white/40 focus:bg-zinc-900 transition-all placeholder:text-zinc-600 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Button - disabled for now, can be re-enabled in the future
              <button
                onClick={() => setShowFilterSheet(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-600 transition-all"
              >
                <Filter iconSize={14} /> Filters
              </button>
              */}

              {/* Sort Dropdown - disabled for now, can be re-enabled in the future
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-600 transition-all"
                >
                  {sortBy === "popular" ? <FireFlame iconSize={14} /> : <Clock iconSize={14} />}
                  {sortBy === "popular" ? "Popular" : "New"}
                  <ArrowDown className={`w-3 h-3 transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
                </button>
                {showSortDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <button onClick={() => { setSortBy("popular"); setShowSortDropdown(false); }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center gap-2 ${sortBy === "popular" ? "text-white bg-zinc-800" : "text-zinc-400 hover:text-zinc-200"}`}>
                      <FireFlame iconSize={14} /> Popular
                    </button>
                    <button onClick={() => { setSortBy("createdAt"); setShowSortDropdown(false); }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center gap-2 ${sortBy === "createdAt" ? "text-white bg-zinc-800" : "text-zinc-400 hover:text-zinc-200"}`}>
                      <Clock iconSize={14} /> New
                    </button>
                  </div>
                )}
              </div>
              */}

              {/* Active Filter Pills */}
              {activeFilterChips.map(chip => (
                <button key={chip.key}
                  onClick={chip.onClear}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                >
                  {chip.label}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-amber-400/70">
                    <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Notes Count */}
          <div className="text-zinc-500 text-xs font-medium mb-4">
            Showing <strong className="text-white">{notes.length}</strong> notes
          </div>

          {/* Feed */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-10 h-10 border-4 border-zinc-800 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-zinc-500 font-medium tracking-tight animate-pulse">Fetching notes...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-white/5 rounded-3xl bg-zinc-900/20 backdrop-blur-sm">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
                <OpenBook className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Nothing found</h3>
              <p className="text-zinc-500 max-w-md mx-auto">
                We couldn't find any notes matching your current filters. Try tweaking your search or check back later!
              </p>
              {activeFilterChips.length > 0 && (
                <button onClick={() => { setSelectedSemester("ALL"); setSelectedBranch("ALL"); setSelectedDocType("ALL"); setSelectedGroupFilter("ALL"); setSearchTerm(""); }}
                  className="mt-6 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-semibold transition-colors">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 w-full">
                {notes.map(note => (
                  <NoteCard key={note._id} note={note} currentUser={currentUser}
                    isLikedByUser={isLikedByUser} getLikesCount={getLikesCount}
                    onView={handleViewNote} onDelete={handleDeleteNote} onLike={handleLike} onShare={handleShare}
                    formatDate={formatDate} setModalConfig={setModalConfig} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button onClick={() => fetchNotes(false)} disabled={loadingMore}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-full text-sm font-semibold transition-colors">
                    {loadingMore ? "Loading..." : "Load More Notes"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modals - outside main to avoid stacking context confinement */}
      <NoteUploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} onUploadSuccess={(note) => setNotes([note, ...notes])} currentUser={currentUser} token={token} />

      <NoteViewModal isOpen={showViewModal} selectedNote={selectedNote} selectedFileIndex={selectedFileIndex}
        onClose={() => { setIsFullScreen(false); setShowViewModal(false); setSelectedFileIndex(null); }}
        onSetSelectedFileIndex={setSelectedFileIndex} isFullScreen={isFullScreen}
        onToggleFullScreen={() => setIsFullScreen(!isFullScreen)} onLike={handleLike}
        isLikedByUser={isLikedByUser} getLikesCount={getLikesCount} onShare={handleShare} />

      <FilterBottomSheet isOpen={showFilterSheet} onClose={() => setShowFilterSheet(false)}
        semesters={semesters} branches={branches} documentTypes={documentTypes}
        filters={{ semester: selectedSemester, branch: selectedBranch, docType: selectedDocType, group: selectedGroupFilter }}
        onFilterChange={handleFilterChange} />

      <CustomModal isOpen={modalConfig.isOpen} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title} message={modalConfig.message} type={modalConfig.type} onConfirm={modalConfig.onConfirm} />
    </div>
  );
};

export default NotesLibraryPage;
