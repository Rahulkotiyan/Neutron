import React from 'react';
import { Refresh, Lock, Hashtag, Microphone, Menu, InfoCircle, Group, Upload, MoreHoriz } from 'iconoir-react';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';

const ChatArea = ({ 
  activeChannel, 
  loadingMessages, 
  activeChatTab, 
  setActiveChatTab, 
  messages, 
  currentUser, 
  handleMessageContextMenu, 
  formatTime, 
  formatDate, 
  filesAndNotes, 
  typingUsers, 
  e2eeStatus, 
  isSending, 
  handleTyping, 
  handleSendMessage, 
  newMessage,
  setShowPollModal,
  setShowMobileSidebar,
  showMembersModal,
  setShowMembersModal,
  handleLeaveChannel,
  isActiveMember,
  messagesEndRef,
  E2EEBadge,
  handleVotePoll,
  handleFileSelect,
  selectedFile,
  clearSelectedFile,
  isUploading,
  uploadProgress
}) => {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-black w-full relative">
      {activeChannel ? (
        <>
          {/* Chat Header */}
          <div className="h-16 px-5 border-b border-white/[0.03] bg-[#050505]/80 backdrop-blur-xl flex items-center justify-between flex-shrink-0 z-10 sticky top-0">
            <div className="flex items-center gap-3">
              <div
                className="md:hidden mr-1 text-zinc-600 cursor-pointer hover:text-white transition-colors"
                onClick={() => setShowMobileSidebar(true)}
              >
                <Menu size={22} />
              </div>
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-zinc-600 border border-white/[0.05]">
                {activeChannel.type === "voice" ? <Microphone size={16} /> : <Hashtag size={16} />}
              </div>
              <h3 className="font-bold text-base truncate text-white tracking-tight">
                {activeChannel.name}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <E2EEBadge />
              <button
                className={`p-2.5 rounded-xl transition-all active:scale-95 border border-transparent ${showMembersModal ? "bg-white text-black shadow-xl" : "text-zinc-600 hover:text-white hover:bg-white/[0.03] hover:border-white/[0.05]"}`}
                onClick={() => setShowMembersModal(!showMembersModal)}
              >
                <Group size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center px-5 py-2 border-b border-white/[0.03] bg-[#050505]/50 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest">
              <button
                onClick={() => setActiveChatTab("chat")}
                className={`px-4 py-2 rounded-xl transition-all active:scale-95 ${
                  activeChatTab === "chat"
                    ? "bg-white text-black shadow-xl"
                    : "text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.02]"
                }`}
              >
                Communications
              </button>
              <button
                onClick={() => setActiveChatTab("files")}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95 ${
                  activeChatTab === "files"
                    ? "bg-white text-black shadow-xl"
                    : "text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.02]"
                }`}
              >
                Intelligence
                {filesAndNotes.length > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${activeChatTab === 'files' ? 'bg-black text-white' : 'bg-white/5 text-zinc-500'}`}>
                    {filesAndNotes.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 pb-32 md:pb-8 space-y-1 scrollbar-hide bg-black">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Refresh size={24} className="animate-spin text-zinc-800" />
              </div>
            ) : activeChatTab === "chat" && messages.length === 0 ? (
              <div className="mt-20 px-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-20 h-20 bg-[#050505] border border-white/[0.03] rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-2xl">
                  <Lock size={32} className="text-zinc-700" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3 tracking-tighter">
                  Secure Link Established
                </h2>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed">
                  Channel #{activeChannel.name} is now private and encrypted.
                </p>
              </div>
            ) : activeChatTab === "chat" ? (
              messages.map((msg, i) => {
                const prevMsg = messages[i - 1];
                const isSequence =
                  prevMsg &&
                  (prevMsg.user?._id || prevMsg.user) ===
                    (msg.user?._id || msg.user) &&
                  new Date(msg.timestamp) - new Date(prevMsg.timestamp) <
                    300000;

                return (
                  <MessageItem
                    key={msg._id || i}
                    msg={msg}
                    isSequence={isSequence}
                    currentUser={currentUser}
                    handleMessageContextMenu={handleMessageContextMenu}
                    formatTime={formatTime}
                    formatDate={formatDate}
                  />
                );
              })
            ) : (
              <div className="space-y-3">
                {filesAndNotes.length === 0 ? (
                  <div className="mt-20 px-4 text-center opacity-30">
                    <p className="text-white text-[10px] font-bold uppercase tracking-widest">No Intelligence Data Available</p>
                  </div>
                ) : (
                  filesAndNotes.map((msg) => (
                    <div key={msg._id} className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-5 flex flex-col gap-3 group hover:bg-white/[0.03] transition-all">
                      <div className="flex items-center justify-between text-[9px] font-bold text-zinc-600 uppercase tracking-[0.15em]">
                        <span className="text-zinc-400">{msg.user?.name}</span>
                        <span>{formatDate(msg.timestamp)}</span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">{msg._plaintext || msg.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-3 px-2 py-4 text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] animate-pulse">
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-white rounded-full" />
                  <span className="w-1 h-1 bg-white/60 rounded-full" />
                  <span className="w-1 h-1 bg-white/20 rounded-full" />
                </div>
                {typingUsers.length} Personnel Typing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <MessageInput 
            newMessage={newMessage}
            handleTyping={handleTyping}
            handleSendMessage={handleSendMessage}
            e2eeStatus={e2eeStatus}
            isSending={isSending}
            activeChannel={activeChannel}
            setShowPollModal={setShowPollModal}
            handleFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            clearSelectedFile={clearSelectedFile}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-black p-12">
          <div className="w-24 h-24 bg-[#050505] border border-white/[0.03] rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl animate-pulse">
            <Lock size={40} className="text-zinc-900" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Access Restricted</h3>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] text-center max-w-[240px]">Select a secure communication channel to proceed.</p>
        </div>
      )}
    </div>
  );
};

export default ChatArea;
