import React, { useState, useEffect } from "react";
import { Xmark, Upload as ImageIcon, Link as LinkIcon, Refresh, Globe, Building, AtSign, Calendar, MapPin, User, Phone, Mail, Hashtag } from "iconoir-react";
import axios from "axios";
import { getAuth } from "firebase/auth";
import CustomDropdown from "./CustomDropdown";
import CustomModal from "./CustomModal";

const CreatePostModal = ({ isOpen, onClose, user, onPostCreated }) => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [tag, setTag] = useState("GENERAL");
  const [college, setCollege] = useState(user?.college || "Global");
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [postingLimit, setPostingLimit] = useState(null);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // Notice-specific fields
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [tags, setTags] = useState("");

  const API_URL = "http://localhost:5000/api";
  const auth = getAuth();

  // Fetch list of colleges
  useEffect(() => {
    if (isOpen) {
      fetchColleges();
      checkPostingLimit();
      // Set default college to user's college
      if (user?.college) {
        setCollege(user.college);
      }
    }
  }, [isOpen, user]);

  // Check daily posting limit
  const checkPostingLimit = async () => {
    try {
      setCheckingLimit(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/posts/limit/check`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPostingLimit(response.data);
    } catch (error) {
      console.error("Error checking posting limit:", error);
      // If API fails, assume they can post (fallback)
      setPostingLimit({
        canPost: true,
        postsToday: 0,
        postsRemaining: 1,
        limit: 1,
      });
    } finally {
      setCheckingLimit(false);
    }
  };

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

  // Clear file selection
  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
    // Reset file input
    const fileInput = document.getElementById("file-input");
    if (fileInput) fileInput.value = "";
  };

  // Handle mention
  const handleMention = () => {
    const textarea = document.querySelector("textarea");
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = desc;
      const newText = text.substring(0, start) + "@" + text.substring(end);
      setDesc(newText);

      // Focus back to textarea and set cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 1, start + 1);
      }, 0);
    }
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

      // Add notice-specific fields if tag is NOTICE
      if (tag === "NOTICE") {
        if (eventDate) formData.append("eventDate", eventDate);
        if (location) formData.append("location", location);
        if (contactPerson) formData.append("contactPerson", contactPerson);
        if (contactPhone) formData.append("contactPhone", contactPhone);
        if (contactEmail) formData.append("contactEmail", contactEmail);
        if (tags) formData.append("tags", tags);
      }

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
      // Reset notice-specific fields
      setEventDate("");
      setLocation("");
      setContactPerson("");
      setContactPhone("");
      setContactEmail("");
      setTags("");

      // Notify parent to refresh feed
      if (onPostCreated) onPostCreated();
      onClose();
    } catch (error) {
      console.error("Failed to post:", error);
      setModalConfig({
        isOpen: true,
        title: "Submission Failed",
        message: "Failed to create post. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gradient-to-b from-zinc-950/60 via-black/80 to-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg bg-gradient-to-br from-zinc-900/40 to-black/60 border border-white/20 rounded-2xl p-6 shadow-2xl relative backdrop-blur-xl my-auto max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <Xmark size={20} />
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

            {/* Tag Filters - Vertical Layout */}
            <div className="mt-3 space-y-2">
              <p className="text-xs text-zinc-500 font-medium">
                Choose Category
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "GENERAL", label: "General" },
                  { value: "NOTICE", label: "Notice" },
                  { value: "CONFESSION", label: "Confession" },
                  { value: "ANONYMOUS", label: "Anonymous" },
                  { value: "MEME", label: "Meme" },
                ].map((tagOption) => (
                  <button
                    key={tagOption.value}
                    onClick={() => setTag(tagOption.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      tag === tagOption.value
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-lg shadow-blue-500/20"
                        : "bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:bg-zinc-700/50 hover:text-zinc-300"
                    }`}
                  >
                    {tagOption.label}
                  </button>
                ))}
              </div>
            </div>

            {/* College Selector - Separate Section */}
            {/* <div className="mt-4 space-y-2">
              <p className="text-xs text-zinc-500 font-medium">Post To</p>
              <CustomDropdown
                colorScheme="purple"
                options={[
                  { value: "Global", label: " Global Feed" },
                  ...(user?.college
                    ? [{ value: user.college, label: ` ${user.college}` }]
                    : []),
                ]}
                value={college}
                onChange={setCollege}
              />
            </div> */}
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

          {/* Notice-specific fields - only show when NOTICE is selected */}
          {tag === "NOTICE" && (
            <div className="space-y-3 p-3 bg-zinc-900/30 rounded-xl border border-white/5">
              <p className="text-sm font-medium text-zinc-400 mb-2">Notice Details</p>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar
                        size={14}
                        className="text-zinc-500 group-focus-within:text-blue-400 transition-colors"
                      />
                    </div>
                    <input
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-zinc-800/50 text-sm text-zinc-300 rounded-lg pl-9 pr-3 py-2 outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                    />
                  </div>

                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin
                        size={14}
                        className="text-zinc-500 group-focus-within:text-blue-400 transition-colors"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-zinc-800/50 text-sm text-zinc-300 placeholder:text-zinc-600 rounded-lg pl-9 pr-3 py-2 outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User
                        size={14}
                        className="text-zinc-500 group-focus-within:text-blue-400 transition-colors"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Contact Person"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full bg-zinc-800/50 text-sm text-zinc-300 placeholder:text-zinc-600 rounded-lg pl-9 pr-3 py-2 outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                    />
                  </div>

                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone
                        size={14}
                        className="text-zinc-500 group-focus-within:text-blue-400 transition-colors"
                      />
                    </div>
                    <input
                      type="tel"
                      placeholder="Contact Phone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full bg-zinc-800/50 text-sm text-zinc-300 placeholder:text-zinc-600 rounded-lg pl-9 pr-3 py-2 outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail
                        size={14}
                        className="text-zinc-500 group-focus-within:text-blue-400 transition-colors"
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="Contact Email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-zinc-800/50 text-sm text-zinc-300 placeholder:text-zinc-600 rounded-lg pl-9 pr-3 py-2 outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                    />
                  </div>

                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hashtag
                        size={14}
                        className="text-zinc-500 group-focus-within:text-blue-400 transition-colors"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Tags (e.g. urgent, tech)"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full bg-zinc-800/50 text-sm text-zinc-300 placeholder:text-zinc-600 rounded-lg pl-9 pr-3 py-2 outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

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
                <Xmark size={16} />
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
                <Xmark size={16} />
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
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
              <Building size={16} className="text-blue-400" />
              <span className="text-blue-300">
                Visible to <strong>{college}</strong> and Global personnel
              </span>
            </div>
          )}

          {college === "Global" && (
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-500/10 border border-zinc-500/20 rounded-lg text-sm">
              <Globe size={16} className="text-zinc-400" />
              <span className="text-zinc-400">
                Visible to <strong>all colleges</strong> (Global Feed)
              </span>
            </div>
          )}

          {/* Daily Posting Limit Status */}
          {postingLimit && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                postingLimit.canPost
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-red-500/10 border border-red-500/20"
              }`}
            >
              {postingLimit.canPost ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-300">
                    {postingLimit.postsRemaining} post
                    {postingLimit.postsRemaining !== 1 ? "s" : ""} remaining
                    today
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-red-300">
                    Daily limit reached. Try again tomorrow.
                  </span>
                </>
              )}
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
                onClick={handleMention}
                className="p-2 hover:bg-white/5 rounded-full hover:text-green-400 transition-colors"
                title="Mention User"
              >
                <AtSign size={20} />
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
              disabled={
                !desc.trim() ||
                loading ||
                checkingLimit ||
                (postingLimit && !postingLimit.canPost)
              }
              className="bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2"
            >
              {checkingLimit ? (
                <>
                  <Refresh className="animate-spin" size={16} />
                  Checking limit...
                </>
              ) : loading ? (
                <>
                  <Refresh className="animate-spin" size={16} />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </button>
          </div>
        </form>
      </div>
      {/* Custom Modal for Alerts */}
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

export default CreatePostModal;
