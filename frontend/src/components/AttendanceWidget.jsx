import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const AttendanceWidget = ({ token }) => {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchAttendance();
    }
  }, [token]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/timetable/attendance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendance(res.data.data || { subjects: [] });
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendance({ subjects: [] });
    } finally {
      setLoading(false);
    }
  };

  if (!attendance?.subjects || attendance.subjects.length === 0) {
    return (
      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg p-6 border border-white/10">
        <h3 className="text-lg font-bold mb-4">Attendance Overview</h3>
        <p className="text-zinc-400 text-center py-6">
          No attendance data available
        </p>
      </div>
    );
  }

  const overallAttendance =
    attendance.subjects.length > 0
      ? (
          (attendance.subjects.reduce((sum, s) => sum + s.classesAttended, 0) /
            attendance.subjects.reduce((sum, s) => sum + s.totalClasses, 0)) *
          100
        ).toFixed(1)
      : 0;

  const atRiskCount = attendance.subjects.filter(
    (s) => s.attendancePercentage < 75,
  ).length;

  const getStatusIcon = (percentage) => {
    if (percentage >= 75)
      return <CheckCircle size={16} className="text-green-400" />;
    if (percentage >= 65)
      return <AlertTriangle size={16} className="text-yellow-400" />;
    return <AlertTriangle size={16} className="text-red-400" />;
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 75) return "bg-green-600";
    if (percentage >= 65) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg p-6 border border-white/10 hover:border-white/20 transition">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Attendance Overview</h3>
        <Link
          to="/timetable?tab=attendance"
          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
        >
          Details <ChevronRight size={16} />
        </Link>
      </div>

      {/* Overall Percentage */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded p-4 mb-4">
        <p className="text-sm text-blue-100 mb-1">Overall Attendance</p>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-bold">{overallAttendance}%</p>
          {overallAttendance >= 75 ? (
            <TrendingUp size={24} className="text-green-300" />
          ) : (
            <TrendingDown size={24} className="text-red-300" />
          )}
        </div>
      </div>

      {/* Status Alert */}
      {atRiskCount > 0 && (
        <div className="bg-red-900/20 border border-red-700 rounded p-3 mb-4">
          <p className="text-sm font-medium text-red-300 flex items-center gap-2">
            <AlertTriangle size={16} />
            {atRiskCount} subject(s) below 75%
          </p>
        </div>
      )}

      {/* Top Subjects */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-400 font-medium mb-2">TOP SUBJECTS</p>
        {attendance.subjects.slice(0, 3).map((subject) => (
          <div
            key={subject.subjectCode}
            className="bg-zinc-700/50 rounded p-2 flex items-center justify-between"
          >
            <div className="flex-1">
              <p className="text-sm font-medium truncate">
                {subject.subjectName}
              </p>
              <p className="text-xs text-zinc-400">{subject.subjectCode}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-bold">
                  {subject.attendancePercentage}%
                </p>
              </div>
              {getStatusIcon(subject.attendancePercentage)}
            </div>
          </div>
        ))}
      </div>

      {attendance.subjects.length > 3 && (
        <p className="text-xs text-zinc-400 mt-3 text-center">
          +{attendance.subjects.length - 3} more subjects
        </p>
      )}
    </div>
  );
};

export default AttendanceWidget;
