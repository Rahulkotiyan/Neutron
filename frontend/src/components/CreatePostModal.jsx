import React, { useState, useEffect } from "react";
import {
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader,
  Globe,
  School,
} from "lucide-react";
import axios from "axios";
import { getAuth } from "firebase/auth";

const CreatePostModal = ({ isOpen, onClose, user, onPostCreated }) => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [tag, setTag] = useState("GENERAL");
  const [college, setCollege] = useState("Global");
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const API_URL = "http://localhost:5000/api";
  const auth = getAuth();

  // Fetch list of colleges
  useEffect(() => {
    if (isOpen) {
      fetchColleges();
      // Set default college to user's college
      if (user?.college) {
        setCollege(user.college);
      }
    }
  }, [isOpen, user]);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Generate preview for images
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null); // No preview for non-image files
      }
    }
  };

  // Clear file
  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  const fetchColleges = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts/colleges/list`);
      setColleges(res.data);
    } catch (err) {
      console.error("Error fetching colleges:", err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!desc.trim()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append("title", title);
      formData.append("desc", desc);
      formData.append("tag", tag);
      formData.append("college", college);

      if (file) {
        formData.append("file", file);
      }

      await axios.post(`${API_URL}/posts`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Reset form
      setTitle("");
      setDesc("");
      setTag("GENERAL");
      setCollege("Global");
      clearFile();

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
            <div className="flex gap-2 mt-2">
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="bg-zinc-900 border border-white/10 text-xs text-zinc-400 rounded-md px-2 py-1 outline-none focus:border-blue-500"
              >
                <option value="GENERAL">General</option>
                <option value="ANNOUNCEMENT">Announcement</option>
                <option value="QUESTION">Question</option>
                <option value="EVENT">Event</option>
                <option value="MEME">Meme</option>
                <option value="CONFESSION">Confession</option>
                <option value="LOST_FOUND">Lost & Found</option>
              </select>

              {/* College Selector */}
              <select
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="bg-zinc-900 border border-white/10 text-xs text-zinc-400 rounded-md px-2 py-1 outline-none focus:border-blue-500"
              >
                <option value="Global">🌍 Global Feed</option>
                {user?.college && (
                  <option value={user.college}>🏫 {user.college}</option>
                )}
                <option disabled>───────────</option>
                {colleges.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
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

          {/* File Preview */}
          {filePreview && (
            <div className="relative w-full max-h-80 bg-zinc-900/50 border border-white/10 rounded-lg overflow-hidden">
              <img
                src={filePreview}
                alt="Preview"
                className="w-full h-auto max-h-80 object-cover"
              />
              <button
                type="button"
                onClick={clearFile}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* File Info */}
          {file && !filePreview && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
              <ImageIcon size={16} className="text-blue-400" />
              <span className="text-blue-300 flex-1 truncate">{file.name}</span>
              <button
                type="button"
                onClick={clearFile}
                className="text-blue-400 hover:text-blue-300"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Hidden file input */}
          <input
            type="file"
            id="file-input"
            onChange={handleFileChange}
            accept="image/*,video/*,.pdf,.doc,.docx"
            className="hidden"
          />

          {/* College Info Badge */}
          {college !== "Global" && (
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-sm">
              <School size={16} className="text-purple-400" />
              <span className="text-purple-300">
                Posting to <strong>{college}</strong>
              </span>
            </div>
          )}

          {college === "Global" && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
              <Globe size={16} className="text-blue-400" />
              <span className="text-blue-300">
                Posting to <strong>Global Feed</strong> (visible to all
                colleges)
              </span>
            </div>
          )}

          <div className="border-t border-white/10 pt-4 flex justify-between items-center mt-4">
            <div className="flex gap-2 text-zinc-400">
              <button
                type="button"
                onClick={() => document.getElementById("file-input").click()}
                className="p-2 hover:bg-white/5 rounded-full hover:text-blue-400 transition-colors"
                title="Add Image or Video"
              >
                <ImageIcon size={20} />
              </button>
              <button
                type="button"
                onClick={() => document.getElementById("file-input").click()}
                className="p-2 hover:bg-white/5 rounded-full hover:text-blue-400 transition-colors"
                title="Add Document"
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
