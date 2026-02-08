import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";
import {
  Loader,
  School,
  TrendingUp,
  Clock,
  Hash,
  MoreHorizontal,
  X,
} from "lucide-react";

const FeedPage = ({ user, pageType, collegeName, currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState("ALL");
  const [sortBy, setSortBy] = useState("popular");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const moreFiltersRef = useRef(null);

  const API_URL = "http://localhost:5000/api";

  const fetchCollegeFeed = async () => {
    setLoading(true);
    try {
      const college =
        user?.college || currentUser?.college || collegeName || "AIT Bangalore";

      let url = `${API_URL}/posts/college/${college}`;
      const params = [];

      if (filterTag !== "ALL") params.push(`tag=${filterTag}`);
      if (params.length > 0) url += "?" + params.join("&");

      const res = await axios.get(url);
      setPosts(res.data);
    } catch (err) {
      console.error("Error fetching college feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollegeFeed();
  }, [
    pageType,
    collegeName,
    user?.college,
    currentUser?.college,
    filterTag,
    sortBy,
  ]);

  // Close more filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moreFiltersRef.current &&
        !moreFiltersRef.current.contains(event.target)
      ) {
        setShowMoreFilters(false);
      }
    };

    if (showMoreFilters) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMoreFilters]);

  const getFilteredAndSortedPosts = () => {
    let filtered = posts;

    if (filterTag !== "ALL") {
      filtered = filtered.filter((post) => post.tag === filterTag);
    }

    if (sortBy === "recent") {
      filtered = [...filtered].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    } else if (sortBy === "popular") {
      filtered = [...filtered].sort(
        (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)
      );
    }

    return filtered;
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    setShowCreateModal(false);
  };

  const displayedPosts = getFilteredAndSortedPosts();
  const currentCollege =
    user?.college || currentUser?.college || collegeName || "AIT Bangalore";

  const tagOptions = [
    { value: "ALL", label: "All Posts", icon: Hash },
    { value: "ANNOUNCEMENT", label: "Announcements" },
    { value: "EVENT", label: "Events" },
    { value: "QUESTION", label: "Questions" },
    { value: "LOST_FOUND", label: "Lost & Found" },
    { value: "GENERAL", label: "General" },
    { value: "MEME", label: "Memes" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-zinc-500 gap-3 pt-24">
        <Loader className="animate-spin text-blue-500" size={32} />
        <p className="text-sm font-medium">Loading {currentCollege} Feed...</p>
      </div>
    );
  }

  return (
    // Increased top padding to pt-24 to prevent overlap with fixed header
    <main
      className={`flex-1 w-full min-h-screen bg-zinc-950 transition-all duration-300 p-4 md:p-6 pt-4 overflow-y-auto no-scrollbar relative z-0`}
    >
      <div className="max-w-2xl mx-auto pb-20 pt-4">
        {/* Create Post Section */}
        

        {/* Header Title & Info */}
        <div className="mb-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <School className="text-purple-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {currentCollege}
              </h1>
              <p className="text-sm text-zinc-500 font-medium">
                {pageType?.replace("_", " & ") || "College Community Feed"}
              </p>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex items-center gap-3 mb-1">
            {/* Hot/New Toggle */}
            <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-full border border-zinc-800">
              <button
                onClick={() => setSortBy("popular")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  sortBy === "popular"
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                🔥 Hot
              </button>
              <button
                onClick={() => setSortBy("recent")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  sortBy === "recent"
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ✨ New
              </button>
            </div>

            {/* More Filters Button */}
            <div className="relative" ref={moreFiltersRef}>
              <button
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded-full text-xs font-bold border border-zinc-800 hover:border-zinc-600 transition-all"
              >
                <MoreHorizontal size={16} />
                More
              </button>

              {/* Filter Dropdown Menu */}
              {showMoreFilters && (
                <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 backdrop-blur-sm z-50 min-w-48 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between px-3 py-2 mb-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Categories
                    </span>
                    <button
                      onClick={() => setShowMoreFilters(false)}
                      className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-1 max-h-72 overflow-y-auto">
                    {tagOptions.map((tag) => (
                      <button
                        key={tag.value}
                        onClick={() => {
                          setFilterTag(tag.value);
                          setShowMoreFilters(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          filterTag === tag.value
                            ? "bg-blue-600 text-white"
                            : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        }`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-6">
          {displayedPosts.length > 0 ? (
            displayedPosts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUser={currentUser || user}
                apiBaseUrl={API_URL}
                onPostUpdate={() => fetchCollegeFeed()}
              />
            ))
          ) : (
            <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-white/5 border-dashed">
              <School className="mx-auto mb-4 text-zinc-700" size={48} />
              <p className="text-lg font-bold text-zinc-400 mb-2">
                It's quiet here...
              </p>
              <p className="text-sm text-zinc-600 mb-6">
                Be the first to post in {currentCollege}!
              </p>
              {!currentUser && (
                <button
                  // onClick={onLogin} // Passed from props if available
                  className="px-6 py-2 bg-white text-black hover:bg-zinc-200 rounded-full font-bold transition-colors text-sm"
                >
                  Login to Post
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats Footer */}
        {displayedPosts.length > 0 && (
          <div className="mt-8 p-4 flex items-center justify-center gap-6 text-xs font-medium text-zinc-600">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} />
              <span>{displayedPosts.length} posts loaded</span>
            </div>
            <div className="h-3 w-px bg-zinc-800"></div>
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>
                {sortBy === "recent" ? "Sorted by Recent" : "Sorted by Popular"}
              </span>
            </div>
          </div>
        )}

        {/* Create Post Modal */}
        {showCreateModal && (
          <CreatePostModal
            currentUser={currentUser || user}
            onClose={() => setShowCreateModal(false)}
            onPostCreated={handlePostCreated}
            college={currentCollege}
            apiBaseUrl={API_URL}
          />
        )}
      </div>
    </main>
  );
};

export default FeedPage;
