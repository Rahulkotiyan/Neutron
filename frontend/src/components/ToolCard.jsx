import React, { useState, memo } from "react";
import api from "../utils/api";

const LONG_DESC_THRESHOLD = 100;

const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname === "youtu.be") {
      if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
      if (u.pathname.startsWith("/embed/")) return url;
      if (u.pathname === "/watch") {
        const v = u.searchParams.get("v");
        if (v) return `https://www.youtube.com/embed/${v}`;
      }
      if (u.pathname.startsWith("/playlist")) {
        const list = u.searchParams.get("list");
        if (list) return `https://www.youtube.com/embed/videoseries?list=${list}`;
      }
    }
  } catch { /* not a valid URL */ }
  return null;
};

const ToolCard = ({ title, description, url, subcategoryName, starCount: initialStars, hasStarred: initialStarred, token, toolId, icon, tags, youtube }) => {
  const tagList = tags && Array.isArray(tags) && tags.length > 0 ? tags : [];
  const [starred, setStarred] = useState(initialStarred);
  const [stars, setStars] = useState(initialStars);
  const [starring, setStarring] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const isLongDesc = description && description.length > LONG_DESC_THRESHOLD;
  const embedUrl = youtube ? getYouTubeEmbedUrl(url) : null;

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
      {icon && !embedUrl && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]">
          <img src={icon} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="relative z-10 flex flex-col h-full">
        {embedUrl ? (
          <>
            <div className="relative w-full aspect-video bg-black rounded-t-2xl overflow-hidden">
              <iframe
                src={embedUrl}
                title={title}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4 flex flex-col flex-1 gap-2">
              <div className="flex items-start justify-between">
                <h3 className="text-xs sm:text-sm md:text-sm font-bold text-white leading-snug flex-1 min-w-0 mr-2">{title}</h3>
                <button
                  onClick={handleStar}
                  disabled={!token || starring}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.65rem] sm:text-xs md:text-xs font-bold transition-all duration-200 shrink-0 ${
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
              {description && (
                <p className="text-[0.65rem] sm:text-xs md:text-xs text-zinc-400 leading-relaxed line-clamp-2">{description}</p>
              )}
              <div className="flex items-center gap-2 mt-auto pt-1">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-[0.65rem] sm:text-xs md:text-xs font-bold rounded-lg transition-all ml-auto shrink-0"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z" />
                  </svg>
                  Watch
                </a>
              </div>
            </div>
          </>
        ) : (
          <div className="p-5 flex flex-col h-full">
            {/* Top row: star button */}
            <div className="flex items-start justify-between mb-3">
              <div />
              <button
                onClick={handleStar}
                disabled={!token || starring}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.65rem] sm:text-xs md:text-xs font-bold transition-all duration-200 ${
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
            <h3 className="text-sm sm:text-base md:text-base font-bold text-white leading-snug mb-1.5">{title}</h3>

            {/* Description */}
            <div className="mb-3 flex-1">
              <p className={`text-[0.65rem] sm:text-xs md:text-xs text-zinc-400 leading-relaxed ${isLongDesc && !descExpanded ? "line-clamp-2" : ""}`}>
                {description || "No description available"}
              </p>
            </div>

            {/* Tags */}
            {tagList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tagList.map((tag, i) => (
                  <span key={i} className="inline-block px-2.5 py-1 bg-white/10 text-zinc-400 text-[0.625rem] font-bold rounded-full truncate max-w-[120px]">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Arrow + Open button */}
            <div className="flex items-center gap-2 mt-auto">
              {isLongDesc && (
                <button
                  onClick={() => setDescExpanded((v) => !v)}
                  className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-all"
                >
                  <svg className={`w-3.5 h-3.5 transition-transform ${descExpanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              )}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-zinc-200 text-black text-[0.65rem] sm:text-xs md:text-xs font-bold rounded-lg transition-all duration-200 ml-auto shrink-0"
              >
                Open
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ToolCard);
