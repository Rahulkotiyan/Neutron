import React from "react";
import { Xmark } from "iconoir-react";

const ModalShell = ({ isOpen, onClose, size = "md", children }) => {
  if (!isOpen) return null;
  const sizeMap = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl", "2xl": "max-w-2xl" };
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
      <div className={`w-full ${sizeMap[size] || size} bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 relative z-[120]`}>
        {children}
      </div>
    </div>
  );
};

export const ModalHeader = ({ title, subtitle, onClose, gradient = false }) => (
  <div className={`${gradient ? "bg-gradient-to-br from-red-950/40 to-red-900/20" : "bg-zinc-800/50"} backdrop-blur-md border-b border-white/5 p-6 md:p-8 flex items-start justify-between`}>
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-zinc-400 mt-2">{subtitle}</p>}
    </div>
    {onClose && (
      <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0 active:scale-95 min-h-[44px]">
        <Xmark size={20} className="text-zinc-400" />
      </button>
    )}
  </div>
);

export const ModalFooter = ({ children, className = "" }) => (
  <div className={`bg-gradient-to-t from-zinc-950 to-zinc-950/50 backdrop-blur-md border-t border-white/5 p-6 md:p-8 ${className}`}>
    {children}
  </div>
);

export const ModalBody = ({ children, scrollable = true, className = "" }) => (
  <div className={`${scrollable ? "flex-1 overflow-y-auto" : ""} p-6 md:p-8 space-y-5 ${className}`}>
    {children}
  </div>
);

export default ModalShell;
