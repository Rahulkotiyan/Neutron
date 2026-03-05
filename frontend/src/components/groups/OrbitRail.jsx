import React from 'react';
import { MessageCircle, Plus } from 'lucide-react';

const OrbitRail = ({ 
  groups, 
  activeGroup, 
  setActiveGroup, 
  setShowCreateGroupModal, 
  showMobileSidebar, 
  setShowMobileSidebar 
}) => {
  return (
    <div
      className="w-20 bg-[#050505] border-r border-white/[0.03] flex flex-col items-center py-5 space-y-4 overflow-y-auto scrollbar-hide flex-shrink-0 z-10 h-full transition-all duration-300"
    >
      <div
        onClick={() => setShowMobileSidebar(false)}
        className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center mb-2 hover:bg-zinc-100 transition-all cursor-pointer shadow-xl shadow-white/5 active:scale-95"
      >
        <MessageCircle size={26} />
      </div>

      <div className="w-8 h-[1px] bg-white/[0.03] rounded-full mx-auto" />

      <div className="flex-1 space-y-3 w-full flex flex-col items-center overflow-y-auto scrollbar-hide px-2">
        {groups.map((group) => (
          <div
            key={group._id}
            className="relative group w-full flex justify-center"
          >
            {activeGroup?._id === group._id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-full" />
            )}
            <div
              onClick={() => setActiveGroup(group)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 overflow-hidden active:scale-95 border ${
                activeGroup?._id === group._id
                  ? "bg-white/[0.08] text-white border-white/20 shadow-2xl shadow-black scale-105"
                  : "bg-white/[0.02] hover:bg-white/[0.05] text-zinc-600 hover:text-white border-white/[0.03]"
              }`}
            >
              {group.icon ? (
                <img
                  src={group.icon}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-bold text-[10px] tracking-widest">
                  {group.name.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-[#050505] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all shadow-2xl border border-white/[0.05]">
              {group.name}
            </div>
          </div>
        ))}
      </div>

      <div
        onClick={() => setShowCreateGroupModal(true)}
        className="w-12 h-12 rounded-xl bg-white/[0.02] flex items-center justify-center hover:bg-white/[0.05] transition-all cursor-pointer text-zinc-600 hover:text-white border border-white/[0.03] active:scale-95"
      >
        <Plus size={22} />
      </div>
    </div>
  );
};

export default OrbitRail;
