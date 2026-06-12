import React from "react";
import ToolCard from "./ToolCard";

const YOUTUBE_SUBCATEGORIES = ["tutorials", "playlist", "channel"];

const ToolSection = ({ subcategory, token }) => {
  if (!subcategory || !subcategory.tools?.length) return null;

  const isYoutube = YOUTUBE_SUBCATEGORIES.includes(subcategory.name?.toLowerCase());
  const sorted = [...subcategory.tools].sort((a, b) => (b.starCount || 0) - (a.starCount || 0));

  return (
    <div>
      <h3 className="text-sm sm:text-base md:text-base font-bold text-zinc-300 tracking-wide mb-3">
        {subcategory.name}
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {sorted.map((tool) => (
          <ToolCard
            key={tool._id || tool.id}
            toolId={tool.id}
            title={tool.title}
            description={tool.description}
            url={tool.url}
            subcategoryName={subcategory.name}
            tags={tool.tags}
            starCount={tool.starCount || 0}
            hasStarred={tool.hasStarred || false}
            token={token}
            icon={tool.icon}
            youtube={isYoutube}
          />
        ))}
      </div>
    </div>
  );
};

export default ToolSection;
