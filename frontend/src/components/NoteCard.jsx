import React from "react";
import { Trash, Heart, Eye, Send } from "iconoir-react";

const NoteCard = ({ note, currentUser, isLikedByUser, getLikesCount, onView, onDelete, onLike, onShare, formatDate, setModalConfig }) => {
  return (
    <div
      onClick={() => onView(note)}
      className="group relative flex flex-col bg-zinc-900/40 backdrop-blur-md border rounded-[2rem] overflow-hidden hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-xl border-white/5 hover:border-amber-500/30"
    >
      <div className="px-4 md:px-6 pt-3 md:pt-6 pb-1 md:pb-4 flex items-start justify-between gap-4">
        <p className="text-[10px] md:text-xs text-zinc-500 font-medium">
          {formatDate(note.createdAt)} &bull; {note.views} views
        </p>
        {currentUser?.isAdmin && (
          <button
            onClick={(e) => onDelete(e, note._id)}
            className="p-1.5 md:p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all shrink-0"
          >
            <Trash className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        )}
      </div>

      <div className="px-4 md:px-6 pt-0 flex-1 flex flex-col">
        <h3 className="text-base md:text-xl font-bold text-white tracking-tight leading-snug mb-2 md:mb-3 line-clamp-1 md:line-clamp-2">
          {note.title}
        </h3>
        {note.description && !note.description.includes("Automatically synced") && (
          <p className="text-xs md:text-sm text-zinc-400 leading-relaxed line-clamp-2 md:line-clamp-3 mb-3 md:mb-4">
            {note.description}
          </p>
        )}
        <div className="mt-auto flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
          {note.subject && note.subject !== "Drive Sync" && (
            <span className="text-[10px] md:text-xs font-semibold bg-black/30 text-zinc-300 rounded-full px-2 md:px-2.5 py-0.5 md:py-1 border border-white/10">
              {note.subject}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 md:px-6 py-2.5 md:py-4 border-t border-white/5 bg-black/20 flex items-center justify-between">
        <div className="flex gap-3 md:gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!currentUser) {
                setModalConfig({
                  isOpen: true,
                  title: "Sign In Required",
                  message: "Please sign in to like notes.",
                  type: "warning",
                });
                return;
              }
              onLike(note._id);
            }}
            className={`flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs font-bold transition-colors ${
              isLikedByUser(note) ? "text-red-500" : "text-zinc-500 hover:text-white"
            }`}
          >
            <Heart className={isLikedByUser(note) ? "fill-current w-3 h-3 md:w-4 md:h-4" : "w-3 h-3 md:w-4 md:h-4"} />
            {getLikesCount(note)}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(note);
            }}
            className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs font-bold text-zinc-500 hover:text-green-400 hover:bg-green-500/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full transition-all"
          >
            <Send className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
        <div className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs font-bold text-zinc-500">
          <Eye className="w-3 h-3 md:w-4 md:h-4" />
          {note.views || 0}
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
