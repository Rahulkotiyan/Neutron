import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Eye,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Loader,
  AlertTriangle,
  User,
  Clock,
  MessageSquare,
  Calendar,
  Flag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const AdminDashboard = ({ user, refreshUserData }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [expandedReports, setExpandedReports] = useState(new Set());
  const hasRefreshed = useRef(false);

  const API_URL = "http://localhost:5000/api";

  useEffect(() => {
    const initializeDashboard = async () => {
      // Only refresh user data once to avoid infinite loops
      if (refreshUserData && !hasRefreshed.current) {
        hasRefreshed.current = true;
        await refreshUserData();
      }

      // Check admin status after potential refresh
      if (user?.isAdmin) {
        fetchReports();
      } else {
        setLoading(false); // Stop loading if not admin
      }
    };

    initializeDashboard();
  }, [user?.isAdmin]); // Only depend on isAdmin, not entire user object

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Reports data received:", response.data);
      if (response.data.length > 0) {
        console.log("First report target:", response.data[0].target);
        console.log("First report target author:", response.data[0].target?.author);
        console.log("First report target createdAt:", response.data[0].target?.createdAt);
      }
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

  const toggleExpanded = (reportId) => {
    const newExpanded = new Set(expandedReports);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedReports(newExpanded);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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
        <h1 className="text-3xl font-bold text-white-900 flex items-center gap-2">
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
              className="bg-gradient-to-r from-black to-gray-700 rounded-lg shadow-md border-l-4 border-red-500 overflow-hidden text-white"
            >
              {/* Header Section */}
              <div className="p-4 border-b border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-white" />
                    <div>
                      <span className="text-lg font-semibold text-white">
                        {item.reportCount} Report{item.reportCount !== 1 ? "s" : ""}
                      </span>
                      <p className="text-sm text-gray-300">
                        Top reason: <span className="font-medium">{item.topReason}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleExpanded(item.target._id)}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md border border-gray-600 text-sm font-medium text-white"
                  >
                    {expandedReports.has(item.target._id) ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Collapse
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Expand Details
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Post Title */}
                    {item.target.title && (
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          {item.target.title}
                        </h3>
                      </div>
                    )}

                    {/* Post Description */}
                    {item.target.desc && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-1">Content:</h4>
                        <p className="text-gray-300 bg-gray-700 p-3 rounded-md leading-relaxed">
                          {item.target.desc}
                        </p>
                      </div>
                    )}

                    {/* Post Image */}
                    {item.target.image && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Image:</h4>
                        <img
                          src={item.target.image}
                          alt="Reported content"
                          className="w-full max-w-md h-auto object-cover rounded-lg border shadow-sm"
                        />
                      </div>
                    )}

                    {/* Content Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-gray-300">Type:</span>
                        <span className="ml-2 text-gray-400 capitalize">{item.target_type}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-300">Created:</span>
                        <span className="ml-2 text-gray-400">
                          {item.target.createdAt ? formatDate(item.target.createdAt) : 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-300">First Reported:</span>
                        <span className="ml-2 text-gray-400">{formatDate(item.firstReported)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-300">Last Reported:</span>
                        <span className="ml-2 text-gray-400">{formatDate(item.latestReported)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    {/* Content Author */}
                    <div className="p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-200 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Content Author
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium text-gray-300">Name:</span> {item.target.author?.name || 'Unknown'}</p>
                        <p><span className="font-medium text-gray-300">Email:</span> {item.target.author?.email || 'Unknown'}</p>
                        {item.target.author?.handle && (
                          <p><span className="font-medium text-gray-300">Handle:</span> @{item.target.author.handle}</p>
                        )}
                      </div>
                    </div>

                    {/* Report Statistics */}
                    <div className="p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
                        <Flag className="w-4 h-4" />
                        Report Breakdown
                      </h4>
                      <div className="space-y-1 text-sm">
                        {Object.entries(item.allReasons).map(([reason, count]) => (
                          <div key={reason} className="flex justify-between">
                            <span className="capitalize text-gray-300">{reason.replace(/_/g, ' ')}:</span>
                            <span className="font-medium text-gray-300">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => handleResolve(item.target._id, "KEEP")}
                        disabled={processing === item.target._id}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-black to-gray-600 hover:from-gray-900 hover:to-gray-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-md transition-colors font-medium"
                      >
                        {processing === item.target._id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Keep Content
                      </button>

                      <button
                        onClick={() => handleResolve(item.target._id, "WARN")}
                        disabled={processing === item.target._id}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-black to-gray-500 hover:from-gray-900 hover:to-gray-600 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-md transition-colors font-medium"
                      >
                        {processing === item.target._id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        Warn Creator
                      </button>

                      <button
                        onClick={() => handleResolve(item.target._id, "REMOVE")}
                        disabled={processing === item.target._id}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-black to-gray-400 hover:from-gray-900 hover:to-gray-500 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-md transition-colors font-medium"
                      >
                        {processing === item.target._id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Delete Content
                      </button>

                      <button
                        onClick={() => handleResolve(item.target._id, "SUSPEND")}
                        disabled={processing === item.target._id}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-black to-gray-300 hover:from-gray-900 hover:to-gray-400 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-md transition-colors font-medium"
                      >
                        {processing === item.target._id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Ban className="w-4 h-4" />
                        )}
                        Temporarily Withhold Account
                      </button>

                      <button
                        onClick={() => handleResolve(item.target._id, "BAN_USER")}
                        disabled={processing === item.target._id}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-black to-gray-200 hover:from-gray-900 hover:to-gray-300 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-md transition-colors font-medium"
                      >
                        {processing === item.target._id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Ban className="w-4 h-4" />
                        )}
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Reporter Details */}
                {expandedReports.has(item.target._id) && (
                  <div className="mt-6 pt-6 border-t border-gray-600">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Reporter Details ({item.reporters.length})
                    </h4>
                    <div className="space-y-3">
                      {item.reporters.map((reporter, index) => (
                        <div key={index} className="p-4 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium text-white mb-1">
                                Reporter: {reporter.name}
                              </h5>
                              <p className="text-sm text-gray-400 mb-2">{reporter.email}</p>
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Reported: {formatDate(reporter.reportedAt)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm">
                                <span className="font-medium text-gray-300">Reason:</span>
                                <span className="ml-2 capitalize">{reporter.reason.replace(/_/g, ' ')}</span>
                              </p>
                              {reporter.additional_info && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-gray-300">Additional Info:</p>
                                  <p className="text-sm text-gray-400 bg-gray-600 p-2 rounded mt-1">
                                    {reporter.additional_info}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
