import React, { useState, useEffect } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";
import { Loader, School, Filter, TrendingUp, Clock, Hash } from "lucide-react";

const FeedPage = ({
  user,
  onLogin,
  pageType,
  isSidebarOpen,
  collegeName,
  currentUser,
  token,
}) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState("ALL");
  const [sortBy, setSortBy] = useState("recent");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const API_URL = "http://localhost:5000/api";

  // Map pageType to API tag
  const getApiTag = () => {
    const tagMap = {
      LOST_FOUND: "LOST_FOUND",
      NOTICES: "OFFICIAL",
      CONFESSIONS: "CONFESSION",
      HOME: null,
    };
    return tagMap[pageType] || null;
  };

  // Fetch College-Specific Feed
  const fetchCollegeFeed = async () => {
    setLoading(true);
    try {
      // Get the college from user or use a default
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
  }, [pageType, collegeName, user?.college, currentUser?.college, filterTag]);

  // Filter and sort posts
  const getFilteredAndSortedPosts = () => {
    let filtered = posts;

    // Apply tag filter
    if (filterTag !== "ALL") {
      filtered = filtered.filter((post) => post.tag === filterTag);
    }

    // Apply sorting
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

  // Tag options for filtering
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
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-3">
        <Loader className="animate-spin text-blue-500" size={32} />
        <p className="text-sm font-medium">Loading {currentCollege} Feed...</p>
      </div>
    );
  }

  return (
    <main
      className={`flex-1 w-full transition-all duration-300 p-4 md:p-6 pt-20 overflow-y-auto no-scrollbar relative z-0`}
    >
      <div className="max-w-2xl mx-auto pb-20">
        {/* Create Post Section */}
        <div className="mb-6 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
          <div className="flex gap-4">
            <img
              src={
                currentUser?.avatar ||
                "https://api.dicebear.com/7.x/avataaars/svg?seed=User"
              }
              alt="avatar"
              className="w-12 h-12 rounded-full"
            />
            <div className="flex-1">
              <input
                type="text"
                placeholder={`What's happening in ${currentCollege}?`}
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-transparent text-xl text-white placeholder-zinc-500 focus:outline-none cursor-pointer"
                readOnly
              />
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <School className="text-purple-500" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-white">
                {currentCollege}
              </h1>
              <p className="text-sm text-zinc-500">
                {pageType?.replace("_", " & ") || "College Community Feed"}
              </p>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Tag Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar flex-1">
              {tagOptions.map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => setFilterTag(tag.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    filterTag === tag.value
                      ? "bg-purple-600 text-white"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-zinc-900 text-zinc-300 rounded-full text-sm font-medium outline-none border border-white/10 hover:bg-zinc-800 cursor-pointer"
            >
              <option value="recent">Recent</option>
              <option value="popular">Popular</option>
            </select>
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
            <div className="text-center py-20">
              <School className="mx-auto mb-4 text-zinc-700" size={48} />
              <p className="text-lg font-bold text-zinc-400 mb-2">
                No posts yet
              </p>
              <p className="text-sm text-zinc-600 mb-6">
                Be the first to post in {currentCollege}!
              </p>
              {!currentUser && (
                <button
                  onClick={onLogin}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-medium transition-colors"
                >
                  Login to Post
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats Footer */}
        {displayedPosts.length > 0 && (
          <div className="mt-8 p-4 bg-zinc-900/50 rounded-xl border border-white/5 flex items-center justify-center gap-6 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} />
              <span>{displayedPosts.length} posts</span>
            </div>
            <div className="h-4 w-px bg-white/10"></div>
            <div className="flex items-center gap-2">
              <Clock size={16} />
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
