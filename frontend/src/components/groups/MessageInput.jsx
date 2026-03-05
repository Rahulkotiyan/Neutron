import React from 'react';
import { Plus, Gift, Smile, Send, Loader, X } from 'lucide-react';

const MessageInput = ({ 
  newMessage, 
  handleTyping, 
  handleSendMessage, 
  e2eeStatus, 
  isSending, 
  activeChannel, 
  setShowPollModal,
  handleFileSelect,
  selectedFile,
  clearSelectedFile,
  isUploading,
  uploadProgress
}) => {
  const fileInputRef = React.useRef(null);

  return (
    <div className="px-5 pb-5 bg-black border-t border-white/[0.03] pt-4 flex-shrink-0 fixed inset-x-0 bottom-16 md:static md:bottom-0 z-30">
      {selectedFile && (
        <div className="mb-2 p-2 bg-zinc-900/50 border border-white/10 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
              <Plus size={18} className="text-zinc-400 rotate-45" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-zinc-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isUploading && (
              <span className="text-[10px] font-bold text-blue-400">{uploadProgress}%</span>
            )}
            <button 
              onClick={clearSelectedFile}
              className="p-1.5 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage}>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="bg-[#050505] border border-white/[0.05] rounded-[1.25rem] p-2 flex items-center gap-2 transition-all focus-within:bg-[#080808] focus-within:border-white/[0.1] focus-within:ring-1 focus-within:ring-white/5 shadow-2xl">
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl text-zinc-600 hover:text-white hover:bg-white/[0.03] transition-all flex items-center justify-center border border-transparent hover:border-white/5 active:scale-95"
          >
            <Plus size={20} />
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder={
              e2eeStatus === "ready"
                ? `Message Personnel in #${activeChannel?.name}`
                : e2eeStatus === "loading"
                  ? "Verifying Secure Link..."
                  : `Message #${activeChannel?.name}`
            }
            disabled={e2eeStatus === "loading" || isSending || isUploading}
            className="flex-1 bg-transparent outline-none text-white placeholder-zinc-600 disabled:opacity-50 px-3 py-2 text-sm font-medium tracking-tight"
          />
          
          <div className="flex items-center gap-2 text-zinc-500 px-1">
            <button 
              type="button"
              className="p-2.5 rounded-xl text-zinc-600 hover:text-white hover:bg-white/[0.02] transition-all hidden sm:flex border border-transparent hover:border-white/5 active:scale-95"
            >
              <Smile size={20} />
            </button>
            <button
              type="button"
              onClick={() => setShowPollModal(true)}
              className="text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl border border-white/[0.05] text-zinc-600 hover:bg-white/[0.05] hover:text-white hover:border-white/20 transition-all hidden sm:block active:scale-90 shadow-xl shadow-white/5"
            >
              Poll
            </button>
            <button
              type="submit"
              disabled={
                (!newMessage.trim() && !selectedFile) ||
                isSending ||
                isUploading ||
                e2eeStatus !== "ready"
              }
              className="w-11 h-11 rounded-[0.9rem] bg-white text-black flex items-center justify-center hover:bg-zinc-100 disabled:opacity-20 disabled:grayscale transition-all active:scale-90 shadow-2xl shadow-white/10 font-black uppercase tracking-widest"
            >
              {isSending || isUploading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
