import React from 'react';
import { 
  Plus, 
  UserPlus, 
  LogOut, 
  X, 
  ChevronDown, 
  ChevronRight, 
  Hash, 
  Volume2, 
  Settings,
  User as UserIcon,
  MessageCircle,
  Lock
} from 'lucide-react';

const ChannelSidebar = ({ 
  activeGroup, 
  isActiveMember, 
  isActiveOwner, 
  isActiveAdmin, 
  handleJoinGroup, 
  setShowCreateChannelModal, 
  setShowInviteModal, 
  setInviteCode, 
  handleLeaveGroup, 
  showMobileSidebar, 
  setShowMobileSidebar,
  showChannelCategories,
  setShowChannelCategories,
  activeChannel,
  setActiveChannel,
  currentUser,
  setShowSettingsModal,
  isConnected
}) => {
  return (
    <div
      className="w-64 sm:w-72 bg-black border-r border-white/[0.03] flex flex-col flex-shrink-0 z-10 h-full transition-all duration-300"
    >
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/[0.03]">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="font-bold text-lg truncate text-white tracking-tight">
            {activeGroup?.name || "Select an Orbit"}
          </h1>
          {activeGroup && !isActiveMember && (
            <button
              onClick={handleJoinGroup}
              className="ml-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full bg-white text-black hover:bg-zinc-100 transition-all shadow-xl shadow-white/5 active:scale-95"
            >
              Authorize Access
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {activeGroup && isActiveMember && (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/[0.03] rounded-lg transition-all"
              title="Orbit Settings"
            >
              <Settings size={18} />
            </button>
          )}
          {activeGroup && (isActiveOwner || isActiveAdmin) && (
            <>
              <button
                onClick={() => setShowCreateChannelModal(true)}
                className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/[0.03] rounded-lg transition-all"
                title="Add Channel"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={() => {
                  setShowInviteModal(true);
                  setInviteCode("");
                }}
                className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/[0.03] rounded-lg transition-all"
                title="Invite Members"
              >
                <UserPlus size={18} />
              </button>
            </>
          )}
          {activeGroup && isActiveMember && !(isActiveOwner || isActiveAdmin) && (
            <button
              onClick={handleLeaveGroup}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title="Leave Orbit"
            >
              <LogOut size={18} />
            </button>
          )}
          <div
            className="md:hidden p-2 hover:bg-white/[0.03] rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowMobileSidebar(false);
            }}
          >
            <X size={20} className="text-zinc-400" />
          </div>
        </div>
      </div>

      {activeGroup ? (
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          {/* Group Info Card */}
          <div className="mb-6 p-4 bg-white/[0.02] rounded-2xl border border-white/[0.03]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-zinc-700 font-bold text-xs border border-white/[0.05]">
                {activeGroup?.name?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">{activeGroup?.channels?.length || 0} channels</div>
                <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{activeGroup?.members?.length || 0} personnel</div>
              </div>
            </div>
            {activeGroup?.description && (
              <p className="text-[10px] text-zinc-500 mt-2 line-clamp-2 leading-relaxed font-medium uppercase tracking-tight">{activeGroup.description}</p>
            )}
          </div>

          {/* Text Channels */}
          <div className="mb-4">
            <div
              className="flex items-center justify-between px-2 mb-2 text-[10px] font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-[0.2em] cursor-pointer transition-colors"
              onClick={() =>
                setShowChannelCategories((p) => ({ ...p, text: !p.text }))
              }
            >
              <div className="flex items-center gap-1.5">
                {showChannelCategories.text ? (
                  <ChevronDown size={10} />
                ) : (
                  <ChevronRight size={10} />
                )}
                <span>Communications</span>
              </div>
            </div>
            {showChannelCategories.text &&
              activeGroup.channels
                ?.filter((c) => (c.type === "text" || c.type === "TEXT"))
                .map((channel) => (
                  <div
                    key={channel._id}
                    onClick={() => {
                      setActiveChannel(channel);
                      setShowMobileSidebar(false);
                    }}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl mb-1 cursor-pointer transition-all active:scale-[0.98] border ${
                      activeChannel?._id === channel._id 
                        ? "bg-white/[0.06] text-white border-white/10 shadow-xl" 
                        : "text-zinc-600 hover:bg-white/[0.03] hover:text-white border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Hash
                        size={16}
                        className={`${activeChannel?._id === channel._id ? "text-white" : "text-zinc-700"} flex-shrink-0`}
                      />
                      <span className="truncate font-bold text-xs uppercase tracking-widest">
                        {channel.name}
                      </span>
                    </div>
                    {channel.name !== "general" && (
                      <Lock size={10} className={`${activeChannel?._id === channel._id ? "text-white/40" : "text-zinc-700"} flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity`} />
                    )}
                  </div>
                ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center opacity-20">
          <div className="w-16 h-16 mb-4 rounded-3xl bg-black flex items-center justify-center border border-white/[0.05]">
            <MessageCircle size={28} className="text-white" />
          </div>
          <p className="text-white text-[10px] font-bold uppercase tracking-widest">Select Orbit</p>
        </div>
      )}

      {/* User Status Footer */}
      <div className="h-[72px] bg-[#050505] border-t border-white/[0.03] px-5 flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center relative border border-white/[0.05]">
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              className="rounded-xl w-full h-full object-cover"
              alt="avatar"
            />
          ) : (
            <UserIcon size={18} className="text-zinc-500" />
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white border-2 border-black rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate text-white tracking-tight">
            {currentUser?.name || "Personnel"}
          </div>
          <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Active Status</div>
        </div>
        <div className="flex items-center">
          <button 
            className="p-2.5 hover:bg-white/[0.03] rounded-xl transition-all cursor-pointer group border border-transparent hover:border-white/[0.05]"
            onClick={() => setShowSettingsModal(true)}
          >
            <Settings size={18} className="text-zinc-600 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChannelSidebar;
