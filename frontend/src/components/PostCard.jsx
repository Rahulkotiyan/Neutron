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
} from "lucide-react";
import axios from "axios";
import { getAuth } from "firebase/auth";

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
  // Local state for optimistic updates
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [reposts, setReposts] = useState(post.reposts || []);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false); // Placeholder for sub logic

  const auth = getAuth();

  // Helper: Check if current user liked/reposted
  // Note: We need the mongoDB _id of the current user, usually stored in context or derived
  // For this example, we assume we check against the array of IDs directly
  // In a real app, ensure you match the correct ID types (String vs ObjectId)
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

  return (
    <div className="bg-black rounded-2xl border border-white/10 p-5 shadow-lg mb-6 hover:border-white/20 transition-all group">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold overflow-hidden border border-white/10">
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
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-zinc-200 font-bold hover:underline cursor-pointer">
                {post.author?.name || "Unknown User"}
              </p>
              <span className="text-xs text-zinc-500">
                @{post.author?.handle || "user"}
              </span>

              {/* College Tag */}
              {post.college && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 border border-blue-500/20">
                  {post.college}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isSubscribed && currentUser?._id !== post.author?._id && (
            <button
              onClick={() => setIsSubscribed(true)}
              className="flex items-center gap-1 text-xs text-blue-500 font-bold hover:bg-blue-500/10 px-2 py-1 rounded-full transition-colors"
            >
              <UserPlus size={14} /> Subscribe
            </button>
          )}
          <button className="text-zinc-500 hover:text-white transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        {post.title && (
          <h3 className="text-lg font-bold text-zinc-100 mb-2">{post.title}</h3>
        )}
        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {post.desc}
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-1 bg-zinc-900/50 rounded-full px-2 py-1 border border-white/5">
          <button
            onClick={handleLike}
            className={`p-1.5 rounded-full transition-colors ${
              hasLiked
                ? "text-orange-500 bg-orange-500/10"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-orange-400"
            }`}
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
          <button className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-blue-400 transition-colors">
            <ArrowBigDown size={20} />
          </button>
        </div>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800 px-3 py-1.5 rounded-full transition-colors text-sm font-medium"
        >
          <MessageCircle size={18} />
          <span>{comments.length} Comments</span>
        </button>

        <button
          onClick={handleRepost}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors text-sm font-medium ${
            hasReposted
              ? "text-green-500 bg-green-500/10"
              : "text-zinc-400 hover:text-green-400 hover:bg-zinc-800"
          }`}
        >
          <Repeat size={18} />
          <span>{reposts.length} Repost</span>
        </button>

        <button className="flex items-center gap-2 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 px-3 py-1.5 rounded-full transition-colors text-sm font-medium">
          <Share2 size={18} />
          <span>Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2">
          {/* Comment Input */}
          <form onSubmit={handleComment} className="flex gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-bold border border-white/10">
              {currentUser ? (currentUser.name || "U").charAt(0) : "?"}
            </div>
            <div className="flex-1 relative">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
              <button
                type="submit"
                disabled={!newComment}
                className="absolute right-2 top-2 text-blue-500 hover:text-blue-400 disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4 pl-2">
            {comments.map((comment, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center text-[10px] text-zinc-400 border border-white/5">
                  {comment.user?.name ? comment.user.name.charAt(0) : "?"}
                </div>
                <div>
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
                  <p className="text-sm text-zinc-400 mt-0.5">{comment.text}</p>
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
