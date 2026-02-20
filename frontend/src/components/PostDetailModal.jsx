import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Share,
  MoreHorizontal,
  ArrowLeft,
  Eye,
  TrendingUp,
  ArrowBigUp,
  ArrowBigDown,
  EyeOff,
  UserPlus,
  UserMinus,
  Flag,
} from "lucide-react";
import axios from "axios";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import CommentSection from "./CommentSection";
import ReplyModal from "./ReplyModal";
import ReportModal from "./ReportModal";
import { useSocket } from "../context/SocketContext";

const PostDetailModal = ({ 
  isOpen, 
  onClose, 
  post, 
  currentUser, 
  apiBaseUrl,
  onPostUpdate 
}) => {
  const [likes, setLikes] = useState(post?.likes || []);
  const [views, setViews] = useState(post?.views || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const modalRef = useRef(null);
  const moreMenuRef = useRef(null);
  const navigate = useNavigate();
  const { socket } = useSocket();

  useEffect(() => {
    if (post) {
      setLikes(post.likes || []);
      setViews(post.views || 0);
      const saved = JSON.parse(localStorage.getItem("bookmarkedPosts") || "[]");
      setIsSaved(saved.includes(post._id));
      
      const followingList = JSON.parse(localStorage.getItem("following") || "[]");
      setIsFollowing(followingList.includes(post.author?._id));
    }
  }, [post]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    const handleClickOutside = (e) => {
      if (showMoreMenu && moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    // Increment views when modal opens
    if (isOpen && post?._id) {
      axios.put(`${apiBaseUrl}/posts/${post._id}/view`).catch(err => {
        console.error("Failed to increment views:", err);
      });
    }

    if (socket && isOpen && post?._id) {
      socket.emit("join_post", post._id);
      socket.on("view_update", (data) => {
        if (data.postId === post._id) {
          setViews(data.views);
        }
      });
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      if (socket) {
        socket.off("view_update");
      }
    };
  }, [isOpen, onClose, showMoreMenu, post?._id, apiBaseUrl, socket]);

  if (!isOpen || !post) return null;

  const handleLike = async () => {
    if (!currentUser) return;
    const hasLiked = likes.includes(currentUser._id);
    const newLikes = hasLiked 
      ? likes.filter(id => id !== currentUser._id)
      : [...likes, currentUser._id];
    
    setLikes(newLikes);
    if (onPostUpdate) onPostUpdate({ ...post, likes: newLikes });

    try {
      const token = localStorage.getItem("token");
      await axios.put(`${apiBaseUrl}/posts/${post._id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  const handleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem("bookmarkedPosts") || "[]");
    let newBookmarks;
    if (isSaved) {
      newBookmarks = bookmarks.filter(id => id !== post._id);
    } else {
      newBookmarks = [...new Set([...bookmarks, post._id])];
    }
    localStorage.setItem("bookmarkedPosts", JSON.stringify(newBookmarks));
    setIsSaved(!isSaved);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post._id}`;
    if (navigator.share) {
      navigator.share({
        title: post.title || "Neutron Post",
        url: url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert("Post link copied to clipboard!");
    }
  };

  const handleFollow = async () => {
    if (!currentUser) return alert("Please login to follow users");
    if (currentUser._id === post.author?._id) return alert("You cannot follow yourself");

    const authorId = post.author?._id;
    let followingList = JSON.parse(localStorage.getItem("following") || "[]");
    let newFollowingList;

    if (isFollowing) {
      newFollowingList = followingList.filter(id => id !== authorId);
    } else {
      newFollowingList = [...new Set([...followingList, authorId])];
    }

    localStorage.setItem("following", JSON.stringify(newFollowingList));
    setIsFollowing(!isFollowing);

    try {
      const token = localStorage.getItem("token");
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      await axios.post(`${apiBaseUrl}/users/${authorId}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Follow failed:", err);
    }
  };

  const handleHidePost = () => {
    const hiddenPosts = JSON.parse(localStorage.getItem("hiddenPosts") || "[]");
    if (!hiddenPosts.includes(post._id)) {
      hiddenPosts.push(post._id);
      localStorage.setItem("hiddenPosts", JSON.stringify(hiddenPosts));
    }
    alert("Post hidden. You won't see this again in your feed.");
    onClose();
  };


  const handleProfileClick = () => {
    if (post.author?._id) {
      navigate(`/profile/${post.author._id}`);
      onClose();
    }
  };

  const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + 
           date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[150] flex items-stretch sm:items-center justify-center bg-black/90 backdrop-blur-xl overflow-hidden"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        ref={modalRef}
        className="bg-gradient-to-b from-zinc-900 to-black w-full max-w-[700px] sm:max-h-[95vh] rounded-none sm:rounded-[2.5rem] border-x-0 sm:border border-white/10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 shadow-[0_0_50px_rgba(255,255,255,0.05)] h-full sm:h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Premium Glassmorphism */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sticky top-0 bg-black/60 backdrop-blur-2xl z-40 border-b border-white/5">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={onClose} 
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 hover:border-white/20 group"
            >
              <ArrowLeft size={18} className="text-zinc-400 group-hover:text-white transition-colors" />
            </button>
            <div>
              <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-[0.2em]">Discussion</h2>
              <h3 className="text-lg font-bold text-white tracking-tight -mt-0.5">Post Details</h3>
            </div>
          </div>
          <div className="flex items-center gap-3 relative" ref={moreMenuRef}>
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`p-2.5 rounded-2xl transition-all border ${showMoreMenu ? 'bg-white/10 text-white border-white/20' : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/5 hover:border-white/20'}`}
            >
              <MoreHorizontal size={20} />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-3 w-64 bg-zinc-900/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <MenuOption 
                  onClick={() => { handleShare(); setShowMoreMenu(false); }}
                  icon={<Share2 size={16} />} 
                  label="Share Post" 
                />
                <MenuOption 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
                    alert("Link copied!");
                    setShowMoreMenu(false);
                  }}
                  icon={<Share size={16} />} 
                  label="Copy Link" 
                />
                <div className="h-px bg-white/5 my-2 mx-4" />
                <MenuOption 
                  onClick={handleFollow}
                  icon={isFollowing ? <UserMinus size={16} /> : <UserPlus size={16} />} 
                  label={`${isFollowing ? 'Unfollow' : 'Follow'} @${post.author?.handle}`}
                  bold
                />
                <div className="h-px bg-white/5 my-2 mx-4" />
                <MenuOption 
                  onClick={() => { handleHidePost(); setShowMoreMenu(false); }}
                  icon={<EyeOff size={16} />} 
                  label="Not Interested" 
                  danger
                />
                <MenuOption 
                  onClick={() => { setShowReportModal(true); setShowMoreMenu(false); }}
                  icon={<Flag size={16} />} 
                  label="Report Post" 
                />
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050505]">
          <div className="max-w-[650px] mx-auto pt-6 sm:pt-8 px-4 sm:px-6 pb-6">
            {/* Author Section - Redesigned */}
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div 
                className="group relative cursor-pointer" 
                onClick={handleProfileClick}
              >
                <div className="absolute -inset-1 bg-gradient-to-tr from-zinc-500 to-white/20 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-zinc-900 border-2 border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                  {post.author?.avatar ? (
                    <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold bg-gradient-to-br from-zinc-700 to-black">
                      {post.author?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                   <span className="font-bold text-white text-lg sm:text-xl tracking-tight hover:text-zinc-300 transition-colors cursor-pointer" onClick={handleProfileClick}>
                    {post.author?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500 text-[13px] sm:text-[15px]">
                  <span className="cursor-pointer hover:text-zinc-300 transition-colors" onClick={handleProfileClick}>@{post.author?.handle}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-800" />
                  <span>{formatFullDate(post.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Post Content - Improved Typography & Spacing */}
            

            {post.image && (
              <div className="mb-8 sm:mb-10 group relative">
                <div className="absolute -inset-2 sm:-inset-4 bg-white/5 rounded-[2rem] sm:rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/10 overflow-hidden bg-zinc-950 shadow-2xl transition-all duration-700 group-hover:border-white/20">
                  <img 
                    src={post.image} 
                    alt="" 
                    className="w-full h-auto object-contain max-h-[750px] transition-transform duration-700 group-hover:scale-[1.02]" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
              </div>
            )}

            {/* Interaction Bar - Premium Minimalist */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 border-y border-white/5 mb-8 gap-6 sm:gap-0">
              <div className="flex items-center gap-6 sm:gap-8 w-full sm:w-auto justify-between sm:justify-start px-2 sm:px-0">
                <Metric label="Upvotes" value={likes.length} />
                <Metric label="Replies" value={post.comments?.filter(c => !c.isDeleted)?.length || 0} />
                <Metric label="Views" value={views} />
              </div>
              
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-around sm:justify-end border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                <ActionButton 
                  onClick={handleLike} 
                  active={likes.includes(currentUser?._id)}
                  activeColor="text-orange-500 bg-orange-500/10 border-orange-500/20"
                  icon={<ArrowBigUp size={24} fill={likes.includes(currentUser?._id) ? "currentColor" : "none"} />}
                  title="Like"
                />
                <ActionButton 
                  onClick={() => setShowReplyModal(true)}
                  icon={<MessageCircle size={22} />}
                  title="Reply"
                />
                <ActionButton 
                  onClick={handleBookmark}
                  active={isSaved}
                  activeColor="text-amber-500 bg-amber-500/10 border-amber-500/20"
                  icon={<Bookmark size={22} fill={isSaved ? "currentColor" : "none"} />}
                  title="Bookmark"
                />
                <ActionButton 
                  onClick={handleShare}
                  icon={<Share2 size={22} />}
                  title="Share"
                />
              </div>
            </div>

            <div className="text-zinc-500 text-[13px] font-medium uppercase tracking-[0.2em] mb-6 px-1">
              Comments & Replies
            </div>
          </div>

          <div className="bg-black/20">
            <CommentSection 
              postId={post._id}
              currentUser={currentUser}
              apiBaseUrl={apiBaseUrl}
              initialComments={post.comments}
              post={post}
              onClose={() => {}}
              onCommentUpdate={(updatedComments) => {
                if (onPostUpdate) {
                  onPostUpdate({ ...post, comments: updatedComments });
                }
              }}
            />
          </div>
        </div>
      </div>

      <ReplyModal
        isOpen={showReplyModal}
        onClose={() => setShowReplyModal(false)}
        post={post}
        currentUser={currentUser}
        apiBaseUrl={apiBaseUrl}
        onReplySuccess={(newComment) => {
          if (onPostUpdate) {
            const updatedComments = [newComment, ...(post.comments || [])];
            onPostUpdate({ ...post, comments: updatedComments });
          }
        }}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportableItem={post}
        reportableType="Post"
        currentUser={currentUser}
        apiBaseUrl={apiBaseUrl}
      />
    </div>,
    document.body
  );
};

/* Modern Sub-components for better organization */
const Metric = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-white text-lg font-black tracking-tight">{value.toLocaleString()}</span>
    <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest -mt-1">{label}</span>
  </div>
);

const ActionButton = ({ icon, onClick, active, activeColor, title }) => (
  <button 
    onClick={onClick}
    title={title}
    className={`p-2.5 rounded-2xl transition-all border flex items-center justify-center ${
      active 
        ? activeColor 
        : 'text-zinc-500 bg-white/5 border-white/5 hover:border-white/20 hover:text-white'
    }`}
  >
    {icon}
  </button>
);

const MenuOption = ({ onClick, icon, label, danger, bold }) => (
  <button 
    onClick={onClick}
    className={`w-full px-5 py-3 flex items-center gap-3 text-[14px] transition-all hover:bg-white/5 text-left ${
      danger ? 'text-red-500' : 'text-zinc-300 hover:text-white'
    } ${bold ? 'font-bold' : 'font-medium'}`}
  >
    <span className={danger ? 'text-red-500' : 'text-zinc-500'}>{icon}</span>
    <span>{label}</span>
  </button>
);

export default PostDetailModal;
