import React from 'react';
import { Lock, MoreHoriz, Upload } from 'iconoir-react';

const MessageItem = ({ 
  msg, 
  isSequence, 
  currentUser, 
  handleMessageContextMenu, 
  formatTime, 
  formatDate 
}) => {
  const isMyMessage = (msg.user?._id || msg.user) === (currentUser?._id || currentUser?.id);

  return (
    <div
      className={`group flex pl-4 pr-5 py-2.5 hover:bg-white/[0.02] transition-all duration-200 border-l border-transparent hover:border-white/5 -mx-4 ${!isSequence ? "mt-5" : ""}`}
      onContextMenu={(e) => handleMessageContextMenu(e, msg._id)}
    >
      {!isSequence ? (
        <div className="w-10 h-10 rounded-xl bg-black flex-shrink-0 overflow-hidden mr-4 mt-0.5 cursor-pointer hover:opacity-80 transition-all border border-white/[0.05] shadow-xl shadow-white/5">
          {msg.user?.avatar ? (
            <img
              src={msg.user.avatar}
              className="w-full h-full object-cover"
              alt="avatar"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] font-black bg-white/[0.02] text-zinc-600 uppercase tracking-widest">
              {msg.user?.name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
      ) : (
        <div className="w-10 mr-4 flex-shrink-0 text-[9px] text-zinc-800 opacity-0 group-hover:opacity-100 text-right select-none self-start mt-2 hidden sm:block font-black uppercase tracking-widest transition-opacity">
          {formatTime(msg.timestamp)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {!isSequence && (
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm text-white hover:text-zinc-300 cursor-pointer transition-colors tracking-tight">
                {msg.user?.name}
              </span>
              <span className="text-[9px] text-zinc-700 font-black uppercase tracking-widest">
                {formatTime(msg.timestamp)}
              </span>
              {msg.type === "ENCRYPTED" && (
                <Lock
                  size={8}
                  className="text-zinc-800"
                  title="Secure"
                />
              )}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMessageContextMenu(e, msg._id);
              }}
              className="text-zinc-700 hover:text-white transition-all p-1.5 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/5 opacity-0 group-hover:opacity-100"
              title="Command"
            >
              <MoreHoriz size={14} />
            </button>
          </div>
        )}
        
        {msg.deleted ? (
          <p className="text-[10px] italic text-zinc-800 font-black uppercase tracking-[0.2em] bg-white/[0.01] px-4 py-2 rounded-xl border border-white/[0.02] inline-block mt-1">
            This intel was revoked by the originator
          </p>
        ) : msg.type === "POLL" && msg.poll ? (
          <div className="bg-[#050505] border border-white/[0.03] rounded-2xl p-6 space-y-5 max-w-lg mt-3 shadow-2xl overflow-hidden relative" onContextMenu={(e) => handleMessageContextMenu(e, msg._id)}>
            <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Data Query</div>
            <div className="text-sm font-bold text-white tracking-tight leading-relaxed">
              {msg.poll.question}
            </div>
            <div className="space-y-2">
              {msg.poll.options.map((opt) => {
                const totalVotes = opt.votes?.length || 0;
                const myId = currentUser?._id || currentUser?.id;
                const hasVoted = (opt.votes || []).some(
                  (v) => v === myId || v?._id === myId,
                );
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all active:scale-[0.98] ${
                      hasVoted
                        ? "bg-white text-black border-white shadow-xl shadow-white/5"
                        : "bg-white/[0.02] border-white/[0.05] text-zinc-600 hover:text-white hover:bg-white/[0.05] hover:border-white/[0.1]"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    <span className={`ml-3 text-[10px] font-black ${hasVoted ? "text-black/40" : "text-zinc-800"}`}>
                      {totalVotes}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p
              className={`text-sm text-zinc-300 whitespace-pre-wrap break-words leading-relaxed tracking-tight selection:bg-white selection:text-black ${
                msg.type === "SYSTEM"
                  ? "italic text-zinc-800 font-black uppercase text-[10px] tracking-widest bg-white/[0.02] px-3 py-1 rounded-lg inline-block my-1 border border-white/[0.03]"
                  : ""
              }`}
            >
              {msg._plaintext ?? msg.content}
            </p>

            {msg.attachments && msg.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {msg.attachments.map((file, idx) => {
                  const isImage = file.contentType?.startsWith("image/");
                  const fileUrl = file.url.startsWith("http") ? file.url : `http://localhost:5000${file.url}`;
                  
                  if (isImage) {
                    return (
                      <div key={idx} className="relative group/img max-w-sm rounded-2xl overflow-hidden border border-white/[0.05] shadow-2xl">
                        <img 
                          src={fileUrl} 
                          alt={file.filename} 
                          className="max-h-80 w-auto object-cover hover:scale-[1.02] transition-transform duration-500 cursor-pointer"
                          onClick={() => window.open(fileUrl, '_blank')}
                        />
                      </div>
                    );
                  }
                  
                  return (
                    <a
                      key={idx}
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.05] transition-all group/file max-w-xs"
                    >
                      <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0 group-hover/file:bg-white/10 transition-colors">
                        <Upload size={18} className="text-zinc-500 group-hover/file:text-white transition-colors" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate tracking-tight">{file.filename}</p>
                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mt-0.5">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
