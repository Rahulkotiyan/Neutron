import React, { useState, useEffect, useContext } from "react";
import { BookOpen, Upload } from "lucide-react";
import api from "../api.js";
import AuthContext from "../context/AuthContext.jsx";

export default function LearningResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Get isLoggedIn state from context
  const { user, isLoggedIn } = useContext(AuthContext);

  // State for the new resource form
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("");
  const [description, setDescription] = useState("");

  const fetchResources = async () => {
    try {
      setLoading(true);
      // Guests CAN fetch resources. The backend route for GET /resources
      // should be public or check for a guest/user token.
      // For this setup, we'll assume guests just need to select a college.
      // Our api.js helper will add the token *if it exists*, which is fine.
      const response = await api.get("/resources");
      setResources(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching resources:", err);
      // Check if it's an auth error
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 403)
      ) {
        setError("You must be logged in to view resources.");
      } else {
        setError("Failed to load resources.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // We need to pass the selected college for guests
    // This is best handled in the API helper (interceptor)
    // For now, this will work if the backend logic is correct
    fetchResources();
  }, []);

  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    if (!title || !subject) {
      alert("Title and Subject are required");
      return;
    }

    const newResource = {
      title,
      subject,
      semester: semester ? Number(semester) : undefined,
      description,
      // fileUrl will be handled by file upload logic in a real app
      fileUrl: "http://example.com/file.pdf",
    };

    try {
      await api.post("/resources/add", newResource);
      // Clear form
      setTitle("");
      setSubject("");
      setSemester("");
      setDescription("");
      // Refresh list
      fetchResources();
    } catch (err) {
      console.error("Error adding resource:", err);
      alert("Failed to add resource. Only logged-in users can upload.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
        <BookOpen size={32} />
        <span>Learning Resources</span>
      </h1>

      {/* --- MODIFICATION HERE --- */}
      {/* Only show the upload form if the user is logged in */}
      {isLoggedIn && (
        <form
          onSubmit={handleResourceSubmit}
          className="p-6 bg-white rounded-lg shadow-md"
        >
          <h2 className="text-xl font-semibold mb-4">Add New Resource</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Resource Title (e.g., DSA Unit 1 Notes)"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Subject (e.g., Data Structures)"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Semester (e.g., 3)"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            />
            <input
              type="text"
              placeholder="Description (Optional)"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Upload size={18} />
              <span>Upload Resource</span>
            </button>
          </div>
        </form>
      )}

      {/* Available Resources List (Visible to all) */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Available Resources</h2>
        {loading && <p>Loading resources...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="space-y-3">
          {!loading && !error && resources.length === 0 && (
            <p className="text-gray-500">
              No resources found for your college.{" "}
              {isLoggedIn ? "Be the first to upload!" : ""}
            </p>
          )}
          {!loading &&
            !error &&
            resources.map((res) => (
              <div
                key={res._id}
                className="p-4 border rounded-lg flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {res.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {res.subject} {res.semester ? `| Sem ${res.semester}` : ""}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Uploaded by {res.author?.username || "Unknown"} on{" "}
                    {new Date(res.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={res.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                >
                  Download
                </a>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
