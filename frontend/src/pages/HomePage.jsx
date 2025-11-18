import React, { useState, useEffect, useContext,useRef } from "react";
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
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function FilterBar({ semester, setSemester, branch, setBranch, clearFilters }) {
  const semesters = ["", "1", "2", "3", "4", "5", "6", "7", "8"];
  const branches = ["", "CSE", "ISE", "ECE", "EEE", "MECH", "CIVIL", "AIML"];

  return (
    <div className="p-4 bg-white rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Semester Filter */}
        <div>
          <label
            htmlFor="sem-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Filter by Semester
          </label>
          <div className="relative">
            <select
              id="sem-filter"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full p-2 pr-8 border border-gray-300 rounded-lg appearance-none"
            >
              {semesters.map((s) => (
                <option key={s} value={s}>
                  {s ? `Semester ${s}` : "All Semesters"}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Branch Filter */}
        <div>
          <label
            htmlFor="branch-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Filter by Branch
          </label>
          <div className="relative">
            <select
              id="branch-filter"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full p-2 pr-8 border border-gray-300 rounded-lg appearance-none"
            >
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b ? b : "All Branches"}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Clear Button */}
        <div>
          <button
            onClick={clearFilters}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            <X size={18} />
            <span>Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isLoggedIn, selectedCollege, searchQuery, setSearchQuery } =
    useContext(AuthContext);

  // Filters
  const [semesterFilter, setSemesterFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("");
  const [branch, setBranch] = useState(""); // New Branch State for Upload
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const branches = ["CSE", "ISE", "ECE", "EEE", "MECH", "CIVIL", "AIML","IEM","EIE","ETE","AE","CSBS","MCA","MBA"];

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
      if (branchFilter) params.branch = branchFilter; // Send branch filter

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
    formData.append("branch", branch); // Send branch to backend
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
      alert("Failed to upload resource.");
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

  const antiCopyProps = {
    onContextMenu: (e) => e.preventDefault(),
    className: "select-none",
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

            {/* --- NEW BRANCH SELECT FOR UPLOAD --- */}
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
        semester={semesterFilter}
        setSemester={setSemesterFilter}
        branch={branchFilter}
        setBranch={setBranchFilter}
        clearFilters={clearFilters}
      />

      <div className="p-6 bg-white rounded-lg shadow-md" {...antiCopyProps}>
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
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {res.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {res.subject} {res.semester ? `| Sem ${res.semester}` : ""}
                    {/* Show Branch on Card */}
                    {res.branch ? ` | ${res.branch}` : ""}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Uploaded by {res.author?.username || "Unknown"} on{" "}
                    {new Date(res.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <a
                    href={res.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                  >
                    <Eye size={16} />
                    <span>View</span>
                  </a>
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
    </div>
  );
}