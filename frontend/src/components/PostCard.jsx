import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  Message,
  Send,
  MoreHoriz,
  ArrowUp,
  ArrowDown,
  UserPlus,
  UserXmark,
  Bookmark,
  TriangleFlag,
  Eye,
  Prohibition,
  EyeClosed,
  Calendar,
  MapPin,
  User as UserIcon,
  Phone,
  Mail,
  Hashtag,
} from "iconoir-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReportModal from "./ReportModal";
import CommentSection from "./CommentSection";
import PostDetailModal from "./PostDetailModal";
import ReplyModal from "./ReplyModal";
import CustomModal from "./CustomModal";

const PostCard = ({ post, currentUser, apiBaseUrl, onUserUpdate }) => {
  const navigate = useNavigate();
  // Local state for optimistic updates
  const [likes, setLikes] = useState(post.likes || []);
  const [dislikes, setDislikes] = useState(post.dislikes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [views, setViews] = useState(post.views || 0);
  const [hasViewed, setHasViewed] = useState(false);
  const postRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState('right');
  const dropdownRef = useRef(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showDropdown]);

  // Calculate dropdown position based on viewport
  const calculateDropdownPosition = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const dropdownWidth = 176; // w-44 = 11rem = 176px
      const spaceOnRight = window.innerWidth - rect.right;
      
      if (spaceOnRight < dropdownWidth) {
        setDropdownPosition('left');
      } else {
        setDropdownPosition('right');
      }
    }
  };

  // Update position when dropdown opens
  useEffect(() => {
    if (showDropdown) {
      calculateDropdownPosition();
    }
  }, [showDropdown]);

  // Update following state when currentUser changes
  useEffect(() => {
    if (!post.author?._id || !currentUser || post.isAnonymous) {
      setIsFollowing(false);
      return;
    }

    const updateFollowingState = () => {
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
    };

    // Initial update
    updateFollowingState();

    // Listen for following updates from other components
    const handleFollowingUpdate = () => {
      updateFollowingState();
    };

    window.addEventListener('following_updated', handleFollowingUpdate);

    return () => {
      window.removeEventListener('following_updated', handleFollowingUpdate);
    };
  }, [currentUser, post.author?._id, post.isAnonymous]);

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
        rootMargin: "0px 0px -50px 0px", // Trigger when post is 50px from bottom of viewport
      },
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
        },
      );

      // Update local state
      setViews((prevViews) => prevViews + 1);
    } catch (error) {
      console.error("Error incrementing views:", error);
      // Still increment locally even if API fails
      setViews((prevViews) => prevViews + 1);
    }
  };

  // Helper: Check if current user liked/reposted
  const hasLiked = currentUser && likes.includes(currentUser._id);
  const hasDisliked = currentUser && dislikes.includes(currentUser._id);

  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  const handleLike = useCallback(async () => {
    if (!currentUser) {
      setModalConfig({
        isOpen: true,
        title: "Login Required",
        message: "Please login to like posts",
        type: "warning",
      });
      return;
    }

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
        },
      );
      if (res.data.likes) setLikes(res.data.likes);
      if (res.data.dislikes) setDislikes(res.data.dislikes);
    } catch (err) {
      setLikes(originalLikes);
      console.error("Like failed", err);
    }
  }, [currentUser, post._id, hasLiked, likes, apiBaseUrl]);

  const handleDislike = useCallback(async () => {
    if (!currentUser) {
      setModalConfig({
        isOpen: true,
        title: "Login Required",
        message: "Please login to dislike posts",
        type: "warning",
      });
      return;
    }

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
        },
      );
      if (res.data.dislikes) setDislikes(res.data.dislikes);
      if (res.data.likes) setLikes(res.data.likes);
    } catch (err) {
      setDislikes(originalDislikes);
      setLikes(originalLikes);
      console.error("Dislike failed", err);
    }
  }, [currentUser, post._id, hasDisliked, hasLiked, dislikes, likes, apiBaseUrl]);

  const handleCommentUpdate = (newComments) => {
    setComments(newComments);
  };

  const handleBookmark = useCallback(async () => {
    if (!currentUser) {
      setModalConfig({
        isOpen: true,
        title: "Login Required",
        message: "Please login to bookmark posts",
        type: "warning",
      });
      return;
    }

    const wasSaved = isSaved;
    setIsSaved(!wasSaved);

    let bookmarks = JSON.parse(localStorage.getItem("bookmarkedPosts") || "[]");
    if (wasSaved) {
      bookmarks = bookmarks.filter((id) => id !== post._id);
    } else {
      bookmarks.push(post._id);
    }
    localStorage.setItem("bookmarkedPosts", JSON.stringify(bookmarks));

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${apiBaseUrl}/posts/${post._id}/save`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Save failed:", err);
      setIsSaved(wasSaved);
      bookmarks = JSON.parse(localStorage.getItem("bookmarkedPosts") || "[]");
      if (!wasSaved) {
        bookmarks = bookmarks.filter((id) => id !== post._id);
      } else {
        bookmarks.push(post._id);
      }
      localStorage.setItem("bookmarkedPosts", JSON.stringify(bookmarks));
    }
  }, [currentUser, post._id, isSaved, apiBaseUrl]);

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: post.title || "Check this post",
          text: post.desc?.substring(0, 100),
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      const url = `${window.location.origin}/post/${post._id}`;
      navigator.clipboard.writeText(url).then(() => {
        setModalConfig({
          isOpen: true,
          title: "Link Copied",
          message: "Post link copied to clipboard!",
          type: "success",
        });
      });
    }
  };

  const handleFlag = useCallback(() => {
    if (!currentUser) {
      setModalConfig({
        isOpen: true,
        title: "Login Required",
        message: "Please login to report posts",
        type: "warning",
      });
      return;
    }
    setShowReportModal(true);
  }, [currentUser]);

  const handleFollow = useCallback(async () => {
    if (!currentUser) {
      setModalConfig({
        isOpen: true,
        title: "Login Required",
        message: "Please login to follow users",
        type: "warning",
      });
      return;
    }
    // Rest of the function remains the same...
    if (currentUser._id === post.author?._id) {
      setModalConfig({
        isOpen: true,
        title: "Action Restricted",
        message: "You cannot follow yourself",
        type: "warning",
      });
      return;
    }

    const originalFollowing = isFollowing;

    // Always update localStorage first (most reliable)
    let followingList = JSON.parse(localStorage.getItem("following") || "[]");

    // Remove duplicates first
    followingList = [...new Set(followingList)];

    let newFollowingList;
    if (isFollowing) {
      // Unfollow: remove author from list
      newFollowingList = followingList.filter((id) => id !== post.author._id);
    } else {
      // Follow: add author to list
      newFollowingList = [...new Set([...followingList, post.author._id])];
    }
    localStorage.setItem("following", JSON.stringify(newFollowingList));

    // Optimistic update
    setIsFollowing(!isFollowing);

    try {
      const token = getAuthToken();
      const endpoint = isFollowing ? "unfollow" : "follow";

      await axios.post(
        `${apiBaseUrl}/users/${post.author._id}/${endpoint}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Update local user data if API succeeds
      if (currentUser) {
        if (isFollowing) {
          currentUser.following =
            currentUser.following?.filter((id) => id !== post.author._id) || [];
        } else {
          currentUser.following = [
            ...new Set([...(currentUser.following || []), post.author._id]),
          ];
        }
        // Notify parent component of user data change
        if (onUserUpdate) {
          onUserUpdate(currentUser);
        }
      }

      // Show feedback
      setModalConfig({
        isOpen: true,
        title: isFollowing ? "Unfollowed" : "Following",
        message: isFollowing
          ? post.isAnonymous ? "Unfollowed user" : `Unfollowed ${post.author?.name}`
          : post.isAnonymous ? "Following user" : `Following ${post.author?.name}`,
        type: "success",
      });

      // Dispatch event to update other components
      window.dispatchEvent(new Event("following_updated"));
    } catch (err) {
      console.error("Follow/Unfollow failed:", err);
      // Revert optimistic update
      setIsFollowing(originalFollowing);

      // Show feedback anyway since localStorage was updated
      setModalConfig({
        isOpen: true,
        title: isFollowing ? "Unfollowed" : "Following",
        message: isFollowing
          ? post.isAnonymous ? "Unfollowed user" : `Unfollowed ${post.author?.name}`
          : post.isAnonymous ? "Following user" : `Following ${post.author?.name}`,
        type: "success",
      });

      // Dispatch event to update other components
      window.dispatchEvent(new Event("following_updated"));
    }
  }, [currentUser, post.author?._id, post.isAnonymous, isFollowing, apiBaseUrl, post.author?.name, onUserUpdate]);

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
      postElement.style.display = "none";
    }

    setModalConfig({
      isOpen: true,
      title: "Post Hidden",
      message: "Post hidden. You won't see this post again.",
      type: "info",
    });
  };

  const handleNotInterested = () => {
    // Store not interested posts in localStorage
    const notInterestedPosts = JSON.parse(
      localStorage.getItem("notInterestedPosts") || "[]",
    );
    if (!notInterestedPosts.includes(post._id)) {
      notInterestedPosts.push(post._id);
      localStorage.setItem(
        "notInterestedPosts",
        JSON.stringify(notInterestedPosts),
      );
    }

    // Also hide the post
    const postElement = document.getElementById(`post-${post._id}`);
    if (postElement) {
      postElement.style.display = "none";
    }

    // Show feedback
    setModalConfig({
      isOpen: true,
      title: "Preference Saved",
      message: "We'll show you fewer posts like this.",
      type: "info",
    });
  };

  return (
    <div
      id={`post-${post._id}`}
      ref={postRef}
      onClick={() => setShowDetailModal(true)}
      className="bg-black/40 rounded-xl border border-white/10 p-3 sm:p-5 shadow-lg mb-4 sm:mb-6 hover:border-white/30 transition-all group backdrop-blur-sm cursor-pointer overflow-visible"
    >
      {/* Premium Header with Author Info & Badge */}
      <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
        <div className="flex items-center gap-3 flex-1">
          {/* Avatar with online indicator - Hide for anonymous posts */}
          {!post.isAnonymous ? (
            <div
              className="relative cursor-pointer flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${post.author?._id}`);
              }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-white font-bold overflow-hidden border border-white/20 hover:border-white/40 transition-all shadow-inner">
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
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center border border-zinc-700/50">
              <UserXmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className="text-xs sm:text-sm md:text-sm text-zinc-200 font-bold hover:underline cursor-pointer group-hover:text-white transition-colors line-clamp-1"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!post.isAnonymous) {
                    navigate(`/profile/${post.author?._id}`);
                  }
                }}
              >
                {post.isAnonymous ? "Anonymous" : (post.author?.name || "Unknown User")}
              </p>
              <span className="text-[0.65rem] sm:text-xs md:text-xs text-zinc-500 hidden sm:inline">
                {post.isAnonymous ? "@anonymous" : (post.author?.handle || "@user")}
              </span>

              {/* Premium Badges */}
              <div className="flex gap-1">
                {post.isVerified && (
                  <span title="Verified User" className="text-blue-400 text-xs sm:text-sm md:text-sm">
                    ✓
                  </span>
                )}
                {post.author?.isModerator && (
                  <span
                    title="Moderator"
                    className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[0.625rem] font-bold rounded-full border border-green-500/50"
                  >
                    MOD
                  </span>
                )}
              </div>

              {/* College Tag */}
              {post.college && (
                <span className="text-[0.625rem] px-2 py-0.5 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 text-zinc-300 border border-zinc-700/50 font-medium shadow-sm">
                  {post.college}
                </span>
              )}

              {/* Tag Badge */}
              {post.tag && (
                <span className="text-[0.625rem] px-2 py-0.5 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 text-zinc-300 border border-zinc-700/50 font-medium shadow-sm">
                  {post.tag}
                </span>
              )}
            </div>
            <p className="text-[0.65rem] sm:text-xs md:text-xs text-zinc-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              <span className="text-zinc-600 flex items-center gap-1 inline-flex">
                <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {views.toLocaleString()}
              </span>
            </p>
          </div>
        </div>

        {/* Action Menu - Always visible for accessibility, higher on hover */}
        <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 relative">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                calculateDropdownPosition();
                setShowDropdown(!showDropdown);
              }}
              className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <MoreHoriz className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className={`absolute top-12 w-44 sm:w-48 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden ${
                dropdownPosition === 'left' ? 'right-0' : 'left-0'
              }`}>
                {/* Follow/Unfollow Option */}
                {currentUser && currentUser._id !== post.author?._id && !post.isAnonymous && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollow();
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 text-xs sm:text-sm md:text-sm text-zinc-300 hover:bg-white/10 transition-colors text-left"
                  >
                    {isFollowing ? (
                      <>
                       <UserXmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                        <span>Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}

                {/* Hide Post Option */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHidePost();
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 text-xs sm:text-sm md:text-sm text-zinc-300 hover:bg-white/10 transition-colors text-left"
                >
                  <EyeClosed className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
                  <span>Hide post</span>
                </button>

                {/* Not Interested Option */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNotInterested();
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 text-xs sm:text-sm md:text-sm text-zinc-300 hover:bg-white/10 transition-colors text-left"
                >
                  <Prohibition className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
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
          <h3 className="text-sm sm:text-base md:text-base font-bold text-zinc-100 mb-2 group-hover:text-white transition-colors">
            {post.title}
          </h3>
        )}
        <p
          className={`text-xs sm:text-sm md:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap ${
            !showMore && post.desc?.length > 200 ? "line-clamp-3" : ""
          }`}
        >
          {post.desc}
        </p>
        {post.desc?.length > 200 && (
          <button
            onClick={() => setShowMore(!showMore)}
            className="text-[0.65rem] sm:text-xs md:text-xs text-blue-500 hover:text-blue-400 font-medium mt-2"
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
            loading="lazy"
            className="w-full h-auto max-h-64 sm:max-h-96 object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      )}

      {/* Notice Details Section - Only show for NOTICE posts */}
      {post.tag === "NOTICE" && (
        <div className="mb-4 p-4 bg-zinc-900/50 border border-zinc-700/50 rounded-lg">
          <h4 className="text-xs sm:text-sm md:text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Notice Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm md:text-sm">
            {post.eventDate && (
              <div className="flex items-center gap-2 text-zinc-300">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span>
                  <strong className="text-zinc-200">Date:</strong> {new Date(post.eventDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {post.location && (
              <div className="flex items-center gap-2 text-zinc-300">
                <MapPin className="w-4 h-4 text-zinc-500" />
                <span>
                  <strong className="text-zinc-200">Location:</strong> {post.location}
                </span>
              </div>
            )}
            {post.contactPerson && (
              <div className="flex items-center gap-2 text-zinc-300">
                <UserIcon className="w-4 h-4 text-zinc-500" />
                <span>
                  <strong className="text-zinc-200">Contact:</strong> {post.contactPerson}
                </span>
              </div>
            )}
            {post.contactPhone && (
              <div className="flex items-center gap-2 text-zinc-300">
                <Phone className="w-4 h-4 text-zinc-500" />
                <span>
                  <strong className="text-zinc-200">Phone:</strong> {post.contactPhone}
                </span>
              </div>
            )}
            {post.contactEmail && (
              <div className="flex items-center gap-2 text-zinc-300">
                <Mail className="w-4 h-4 text-zinc-500" />
                <span>
                  <strong className="text-zinc-200">Email:</strong> {post.contactEmail}
                </span>
              </div>
            )}
            {post.tags && (
              <div className="flex items-center gap-2 text-zinc-300 sm:col-span-2">
                <Hashtag className="w-4 h-4 text-zinc-500" />
                <span>
                  <strong className="text-zinc-200">Tags:</strong> {post.tags}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Bar - Premium Style */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10 gap-1 sm:gap-2 flex-wrap">
        {/* Upvote/Downvote */}
        <div className="flex items-center gap-1 bg-black/40 rounded-full px-2 py-1.5 border border-white/10 hover:border-white/20 transition-all flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className={`p-1.5 rounded-full transition-all ${
              hasLiked
                ? "text-pink-500 bg-pink-500/20"
                : "text-zinc-400 hover:bg-pink-500/10 hover:text-pink-400"
            }`}
            title="Upvote"
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" fill={hasLiked ? "currentColor" : "none"} />
          </button>
          <span
            className={`text-xs sm:text-sm md:text-sm font-bold ${
              hasLiked ? "text-pink-500" : "text-zinc-400"
            }`}
          >
            {likes.length}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDislike();
            }}
            className={`p-1.5 rounded-full transition-all ${
              hasDisliked
                ? "text-blue-500 bg-blue-500/20"
                : "text-zinc-400 hover:bg-blue-500/10 hover:text-blue-400"
            }`}
            title="Downvote"
          >
            <ArrowDown
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill={hasDisliked ? "currentColor" : "none"}
            />
          </button>
        </div>

        {/* Comments */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowReplyModal(true);
          }}
          className="flex items-center gap-1 sm:gap-2 text-zinc-400 hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 px-2 sm:px-4 py-1.5 rounded-full transition-all text-xs sm:text-sm font-medium border border-transparent hover:border-[#1d9bf0]/30 flex-shrink-0"
        >
          <Message className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span className="hidden sm:inline">
            {comments.filter((c) => !c.isDeleted).length}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleShare();
          }}
          className="flex items-center gap-1 sm:gap-2 text-zinc-400 hover:text-green-400 hover:bg-green-500/10 px-2 sm:px-4 py-1.5 rounded-full transition-all text-xs sm:text-sm font-medium border border-transparent hover:border-green-500/30 flex-shrink-0"
        >
          <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Bookmark */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleBookmark();
          }}
          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 rounded-full transition-all text-xs sm:text-sm font-medium border flex-shrink-0 ${
            isSaved
              ? "text-white border-white/30"
              : "text-zinc-400 hover:text-white hover:bg-white/5 border-transparent hover:border-white/30"
          }`}
          title="Bookmark"
        >
          <Bookmark className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill={isSaved ? "currentColor" : "none"} />
          <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
        </button>

        {/* Report/Flag */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFlag();
          }}
          className="flex items-center gap-1 sm:gap-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 px-2 sm:px-4 py-1.5 rounded-full transition-all text-xs sm:text-sm font-medium border border-transparent hover:border-red-500/30 flex-shrink-0"
          title="Report"
        >
          <TriangleFlag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span className="hidden sm:inline">Report</span>
        </button>
      </div>

      {/* Post Detail Modal (The "Pop Out" focused view) */}
      <PostDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        post={{ ...post, likes, comments }}
        currentUser={currentUser}
        apiBaseUrl={apiBaseUrl}
        onPostUpdate={(updatedPost) => {
          setLikes(updatedPost.likes);
          if (updatedPost.comments) setComments(updatedPost.comments);
        }}
      />

      {/* Reply Modal (The specific one from the screenshot) */}
      <ReplyModal
        isOpen={showReplyModal}
        onClose={() => setShowReplyModal(false)}
        post={post}
        currentUser={currentUser}
        apiBaseUrl={apiBaseUrl}
        onReplySuccess={(newComment) => {
          setComments((prev) => [newComment, ...prev]);
        }}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetId={post._id}
        targetType="post"
        user={currentUser}
      />

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

export default memo(PostCard);
