import React, { useState } from "react";
import axios from "axios";
import { Xmark, Upload, Refresh } from "iconoir-react";
import CustomDropdown from "./CustomDropdown";
import { API_URL } from "../utils/api";

const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"];
const documentTypes = ["NOTES", "SYLLABUS", "PAST_PAPERS"];

const NoteUploadModal = ({ isOpen, onClose, onUploadSuccess, currentUser, token }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    semester: "",
    branch: "",
    documentType: "NOTES",
    fileUrl: "",
    fileName: "",
    isGroup: false,
    files: [{ title: "", fileUrl: "", fileName: "" }],
  });
  const [uploading, setUploading] = useState(false);
  const [branches, setBranches] = useState(["CSE","ECE","EEE","ME","CE","IT","AIML","DS","CSBS","AERO","AUTO","BIOTECH"]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!currentUser || !token) return;

    if (formData.isGroup) {
      const hasEmptyUrl = formData.files.some((file) => !file.fileUrl.trim());
      if (hasEmptyUrl) return;
    } else if (!formData.fileUrl) return;

    try {
      setUploading(true);
      const uploadData = new FormData();
      uploadData.append("title", formData.title);
      uploadData.append("description", formData.description);
      uploadData.append("subject", formData.subject);
      uploadData.append("semester", formData.semester);
      uploadData.append("branch", formData.branch);
      uploadData.append("documentType", formData.documentType);
      uploadData.append("isGroup", formData.isGroup);

      if (formData.isGroup) {
        uploadData.append("files", JSON.stringify(formData.files));
      } else {
        uploadData.append("fileUrl", formData.fileUrl);
        uploadData.append("fileName", formData.fileName || "document.pdf");
      }

      const response = await axios.post(`${API_URL}/notes`, uploadData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      onUploadSuccess(response.data);
      onClose();
      setFormData({
        title: "",
        description: "",
        subject: "",
        semester: "",
        branch: "",
        documentType: "NOTES",
        fileUrl: "",
        fileName: "",
        isGroup: false,
        files: [{ title: "", fileUrl: "", fileName: "" }],
      });
    } catch (err) {
      console.error("Error uploading note:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleAddFileRow = () => {
    setFormData({ ...formData, files: [...formData.files, { title: "", fileUrl: "", fileName: "" }] });
  };

  const handleRemoveFileRow = (index) => {
    setFormData({ ...formData, files: formData.files.filter((_, i) => i !== index) });
  };

  const handleFileChange = (index, field, value) => {
    const newFiles = [...formData.files];
    newFiles[index][field] = value;
    setFormData({ ...formData, files: newFiles });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[110] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl relative overflow-hidden my-auto animate-in zoom-in-95 duration-300">
        <div className="sticky top-0 bg-zinc-950 border-b border-white/10 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2">Share Your Notes</h2>
            <p className="text-zinc-400 text-sm">Contribute to the community by uploading study materials</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors active:scale-95 min-h-[44px]">
            <Xmark size={24} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-8">
          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Title *</label>
              <input
                type="text"
                placeholder="e.g., Data Structures - Sorting Algorithms"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-zinc-600"
                required
              />
            </div>

            <div>
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Description (Optional)</label>
              <textarea
                placeholder="Add details about the notes, topics covered, etc."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-zinc-600 h-20 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Subject *</label>
                <input
                  type="text"
                  placeholder="e.g., Data Structures"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-zinc-600"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Semester *</label>
                <CustomDropdown
                  colorScheme="amber"
                  options={[
                    { value: "", label: "Select Semester" },
                    ...semesters.map((sem) => ({ value: sem, label: `Semester ${sem}` })),
                  ]}
                  value={formData.semester}
                  onChange={(value) => setFormData({ ...formData, semester: value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Branch</label>
                <CustomDropdown
                  colorScheme="amber"
                  options={[
                    { value: "", label: "Select Branch" },
                    ...branches.map((branch) => ({ value: branch, label: branch })),
                  ]}
                  value={formData.branch}
                  onChange={(value) => setFormData({ ...formData, branch: value })}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Type</label>
                <CustomDropdown
                  colorScheme="amber"
                  options={documentTypes.map((type) => ({ value: type, label: type.replace(/_/g, " ") }))}
                  value={formData.documentType}
                  onChange={(value) => setFormData({ ...formData, documentType: value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-zinc-900/50 border border-white/10 rounded-xl">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">Group Notes</h4>
                <p className="text-xs text-zinc-500">Upload multiple files under one topic</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isGroup: !formData.isGroup })}
                className={`w-12 h-6 rounded-full transition-colors relative active:scale-95 min-h-[44px] ${formData.isGroup ? "bg-amber-500" : "bg-zinc-700"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.isGroup ? "left-7" : "left-1"}`} />
              </button>
            </div>

            <div className="space-y-4">
              {!formData.isGroup ? (
                <>
                  <div>
                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Google Drive Link *</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/file/d/..."
                      value={formData.fileUrl}
                      onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-zinc-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">File Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., Sorting_Algorithms.pdf"
                      value={formData.fileName}
                      onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-zinc-600"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest block">Group Files *</label>
                    <button type="button" onClick={handleAddFileRow} className="text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors active:scale-95 min-h-[44px]">
                      + Add File
                    </button>
                  </div>
                  {formData.files.map((file, index) => (
                    <div key={index} className="p-4 bg-zinc-900/30 border border-white/5 rounded-xl space-y-3 relative">
                      {formData.files.length > 1 && (
                        <button type="button" onClick={() => handleRemoveFileRow(index)} className="absolute top-2 right-2 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-full transition-all active:scale-95 min-h-[44px]">
                          <Xmark className="w-2.5 h-2.5" />
                        </button>
                      )}
                      <input
                        type="text"
                        placeholder="File Title (e.g., Unit 1 Notes)"
                        value={file.title}
                        onChange={(e) => handleFileChange(index, "title", e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white"
                        required
                      />
                      <input
                        type="url"
                        placeholder="Google Drive Link"
                        value={file.fileUrl}
                        onChange={(e) => handleFileChange(index, "fileUrl", e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white"
                        required
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-6 border-t border-white/5">
              <button type="button" onClick={onClose} className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold transition-colors active:scale-95 min-h-[44px]" disabled={uploading}>
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-black rounded-xl font-semibold transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 min-h-[44px]"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Refresh className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Share Notes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NoteUploadModal;
