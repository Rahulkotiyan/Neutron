import React from "react";
import * as Icons from "iconoir-react";

const FALLBACK_ICON = "Book";

const ToolCard = ({ title, description, url, icon }) => {
  const IconComponent = Icons[icon] || Icons[FALLBACK_ICON];

  return (
    <div className="min-w-[280px] max-w-[280px] bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:border-amber-500/30 hover:bg-zinc-900/80 transition-all duration-300 group shrink-0">
      <div className="flex items-start gap-4 mb-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
          <IconComponent className="w-5 h-5 text-amber-500" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-white leading-snug truncate">{title}</h3>
        </div>
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-2 min-h-[2.5em]">
        {description || "No description available"}
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white text-xs font-bold rounded-lg transition-all duration-200"
      >
        Open
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
};

export default ToolCard;
