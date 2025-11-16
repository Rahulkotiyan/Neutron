import React, { useState, useEffect, useContext } from "react";
import { Briefcase, Plus } from "lucide-react";
import api from "../api.js";
import AuthContext from "../context/AuthContext.jsx";

export default function PlacementsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Get user and login state
  const { user, isLoggedIn } = useContext(AuthContext);

  // State for new job form
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [packageAmt, setPackageAmt] = useState("");
  const [applyLink, setApplyLink] = useState("");
  const [description, setDescription] = useState("");

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/placements");
      setJobs(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load job postings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    if (!title || !company || !description || !applyLink) {
      alert("Please fill in all required fields");
      return;
    }

    const newJob = {
      title,
      company,
      description,
      package: packageAmt,
      applyLink,
    };

    try {
      await api.post("/placements/add", newJob);
      // Clear form
      setTitle("");
      setCompany("");
      setPackageAmt("");
      setApplyLink("");
      setDescription("");
      // Refresh list
      fetchJobs();
    } catch (err) {
      console.error("Error adding job:", err);
      alert("Failed to add job posting. Only logged-in users can add jobs.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
        <Briefcase size={32} />
        <span>Company & Placements</span>
      </h1>

      {/* --- MODIFICATION HERE --- */}
      {/* Only show this form if logged in */}
      {/* In a real app, you'd also check if user.role === 'admin' */}
      {isLoggedIn && (
        <form
          onSubmit={handleJobSubmit}
          className="p-6 bg-white rounded-lg shadow-md"
        >
          <h2 className="text-xl font-semibold mb-4">Add New Job Posting</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Job Title"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Company Name"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Package (e.g., 10 LPA)"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={packageAmt}
              onChange={(e) => setPackageAmt(e.target.value)}
            />
            <input
              type="text"
              placeholder="Apply Link"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={applyLink}
              onChange={(e) => setApplyLink(e.target.value)}
              required
            />
            <textarea
              placeholder="Job Description"
              className="w-full p-2 border border-gray-300 rounded-lg md:col-span-2"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              <span>Add Job</span>
            </button>
          </div>
        </form>
      )}

      {/* Job Postings List (Visible to all) */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Open Positions</h2>
        {loading && <p>Loading job postings...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="space-y-4">
          {!loading && !error && jobs.length === 0 && (
            <p className="text-gray-500">
              No job postings found for your college.
            </p>
          )}
          {!loading &&
            !error &&
            jobs.map((job) => (
              <div key={job._id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-xl text-gray-900">
                      {job.title}
                    </h3>
                    <p className="text-md text-gray-700">{job.company}</p>
                  </div>
                  <a
                    href={job.applyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                  >
                    Apply Now
                  </a>
                </div>
                <div className="mt-2">
                  {job.package && (
                    <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                      {job.package}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-3">{job.description}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Posted on {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
