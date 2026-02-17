import React, { useState, useEffect } from "react";
import {
  Shield,
  Eye,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Loader,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const AdminDashboard = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const API_URL = "http://localhost:5000/api";

  useEffect(() => {
    if (user?.isAdmin) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (targetId, action) => {
    setProcessing(targetId);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/admin/resolve`,
        { target_id: targetId, action },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Report resolved successfully");
      fetchReports(); // Refresh the list
    } catch (error) {
      console.error("Error resolving report:", error);
      toast.error("Failed to resolve report");
    } finally {
      setProcessing(null);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">
            Access Denied
          </h2>
          <p className="text-gray-500">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-8 h-8 text-blue-600" />
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Review and moderate reported content
        </p>
      </div>

      <div className="grid gap-6">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600">
              All caught up!
            </h3>
            <p className="text-gray-500">
              No pending reports to review.
            </p>
          </div>
        ) : (
          reports.map((item) => (
            <div
              key={item.target._id}
              className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500"
            >
              <div className="flex items-start gap-4">
                {/* Content Preview */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-red-600">
                      Reported {item.reportCount} time{item.reportCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-sm text-gray-500">
                      • Top reason: {item.topReason}
                    </span>
                  </div>

                  {item.target.title && (
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.target.title}
                    </h3>
                  )}

                  {item.target.desc && (
                    <p className="text-gray-700 mb-3 line-clamp-3">
                      {item.target.desc}
                    </p>
                  )}

                  {item.target.image && (
                    <img
                      src={item.target.image}
                      alt="Reported content"
                      className="w-full max-w-md h-48 object-cover rounded-lg mb-3"
                    />
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>By: {item.target.author?.name || "Anonymous"}</span>
                    <span>Type: {item.target_type}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleResolve(item.target._id, "KEEP")}
                    disabled={processing === item.target._id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-md transition-colors"
                  >
                    {processing === item.target._id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Keep
                  </button>

                  <button
                    onClick={() => handleResolve(item.target._id, "REMOVE")}
                    disabled={processing === item.target._id}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-md transition-colors"
                  >
                    {processing === item.target._id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Remove
                  </button>

                  <button
                    onClick={() => handleResolve(item.target._id, "BAN_USER")}
                    disabled={processing === item.target._id}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-md transition-colors"
                  >
                    {processing === item.target._id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Ban className="w-4 h-4" />
                    )}
                    Ban User
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
