import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  Repeat,
  Share2,
  MoreHorizontal,
  ArrowBigUp,
  ArrowBigDown,
  UserPlus,
  Send,
  Award,
  Bookmark,
  Share,
  Flag,
  Eye,
  TrendingUp,
} from "lucide-react";
import axios from "axios";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const MOCK_USER = {
  displayName: "Alex Chen",
  email: "alex@university.edu",
  handle: "@alexc",
  photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
};

const STATIC_POSTS = [
  {
    _id: "1",
    title: "Hackathon Registration is finally OPEN! 🚀",
    desc: "Hey everyone! The annual Inter-College Hackathon 2024 registrations are now live. We have tracks for AI, Blockchain, and IoT. \n\nTeams of 2-4 can participate. Great prizes up for grabs including internships at top tech firms! Link in bio/comments.",
    tag: "OFFICIAL",
    college: "Engineering Dept",
    author: {
      name: "Student Council",
      handle: "@council",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SC",
    },
    likes: ["u1", "u2", "u3", "u4", "u5"],
    reposts: ["u2"],
    comments: [
      { user: { name: "Sarah" }, text: "Is it open for first years?" },
      { user: { name: "Mike" }, text: "Looking for a teammate! DM me." },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "2",
    desc: "Just found a blue hoodie in the library 3rd floor reading room. Left it at the front desk.",
    tag: "LOST_FOUND",
    college: "Central Library",
    author: {
      name: "Jamie L.",
      handle: "@jamie_l",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie",
    },
    likes: ["u1"],
    reposts: [],
    comments: [],
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    _id: "3",
    title: "Notes for Physics 101 - Thermodynamics",
    desc: "I've compiled all my handwritten notes for the Thermo module. Covers laws, entropy, and heat engines. Hope it helps for the midterms! 📚",
    tag: "RESOURCES",
    college: "Physics Dept",
    author: {
      name: "Nerd Squad",
      handle: "@study_hard",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nerd",
    },
    likes: ["u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8"],
    reposts: ["u3", "u4"],
    comments: [{ user: { name: "Tom" }, text: "You are a lifesaver!!" }],
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    _id: "4",
    title: "Anyone selling a scientific calculator?",
    desc: "Mine broke right before exams. Looking for Casio fx-991EX. Willing to pay cash immediately.",
    tag: "MARKETPLACE",
    college: "Campus",
    author: {
      name: "Chris P.",
      handle: "@chris_p",
      avatar: null,
    },
    likes: [],
    reposts: [],
    comments: [],
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
];

const PostCard = ({ post, currentUser, apiBaseUrl }) => {
  const navigate = useNavigate();
  // Local state for optimistic updates
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [reposts, setReposts] = useState(post.reposts || []);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [views, setViews] = useState(post.views || 0);

  const auth = getAuth();

  // Calculate engagement score
  const engagementScore =
    (likes?.length || 0) * 2 +
    (comments?.length || 0) +
    (reposts?.length || 0) * 1.5;

  // Helper: Check if current user liked/reposted
  const hasLiked = currentUser && likes.includes(currentUser._id);
  const hasReposted = currentUser && reposts.includes(currentUser._id);

  const getAuthToken = async () => {
    if (auth.currentUser) return await auth.currentUser.getIdToken();
    return null;
  };

  const handleLike = async () => {
    if (!currentUser) return alert("Please login to like");

    // Optimistic Update
    const originalLikes = [...likes];
    const newLikes = hasLiked
      ? likes.filter((id) => id !== currentUser._id)
      : [...likes, currentUser._id];

    setLikes(newLikes);

    try {
      const token = await getAuthToken();
      await axios.put(
        `${apiBaseUrl}/posts/${post._id}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      setLikes(originalLikes); // Revert on error
      console.error("Like failed", err);
    }
  };

  const handleRepost = async () => {
    if (!currentUser) return alert("Please login to repost");
    if (hasReposted) return; // Prevent double repost for now

    const originalReposts = [...reposts];
    setReposts([...reposts, currentUser._id]);

    try {
      const token = await getAuthToken();
      await axios.post(
        `${apiBaseUrl}/posts/${post._id}/repost`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      setReposts(originalReposts);
      console.error("Repost failed", err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!currentUser) return alert("Please login to comment");

    try {
      const token = await getAuthToken();
      const res = await axios.post(
        `${apiBaseUrl}/posts/${post._id}/comment`,
        {
          text: newComment,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setComments(res.data); // Update with server response (which includes populated user)
      setNewComment("");
    } catch (err) {
      console.error("Comment failed", err);
    }
  };

  const handleBookmark = () => {
    if (!currentUser) return alert("Please login to bookmark");

    // Toggle bookmark
    setIsSaved(!isSaved);

    // Optional: Save to localStorage for persistence
    let bookmarks = JSON.parse(
      localStorage.getItem("bookmarkedPosts") || "[]"
    );
    if (!isSaved) {
      bookmarks.push(post._id);
    } else {
      bookmarks = bookmarks.filter((id) => id !== post._id);
    }
    localStorage.setItem("bookmarkedPosts", JSON.stringify(bookmarks));
  };

  const handleShare = () => {
    if (navigator.share) {
      // Native share (mobile)
      navigator
        .share({
          title: post.title || "Check this post",
          text: post.desc?.substring(0, 100),
          url: window.location.href,
        })
        .catch((err) => console.log("Share cancelled"));
    } else {
      // Fallback: Copy to clipboard
      const url = `${window.location.origin}/post/${post._id}`;
      navigator.clipboard.writeText(url).then(() => {
        alert("Post link copied to clipboard!");
      });
    }
  };

  const handleFlag = async () => {
    if (!currentUser) return alert("Please login to report");

    const reason = prompt("Please describe why you're reporting this post:");
    if (!reason) return;

    try {
      const token = await getAuthToken();
      await axios.post(
        `${apiBaseUrl}/posts/${post._id}/flag`,
        { reason },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Post reported. Thank you for keeping our community safe.");
    } catch (err) {
      console.error("Flag failed", err);
      if (err.response?.status === 404) {
        // Endpoint doesn't exist yet - just store locally
        const flags = JSON.parse(localStorage.getItem("flaggedPosts") || "{}");
        flags[post._id] = reason;
        localStorage.setItem("flaggedPosts", JSON.stringify(flags));
        alert("Post reported. Thank you for keeping our community safe.");
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-zinc-900/50 to-black/50 rounded-xl border border-white/10 p-5 shadow-lg mb-6 hover:border-white/30 hover:shadow-xl transition-all group backdrop-blur-sm">
      {/* Premium Header with Author Info & Badge */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Avatar with online indicator */}
          <div
            className="relative cursor-pointer"
            onClick={() => navigate(`/profile/${post.author?._id}`)}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden border-2 border-white/20 hover:border-white/40 transition-all">
              {post.author?.avatar ? (
                <img
                  src={post.author.avatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                (post.author?.name || "U").charAt(0).toUpperCase()
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900"></div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className="text-sm text-zinc-200 font-bold hover:underline cursor-pointer group-hover:text-white transition-colors"
                onClick={() => navigate(`/profile/${post.author?._id}`)}
              >
                {post.author?.name || "Unknown User"}
              </p>
              <span className="text-xs text-zinc-500">
                @{post.author?.handle || "user"}
              </span>

              {/* Premium Badges */}
              <div className="flex gap-1">
                {post.isVerified && (
                  <span title="Verified User" className="text-blue-400 text-sm">
                    ✓
                  </span>
                )}
                {post.author?.isModerator && (
                  <span
                    title="Moderator"
                    className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full border border-green-500/50"
                  >
                    MOD
                  </span>
                )}
              </div>

              {/* College Tag */}
              {post.college && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 font-medium">
                  {post.college}
                </span>
              )}

              {/* Tag Badge */}
              {post.tag && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 font-medium">
                  {post.tag}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {new Date(post.createdAt).toLocaleDateString()} •{" "}
              <span className="text-zinc-600 flex items-center gap-1 inline-flex">
                <Eye size={12} /> {views.toLocaleString()}
              </span>
            </p>
          </div>
        </div>

        {/* Action Menu */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isSubscribed && currentUser?._id !== post.author?._id && (
            <button
              onClick={() => setIsSubscribed(true)}
              className="flex items-center gap-1 text-xs text-blue-500 font-bold hover:bg-blue-500/10 px-3 py-1 rounded-full transition-colors border border-blue-500/30"
            >
              <UserPlus size={14} /> Follow
            </button>
          )}
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`p-2 rounded-full transition-colors ${
              isSaved
                ? "text-yellow-500 bg-yellow-500/10"
                : "text-zinc-500 hover:text-yellow-500 hover:bg-yellow-500/10"
            }`}
          >
            <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
          </button>
          <button className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Premium Content */}
      <div className="mb-4">
        {post.title && (
          <h3 className="text-base font-bold text-zinc-100 mb-2 group-hover:text-white transition-colors">
            {post.title}
          </h3>
        )}
        <p
          className={`text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap ${
            !showMore && post.desc?.length > 250 ? "line-clamp-3" : ""
          }`}
        >
          {post.desc}
        </p>
        {post.desc?.length > 250 && (
          <button
            onClick={() => setShowMore(!showMore)}
            className="text-xs text-blue-500 hover:text-blue-400 font-medium mt-2"
          >
            {showMore ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {/* Image Display */}
      {post.image && (
        <div className="mb-4 overflow-hidden rounded-lg border border-white/10">
          <img
            src={post.image}
            alt="Post content"
            className="w-full h-auto max-h-96 object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      )}

      {/* Premium Engagement Stats */}
      <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <TrendingUp size={14} className="text-orange-500" />
            <span className="text-zinc-400">
              {engagementScore > 1000
                ? (engagementScore / 1000).toFixed(1) + "K"
                : engagementScore}{" "}
              engagement
            </span>
          </div>
          <div className="w-px h-4 bg-white/10"></div>
          <div className="flex items-center gap-1">
            <span className="text-green-500 font-bold">
              ↑{" "}
              {(
                ((likes?.length || 0) / (likes?.length || 0 + 1)) *
                100
              ).toFixed(0)}
              %
            </span>
            <span className="text-zinc-500">upvote rate</span>
          </div>
        </div>
        <Award size={14} className="text-purple-500" />
      </div>

      {/* Action Bar - Premium Style */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        {/* Upvote/Downvote */}
        <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-1.5 border border-white/10 hover:border-white/20 transition-all">
          <button
            onClick={handleLike}
            className={`p-1.5 rounded-full transition-all ${
              hasLiked
                ? "text-orange-500 bg-orange-500/20"
                : "text-zinc-400 hover:bg-orange-500/10 hover:text-orange-400"
            }`}
            title="Upvote"
          >
            <ArrowBigUp size={20} fill={hasLiked ? "currentColor" : "none"} />
          </button>
          <span
            className={`text-sm font-bold ${
              hasLiked ? "text-orange-500" : "text-zinc-400"
            }`}
          >
            {likes.length}
          </span>
          <button
            className="p-1.5 rounded-full text-zinc-400 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
            title="Downvote"
          >
            <ArrowBigDown size={20} />
          </button>
        </div>

        {/* Comments */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-white/10 px-4 py-1.5 rounded-full transition-all text-sm font-medium border border-transparent hover:border-white/10"
        >
          <MessageCircle size={18} />
          <span>{comments.length}</span>
        </button>

        {/* Repost */}
        <button
          onClick={handleRepost}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all text-sm font-medium border ${
            hasReposted
              ? "text-green-500 bg-green-500/20 border-green-500/30"
              : "text-zinc-400 hover:text-green-400 hover:bg-green-500/10 border-transparent hover:border-green-500/30"
          }`}
        >
          <Repeat size={18} />
          <span>{reposts.length}</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 px-4 py-1.5 rounded-full transition-all text-sm font-medium border border-transparent hover:border-blue-500/30"
        >
          <Share size={18} />
          <span>Share</span>
        </button>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all text-sm font-medium border ${
            isSaved
              ? "text-amber-500 bg-amber-500/20 border-amber-500/30"
              : "text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 border-transparent hover:border-amber-500/30"
          }`}
          title="Bookmark"
        >
          <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
          <span>{isSaved ? "Saved" : "Save"}</span>
        </button>

        {/* Report/Flag */}
        <button
          onClick={handleFlag}
          className="flex items-center gap-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 px-4 py-1.5 rounded-full transition-all text-sm font-medium border border-transparent hover:border-red-500/30"
          title="Report"
        >
          <Flag size={18} />
          <span>Report</span>
        </button>
      </div>

      {/* Comments Section - Premium Style */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
          {/* Comment Input */}
          <form onSubmit={handleComment} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold border border-white/20">
              {currentUser ? (currentUser.name || "U").charAt(0) : "?"}
            </div>
            <div className="flex-1 relative">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
              />
              <button
                type="submit"
                disabled={!newComment}
                className="absolute right-2 top-2 text-blue-500 hover:text-blue-400 disabled:opacity-30 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4 pl-2 max-h-96 overflow-y-auto">
            {comments.map((comment, idx) => (
              <div
                key={idx}
                className="flex gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold border border-white/10">
                  {comment.user?.name ? comment.user.name.charAt(0) : "?"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-300">
                      {comment.user?.name || "Unknown"}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {new Date(comment.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 mt-1">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
