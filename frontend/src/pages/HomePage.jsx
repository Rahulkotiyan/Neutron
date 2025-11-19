import React, { useState, useEffect, useContext,useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Upload,
  ChevronDown,
  Search,
  X ,
  Eye,
  Trash2
} from "lucide-react";
import api from "../api.js";
import AuthContext from "../context/AuthContext.jsx";

// --- New College Selector Component (for Guests) ---
function CollegeSelector() {
  const { selectedCollege, changeCollege, isLoggedIn } =
    useContext(AuthContext);
  const colleges = [
    "Dr Ambedkar Institute of technology",
    "R.V. College of Engineering",
    "BMS College of Engineering",
    "PES University",
  ];
  if (isLoggedIn) return null;

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
      <label
        htmlFor="college"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Viewing as a Guest. Change college:
      </label>
      <div className="relative">
        <select
          id="college"
          value={selectedCollege}
          onChange={(e) => changeCollege(e.target.value)}
          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
        >
          {colleges.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <ChevronDown size={18} />
        </div>
      </div>
    </div>
  );
}

// FilterBar component
function FilterBar({
  subject,
  setSubject,
  semester,
  setSemester,
  branch,
  setBranch,
  clearFilters,
}) {
  const branches = ["CSE", "ISE", "ECE", "EEE", "MECH", "CIVIL", "AIML"];
  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[150px]">
        <label
          htmlFor="filterSubject"
          className="block text-sm font-medium text-gray-700"
        >
          Subject
        </label>
        <input
          type="text"
          id="filterSubject"
          placeholder="e.g., Data Structures"
          className="w-full p-2 border border-gray-300 rounded-lg"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div className="flex-1 min-w-[100px]">
        <label
          htmlFor="filterSemester"
          className="block text-sm font-medium text-gray-700"
        >
          Semester
        </label>
        <input
          type="number"
          id="filterSemester"
          placeholder="e.g., 3"
          className="w-full p-2 border border-gray-300 rounded-lg"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        />
      </div>
      <div className="flex-1 min-w-[150px]">
        <label
          htmlFor="filterBranch"
          className="block text-sm font-medium text-gray-700"
        >
          Branch
        </label>
        <select
          id="filterBranch"
          className="w-full p-2 border border-gray-300 rounded-lg"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={clearFilters}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-2"
      >
        <X size={16} />
        <span>Clear</span>
      </button>
    </div>
  );
}

export default function HomePage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isLoggedIn, selectedCollege, searchQuery, setSearchQuery } =
    useContext(AuthContext);
  const navigate = useNavigate();

  // Filters
  const [semesterFilter, setSemesterFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("");
  const [branch, setBranch] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const branches = ["CSE", "ISE", "ECE", "EEE", "MECH", "CIVIL", "AIML"];

  // --- NEW STATE for Modal Viewer ---
  const [selectedResourceForView, setSelectedResourceForView] = useState(null);
  // --- NEW FUNCTION to open viewer modal ---
  const viewResource = (resource) => {
    setSelectedResourceForView(resource);
  };
  // --- NEW FUNCTION to close viewer modal ---
  const closeResourceViewer = () => {
    setSelectedResourceForView(null);
  };

  // Define strict protection properties for the viewer modal
  const strictProtectionProps = {
    onContextMenu: (e) => {
      e.preventDefault();
      return false;
    }, // Disable right-click
    onCopy: (e) => {
      e.preventDefault();
      return false;
    }, // Disable Ctrl+C
    onCut: (e) => {
      e.preventDefault();
      return false;
    }, // Disable Ctrl+X
    onDragStart: (e) => {
      e.preventDefault();
      return false;
    }, // Disable drag
    className: "select-none", // TailwindCSS to prevent text selection on other elements (like title)
  };

  // Debounce Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchResources();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, semesterFilter, branchFilter, selectedCollege, user]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.subject = searchQuery;
      if (semesterFilter) params.semester = semesterFilter;
      if (branchFilter) params.branch = branchFilter;

      const response = await api.get("/resources", { params });
      setResources(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching resources:", err);
      setError("Failed to load resources.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    if (!title || !subject || !file || !branch) {
      alert("Title, Subject, Branch, and File are required");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("subject", subject);
    formData.append("branch", branch);
    if (semester) formData.append("semester", semester);
    if (description) formData.append("description", description);

    try {
      await api.post("/resources/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTitle("");
      setSubject("");
      setSemester("");
      setBranch("");
      setDescription("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchResources();
    } catch (err) {
      console.error("Upload error:", err);
      // ONLY show an alert if it's NOT a 401 error.
      // The interceptor already handles 401 by logging out and redirecting.
      if (err.response && err.response.status !== 401) {
        alert(
          "Failed to upload resource: " +
            (err.response?.data?.error ||
              err.response?.data?.message ||
              err.message)
        );
      } else if (!err.response) {
        // Handle cases like network errors where there's no err.response
        alert(
          "Failed to upload resource due to a network error: " + err.message
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      try {
        await api.delete(`/resources/${resourceId}`);
        fetchResources();
      } catch (err) {
        alert("Failed to delete resource.");
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSemesterFilter("");
    setBranchFilter("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
        <BookOpen size={32} />
        <span>Learning Resources</span>
      </h1>
      <CollegeSelector />

      {isLoggedIn && (
        <form
          onSubmit={handleResourceSubmit}
          className="p-6 bg-white rounded-lg shadow-md"
        >
          <h2 className="text-xl font-semibold mb-4">Add New Resource</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Resource Title"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Subject"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />

            <select
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              required
            >
              <option value="">Select Branch</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Semester"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            />
            <input
              type="text"
              placeholder="Description (Optional)"
              className="w-full p-2 border border-gray-300 rounded-lg md:col-span-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload File (PDF, DOC, etc.)
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={isUploading}
              className="flex items-center space-x-2 px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              <Upload size={18} />
              <span>{isUploading ? "Uploading..." : "Upload Resource"}</span>
            </button>
          </div>
        </form>
      )}

      <FilterBar
        subject={searchQuery}
        setSubject={setSearchQuery} // Link search to subject filter
        semester={semesterFilter}
        setSemester={setSemesterFilter}
        branch={branchFilter}
        setBranch={setBranchFilter}
        clearFilters={clearFilters}
      />

      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Available Resources</h2>
        {loading && <p>Loading resources...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="space-y-3">
          {!loading && !error && resources.length === 0 && (
            <p className="text-gray-500">
              No resources found. {isLoggedIn ? " Be the first to upload!" : ""}
            </p>
          )}
          {!loading &&
            !error &&
            resources.map((res) => (
              <div
                key={res._id}
                className="p-4 border rounded-lg flex flex-wrap justify-between items-center gap-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-4">
                  {/* Display a small thumbnail of the first image */}
                  {res.imageUrls && res.imageUrls.length > 0 && (
                    <img
                      src={res.imageUrls[0]}
                      alt={`${res.title} thumbnail`}
                      className="w-16 h-16 object-cover rounded-md flex-shrink-0 border border-gray-200"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {res.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {res.subject}{" "}
                      {res.semester ? `| Sem ${res.semester}` : ""}
                      {res.branch ? ` | ${res.branch}` : ""}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Uploaded by {res.author?.username || "Unknown"} on{" "}
                      {new Date(res.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {/* The "View" button now opens the modal */}
                  <button
                    onClick={() => viewResource(res)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                  >
                    <Eye size={16} />
                    <span>View</span>
                  </button>

                  {isLoggedIn && user.id === res.author?._id && (
                    <button
                      onClick={() => handleDeleteResource(res._id)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* --- RESOURCE VIEWER MODAL (NEW) --- */}
      {selectedResourceForView && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2
                className="text-xl font-bold text-gray-800"
                {...strictProtectionProps}
              >
                {selectedResourceForView.title}
              </h2>
              <button
                onClick={closeResourceViewer}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <p className="text-gray-600" {...strictProtectionProps}>
                {selectedResourceForView.description}
              </p>
              <p className="text-sm text-gray-500" {...strictProtectionProps}>
                Subject: {selectedResourceForView.subject} | Semester:{" "}
                {selectedResourceForView.semester} | Branch:{" "}
                {selectedResourceForView.branch}
              </p>
              <p className="text-xs text-gray-400" {...strictProtectionProps}>
                Uploaded by{" "}
                {selectedResourceForView.author?.username || "Unknown"} on{" "}
                {new Date(
                  selectedResourceForView.createdAt
                ).toLocaleDateString()}
              </p>

              <div className="mt-4 space-y-4">
                {selectedResourceForView.imageUrls &&
                selectedResourceForView.imageUrls.length > 0 ? (
                  selectedResourceForView.imageUrls.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="flex justify-center bg-gray-100 p-2 rounded-lg"
                    >
                      <img
                        src={imageUrl}
                        alt={`${selectedResourceForView.title} Page ${
                          index + 1
                        }`}
                        className="max-w-full h-auto border border-gray-300 shadow-sm"
                        // Apply strict protection directly to the image
                        {...strictProtectionProps}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">
                    No images available for this resource.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --- END RESOURCE VIEWER MODAL --- */}
    </div>
  );
}