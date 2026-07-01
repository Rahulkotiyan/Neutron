import React, { useState, useEffect, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Heart,
  Message,
  Bookmark,
  Send,
  Trash,
  Calendar,
  User,
  FloppyDisk,
} from "iconoir-react";
const PostCard = React.lazy(() => import("./PostCard"));
import CustomModal from "./CustomModal";
import { API_URL } from "../utils/api";

const PostDetail = ({ currentUser, token }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const authToken = token || localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };

      const res = await axios.get(`${API_URL}/posts/${postId}`, config);
      setPost(res.data);
    } catch (err) {
      console.error("Error fetching post:", err);
      setError("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      navigate("/");
      return;
    }

    try {
      const authToken = token || localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };

      const res = await axios.put(`${API_URL}/posts/${postId}/like`, {}, config);
      setPost((prev) => ({ ...prev, likes: res.data.likes, likesCount: res.data.likesCount }));
    } catch (err) {
      console.error("Error liking post:", err);
      setError("Failed to like post");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDislike = async () => {
    if (!currentUser) {
      navigate("/");
      return;
    }

    try {
      const authToken = token || localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };

      const res = await axios.put(`${API_URL}/posts/${postId}/dislike`, {}, config);
      setPost((prev) => ({ ...prev, dislikes: res.data.dislikes, dislikesCount: res.data.dislikesCount, likes: res.data.likes }));
    } catch (err) {
      console.error("Error disliking post:", err);
      setError("Failed to dislike post");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      navigate("/");
      return;
    }

    try {
      const authToken = token || localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };

      const res = await axios.post(`${API_URL}/posts/${postId}/save`, {}, config);
      setPost((prev) => ({ ...prev, ...res.data }));
      setSuccess("Post saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error saving post:", err);
      setError("Failed to save post");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!currentUser || !commentText.trim()) return;

    setIsSubmitting(true);
    try {
      const authToken = token || localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };

      const res = await axios.post(
        `${API_URL}/posts/${postId}/comment`,
        { text: commentText },
        config
      );
      setPost(res.data);
      setCommentText("");
      setSuccess("Comment added successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("Failed to add comment");
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Comment",
      message: "Are you sure you want to delete this comment?",
      type: "confirm",
      onConfirm: async () => {
        try {
          const authToken = token || localStorage.getItem("token");
          const config = {
            headers: { Authorization: `Bearer ${authToken}` },
          };

          const res = await axios.delete(
            `${API_URL}/posts/${postId}/comment/${commentId}`,
            config
          );
          setPost((prev) => ({ ...prev, comments: (prev.comments || []).filter((c) => c._id !== commentId) }));
          setModalConfig({
            isOpen: false,
            title: "",
            message: "",
            type: "info",
            onConfirm: null,
          });
        } catch (err) {
          console.error("Error deleting comment:", err);
          setError("Failed to delete comment");
          setTimeout(() => setError(""), 3000);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#070708]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-2 border-white/5 border-t-white rounded-full animate-spin"></div>
          <span className="text-[10px] md:text-xs font-black text-zinc-500 uppercase tracking-[0.3em]">
            Loading
          </span>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#070708]">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Post not found</p>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-white text-black hover:bg-zinc-200 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all active:scale-95 min-h-[44px]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isLiked = post.likes?.some((like) => like._id === currentUser?._id);
  const isDisliked = post.dislikes?.some((dislike) => dislike._id === currentUser?._id);
  const isSaved = currentUser?.savedPosts?.some((savedPost) => savedPost._id === post._id);

  return (
    <div className="flex-1 min-h-screen bg-black pb-16 md:pb-0 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-3 md:px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95 min-h-[44px]"
          >
            <ArrowLeft iconSize={20} className="text-white" />
          </button>
          <h1 className="text-2xl font-black text-white">Post Details</h1>
        </div>

        {/* Alerts */}
        <div className="mb-6 space-y-2">
          {error && (
            <div className="py-3 px-4 bg-red-500/5 border border-red-500/20 rounded-lg text-red-500 text-[10px] md:text-xs font-black uppercase tracking-widest text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="py-3 px-4 bg-white/5 border border-white/10 rounded-lg text-white text-[10px] md:text-xs font-black uppercase tracking-widest text-center">
              {success}
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 mb-6">
          <Suspense fallback={<div className="h-48 bg-zinc-800/30 rounded-lg animate-pulse" />}>
            <PostCard
              post={post}
              currentUser={currentUser}
              apiBaseUrl={API_URL}
              onPostUpdate={fetchPost}
              showFullContent={true}
            />
          </Suspense>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-95 min-h-[44px] ${
              isLiked
                ? "bg-red-500/20 text-red-400 border border-red-500/20"
                : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
            }`}
          >
            <Heart iconSize={16} className={isLiked ? "fill-current" : ""} />
            <span className="text-sm font-bold">{post.likes?.length || 0}</span>
          </button>

          <button
            onClick={handleDislike}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-95 min-h-[44px] ${
              isDisliked
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/20"
                : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
            }`}
          >
            <Heart iconSize={16} className="rotate-180" />
            <span className="text-sm font-bold">{post.dislikes?.length || 0}</span>
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-95 min-h-[44px] ${
              isSaved
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
            }`}
          >
            <Bookmark iconSize={16} className={isSaved ? "fill-current" : ""} />
            <span className="text-sm font-bold">Save</span>
          </button>
        </div>

        {/* Comments Section */}
        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6">
          <h2 className="text-xl font-black text-white mb-6">
            Comments ({post.comments?.length || 0})
          </h2>

          {/* Add Comment */}
          {currentUser && (
            <form onSubmit={handleComment} className="mb-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-all"
                  maxLength="280"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmitting}
                  className="px-6 py-3 bg-white text-black rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest transition-all hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 min-h-[44px]"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-black/5 border-t-black rounded-full animate-spin"></div>
                  ) : (
                    <Send iconSize={16} />
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {post.comments?.length === 0 ? (
              <div className="text-center py-8">
                <Message iconSize={32} className="mx-auto text-zinc-600 mb-4" />
                <p className="text-zinc-400">No comments yet</p>
              </div>
            ) : (
              post.comments.map((comment) => (
                <div key={comment._id}>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {comment.user?.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">
                              {comment.user?.name || "Unknown User"}
                            </p>
                            <p className="text-zinc-500 text-xs">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-zinc-300 text-sm leading-relaxed">
                          {comment.text}
                        </p>
                      </div>
                      {currentUser && comment.user?._id === currentUser._id && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="p-3 text-zinc-500 hover:text-red-400 transition-all active:scale-95 min-h-[44px]"
                        >
                          <Trash iconSize={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Replies */}
                  {comment.replies?.length > 0 && (
                    <div className="ml-8 mt-2 space-y-2">
                      {comment.replies.map((reply) => (
                        <div key={reply._id} className="p-3 bg-white/[0.03] border border-white/5 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-white text-[10px] md:text-xs font-bold">
                                  {reply.user?.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <div>
                                  <p className="text-white text-xs font-semibold">
                                    {reply.user?.name || "Unknown User"}
                                  </p>
                                  <p className="text-zinc-500 text-[10px] md:text-sm">
                                    {new Date(reply.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <p className="text-zinc-400 text-xs leading-relaxed">
                                {reply.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() =>
          setModalConfig({
            isOpen: false,
            title: "",
            message: "",
            type: "info",
            onConfirm: null,
          })
        }
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
};

export default PostDetail;
