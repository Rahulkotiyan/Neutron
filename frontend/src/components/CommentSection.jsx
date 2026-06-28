import React, { useState, useEffect, useRef, memo } from "react";
import {
  Heart,
  Send,
  Menu,
  Xmark,
  Trash,
  Page as ImageIcon,
  Message,
  Emoji,
  WarningTriangle,
  Play,
} from "iconoir-react";
import axios from "axios";
import ReplyModal from "./ReplyModal";
import ReportModal from "./ReportModal";
import EmojiPicker from "./EmojiPicker";
import GIFPicker from "./GIFPicker";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import CustomModal from "./CustomModal";

const CommentSection = ({
  postId,
  currentUser,
  comments: initialComments,
  onCommentUpdate,
  apiBaseUrl,
  onClose,
  post,
}) => {
  const { socket } = useSocket();
  const MAX_COMMENT_LENGTH = 280;

  const deduplicate = (list) => {
    if (!list) return [];
    const seen = new Set();
    return list.filter((item) => {
      const id = String(item._id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };

  const [comments, setComments] = useState(deduplicate(initialComments));
  const [newComment, setNewComment] = useState("");
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reportingComment, setReportingComment] = useState(null);
  const commentFileInputRef = useRef(null);
  const dropdownRefs = useRef({});

  const navigate = useNavigate();
  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // Sync state with props when initialComments change
  useEffect(() => {
    setComments((prev) => deduplicate([...(initialComments || []), ...prev]));
  }, [initialComments]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join_post", postId);
    socket.on("new_comment", (data) => {
      if (data.postId === postId) {
        setComments((prev) => {
          if (prev.find((c) => String(c._id) === String(data.comment._id)))
            return prev;
          const updated = [data.comment, ...prev];
          if (onCommentUpdate) onCommentUpdate(updated);
          return updated;
        });
      }
    });
    socket.on("new_reply", (data) => {
      if (data.postId === postId) {
        setComments((prev) => {
          const updated = prev.map((comment) => {
            if (String(comment._id) === String(data.commentId)) {
              if (
                comment.replies?.find(
                  (r) => String(r._id) === String(data.reply._id),
                )
              )
                return comment;
              return {
                ...comment,
                replies: [...(comment.replies || []), data.reply],
              };
            }
            return comment;
          });
          if (onCommentUpdate) onCommentUpdate(updated);
          return updated;
        });
      }
    });
    return () => {
      socket.emit("leave_post", postId);
      socket.off("new_comment");
      socket.off("new_reply");
    };
  }, [socket, postId, onCommentUpdate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showDropdown &&
        !Object.values(dropdownRefs.current).some((ref) =>
          ref?.contains(event.target),
        )
      ) {
        setShowDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setAttachedImage(null);
    setImagePreview(null);
    if (commentFileInputRef.current) commentFileInputRef.current.value = "";
  };

  const handleEmojiSelect = (emoji) => {
    setNewComment((prev) => prev + emoji);
  };

  const handleGifSelect = (gifUrl) => {
    setImagePreview(gifUrl);
    setAttachedImage(null);
  };

  const handleCommentSubmit = async () => {
    if ((!newComment.trim() && !attachedImage) || !currentUser) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      if (newComment.trim()) formData.append("text", newComment.trim());
      if (attachedImage) formData.append("file", attachedImage);

      const res = await axios.post(
        `${apiBaseUrl}/posts/${postId}/comment`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const addedComment = res.data;
      setComments((prev) => {
        const updated = deduplicate([addedComment, ...prev]);
        if (onCommentUpdate) onCommentUpdate(updated);
        return updated;
      });

      setNewComment("");
      setAttachedImage(null);
      setImagePreview(null);
    } catch (err) {
      console.error("Comment failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!currentUser) return;
    setComments((prev) =>
      prev.map((c) => {
        if (c._id === commentId) {
          const hasLiked = c.likes?.includes(currentUser._id);
          return {
            ...c,
            likes: hasLiked
              ? c.likes.filter((id) => id !== currentUser._id)
              : [...(c.likes || []), currentUser._id],
          };
        }
        return c;
      }),
    );
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${apiBaseUrl}/posts/${postId}/comments/${commentId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  const handleShareComment = (comment) => {
    const url = `${window.location.origin}/post/${postId}`;
    if (navigator.share) {
      navigator
        .share({
          title: `Comment by ${comment.user?.name}`,
          text: comment.text,
          url: url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setModalConfig({
        isOpen: true,
        title: "Link Copied",
        message: "Link copied to clipboard!",
        type: "success",
      });
    }
  };

  const handleDeleteComment = async (commentId) => {
    setModalConfig({
      isOpen: true,
      title: "Confirm Deletion",
      message: "Delete this comment?",
      type: "confirm",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          await axios.delete(
            `${apiBaseUrl}/posts/${postId}/comments/${commentId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          const recursiveFilter = (list) => {
            return list
              .filter((item) => String(item._id) !== String(commentId))
              .map((item) => ({
                ...item,
                replies: item.replies ? recursiveFilter(item.replies) : [],
              }));
          };

          setComments((prev) => {
            const updated = recursiveFilter(prev);
            if (onCommentUpdate) onCommentUpdate(updated);
            return updated;
          });
          setModalConfig({
            isOpen: true,
            title: "Deleted",
            message: "Comment deleted successfully",
            type: "success",
          });
        } catch (err) {
          console.error("Delete failed:", err);
          setModalConfig({
            isOpen: true,
            title: "Delete Failed",
            message: "Failed to delete comment",
            type: "error",
          });
        }
      },
    });
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString();
  };

  const CommentItem = ({
    comment,
    isReply = false,
    parentCommentId = null,
    depth = 0,
    isLastChild = false,
  }) => {
    const hasLiked = currentUser && comment.likes?.includes(currentUser._id);
    const isOwnComment = currentUser?._id === comment.user?._id;
    const replies = comment.replies || [];
    const showCurrentReplies = showReplies[comment._id] || depth > 0;

    return (
      <div
        className={`relative px-3 sm:px-6 ${depth === 0 ? "border-b border-white/5 bg-white/[0.01]" : ""}`}
      >
        {/* Enhanced Threading Path */}
        {depth > 0 && (
          <div
            className={`absolute left-[33px] sm:left-11 top-0 bottom-0 w-[1.5px] bg-white/5 -translate-x-1/2 ${isLastChild ? "h-5 rounded-b-full" : ""}`}
          />
        )}

        <div className="flex gap-3 sm:gap-4 py-4 sm:py-6 relative">
          {/* Avatar and vertical line logic */}
          <div className="flex flex-col items-center flex-shrink-0 relative">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 z-10 shadow-xl cursor-pointer transition-all hover:scale-105 hover:border-white/20"
              onClick={() => handleProfileClick(comment.user?._id)}
            >
              {comment.user?.avatar ? (
                <img
                  src={comment.user.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-[10px] sm:text-xs font-black bg-gradient-to-br from-zinc-700 to-black">
                  {comment.user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* Thread path continue */}
            {replies.length > 0 && showCurrentReplies && (
              <div className="absolute left-1/2 top-10 sm:top-12 bottom-0 w-[1.5px] bg-white/5 -translate-x-1/2" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
              <span
                className="text-[14px] sm:text-[15px] font-black text-white hover:text-zinc-300 transition-colors cursor-pointer tracking-tight"
                onClick={() => handleProfileClick(comment.user?._id)}
              >
                {comment.user?.name || "User"}
              </span>
              <span
                className="text-zinc-500 text-[13px] sm:text-[14px] font-medium tracking-tight cursor-pointer"
                onClick={() => handleProfileClick(comment.user?._id)}
              >
                {comment.user?.handle || "@user"}
              </span>
              <span className="w-1 h-1 bg-zinc-800 rounded-full" />
              <span className="text-zinc-500 text-[10px] md:text-xs font-medium uppercase tracking-widest">
                {formatTimeAgo(comment.createdAt)}
              </span>
            </div>

            <div className="text-[14px] sm:text-[15px] text-zinc-200 leading-[1.55] sm:leading-[1.6] mb-3 sm:mb-4 whitespace-pre-wrap font-normal selection:bg-white selection:text-black">
              {comment.text}
            </div>

            {comment.image && (
              <div className="mb-3 sm:mb-4 rounded-xl sm:rounded-2xl border border-white/10 overflow-hidden bg-zinc-950/50 shadow-xl group">
                <img
                  src={comment.image}
                  alt=""
                  className="max-h-60 sm:max-h-80 w-auto object-contain transition-transform duration-500 group-hover:scale-[1.01]"
                />
              </div>
            )}

            {/* Interaction Bar */}
            <div className="flex items-center justify-between max-w-[320px] sm:max-w-[380px] -ml-2 text-zinc-500">
              <ActionButton
                onClick={() => {
                  setReplyingToComment(comment);
                  setShowReplyModal(true);
                }}
                hoverColor="group-hover:text-sky-400"
                hoverBg="group-hover:bg-sky-400/10"
                count={comment.replies?.length || 0}
                title="Reply"
              >
                <Message size={16} />
              </ActionButton>

              <ActionButton
                onClick={() => handleLikeComment(comment._id)}
                hoverColor="group-hover:text-orange-500"
                hoverBg="group-hover:bg-orange-500/10"
                count={comment.likes?.length || 0}
                active={hasLiked}
                activeColor="text-orange-500"
                title={hasLiked ? "Unlike" : "Like"}
              >
                <Heart size={16} fill={hasLiked ? "currentColor" : "none"} />
              </ActionButton>

              <ActionButton
                onClick={() => handleShareComment(comment)}
                hoverColor="group-hover:text-emerald-400"
                hoverBg="group-hover:bg-emerald-400/10"
                title="Share"
              >
                <Send size={16} />
              </ActionButton>

              <div
                className="relative"
                ref={(el) => (dropdownRefs.current[comment._id] = el)}
              >
                <button
                  onClick={() =>
                    setShowDropdown(
                      showDropdown === comment._id ? null : comment._id,
                    )
                  }
                  className={`p-3 rounded-xl transition-all group active:scale-95 min-h-[44px] ${showDropdown === comment._id ? "bg-white/10 text-white" : "hover:bg-white/5 text-zinc-500 hover:text-white"}`}
                >
                  <Menu size={18} />
                </button>

                {showDropdown === comment._id && (
                  <div className="absolute left-0 mt-2 w-48 max-w-[calc(100vw-32px)] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
                    {isOwnComment ? (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left active:scale-95 min-h-[44px]"
                      >
                        <Trash iconSize={16} />
                        <span>Delete Comment</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowReportModal(true);
                          setShowDropdown(null);
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-zinc-300 hover:bg-white/5 transition-colors text-left active:scale-95 min-h-[44px]"
                      >
                        <WarningTriangle size={16} className="text-zinc-500" />
                        <span>Report Comment</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Render Replies */}
        {showCurrentReplies && replies.length > 0 && (
          <div className="ml-3 sm:ml-6">
            {replies.map((reply, index) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                isReply={true}
                parentCommentId={comment._id}
                depth={depth + 1}
                isLastChild={index === replies.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-black/40 border-t border-white/10 flex flex-col">
      {/* Header */}
      {!onClose && (
        <div className="px-3 md:px-4 py-3 sticky top-0 bg-black/80 backdrop-blur-md z-30 border-b border-[#2f3336]">
          <h3 className="text-xl font-bold text-white">Post your reply</h3>
        </div>
      )}

      {/* Main Reply Input (Inline) */}
      {currentUser ? (
        <div className="p-4 flex gap-3 border-b border-[#2f3336]">
          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 flex-shrink-0 shadow-lg">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold bg-zinc-600">
                {currentUser?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value.slice(0, MAX_COMMENT_LENGTH));
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              placeholder="Post your reply"
              className="w-full bg-transparent border-none text-[20px] text-white placeholder-[#71767b] focus:ring-0 resize-none h-auto min-h-[40px] p-0 font-normal"
              rows={1}
            />

            {imagePreview && (
              <div className="mt-2 relative inline-block group">
                <div className="absolute -inset-1 bg-white/5 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-zinc-950">
                  <img
                    src={imagePreview}
                    alt=""
                    className="max-h-60 w-auto object-contain"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-3 sm:p-1.5 bg-black/60 hover:bg-black/90 rounded-xl text-white backdrop-blur-xl border border-white/10 transition-all hover:scale-110 active:scale-95 min-h-[44px]"
                  >
                  <Xmark size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
            <div className="flex items-center gap-1 text-[#1d9bf0] relative">
              <input
                ref={commentFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => commentFileInputRef.current?.click()}
                className="p-3 hover:bg-[#1d9bf0]/10 rounded-full transition-colors active:scale-95 min-h-[44px]"
                title="Media"
              >
                <ImageIcon size={19} />
              </button>
              <button
                onClick={() => {
                  setShowGifPicker(!showGifPicker);
                  setShowEmojiPicker(false);
                }}
                className={`p-3 hover:bg-[#1d9bf0]/10 rounded-full transition-colors active:scale-95 min-h-[44px] ${showGifPicker ? "bg-[#1d9bf0]/10" : ""}`}
                title="GIF"
              >
                <Play size={17} />
              </button>
              <button
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowGifPicker(false);
                }}
                className={`p-3 hover:bg-[#1d9bf0]/10 rounded-full transition-colors active:scale-95 min-h-[44px] ${showEmojiPicker ? "bg-[#1d9bf0]/10" : ""}`}
                title="Emoji"
              >
                <Emoji size={19} />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-[100]">
                  <EmojiPicker
                    onSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              )}

              {showGifPicker && (
                <div className="absolute bottom-12 left-0 z-[100]">
                  <GIFPicker
                    onSelect={handleGifSelect}
                    onClose={() => setShowGifPicker(false)}
                  />
                </div>
              )}
            </div>
            <button
              onClick={handleCommentSubmit}
              disabled={!newComment.trim() || loading}
              className="px-5 py-1.5 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-bold rounded-full transition-all text-[14px] shadow-lg shadow-white/5 active:scale-95 min-h-[44px]"
            >
              {loading ? "Posting..." : "Reply"}
            </button>
          </div>
        </div>
      </div>
      ) : (
        <div className="p-6 text-center border-b border-[#2f3336]">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
            <Message className="w-6 h-6 text-zinc-500" />
          </div>
          <p className="text-white font-medium mb-2">Login Required</p>
          <p className="text-zinc-400 text-sm">Please login to comment on posts</p>
        </div>
      )}

      {/* Comments Feed */}
      <div className="flex-1 pb-16 md:pb-0">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} />
          ))
        ) : (
          <div className="p-10 text-center text-[#71767b]">
            <p className="text-[15px]">Be the first to reply!</p>
          </div>
        )}
      </div>

      <ReplyModal
        isOpen={showReplyModal}
        onClose={() => {
          setShowReplyModal(false);
          setReplyingToComment(null);
        }}
        post={post}
        parentComment={replyingToComment}
        currentUser={currentUser}
        apiBaseUrl={apiBaseUrl}
        onReplySuccess={(newData) => {
          if (replyingToComment) {
            // Nested reply
            setComments((prev) => {
              const updated = prev.map((c) => {
                if (String(c._id) === String(replyingToComment._id)) {
                  return {
                    ...c,
                    replies: deduplicate([...(c.replies || []), newData]),
                  };
                }
                return c;
              });
              if (onCommentUpdate) onCommentUpdate(updated);
              return updated;
            });
          } else {
            // Top level comment
            const updated = deduplicate([newData, ...comments]);
            setComments(updated);
            if (onCommentUpdate) onCommentUpdate(updated);
          }
        }}
      />

      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setReportingComment(null);
          }}
          reportableItem={reportingComment}
          reportableType="Comment"
          currentUser={currentUser}
          apiBaseUrl={apiBaseUrl}
        />
      )}
      {/* Custom Modal for Alerts */}
      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
};

const ActionButton = memo(({
  children,
  hoverColor,
  hoverBg,
  onClick,
  count,
  active,
  activeColor,
  title,
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1 group transition-colors active:scale-95 min-h-[44px] ${active ? activeColor : "text-[#71767b]"} ${hoverColor}`}
    title={title}
  >
    <div className={`p-3 sm:p-2 rounded-full transition-colors ${hoverBg}`}>
      {children}
    </div>
    {count > 0 && <span className="text-[13px]">{count}</span>}
  </button>
));

export default memo(CommentSection);
