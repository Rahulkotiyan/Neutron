import React, { useState } from "react";
import { X, Image as ImageIcon, Link as LinkIcon, Loader } from "lucide-react";
import axios from "axios";
import { getAuth } from "firebase/auth";

const CreatePostModal = ({ isOpen, onClose, user, onPostCreated }) => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [tag, setTag] = useState("GENERAL");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!desc.trim()) return;

    setLoading(true);
    const auth = getAuth();

    try {
      const token = await auth.currentUser?.getIdToken();

      // Replace with your actual API URL
      const API_URL = "http://localhost:5000/api";

      await axios.post(
        `${API_URL}/posts`,
        {
          title,
          desc,
          tag,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Reset form
      setTitle("");
      setDesc("");
      setTag("GENERAL");

      // Notify parent to refresh feed
      if (onPostCreated) onPostCreated();
      onClose();
    } catch (error) {
      console.error("Failed to post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-white mb-6">Create Post</h2>

        <div className="flex gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold overflow-hidden border border-white/10 shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                className="w-full h-full object-cover"
                alt="User"
              />
            ) : (
              (user?.name || "U").charAt(0)
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">{user?.name}</p>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="mt-1 bg-zinc-900 border border-white/10 text-xs text-zinc-400 rounded-md px-2 py-1 outline-none focus:border-blue-500"
            >
              <option value="GENERAL">General</option>
              <option value="DOUBT">Academic Doubt</option>
              <option value="PROJECT">Project Showcase</option>
              <option value="CONFESSION">Confession</option>
              <option value="LOST_FOUND">Lost & Found</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full bg-transparent text-lg font-bold text-white placeholder:text-zinc-600 outline-none"
            placeholder="An interesting title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <textarea
            className="w-full bg-transparent text-zinc-300 placeholder:text-zinc-600 outline-none resize-none h-32 text-base"
            placeholder="What's on your mind?"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            required
          />

          <div className="border-t border-white/10 pt-4 flex justify-between items-center mt-4">
            <div className="flex gap-2 text-zinc-400">
              <button
                type="button"
                className="p-2 hover:bg-white/5 rounded-full hover:text-blue-400 transition-colors"
                title="Add Image"
              >
                <ImageIcon size={20} />
              </button>
              <button
                type="button"
                className="p-2 hover:bg-white/5 rounded-full hover:text-blue-400 transition-colors"
                title="Add Link"
              >
                <LinkIcon size={20} />
              </button>
            </div>

            <button
              type="submit"
              disabled={!desc.trim() || loading}
              className="bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2"
            >
              {loading && <Loader className="animate-spin" size={16} />}
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
