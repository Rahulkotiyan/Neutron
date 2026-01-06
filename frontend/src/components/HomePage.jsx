import React, { useState, useEffect } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";
import { Loader, Globe, TrendingUp } from "lucide-react";

const HomePage = ({ refreshTrigger, currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colleges, setColleges] = useState([]);
  const [filterCollege, setFilterCollege] = useState("All");
  const [filterTag, setFilterTag] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const API_URL = "http://localhost:5000/api";

  const fetchGlobalFeed = async () => {
    setLoading(true);
    try {
      // Logic to fetch global feed
      // If backend supports /posts/global, use it. Otherwise /posts
      let url = `${API_URL}/posts`;
      // If you implemented a specific global endpoint:
      // let url = `${API_URL}/posts/global`;

      const params = [];
      if (filterTag !== "ALL") params.push(`tag=${filterTag}`);
      if (params.length > 0) url += "?" + params.join("&");

      const res = await axios.get(url);
      setPosts(res.data);
    } catch (err) {
      console.error("Error fetching global feed:", err);
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchGlobalFeed();
    fetchColleges();
  }, [refreshTrigger, filterTag, filterCollege]);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-zinc-500 gap-3 pt-24">
        <Loader className="animate-spin text-blue-500" size={32} />
        <p className="text-sm font-medium">Loading Global Feed...</p>
      </div>
    );
  }

  return (
    // Applied flex-1, overflow-y-auto and padding to ensure scrollability independently if needed
    // pt-24 to clear the header
    <main className="flex-1 w-full min-h-screen bg-zinc-950 transition-all duration-300 p-4 md:p-6 pt-24 overflow-y-auto no-scrollbar relative z-0">
      <div className="max-w-2xl mx-auto pb-20 pt-24">
        {/* Create Post Section */}
        <div className="mb-6 p-4 bg-zinc-900/50 rounded-xl border border-white/5 shadow-lg">
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
                placeholder="What's happening?!"
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-transparent text-xl text-white placeholder-zinc-500 focus:outline-none cursor-pointer py-2"
                readOnly
              />
              <div className="flex justify-end mt-3 pt-3 border-t border-white/5">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all shadow-lg"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Header with Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="text-blue-500" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-white">Global Feed</h1>
              <p className="text-sm text-zinc-500">
                Discover posts from colleges across the platform
              </p>
            </div>
          </div>

          {/* Tag Filter */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  filterTag === tag
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* College Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setFilterCollege("All")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                filterCollege === "All"
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
              }`}
            >
              All Colleges
            </button>
            {colleges.map((college) => (
              <button
                key={college}
                onClick={() => setFilterCollege(college)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  filterCollege === college
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
                }`}
              >
                {college}
              </button>
            ))}
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-6">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <div key={post._id} className="relative">
                {/* College Badge */}
                {post.college && post.college !== "Global" && (
                  <div className="absolute -top-3 right-4 z-10">
                    <span className="px-3 py-1 bg-zinc-800/80 backdrop-blur-md border border-white/10 text-white text-xs font-bold rounded-full shadow-lg">
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
            <div className="text-center py-20">
              <Globe className="mx-auto mb-4 text-zinc-700" size={48} />
              <p className="text-lg font-bold text-zinc-400 mb-2">
                No posts found
              </p>
              <p className="text-sm text-zinc-600">
                {filterCollege === "All"
                  ? "Be the first to post something!"
                  : `No posts from ${filterCollege} yet`}
              </p>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        {filteredPosts.length > 0 && (
          <div className="mt-8 p-4 bg-zinc-900/50 rounded-xl border border-white/5 flex items-center justify-center gap-6 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} />
              <span>{filteredPosts.length} posts</span>
            </div>
            <div className="h-4 w-px bg-white/10"></div>
            <span>
              {filterCollege === "All"
                ? `${colleges.length} colleges active`
                : filterCollege}
            </span>
          </div>
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
  );
};

export default HomePage;
