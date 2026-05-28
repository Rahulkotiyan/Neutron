import React, { useState } from "react";
import api from "../utils/api";

const ToolCard = ({ title, description, url, subcategoryName, starCount: initialStars, hasStarred: initialStarred, token, toolId }) => {
  const [starred, setStarred] = useState(initialStarred);
  const [stars, setStars] = useState(initialStars);
  const [starring, setStarring] = useState(false);

  const handleStar = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token || starring) return;
    setStarring(true);
    try {
      const res = await api.post(`/tools/tool/${toolId}/star`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStarred(res.data.starred);
      setStars(res.data.starCount);
    } catch { /* ignore */ }
    setStarring(false);
  };

  return (
    <div className="min-w-[300px] max-w-[300px] bg-zinc-900/70 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 hover:bg-zinc-900/90 transition-all duration-300 group shrink-0 relative">
      <div className="relative z-10 p-5 flex flex-col h-full">
        {/* Top row: star button */}
        <div className="flex items-start justify-between mb-3">
          <div />
          <button
            onClick={handleStar}
            disabled={!token || starring}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${
              starred
                ? "bg-white/20 text-white"
                : "bg-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/10"
            } ${!token ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>{stars}</span>
          </button>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white leading-snug mb-1.5">{title}</h3>

        {/* Description */}
        <p className="text-xs text-zinc-400 leading-relaxed mb-3 line-clamp-2 flex-1">{description || "No description available"}</p>

        {/* Tags + Open button */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          {subcategoryName && (
            <span className="inline-block px-2.5 py-1 bg-white/10 text-zinc-400 text-[10px] font-bold rounded-full truncate max-w-[140px]">
              {subcategoryName}
            </span>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-lg transition-all duration-200 ml-auto shrink-0"
          >
            Open
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ToolCard;
