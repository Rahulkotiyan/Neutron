import React from "react";
import { Xmark } from "iconoir-react";

const SECTIONS = [
  {
    key: "semester",
    title: "Semester",
    options: (semesters) => semesters.map(s => ({ value: s, label: `Semester ${s}` })),
  },
  {
    key: "branch",
    title: "Branch",
    options: (branches) => branches.map(b => ({ value: b, label: b })),
  },
  {
    key: "docType",
    title: "Type",
    options: (types) => types.map(t => ({ value: t, label: t.replace(/_/g, " ") })),
  },
  {
    key: "group",
    title: "Group",
    options: () => [
      { value: "ALL", label: "All" },
      { value: "GROUP", label: "Group Notes" },
      { value: "SINGLE", label: "Single Notes" },
    ],
  },
];

const FilterBottomSheet = ({ isOpen, onClose, semesters, branches, documentTypes, filters, onFilterChange }) => {
  if (!isOpen) return null;

  const renderOptions = (section) => {
    let opts;
    if (section.key === "semester") opts = section.options(semesters);
    else if (section.key === "branch") opts = section.options(branches);
    else if (section.key === "docType") opts = section.options(documentTypes);
    else opts = section.options();

    return (
      <div key={section.key} className="mb-5">
        <h4 className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2.5 px-1">{section.title}</h4>
        <div className="flex flex-wrap gap-1.5">
          {opts.map(opt => {
            const isActive = (filters[section.key] || "ALL") === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onFilterChange(section.key, opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/25 shadow-sm"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-t-[2rem] shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[70vh] flex flex-col">
        <div className="sticky top-0 bg-zinc-950 border-b border-white/10 px-6 py-5 flex items-center justify-between rounded-t-[2rem]">
          <h3 className="text-lg font-bold text-white">Filters</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onFilterChange("semester", "ALL");
                onFilterChange("branch", "ALL");
                onFilterChange("docType", "ALL");
                onFilterChange("group", "ALL");
              }}
              className="text-xs font-bold text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              Reset
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1">
              <Xmark size={20} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-5">
          {SECTIONS.map(renderOptions)}
        </div>
      </div>
    </div>
  );
};

export default FilterBottomSheet;
