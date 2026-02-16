import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  MessageCircle,
  Repeat,
  Share2,
  MoreHorizontal,
  ArrowBigUp,
  ArrowBigDown,
  UserPlus,
  UserMinus,
  Send,
  Award,
  Bookmark,
  Share,
  Flag,
  Eye,
  TrendingUp,
  X,
  Ban,
  EyeOff,
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

const PostCard = ({ post, currentUser, apiBaseUrl, onUserUpdate }) => {
  const navigate = useNavigate();
  // Local state for optimistic updates
  const [likes, setLikes] = useState(post.likes || []);
  const [dislikes, setDislikes] = useState(post.dislikes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [views, setViews] = useState(post.views || 0);
  const [hasViewed, setHasViewed] = useState(false);
  const postRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const auth = getAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  // Update following state when currentUser changes
  useEffect(() => {
    if (!post.author?._id || !currentUser) {
      setIsFollowing(false);
      return;
    }
    
    // Debug logging
    console.log("Checking follow state:", {
      authorId: post.author._id,
      currentUserFollowing: currentUser?.following,
      localStorageFollowing: JSON.parse(localStorage.getItem("following") || "[]")
    });
    
    // Primary check: localStorage (most reliable)
    const followingList = JSON.parse(localStorage.getItem("following") || "[]");
    if (followingList.includes(post.author._id)) {
      setIsFollowing(true);
      return;
    }
    
    // Secondary check: user data (might be stale)
    if (currentUser?.following?.includes(post.author._id)) {
      setIsFollowing(true);
      return;
    }
    
    setIsFollowing(false);
  }, [currentUser, post.author?._id]);

  // Track post views when it comes into viewport
  useEffect(() => {
    if (!postRef.current || hasViewed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasViewed) {
            // Post is now visible, increment view count
            incrementViews();
            setHasViewed(true);
            observer.disconnect(); // Stop observing once viewed
          }
        });
      },
      {
        threshold: 0.5, // 50% of the post must be visible
        rootMargin: '0px 0px -50px 0px' // Trigger when post is 50px from bottom of viewport
      }
    );

    observer.observe(postRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasViewed]);

  // Function to increment views
  const incrementViews = async () => {
    try {
      const token = getAuthToken();
      await axios.put(
        `${apiBaseUrl}/posts/${post._id}/view`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Update local state
      setViews(prevViews => prevViews + 1);
    } catch (error) {
      console.error("Error incrementing views:", error);
      // Still increment locally even if API fails
      setViews(prevViews => prevViews + 1);
    }
  };

  // Calculate engagement score
  const engagementScore =
    (likes?.length || 0) * 2 +
    (comments?.length || 0);

  // Helper: Check if current user liked/reposted
  const hasLiked = currentUser && likes.includes(currentUser._id);
  const hasDisliked = currentUser && dislikes.includes(currentUser._id);

  const getAuthToken = () => {
    return localStorage.getItem("token");
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
      const token = getAuthToken();
      const res = await axios.put(
        `${apiBaseUrl}/posts/${post._id}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Sync with server response
      if (res.data.likes) setLikes(res.data.likes);
      if (res.data.dislikes) setDislikes(res.data.dislikes);
    } catch (err) {
      setLikes(originalLikes); // Revert on error
      console.error("Like failed", err);
    }
  };

  const handleDislike = async () => {
    if (!currentUser) return alert("Please login to downvote");

    // Optimistic Update
    const originalDislikes = [...dislikes];
    const originalLikes = [...likes];
    
    let newDislikes = hasDisliked
      ? dislikes.filter((id) => id !== currentUser._id)
      : [...dislikes, currentUser._id];
    
    let newLikes = likes;
    if (!hasDisliked && hasLiked) {
      newLikes = likes.filter((id) => id !== currentUser._id);
    }

    setDislikes(newDislikes);
    setLikes(newLikes);

    try {
      const token = getAuthToken();
      const res = await axios.put(
        `${apiBaseUrl}/posts/${post._id}/dislike`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Sync with server response
      if (res.data.dislikes) setDislikes(res.data.dislikes);
      if (res.data.likes) setLikes(res.data.likes);
    } catch (err) {
      setDislikes(originalDislikes);
      setLikes(originalLikes);
      console.error("Dislike failed", err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!currentUser) return alert("Please login to comment");

    try {
      const token = getAuthToken();
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
      const token = getAuthToken();
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

  const handleFollow = async () => {
    if (!currentUser) return alert("Please login to follow users");
    if (currentUser._id === post.author?._id) return alert("You cannot follow yourself");

    const originalFollowing = isFollowing;
    console.log("handleFollow called:", { isFollowing, authorId: post.author._id });
    
    // Always update localStorage first (most reliable)
    let followingList = JSON.parse(localStorage.getItem("following") || "[]");
    console.log("Current localStorage following:", followingList);
    
    // Remove duplicates first
    followingList = [...new Set(followingList)];
    
    let newFollowingList;
    if (isFollowing) {
      // Unfollow: remove author from list
      newFollowingList = followingList.filter(id => id !== post.author._id);
      console.log("Unfollowing - removing author, new list:", newFollowingList);
    } else {
      // Follow: add author to list
      newFollowingList = [...new Set([...followingList, post.author._id])];
      console.log("Following - adding author, new list:", newFollowingList);
    }
    localStorage.setItem("following", JSON.stringify(newFollowingList));
    
    // Optimistic update
    setIsFollowing(!isFollowing);
    console.log("Set isFollowing to:", !isFollowing);

    try {
      const token = getAuthToken();
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      console.log("Making API call to:", endpoint);
      
      await axios.post(
        `${apiBaseUrl}/users/${post.author._id}/${endpoint}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Update local user data if API succeeds
      if (currentUser) {
        if (isFollowing) {
          currentUser.following = currentUser.following?.filter(id => id !== post.author._id) || [];
        } else {
          currentUser.following = [...new Set([...(currentUser.following || []), post.author._id])];
        }
        // Notify parent component of user data change
        if (onUserUpdate) {
          onUserUpdate(currentUser);
        }
      }
      
      // Show feedback
      alert(isFollowing ? `Unfollowed ${post.author?.name}` : `Following ${post.author?.name}`);
      
      // Refresh page to apply changes across all posts
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error("Follow/Unfollow failed:", err);
      // DON'T revert state on API failure - localStorage is our source of truth
      // The localStorage change already happened, so keep the optimistic update
      
      // Show feedback anyway since localStorage was updated
      alert(isFollowing ? `Unfollowed ${post.author?.name}` : `Following ${post.author?.name}`);
      
      // Refresh page to apply changes across all posts
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleHidePost = () => {
    // Store hidden posts in localStorage
    const hiddenPosts = JSON.parse(localStorage.getItem("hiddenPosts") || "[]");
    if (!hiddenPosts.includes(post._id)) {
      hiddenPosts.push(post._id);
      localStorage.setItem("hiddenPosts", JSON.stringify(hiddenPosts));
    }
    
    // Hide the post immediately
    const postElement = document.getElementById(`post-${post._id}`);
    if (postElement) {
      postElement.style.display = 'none';
    }
    
    alert("Post hidden. You won't see this post again.");
  };

  const handleNotInterested = () => {
    // Store not interested posts in localStorage
    const notInterestedPosts = JSON.parse(localStorage.getItem("notInterestedPosts") || "[]");
    if (!notInterestedPosts.includes(post._id)) {
      notInterestedPosts.push(post._id);
      localStorage.setItem("notInterestedPosts", JSON.stringify(notInterestedPosts));
    }
    
    // Also hide the post
    const postElement = document.getElementById(`post-${post._id}`);
    if (postElement) {
      postElement.style.display = 'none';
    }
    
    // Show feedback
    alert("We'll show you fewer posts like this.");
  };

  return (
    <div id={`post-${post._id}`} ref={postRef} className="bg-gradient-to-br from-zinc-900/50 to-black/50 rounded-xl border border-white/10 p-3 sm:p-5 shadow-lg mb-4 sm:mb-6 hover:border-white/30 hover:shadow-xl transition-all group backdrop-blur-sm">
      {/* Premium Header with Author Info & Badge */}
      <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
        <div className="flex items-center gap-3 flex-1">
          {/* Avatar with online indicator */}
          <div
            className="relative cursor-pointer flex-shrink-0"
            onClick={() => navigate(`/profile/${post.author?._id}`)}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-500 flex items-center justify-center text-zinc-900 font-bold overflow-hidden border-2 border-white/20 hover:border-white/40 transition-all">
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
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className="text-sm text-zinc-200 font-bold hover:underline cursor-pointer group-hover:text-white transition-colors line-clamp-1"
                onClick={() => navigate(`/profile/${post.author?._id}`)}
              >
                {post.author?.name || "Unknown User"}
              </p>
              <span className="text-xs text-zinc-500 hidden sm:inline">
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
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 text-zinc-300 border border-zinc-700/50 font-medium shadow-sm">
                  {post.college}
                </span>
              )}

              {/* Tag Badge */}
              {post.tag && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 text-zinc-300 border border-zinc-700/50 font-medium shadow-sm">
                  {post.tag}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              <span className="text-zinc-600 flex items-center gap-1 inline-flex">
                <Eye size={12} /> {views.toLocaleString()}
              </span>
            </p>
          </div>
        </div>

        {/* Action Menu */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 top-12 w-48 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                {/* Follow/Unfollow Option */}
                {currentUser && currentUser._id !== post.author?._id && (
                  <button
                    onClick={() => {
                      handleFollow();
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-white/10 transition-colors"
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus size={16} className="text-red-400" />
                        <span>Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} className="text-blue-400" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
                
                {/* Hide Post Option */}
                <button
                  onClick={() => {
                    handleHidePost();
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-white/10 transition-colors"
                >
                  <EyeOff size={16} className="text-zinc-400" />
                  <span>Hide post</span>
                </button>
                
                {/* Not Interested Option */}
                <button
                  onClick={() => {
                    handleNotInterested();
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-white/10 transition-colors"
                >
                  <Ban size={16} className="text-orange-400" />
                  <span>Not interested</span>
                </button>
              </div>
            )}
          </div>
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
            !showMore && post.desc?.length > 200 ? "line-clamp-3" : ""
          }`}
        >
          {post.desc}
        </p>
        {post.desc?.length > 200 && (
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
            className="w-full h-auto max-h-64 sm:max-h-96 object-cover hover:scale-105 transition-transform duration-300"
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
        
      </div>

      {/* Action Bar - Premium Style */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10 gap-2 flex-wrap">
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
            onClick={handleDislike}
            className={`p-1.5 rounded-full transition-all ${
              hasDisliked
                ? "text-blue-500 bg-blue-500/20"
                : "text-zinc-400 hover:bg-blue-500/10 hover:text-blue-400"
            }`}
            title="Downvote"
          >
            <ArrowBigDown size={20} fill={hasDisliked ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Comments */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-white/10 px-4 py-1.5 rounded-full transition-all text-sm font-medium border border-transparent hover:border-white/10"
        >
          <MessageCircle size={18} />
          <span className="hidden sm:inline">{comments.length}</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 px-4 py-1.5 rounded-full transition-all text-sm font-medium border border-transparent hover:border-blue-500/30"
        >
          <Share size={18} />
          <span className="hidden sm:inline">Share</span>
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
          <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
        </button>

        {/* Report/Flag */}
        <button
          onClick={handleFlag}
          className="flex items-center gap-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 px-4 py-1.5 rounded-full transition-all text-sm font-medium border border-transparent hover:border-red-500/30"
          title="Report"
        >
          <Flag size={18} />
          <span className="hidden sm:inline">Report</span>
        </button>
      </div>

      {/* Comments Section - Premium Style */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
          {/* Comment Input */}
          <form onSubmit={handleComment} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold border border-white/20 flex-shrink-0">
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
