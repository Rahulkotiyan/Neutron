import React from "react";
import ToolCard from "./ToolCard";

const ToolSection = ({ subcategory }) => {
  if (!subcategory || !subcategory.tools?.length) return null;

  return (
    <div>
      <h3 className="text-base font-bold text-zinc-300 tracking-wide mb-3">
        {subcategory.name}
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {subcategory.tools.map((tool) => (
          <ToolCard
            key={tool._id || tool.id}
            title={tool.title}
            description={tool.description}
            url={tool.url}
            icon={tool.icon}
          />
        ))}
      </div>
    </div>
  );
};

export default ToolSection;
