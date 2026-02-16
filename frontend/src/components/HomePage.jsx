import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";
import TrendingSection from "./TrendingSection";
import FeedPreferences from "./FeedPreferences";
import {
  Loader,
  Globe,
  TrendingUp,
  Flame,
  Clock,
  Star,
  Zap,
  Settings,
  Filter,
  ChevronDown,
  MoreHorizontal,
  X,
} from "lucide-react";

const HomePage = ({ refreshTrigger, currentUser, isSidebarOpen }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colleges, setColleges] = useState([]);
  const [filterCollege, setFilterCollege] = useState("All");
  const [filterTag, setFilterTag] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState("hot");
  const [showPreferences, setShowPreferences] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const moreFiltersRef = useRef(null);
  const [feedPreferences, setFeedPreferences] = useState({
    showAds: false,
    hideNSFW: false,
    autoplay: true,
    compactMode: false,
  });

  const API_URL = "http://localhost:5000/api";

  const fetchGlobalFeed = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/posts/global`;
      const params = [];
      if (filterTag !== "ALL") params.push(`tag=${filterTag}`);
      if (params.length > 0) url += "?" + params.join("&");

      const res = await axios.get(url);
      let sortedPosts = [...res.data];

      // Apply sorting logic
      sortedPosts = applySorting(sortedPosts, sortBy);

      setPosts(sortedPosts);
    } catch (err) {
      console.error("Error fetching global feed:", err);
    } finally {
      setLoading(false);
    }
  };

  const applySorting = (postsToSort, sortType) => {
    const now = new Date();

    switch (sortType) {
      case "hot":
        return postsToSort.sort((a, b) => {
          const scoreA =
            (a.likes?.length || 0) * 2 +
            (a.comments?.length || 0) +
            (a.reposts?.length || 0) * 1.5;
          const scoreB =
            (b.likes?.length || 0) * 2 +
            (b.comments?.length || 0) +
            (b.reposts?.length || 0) * 1.5;
          return scoreB - scoreA;
        });

      case "new":
        return postsToSort.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

      case "top":
        return postsToSort.sort(
          (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)
        );

      case "best":
        return postsToSort.sort((a, b) => {
          const totalA =
            (a.likes?.length || 0) -
            (a.dislikes?.length || 0) +
            (a.comments?.length || 0) * 0.5;
          const totalB =
            (b.likes?.length || 0) -
            (b.dislikes?.length || 0) +
            (b.comments?.length || 0) * 0.5;
          return totalB - totalA;
        });

      case "controversial":
        return postsToSort.sort((a, b) => {
          const ratioA = Math.min(
            a.likes?.length || 0,
            a.dislikes?.length || 0
          );
          const ratioB = Math.min(
            b.likes?.length || 0,
            b.dislikes?.length || 0
          );
          return ratioB - ratioA;
        });

      default:
        return postsToSort;
    }
  };

  const fetchColleges = async () => {
    try {
      // Mock colleges if endpoint fails or doesn't exist yet
      setColleges(["Global", "MIT", "Stanford", "IIT Bombay", "IIT Delhi"]);
      // const res = await axios.get(`${API_URL}/posts/colleges/list`);
      // setColleges(res.data);
    } catch (err) {
      console.error("Error fetching colleges:", err);
    }
  };

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

  useEffect(() => {
    fetchGlobalFeed();
    fetchColleges();
  }, [refreshTrigger, filterTag, filterCollege, sortBy]);

  const filteredPosts =
    filterCollege === "All"
      ? posts
      : posts.filter((post) => post.college === filterCollege);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    setShowCreateModal(false);
  };

  const tags = [
    "ALL",
    "ANNOUNCEMENT",
    "MEME",
    "QUESTION",
    "LOST_FOUND",
    "OFFICIAL",
    "EVENT",
    "GENERAL",
    "CONFESSION",
  ];

  return (
    <div className="flex w-full min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950 pt-0">
      {/* Main Feed */}
      <main
        className={`flex-1 w-full overflow-y-auto no-scrollbar relative z-0 transition-all duration-300 ${
          isSidebarOpen ? "lg:ml-72" : ""
        }`}
      >
        <div className="max-w-3xl mx-auto pt-3">
          {/* Premium Create Post Section */}

          {/* Feed Controls Bar */}
          <div className="px-4 md:px-6 mb-2">
            {/* Simplified Sorting: Hot & New with More Filters */}
            <div className="flex items-center gap-3">
              {/* Hot/New Toggle */}
              <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-full border border-zinc-800">
                <button
                  onClick={() => setSortBy("hot")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    sortBy === "hot"
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  🔥 Hot
                </button>
                <button
                  onClick={() => setSortBy("new")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    sortBy === "new"
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
                  <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 backdrop-blur-sm z-50 min-w-56 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between px-3 py-2 mb-3 border-b border-zinc-800">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Sort By
                      </span>
                      <button
                        onClick={() => setShowMoreFilters(false)}
                        className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="space-y-1 mb-3">
                      {[
                        { value: "top", label: "Top" },
                        { value: "best", label: "Best" },
                        { value: "controversial", label: "Controversial" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                            setShowMoreFilters(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                            sortBy === option.value
                              ? "bg-blue-600 text-white"
                              : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-zinc-800 pt-2 mt-2">
                      <div className="px-3 py-2 mb-2">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          Categories
                        </span>
                      </div>
                      <div className="space-y-1 max-h-56 overflow-y-auto">
                        {tags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              setFilterTag(tag);
                              setShowMoreFilters(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                              filterTag === tag
                                ? "bg-blue-600 text-white"
                                : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings Button */}
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className={`ml-auto p-2 rounded-full transition-all ${
                  showPreferences
                    ? "bg-purple-600 text-white"
                    : "bg-zinc-900/50 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-600"
                }`}
              >
                <Settings size={18} />
              </button>
            </div>

            {/* Removed Level 2: Tag Filter - Modern Segmented Design */}
            {/* Old filter code removed for simplification */}
          </div>
          {showPreferences && (
            <div className="px-4 md:px-6 mb-6">
              <FeedPreferences
                preferences={feedPreferences}
                onPreferencesChange={setFeedPreferences}
              />
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-96 text-zinc-500 gap-3">
              <Loader className="animate-spin text-blue-500" size={40} />
              <p className="text-base font-medium">Loading Premium Feed...</p>
              <p className="text-sm text-zinc-600">
                Fetching the best posts for you
              </p>
            </div>
          )}

          {/* Posts Feed */}
          {!loading && (
            <>
              <div className="px-4 md:px-6 space-y-6 pb-24">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post, index) => (
                    <div
                      key={post._id}
                      className="relative animate-in fade-in slide-in-from-bottom-4 duration-500"
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      {/* College Badge */}
                      {post.college && post.college !== "Global" && (
                        <div className="absolute -top-3 right-6 z-10">
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md border border-blue-400/30 text-blue-300 text-xs font-bold rounded-full shadow-lg">
                            {post.college}
                          </span>
                        </div>
                      )}
                      <PostCard
                        post={post}
                        currentUser={currentUser}
                        apiBaseUrl={API_URL}
                        onPostUpdate={() => fetchGlobalFeed()}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-24">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 mb-6">
                      <Globe className="text-zinc-600" size={32} />
                    </div>
                    <p className="text-xl font-bold text-zinc-400 mb-2">
                      No posts found
                    </p>
                    <p className="text-sm text-zinc-600 mb-6">
                      {filterCollege === "All"
                        ? "Be the first to share something amazing!"
                        : `No posts from ${filterCollege} yet. Start a conversation!`}
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all"
                    >
                      Create First Post
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Create Post Modal */}
          {showCreateModal && (
            <CreatePostModal
              currentUser={currentUser}
              onClose={() => setShowCreateModal(false)}
              onPostCreated={handlePostCreated}
              college="Global"
              apiBaseUrl={API_URL}
            />
          )}
        </div>
      </main>

      {/* Trending Sidebar - Hidden on mobile, visible on md+ */}
      <aside className="hidden lg:block w-80 border-l border-white/5 bg-zinc-950/50 backdrop-blur-sm overflow-y-auto no-scrollbar">
        <TrendingSection posts={posts} currentUser={currentUser} />
      </aside>
    </div>
  );
};

export default HomePage;
