import React from 'react';
import { Xmark, User as UserIcon, Lock, Crown, Shield } from 'iconoir-react';

const MemberSidebar = ({ 
  showMembersModal, 
  setShowMembersModal, 
  membersList, 
  currentUserId, 
  isActiveOwner, 
  isActiveAdmin, 
  handleDistributeKeyToMember,
  activeGroup
}) => {
  if (!showMembersModal) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        onClick={() => setShowMembersModal(false)}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-80 bg-[#050505] border-l border-white/[0.03] flex flex-col lg:relative lg:flex lg:w-72 shadow-2xl transition-transform duration-300">
        <div className="h-16 border-b border-white/[0.03] flex items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMembersModal(false)}
              className="lg:hidden p-2 -ml-2 text-zinc-600 hover:text-white hover:bg-white/[0.03] rounded-lg transition-all"
            >
              <X size={18} />
            </button>
            <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.25em]">Personnel</span>
          </div>
          <span className="text-[10px] font-black text-white bg-white/[0.02] px-2 py-1 rounded-md border border-white/[0.05] tracking-widest">{membersList.length} UNITS</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide bg-black">
          {membersList.map((member) => {
            const userObj =
              member.userId && typeof member.userId === "object"
                ? member.userId
                : member.userId
                  ? { _id: member.userId }
                  : member;

            const memberUserId = userObj._id || member.userId;
            const hasKey = !!member.encryptedGroupKey;
            const isSelf =
              currentUserId &&
              memberUserId?.toString() === currentUserId.toString();
            
            return (
              <div
                key={userObj._id || Math.random()}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.02] rounded-xl cursor-pointer transition-all group border border-transparent hover:border-white/[0.03]"
              >
                <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center relative flex-shrink-0 border border-white/[0.05] shadow-xl shadow-white/5">
                  {userObj.avatar ? (
                    <img
                      src={userObj.avatar}
                      className="w-full h-full rounded-xl object-cover"
                      alt="avatar"
                    />
                  ) : (
                    <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest transition-colors">
                      {userObj.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-white border-2 border-black rounded-full shadow-lg" />
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-white truncate flex items-center gap-1.5 tracking-tight">
                    {userObj.name || "Personnel"}
                    {isSelf && <span className="text-[8px] text-zinc-700 font-black uppercase tracking-tighter">(Self)</span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.15em] text-zinc-600">
                    {hasKey ? (
                      <span className="text-zinc-600 flex items-center gap-1 transition-colors">
                        <Lock size={8} className="text-zinc-800" /> Secure Link
                      </span>
                    ) : (
                      <span className="text-zinc-900 tracking-tighter">No Key Access</span>
                    )}
                  </div>
                </div>

                {(isActiveOwner || isActiveAdmin) && !hasKey && !isSelf && (
                  <button
                    type="button"
                    onClick={() => handleDistributeKeyToMember(memberUserId)}
                    className="ml-1 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.25em] rounded-lg bg-white text-black hover:bg-zinc-100 transition-all opacity-0 group-hover:opacity-100 shadow-xl shadow-white/10 active:scale-95 blur-0 group-hover:blur-none"
                  >
                    Authorize
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MemberSidebar;
