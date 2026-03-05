import React from 'react';
import { Xmark, Lock, Search, Plus, Trash, Shield, Crown } from 'iconoir-react';

const GroupsModals = ({
  showCreateGroupModal,
  resetCreateGroupModal,
  createStep,
  setCreateStep,
  groupName,
  setGroupName,
  groupDescription,
  setGroupDescription,
  memberSearch,
  setMemberSearch,
  memberResults,
  searchUsers,
  addInviteMember,
  invitedMembers,
  removeInviteMember,
  isCreatingGroup,
  handleCreateGroup,
  showCreateChannelModal,
  setShowCreateChannelModal,
  channelName,
  setChannelName,
  channelType,
  setChannelType,
  handleCreateChannel,
  showPollModal,
  resetPollModal,
  pollQuestion,
  setPollQuestion,
  pollOptions,
  handlePollOptionChange,
  addPollOption,
  removePollOption,
  pollMultiple,
  setPollMultiple,
  isCreatingPoll,
  handleCreatePoll,
  showInviteModal,
  setShowInviteModal,
  isGeneratingInvite,
  handleGenerateInvite,
  inviteCode,
  // Settings
  showSettingsModal,
  setShowSettingsModal,
  activeSettingsTab,
  setActiveSettingsTab,
  activeGroup,
  SettingsOverview,
  SettingsMembers,
  SettingsModeration,
  SettingsGeneral,
  isActiveOwner,
  isActiveAdmin,
  isSearching
}) => {
  return (
    <>
      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl px-4" onClick={resetCreateGroupModal}>
          <div className="bg-[#050505] border border-white/[0.05] text-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(255,255,255,0.02)] animate-in fade-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex border-b border-white/[0.03] bg-black/50">
              {['Identity', 'Personnel'].map((label, i) => (
                <button
                  key={label}
                  onClick={() => createStep > i + 1 && setCreateStep(i + 1)}
                  className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-2 ${
                    createStep === i + 1 ? "text-white border-white bg-white/[0.02]" : "text-zinc-800 border-transparent hover:text-zinc-500 hover:bg-white/[0.01]"
                  }`}
                >
                  {i + 1}. {label}
                </button>
              ))}
            </div>

            <div className="p-10">
              {createStep === 1 ? (
                <div className="space-y-8">
                   <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-black rounded-[2rem] flex items-center justify-center text-zinc-800 mb-6 border border-white/[0.05] shadow-2xl shadow-white/5">
                      {groupName ? <span className="text-4xl font-black text-white">{groupName[0].toUpperCase()}</span> : <Lock size={40} />}
                    </div>
                    <p className="text-zinc-700 text-[9px] font-black uppercase tracking-[0.25em] text-center max-w-[240px] leading-relaxed transition-colors">System-level AES-256 Encryption initialized by default.</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 block">Orbit Designation</label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      className="w-full p-5 bg-black border border-white/[0.05] rounded-2xl focus:border-white focus:ring-1 focus:ring-white/10 outline-none text-sm transition-all text-white placeholder-zinc-800 font-bold tracking-tight"
                      placeholder="e.g. CORE-STATION"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 block">Operational Objectives</label>
                    <textarea
                      value={groupDescription}
                      onChange={e => setGroupDescription(e.target.value)}
                      rows={2}
                      className="w-full p-5 bg-black border border-white/[0.05] rounded-2xl focus:border-white focus:ring-1 focus:ring-white/10 outline-none text-sm transition-all text-white placeholder-zinc-800 resize-none font-bold tracking-tight"
                      placeholder="Define mission scope..."
                    />
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <button onClick={resetCreateGroupModal} className="text-zinc-700 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors">Abort Mission</button>
                    <button
                      onClick={() => setCreateStep(2)}
                      disabled={!groupName.trim()}
                      className="bg-white hover:bg-zinc-100 disabled:opacity-10 text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-white/10 active:scale-95"
                    >
                      Authenticate →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Personnel Roster</h2>
                    <span className="text-[10px] font-black text-white bg-white/5 px-2 py-1 rounded-md border border-white/[0.05] tracking-widest">{invitedMembers.length} SELECTED</span>
                  </div>
                  <div className="relative">
                    <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700" />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => {
                        setMemberSearch(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      className="w-full pl-14 pr-5 py-5 bg-black border border-white/[0.05] rounded-2xl focus:border-white outline-none text-sm transition-all text-white placeholder-zinc-800 font-bold tracking-tight"
                      placeholder="Search System IDs..."
                    />
                    {memberResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-3 bg-[#080808] border border-white/[0.05] rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-h-56 overflow-y-auto z-[110] scrollbar-hide animate-in slide-in-from-top-2">
                         {memberResults.map(u => (
                          <div key={u._id} onClick={() => addInviteMember(u)} className="flex items-center gap-4 p-4 hover:bg-white/[0.03] cursor-pointer transition-colors border-b border-white/[0.02] last:border-0">
                            <div className="w-10 h-10 rounded-xl bg-black border border-white/[0.05] flex items-center justify-center font-black text-zinc-800 text-xs shadow-lg shadow-white/2 transition-colors group-hover:text-white">{u.name[0].toUpperCase()}</div>
                            <span className="text-sm font-bold tracking-tight text-zinc-400 group-hover:text-white">{u.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto scrollbar-hide p-1">
                    {invitedMembers.map(u => (
                      <div key={u._id} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.05] pl-4 pr-2 py-2 rounded-xl group transition-all hover:bg-white/[0.05]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{u.name}</span>
                        <div 
                          className="p-1.5 rounded-lg hover:bg-white hover:text-black transition-all cursor-pointer text-zinc-700"
                          onClick={() => removeInviteMember(u._id)}
                        >
                          <Xmark size={12} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <button onClick={() => setCreateStep(1)} className="text-zinc-700 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors">Previous</button>
                     <button
                      onClick={handleCreateGroup}
                      disabled={isCreatingGroup}
                      className="bg-white hover:bg-zinc-100 disabled:opacity-10 text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-white/10 active:scale-95"
                    >
                      {isCreatingGroup ? 'Establishing...' : 'Establish Orbit'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Channel Creation Modal */}
      {showCreateChannelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl px-4" onClick={() => setShowCreateChannelModal(false)}>
          <div className="bg-[#050505] border border-white/[0.05] text-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-zinc-600">Initialize Channel</h2>
            <form onSubmit={handleCreateChannel} className="space-y-8">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 block">Designation</label>
                <input
                  type="text"
                  value={channelName}
                  onChange={e => setChannelName(e.target.value)}
                  autoFocus
                  className="w-full p-5 bg-black border border-white/[0.05] rounded-2xl outline-none text-sm transition-all focus:border-white text-white font-bold tracking-tight"
                  placeholder="e.g. intel-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 block">Protocol</label>
                <div className="flex gap-3">
                  {['text', 'voice'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setChannelType(type)}
                      className={`flex-1 py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] border transition-all active:scale-95 ${
                        channelType === type ? 'bg-white text-black border-white shadow-xl shadow-white/5' : 'bg-black text-zinc-700 border-white/[0.05] hover:border-white/[0.2] hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                 <button type="button" onClick={() => setShowCreateChannelModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-800 hover:text-white transition-colors">Abort</button>
                <button type="submit" className="flex-1 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-100 transition-all shadow-xl shadow-white/10">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Poll Creation Modal */}
      {showPollModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl px-4" onClick={resetPollModal}>
          <div className="bg-[#050505] border border-white/[0.05] text-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-hide animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-zinc-600">Construct Data Query</h2>
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 block">Inquiry Template</label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  className="w-full p-5 bg-black border border-white/[0.05] rounded-2xl outline-none text-sm focus:border-white transition-all font-bold tracking-tight"
                  placeholder="Define query parameters..."
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] block">Response Variables</label>
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex gap-3 items-center group">
                    <input
                      type="text"
                      value={opt}
                      onChange={e => handlePollOptionChange(i, e.target.value)}
                      className="flex-1 p-4 bg-black border border-white/[0.05] rounded-xl outline-none text-xs focus:border-white/[0.2] transition-all font-medium tracking-tight"
                      placeholder={`Variable ${i + 1}`}
                    />
                    {pollOptions.length > 2 && (
                      <button onClick={() => removePollOption(i)} className="p-3 text-zinc-800 hover:text-white transition-all hover:bg-white/[0.05] rounded-xl">
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addPollOption} className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] text-zinc-700 hover:border-white/20 hover:text-white transition-all flex items-center justify-center gap-3">
                  <Plus size={14} /> Add Parameter
                </button>
              </div>
              <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                <input
                  type="checkbox"
                  id="multi-poll"
                  checked={pollMultiple}
                  onChange={e => setPollMultiple(e.target.checked)}
                  className="w-5 h-5 rounded-lg bg-black border-white/10 accent-white appearance-none border checked:bg-white transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-black checked:after:text-[10px] checked:after:font-black"
                />
                <label htmlFor="multi-poll" className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors">Permit multiple selections</label>
              </div>
              <div className="flex gap-4">
                 <button onClick={resetPollModal} className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-800 hover:text-white transition-colors">Abort</button>
                <button onClick={handleCreatePoll} disabled={isCreatingPoll} className="flex-1 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-100 transition-all shadow-xl shadow-white/10 active:scale-95">
                  {isCreatingPoll ? 'Broadcasting...' : 'Broadcast'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl px-4" onClick={() => setShowInviteModal(false)}>
          <div className="bg-[#050505] border border-white/[0.05] text-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-zinc-600">Access Clearance</h2>
            <div className="space-y-8">
              <p className="text-zinc-700 text-[10px] leading-relaxed font-black uppercase tracking-[0.1em]">Generate a temporary encryption key for personnel entry. Multi-factor authentication active.</p>
              {inviteCode ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="p-6 bg-black border border-white/[0.05] rounded-2xl text-center shadow-inner">
                    <span className="text-xl font-mono font-black tracking-[0.3em] text-white uppercase">{inviteCode}</span>
                  </div>
                   <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteCode);
                    }}
                    className="w-full py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-zinc-100 transition-all shadow-xl shadow-white/10 active:scale-95"
                  >
                    Copy Token
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateInvite}
                  disabled={isGeneratingInvite}
                  className="w-full py-5 bg-black border border-white/[0.05] rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-4 disabled:opacity-20 active:scale-95"
                >
                  {isGeneratingInvite ? <Plus size={18} className="animate-spin" /> : <Plus size={18} />}
                  Generate Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl px-2 sm:px-4" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-[#050505] border border-white/[0.05] text-white w-full max-w-5xl h-[85vh] sm:h-[85vh] rounded-2xl sm:rounded-[3rem] overflow-hidden flex flex-col sm:flex-row shadow-[0_0_150px_rgba(255,255,255,0.02)] animate-in fade-in zoom-in-95 duration-500" onClick={e => e.stopPropagation()}>
            {/* Settings Sidebar - horizontal scroll on mobile, vertical on desktop */}
            <div className="w-full sm:w-80 bg-black border-b sm:border-b-0 sm:border-r border-white/[0.03] p-4 sm:p-10 flex flex-col">
              <div className="mb-6 sm:mb-12">
                <h2 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 mb-2">Orbit Control Terminal</h2>
                <div className="text-lg sm:text-xl font-black text-white truncate tracking-tighter">{activeGroup?.name}</div>
              </div>
              
              <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 scrollbar-hide">
                {[
                  { id: 'overview', label: 'Overview', icon: Shield },
                  { id: 'members', label: 'Personnel', icon: Crown },
                  { id: 'moderation', label: 'Security', icon: Lock },
                  { id: 'general', label: 'System', icon: Plus },
                ].map(tab => (
                   <button
                    key={tab.id}
                    onClick={() => setActiveSettingsTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.15em] transition-all border border-transparent active:scale-[0.98] whitespace-nowrap ${
                      activeSettingsTab === tab.id 
                        ? "bg-white text-black shadow-2xl shadow-white/10" 
                        : "text-zinc-700 hover:text-white hover:bg-white/[0.03] hover:border-white/[0.05]"
                    }`}
                  >
                    <tab.icon size={16} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

               <button 
                onClick={() => setShowSettingsModal(false)}
                className="mt-4 sm:mt-6 w-full py-3 sm:py-5 rounded-xl sm:rounded-[1.5rem] border border-white/[0.03] text-zinc-700 hover:text-white hover:bg-white/[0.03] transition-all text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-white/2"
              >
                Exit
              </button>
            </div>

            {/* Settings Content */}
            <div className="flex-1 overflow-y-auto bg-black p-4 sm:p-12 scrollbar-hide relative">
              <div className="max-w-3xl mx-auto">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {activeSettingsTab === 'overview' && <SettingsOverview />}
                  {activeSettingsTab === 'members' && <SettingsMembers />}
                  {activeSettingsTab === 'moderation' && <SettingsModeration />}
                  {activeSettingsTab === 'general' && <SettingsGeneral />}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupsModals;
