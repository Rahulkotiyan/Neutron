import React from "react";

const TabButton = ({ active, label, icon: Icon, onClick, className = "" }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 active:scale-95 min-h-[44px] ${className} ${
      active
        ? "bg-white text-black shadow-lg"
        : "bg-zinc-900/40 border border-white/5 text-zinc-400 hover:border-white/20 hover:bg-zinc-900/60"
    }`}
  >
    {Icon && <Icon size={18} />}
    {label}
  </button>
);

export default TabButton;
