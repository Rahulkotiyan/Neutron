import React, { useState, useEffect } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";
import { Loader, School, TrendingUp, Clock, Hash } from "lucide-react";

const FeedPage = ({ user, pageType, collegeName, currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState("ALL");
  const [sortBy, setSortBy] = useState("recent");
  const [showCreateModal, setShowCreateModal] = useState(false);

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
  }, [pageType, collegeName, user?.college, currentUser?.college, filterTag]);

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
      className={`flex-1 w-full min-h-screen bg-zinc-950 transition-all duration-300 p-4 md:p-6 pt-24 overflow-y-auto no-scrollbar relative z-0`}
    >
      <div className="max-w-2xl mx-auto pb-20 pt-24">
        {/* Create Post Section */}
        <div className="mb-6 p-4 bg-zinc-900/50 rounded-xl border border-white/5 shadow-lg backdrop-blur-sm">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0">
              <img
                src={
                  currentUser?.avatar ||
                  "https://api.dicebear.com/7.x/avataaars/svg?seed=User"
                }
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder={`What's happening in ${currentCollege}?`}
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-transparent text-lg text-white placeholder-zinc-500 focus:outline-none cursor-pointer py-2"
                readOnly
              />
              <div className="flex justify-end mt-3 pt-3 border-t border-white/5">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-blue-500/20"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Header Title & Info */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
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
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Tag Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar flex-1">
              {tagOptions.map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => setFilterTag(tag.value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                    filterTag === tag.value
                      ? "bg-white text-black border-white"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto px-4 py-1.5 bg-zinc-900 text-zinc-300 rounded-full text-xs font-bold outline-none border border-zinc-800 hover:border-zinc-600 cursor-pointer appearance-none text-center"
              >
                <option value="recent">Recent</option>
                <option value="popular">Popular</option>
              </select>
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
