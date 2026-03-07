import React, { useState, useRef, useEffect } from "react";
import {
  Xmark,
  Send,
  ArrowLeft,
  Clock,
  User,
  Message,
  MoreHoriz,
  MediaImage as ImageIcon,
  Emoji,
  Calendar,
  UserXmark,
} from "iconoir-react";
import axios from "axios";
import { createPortal } from "react-dom";
import EmojiPicker from "./EmojiPicker";
import GIFPicker from "./GIFPicker";
import CustomModal from "./CustomModal";
import { compressImage, validateImage } from '../utils/imageCompression';

// Custom GIF Icon to match X
const GifIcon = ({ size = 20 }) => (
  <div className="border-2 border-current rounded-sm px-0.5 flex items-center justify-center font-bold text-[10px] leading-none" style={{ width: size, height: size }}>
    GIF
  </div>
);

const ReplyModal = ({ 
  isOpen, 
  onClose, 
  post, 
  parentComment = null, 
  currentUser, 
  apiBaseUrl,
  onReplySuccess
}) => {
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [scheduledAt, setScheduledAt] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const modalRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const MAX_REPLY_LENGTH = 280;

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      if (textareaRef.current) {
        setTimeout(() => {
          textareaRef.current.focus();
        }, 150);
      }
      // Load draft if exists
      const savedDraft = localStorage.getItem(`draft_${post._id}`);
      if (savedDraft) setReplyText(savedDraft);
    }
  }, [isOpen, post._id]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    if (text.length <= MAX_REPLY_LENGTH) {
      setReplyText(text);
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Validate the file first
        validateImage(file);

        let processedFile = file;

        // Compress images before storing
        if (file.type.startsWith("image/")) {
          processedFile = await compressImage(file, {
            maxSizeMB: 1, // Smaller for replies
            maxWidthOrHeight: 1280,
            quality: 0.8,
          });
        }

        setAttachedImage(processedFile);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(processedFile);
      } catch (error) {
        console.error("Error processing image:", error);
        setModalConfig({
          isOpen: true,
          title: "Image Processing Error",
          message: error.message || "Failed to process the image. Please try again.",
          type: "error",
        });
      }
    }
  };

  const removeImage = () => {
    setAttachedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!replyText.trim() && !attachedImage) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      if (replyText.trim()) formData.append('text', replyText.trim());
      if (attachedImage) formData.append('image', attachedImage);
      

      if (scheduledAt) {
        formData.append('scheduledAt', scheduledAt.toISOString());
      }

      let endpoint = parentComment 
        ? `${apiBaseUrl}/posts/${post._id}/comments/${parentComment._id}/reply`
        : `${apiBaseUrl}/posts/${post._id}/comment`;

      const res = await axios.post(endpoint, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (onReplySuccess) onReplySuccess(res.data);

      // Clear draft on success
      localStorage.removeItem(`draft_${post._id}`);
      
      setReplyText("");
      setAttachedImage(null);
      setImagePreview(null);
      setScheduledAt(null);
      onClose();
    } catch (err) {
      console.error("Reply failed:", err);
      setModalConfig({
        isOpen: true,
        title: "Reply Failed",
        message: "Failed to post reply.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    if (replyText.trim()) {
      localStorage.setItem(`draft_${post._id}`, replyText.trim());
      setModalConfig({
        isOpen: true,
        title: "Draft Saved",
        message: "Draft saved!",
        type: "success",
      });
    }
  };


  const handleScheduleClick = () => {
    if (scheduledAt) {
      setScheduledAt(null);
      return;
    }
    const future = new Date(Date.now() + 60 * 60 * 1000); // 1 hour later
    setScheduledAt(future);
    setModalConfig({
      isOpen: true,
      title: "Scheduled",
      message: `Scheduled for ${future.toLocaleString()}`,
      type: "info",
    });
  };

  const handleEmojiSelect = (emoji) => {
    setReplyText(prev => prev + emoji);
  };

  const handleGifSelect = (gifUrl) => {
    setImagePreview(gifUrl);
    setAttachedImage(null); // Clear manual upload if GIF is selected
  };

  const comingSoon = (feature) => {
    setModalConfig({
      isOpen: true,
      title: "Coming Soon",
      message: `${feature} feature is coming soon to Neutron! 🚀`,
      type: "info",
    });
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  const contextData = parentComment || post;
  const contextAuthor = parentComment ? parentComment.user : post.author;
  const isAnonymousPost = post.isAnonymous;

  return createPortal(
    <div 
      className="fixed inset-0 z-[200] flex items-start justify-center bg-[#242d34]/60 backdrop-blur-[2px] pt-12 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-gradient-to-b from-zinc-900 to-black w-full max-w-[600px] rounded-none sm:rounded-[2.5rem] border-x-0 sm:border border-white/10 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 h-full sm:h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Premium Glassmorphism */}
        <div className="flex items-center justify-between px-6 py-4 bg-black/60 backdrop-blur-2xl sticky top-0 z-40 border-b border-white/5">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose} 
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 hover:border-white/20 group"
              title="Close"
            >
              <Xmark className="w-4.5 h-4.5 text-zinc-400 group-hover:text-white transition-colors" />
            </button>
            <h3 className="text-lg font-bold text-white tracking-tight">Post your reply</h3>
          </div>
          <button 
            onClick={handleSaveDraft}
            className="text-white font-bold text-[13px] bg-white/5 hover:bg-white/10 px-4 py-2 rounded-2xl transition-all border border-white/10 hover:border-white/20 uppercase tracking-widest leading-none"
          >
            Drafts
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 bg-[#050505]">
          <div className="flex gap-3 sm:gap-4 relative">
            <div className="absolute left-5 sm:left-7 top-10 sm:top-14 bottom-0 w-[2px] bg-white/5 -translate-x-1/2" />
            <div className="flex-shrink-0 z-10">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-zinc-900 border-2 border-white/10 shadow-2xl">
                {!isAnonymousPost && contextAuthor?.avatar ? (
                  <img src={contextAuthor.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-lg sm:text-xl font-black bg-gradient-to-br from-zinc-700 to-black">
                    {isAnonymousPost ? <UserXmark iconSize={16} className="text-zinc-400" /> : (contextAuthor?.name?.charAt(0).toUpperCase() || "U")}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 pb-4 sm:pb-6">
              <div className="flex items-center gap-1.5 mb-1 sm:mb-1.5 flex-wrap">
                <span className="font-black text-white text-[15px] sm:text-[16px] tracking-tight">
                  {isAnonymousPost ? "Anonymous" : (contextAuthor?.name || "Unknown User")}
                </span>
                <span className="text-zinc-500 text-[14px] sm:text-[15px] font-medium tracking-tight">@{isAnonymousPost ? "anonymous" : (contextAuthor?.handle || "user")}</span>
                <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                <span className="text-zinc-500 text-[10px] sm:text-[11px] font-medium uppercase tracking-widest">{formatTimeAgo(contextData.createdAt)}</span>
              </div>
              <div className="text-zinc-300 text-[15px] sm:text-[16px] leading-[1.55] sm:leading-[1.6] whitespace-pre-wrap mb-1 sm:mb-2 font-normal">
                {parentComment ? contextData.text : contextData.desc}
              </div>
              <div className="mt-2 sm:mt-4 text-zinc-500 text-[13px] sm:text-[14px] font-medium">
                Replying to <span className="text-white font-bold">@{isAnonymousPost ? "anonymous" : (contextAuthor?.handle || "user")}</span>
              </div>
            </div>
          </div>

          {/* User Reply Area */}
          <div className="flex gap-3 sm:gap-4 mt-2 min-h-[140px] sm:min-h-[160px]">
            <div className="flex-shrink-0 z-10">
              <div className="relative group">
                <div className="absolute -inset-1 bg-white/10 rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity" />
                <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-zinc-900 border-2 border-white/10 shadow-2xl transition-all group-hover:border-white/20">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-lg sm:text-xl font-black bg-gradient-to-br from-zinc-700 to-black">
                      {currentUser?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col">
              <textarea
                ref={textareaRef}
                value={replyText}
                onChange={handleTextChange}
                placeholder="Post your reply"
                className="w-full bg-transparent border-none text-[18px] sm:text-[22px] text-white placeholder-zinc-600 focus:ring-0 resize-none py-1 sm:py-2 min-h-[60px] sm:min-h-[80px] font-normal"
                rows={1}
              />
              

              {scheduledAt && (
                <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-orange-400/10 text-orange-400 rounded-full border border-orange-400/20 w-fit text-xs font-bold animate-in fade-in slide-in-from-left-2">
                  <Calendar className="w-3 h-3" />
                  <span>{scheduledAt.toLocaleString()}</span>
                  <button onClick={() => setScheduledAt(null)} className="ml-1 hover:text-white"><Xmark className="w-3 h-3" /></button>
                </div>
              )}

              {imagePreview && (
                <div className="mt-3 sm:mt-4 relative inline-block group">
                  <div className="absolute -inset-2 bg-white/5 rounded-2xl sm:rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative rounded-2xl sm:rounded-[2.5rem] border border-white/10 overflow-hidden bg-zinc-950 shadow-2xl">
                    <img src={imagePreview} alt="" className="max-h-60 sm:max-h-80 w-auto object-contain" />
                    <button 
                      onClick={removeImage} 
                      className="absolute top-2 sm:top-4 right-2 sm:right-4 p-1.5 sm:p-2 bg-black/60 hover:bg-black/90 rounded-xl sm:rounded-2xl text-white backdrop-blur-xl border border-white/10 transition-all hover:scale-110"
                    >
                      <Xmark className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </button>
                  </div>
                </div>
              )}

              {showEmojiPicker && (
                <div className="absolute bottom-20 left-6 sm:left-24 z-[300]">
                  <EmojiPicker 
                    onSelect={handleEmojiSelect} 
                    onClose={() => setShowEmojiPicker(false)} 
                  />
                </div>
              )}

              {showGifPicker && (
                <div className="absolute bottom-20 left-6 sm:left-24 z-[300]">
                  <GIFPicker 
                    onSelect={handleGifSelect} 
                    onClose={() => setShowGifPicker(false)} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Toolbar */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky bottom-0 bg-[#050505]/95 backdrop-blur-2xl border-t border-white/5">
          <div className="flex items-center gap-0 sm:gap-1">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <ToolbarIconButton onClick={() => fileInputRef.current?.click()} title="Media"><ImageIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" /></ToolbarIconButton>
            <ToolbarIconButton 
              onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }} 
              title="GIF"
              className={showGifPicker ? 'text-[#1d9bf0] bg-[#1d9bf0]/10' : ''}
            >
                <GifIcon size={16} sm:size={18} />
            </ToolbarIconButton>
            <ToolbarIconButton 
              onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }} 
              title="Emoji"
              className={showEmojiPicker ? 'text-[#1d9bf0] bg-[#1d9bf0]/10' : ''}
            >
                <Emoji className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </ToolbarIconButton>
            <ToolbarIconButton 
              onClick={handleScheduleClick} 
              title="Schedule" 
              className={`hidden sm:flex ${scheduledAt ? 'text-orange-400 bg-orange-400/10' : ''}`}
            >
              <Calendar className="w-5 h-5" />
            </ToolbarIconButton>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            {replyText.length > 0 && <CharacterCounter current={replyText.length} max={MAX_REPLY_LENGTH} />}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (!replyText.trim() && !attachedImage)}
              className="px-6 sm:px-8 py-2 sm:py-2.5 bg-white hover:bg-zinc-200 disabled:bg-white/10 disabled:text-white/20 text-black font-black rounded-xl sm:rounded-2xl transition-all text-[13px] sm:text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95"
            >
              {isSubmitting ? "Posting..." : "Reply"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const ToolbarIconButton = ({ children, onClick, title, className = "" }) => (
  <button onClick={onClick} className={`p-2.5 text-zinc-300 hover:bg-white/10 rounded-full transition-colors ${className}`} title={title}>{children}</button>
);

const CharacterCounter = ({ current, max }) => {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - current / max);
  return (
    <div className="w-8 h-8 flex items-center justify-center">
      <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
        <circle className="text-[#333639]" strokeWidth="2" stroke="currentColor" fill="transparent" r={radius} cx="12" cy="12" />
        <circle className={current > max - 20 ? 'text-[#ffd700]' : 'text-[#1d9bf0]'} strokeWidth="2" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="12" cy="12" />
      </svg>
      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
};

export default ReplyModal;
