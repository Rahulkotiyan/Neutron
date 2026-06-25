import React from "react";
import { createPortal } from "react-dom";
import { Heart, Xmark, Send, Page } from "iconoir-react";

const getFileViewerUrl = (fileUrl) => {
  if (!fileUrl) return "";
  if (fileUrl.includes("drive.google.com")) {
    const fileId = fileUrl.match(/[-\w]{25,}/)?.[0];
    if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  if (fileUrl.endsWith(".pdf") || fileUrl.includes(".pdf") ||
      fileUrl.endsWith(".doc") || fileUrl.endsWith(".docx") ||
      fileUrl.endsWith(".ppt") || fileUrl.endsWith(".pptx") ||
      fileUrl.endsWith(".xls") || fileUrl.endsWith(".xlsx")) {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`;
  }
  return fileUrl;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const NoteViewModal = ({ isOpen, selectedNote, selectedFileIndex, onClose, onSetSelectedFileIndex, isFullScreen, onToggleFullScreen, onLike, isLikedByUser, getLikesCount, onShare }) => {
  if (!isOpen || !selectedNote) return null;

  const currentFileUrl = selectedNote.isGroup
    ? selectedNote.files[selectedFileIndex]?.fileUrl
    : selectedNote.fileUrl;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      {isFullScreen ? (
        /* Full-screen mode: document fills viewport, controls overlay */
        <div className="relative w-full h-screen bg-zinc-950">
          {/* Floating buttons at top */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
            <button
              onClick={() => onLike(selectedNote._id)}
              className={`p-3 rounded-full font-semibold transition-all ${
                isLikedByUser(selectedNote)
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/10"
              }`}
            >
              <Heart className={isLikedByUser(selectedNote) ? "fill-current w-5 h-5" : "w-5 h-5"} />
            </button>
            <button
              onClick={onToggleFullScreen}
              className="p-3 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/10 transition-all"
              title="Exit Full Screen"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            </button>
            <button
              onClick={() => { onToggleFullScreen(); onClose(); }}
              className="p-3 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/10 transition-all"
            >
              <Xmark className="w-5 h-5" />
            </button>
          </div>
          {/* Document viewer */}
          {(selectedFileIndex !== null || !selectedNote.isGroup) && (
            <div className="absolute inset-0 bottom-0 bg-zinc-950"
              style={{ bottom: selectedNote.isGroup && selectedNote.files?.length > 0 ? '56px' : '0' }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <iframe
                src={getFileViewerUrl(currentFileUrl)}
                className="w-full h-full"
                title={selectedNote.isGroup ? selectedNote.files[selectedFileIndex]?.title : selectedNote.title}
                style={{ pointerEvents: "auto" }}
                allowFullScreen
                loading="lazy"
                onError={(e) => {
                  console.error("Error loading document:", e);
                  e.target.style.display = "none";
                  const errorDiv = e.target.nextElementSibling;
                  if (errorDiv) errorDiv.style.display = "flex";
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-zinc-400" style={{ display: "none" }}>
                <div className="text-center">
                  <Page className="w-12 h-12 text-zinc-600" />
                  <p className="text-sm">Unable to load document</p>
                  <a
                    href={currentFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-semibold transition-colors"
                  >
                    Open in New Tab
                  </a>
                </div>
              </div>
            </div>
          )}
          {/* Group file selector bar at bottom */}
          {selectedNote.isGroup && selectedNote.files?.length > 0 && (
            <div className="absolute bottom-0 inset-x-0 bg-zinc-950/90 backdrop-blur-md border-t border-white/10 p-3 z-20">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {selectedNote.files.map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSetSelectedFileIndex(idx)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      selectedFileIndex === idx
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700"
                    }`}
                  >
                    {file.title || `File ${idx + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Normal mode: modal card with all content */
        <div className="flex items-center justify-center w-full p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-5xl bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl relative overflow-hidden my-auto animate-in zoom-in-95 duration-300">
            {/* Top-right buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
              <button
                onClick={() => onLike(selectedNote._id)}
                className={`p-3 rounded-full font-semibold transition-all ${
                  isLikedByUser(selectedNote)
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/10"
                }`}
              >
                <Heart className={isLikedByUser(selectedNote) ? "fill-current w-5 h-5" : "w-5 h-5"} />
              </button>
              <button
                onClick={onToggleFullScreen}
                className="p-3 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/10 transition-all"
                title="Full Screen"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-3 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/10 transition-all"
              >
                <Xmark className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row">
              {/* Left - Document Viewer + Info */}
              <div className="flex-1 p-8 pt-20 border-r border-white/5">
                <div className="space-y-6">
                  <div>
                    <span className="inline-flex items-center border border-white/10 bg-white/5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-zinc-300">
                      {selectedNote.documentType.replace(/_/g, " ")}
                    </span>
                    <h2 className="text-3xl font-bold text-white mb-3 leading-tight mt-2">
                      {selectedNote.title}
                    </h2>
                    {selectedNote.description && !selectedNote.description.includes("Automatically synced") && (
                      <p className="text-zinc-400 text-lg leading-relaxed">
                        {selectedNote.description}
                      </p>
                    )}
                  </div>

                  {selectedNote.isGroup && selectedNote.files?.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                          Group Resources ({selectedNote.files.length})
                        </h4>
                        {selectedFileIndex !== null && (
                          <button onClick={() => onSetSelectedFileIndex(null)} className="text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors">
                            Back to List
                          </button>
                        )}
                      </div>
                      {selectedFileIndex === null ? (
                        <div className="grid gap-3">
                          {selectedNote.files.map((file, idx) => (
                            <div
                              key={idx}
                              onClick={() => onSetSelectedFileIndex(idx)}
                              className="group/file flex items-center gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-amber-500/30 hover:bg-zinc-900 transition-all cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover/file:text-amber-500 transition-colors">
                                <Page className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-bold text-white truncate group-hover/file:text-amber-300 transition-colors">
                                  {file.title || `Resource ${idx + 1}`}
                                </h5>
                                <p className="text-xs text-zinc-500 truncate">{file.fileName || "View Document"}</p>
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
                    <div className="relative w-full h-[500px] rounded-2xl border border-white/10 overflow-hidden bg-zinc-950"
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <iframe
                        src={getFileViewerUrl(currentFileUrl)}
                        className="w-full h-full"
                        title={selectedNote.isGroup ? selectedNote.files[selectedFileIndex]?.title : selectedNote.title}
                        style={{ pointerEvents: "auto" }}
                        allowFullScreen
                        loading="lazy"
                        onError={(e) => {
                          console.error("Error loading document:", e);
                          e.target.style.display = "none";
                          const errorDiv = e.target.nextElementSibling;
                          if (errorDiv) errorDiv.style.display = "flex";
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-zinc-400" style={{ display: "none" }}>
                        <div className="text-center">
                          <Page className="w-12 h-12 text-zinc-600" />
                          <p className="text-sm">Unable to load document</p>
                          <a
                            href={currentFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-semibold transition-colors"
                          >
                            Open in New Tab
                          </a>
                        </div>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                    </div>
                  )}

                  {(!selectedNote.isGroup || selectedFileIndex !== null) && (
                    <p className="text-xs text-zinc-500 mt-3 text-center">
                      Document is view-only. Right-click and download options are restricted.
                    </p>
                  )}

                  <div>
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{selectedNote.views || 0}</div>
                        <div className="text-xs text-zinc-500">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{getLikesCount(selectedNote)}</div>
                        <div className="text-xs text-zinc-500">Likes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{selectedNote.comments?.length || 0}</div>
                        <div className="text-xs text-zinc-500">Comments</div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/5 mt-4">
                      <button
                        onClick={() => onShare(selectedNote)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        Share This Note
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar Details */}
              <div className="w-full md:w-80 flex flex-col bg-zinc-900/50 border-t md:border-t-0 md:border-l border-white/5">
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                  <div className="space-y-3 pb-4 border-b border-white/5">
                    {selectedNote.subject && selectedNote.subject !== "Drive Sync" && (
                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Subject</p>
                        <p className="text-sm text-white font-medium">{selectedNote.subject}</p>
                      </div>
                    )}
                    {selectedNote.semester && (
                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Semester</p>
                        <p className="text-sm text-white font-medium">Semester {selectedNote.semester}</p>
                      </div>
                    )}
                    {selectedNote.branch && (
                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Branch</p>
                        <p className="text-sm text-white font-medium">{selectedNote.branch}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 pb-4 border-b border-white/5">
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Uploaded by</p>
                      <p className="text-sm text-white font-medium truncate">{selectedNote.user?.name || selectedNote.user?.email || "Anonymous"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Date</p>
                      <p className="text-sm text-white font-medium">{formatDate(selectedNote.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Views</p>
                      <p className="text-sm text-white font-medium">{selectedNote.views || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-white/5">
                  <button onClick={onClose} className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold transition-colors">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default NoteViewModal;
