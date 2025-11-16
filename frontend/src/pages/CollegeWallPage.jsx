import React, { useState, useEffect, useContext } from "react";
import { Newspaper } from "lucide-react";
import api from "../api.js";
import AuthContext from "../context/AuthContext.jsx";

export default function CollegeWallPage() {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Get user and login state
  const { user, isLoggedIn } = useContext(AuthContext);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/posts");
      setPosts(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      await api.post("/posts/add", { content: newPostContent });
      setNewPostContent("");
      fetchPosts();
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to create post. Only logged-in users can post.");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
        <Newspaper size={32} />
        <span>College Wall</span>
      </h1>

      {/* --- MODIFICATION HERE --- */}
      {/* Only show the post form if the user is logged in */}
      {isLoggedIn && (
        <form
          onSubmit={handlePostSubmit}
          className="bg-white rounded-lg shadow-md p-4"
        >
          <textarea
            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder={`What's on your mind, ${user?.name}?`}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          ></textarea>
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Post
            </button>
          </div>
        </form>
      )}

      {/* Posts Feed (Visible to all) */}
      <div className="space-y-4">
        {loading && <p>Loading posts...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && posts.length === 0 && (
          <p className="text-gray-500 text-center">
            No posts yet. {isLoggedIn ? "Be the first!" : ""}
          </p>
        )}

        {!loading &&
          !error &&
          posts.map((post) => (
            <div key={post._id} className="bg-white rounded-lg shadow-md p-5">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-bold text-white">
                  {post.author ? post.author.username.charAt(0) : "?"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {post.author ? post.author.username : "Unknown User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(post.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-gray-700">{post.content}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
