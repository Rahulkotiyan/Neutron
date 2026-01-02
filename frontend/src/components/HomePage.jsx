import React, { useState, useEffect } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import { Loader } from "lucide-react";

// You can create a CreatePost component separately and import it here,
// or keep using the one inside the parent App.jsx.
// For this snippet, I will focus on rendering the feed.

const HomePage = ({ currentUser, refreshTrigger }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = "http://localhost:5000/api";

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/posts`);
        setPosts(res.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching feed:", err);
        setError("Failed to load feed. Is the backend running?");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [refreshTrigger]);

  if (loading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-3">
        <Loader className="animate-spin text-blue-500" size={32} />
        <p className="text-sm font-medium">Loading Global Feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center my-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Feed Filters (Optional) */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {["Global", "Trending", "New", "Following"].map((filter, i) => (
          <button
            key={i}
            className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              i === 0
                ? "bg-white text-black"
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-white/5"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Posts List */}
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          currentUser={currentUser}
          apiBaseUrl={API_URL}
        />
      ))}

      {posts.length === 0 && !loading && (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-lg font-bold mb-2">It's quiet here...</p>
          <p className="text-sm">Be the first to post something!</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
