import React, { useState, useRef } from "react";
import {
  X,
  Upload as ImageIcon,
  Link as LinkIcon,
  Refresh,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Hashtag,
  CloudUpload,
  CheckCircleSolid,
  Page,
  Globe,
} from "iconoir-react";
import axios from "axios";
import CustomDropdown from "./CustomDropdown";

const CreateNoticeModal = ({
  isOpen,
  onClose,
  currentUser,
  token,
  onNoticeCreated,
}) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    noticeType: "NOTICE",
    category: "GENERAL",
    priority: "NORMAL",
    eventDate: "",
    location: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    tags: "",
  });

  const API_URL = "http://localhost:5000/api";
  const noticeTypes = [
    "NOTICE",
    "ANNOUNCEMENT",
    "POSTER",
    "CIRCULAR",
    "EVENT",
    "FEST",
    "ACADEMIC",
  ];

  const categories = [
    "GENERAL",
    "ACADEMIC",
    "PLACEMENT",
    "FEST",
    "CLUB",
    "ADMINISTRATION",
    "HOSTEL",
    "OTHERS",
  ];

  if (!isOpen) return null;

  const processFile = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result);
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    setLoading(true);

    try {
      const submitData = new FormData();

      Object.keys(formData).forEach((key) => {
        if (formData[key]) submitData.append(key, formData[key]);
      });

      if (file) submitData.append("file", file);

      const response = await axios.post(`${API_URL}/notices`, submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setFormData({
        title: "",
        description: "",
        noticeType: "NOTICE",
        category: "GENERAL",
        priority: "NORMAL",
        eventDate: "",
        location: "",
        contactPerson: "",
        contactPhone: "",
        contactEmail: "",
        tags: "",
      });
      setFile(null);
      setFilePreview(null);

      if (onNoticeCreated) onNoticeCreated(response.data);
      onClose();
    } catch (error) {
      console.error("Failed to post notice:", error);
      alert("Failed to create notice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full max-w-3xl bg-zinc-950 border border-white/5 rounded-[2rem] shadow-2xl shadow-red-900/10 relative overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
        {/* Decorative Top Gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 opacity-50"></div>

        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all transform hover:scale-110 z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8 md:p-10">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 mb-2 tracking-tight">
              Create Notice
            </h2>
            <p className="text-zinc-500 text-sm font-medium">
              Publish an official announcement to{" "}
              {currentUser?.college || "Global"}.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title Input - Large & Clean */}
            <div>
              <input
                className="w-full bg-transparent text-2xl md:text-3xl font-bold text-white placeholder:text-zinc-700 outline-none border-b-2 border-transparent focus:border-red-500/50 transition-colors pb-2"
                placeholder="What's the title?"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                autoFocus
                required
              />
            </div>

            {/* Core Classification Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase ml-1">
                  Type
                </label>
                <CustomDropdown
                  colorScheme="red"
                  options={noticeTypes.map((t) => ({ value: t, label: t }))}
                  value={formData.noticeType}
                  onChange={(value) =>
                    setFormData({ ...formData, noticeType: value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase ml-1">
                  Category
                </label>
                <CustomDropdown
                  colorScheme="red"
                  options={categories.map((c) => ({ value: c, label: c }))}
                  value={formData.category}
                  onChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase ml-1">
                  Priority
                </label>
                <CustomDropdown
                  colorScheme="red"
                  options={[
                    { value: "LOW", label: "Low" },
                    { value: "NORMAL", label: "Normal" },
                    { value: "HIGH", label: "High" },
                    { value: "URGENT", label: "Urgent" },
                  ]}
                  value={formData.priority}
                  onChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                />
              </div>
            </div>

            {/* Rich Text Area */}
            <div className="relative group">
              <textarea
                className="w-full bg-zinc-900/30 hover:bg-zinc-900/80 border border-white/5 rounded-2xl p-5 text-zinc-200 placeholder:text-zinc-600 outline-none resize-none h-40 focus:bg-zinc-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all leading-relaxed"
                placeholder="Provide the full details of your announcement here..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            {/* Media Upload (Drag & Drop) */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase ml-1 flex items-center gap-1">
                ATTACH MEDIA OR DOCUMENT{" "}
                <span className="normal-case font-normal text-zinc-600">
                  (Optional)
                </span>
              </label>

              {!file ? (
                <div
                  className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer group ${
                    isDragging
                      ? "border-red-500 bg-red-500/5"
                      : "border-white/10 hover:border-red-500/50 hover:bg-zinc-900/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                >
                  <div
                    className={`p-4 rounded-full mb-3 transition-colors ${
                      isDragging
                        ? "bg-red-500/20 text-red-500"
                        : "bg-white/5 text-zinc-400 group-hover:bg-red-500/10 group-hover:text-red-400"
                    }`}
                  >
                    <CloudUpload size={28} />
                  </div>
                  <p className="text-zinc-300 font-medium mb-1">
                    Click to upload or drag & drop
                  </p>
                  <p className="text-zinc-600 text-xs text-center">
                    Supports images (JPG, PNG) and documents (PDF, DOCX)
                  </p>
                </div>
              ) : (
                <div className="relative w-full rounded-2xl bg-zinc-900 border border-white/5 p-2 overflow-hidden group flex flex-col items-center">
                  {filePreview ? (
                    <div className="relative w-full rounded-xl overflow-hidden bg-black/50 aspect-video flex items-center justify-center">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button
                          type="button"
                          onClick={clearFile}
                          className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white font-medium rounded-full flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all"
                        >
                          <X size={16} /> Remove Media
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full p-6 flex flex-col items-center justify-center bg-zinc-900/50 rounded-xl">
                      <Page size={40} className="text-red-400/80 mb-3" />
                      <p className="text-zinc-200 font-medium text-center break-all w-full px-4">
                        {file.name}
                      </p>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="mt-4 px-4 py-1.5 bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 text-sm font-medium rounded-full transition-colors"
                      >
                        Remove file
                      </button>
                    </div>
                  )}
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
              />
            </div>

            {/* Optional Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="group relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Calendar
                    size={16}
                    className="text-zinc-500 group-focus-within:text-red-400 transition-colors"
                  />
                </div>
                <input
                  type="datetime-local"
                  value={formData.eventDate}
                  onChange={(e) =>
                    setFormData({ ...formData, eventDate: e.target.value })
                  }
                  className="w-full bg-zinc-900/50 hover:bg-zinc-900 text-sm text-zinc-300 rounded-xl pl-11 pr-4 py-3 outline-none border border-white/5 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>

              <div className="group relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin
                    size={16}
                    className="text-zinc-500 group-focus-within:text-red-400 transition-colors"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Location (Optional)"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full bg-zinc-900/50 hover:bg-zinc-900 text-sm text-zinc-300 placeholder:text-zinc-600 rounded-xl pl-11 pr-4 py-3 outline-none border border-white/5 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>

              <div className="group relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User
                    size={16}
                    className="text-zinc-500 group-focus-within:text-red-400 transition-colors"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Contact Person"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                  className="w-full bg-zinc-900/50 hover:bg-zinc-900 text-sm text-zinc-300 placeholder:text-zinc-600 rounded-xl pl-11 pr-4 py-3 outline-none border border-white/5 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>

              <div className="group relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Hashtag
                    size={16}
                    className="text-zinc-500 group-focus-within:text-red-400 transition-colors"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Tags (E.g. tech, urgent)"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  className="w-full bg-zinc-900/50 hover:bg-zinc-900 text-sm text-zinc-300 placeholder:text-zinc-600 rounded-xl pl-11 pr-4 py-3 outline-none border border-white/5 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>
            </div>

            {/* Submit Section */}
            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden shrink-0">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      className="w-full h-full object-cover"
                      alt="User"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-white text-sm font-bold">
                      {(currentUser?.name || "U").charAt(0)}
                    </div>
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-zinc-300 leading-none mb-1">
                    Posting as
                  </p>
                  <p className="text-xs text-zinc-500 leading-none">
                    {currentUser?.name}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !formData.title.trim() ||
                    !formData.description.trim() ||
                    loading
                  }
                  className="group relative flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-red-500/25 active:scale-95 overflow-hidden"
                >
                  <div className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={16} />
                        Publishing...
                      </>
                    ) : (
                      <>
                        Publish Notice
                        <CheckCircleSolid size={16} />
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateNoticeModal;
