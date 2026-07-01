import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CheckCircle,
  WarningCircle,
  Calendar,
  Medal,
  InfoCircle,
  GraphUp,
} from "iconoir-react";

const AttendanceTracker = ({ token }) => {
  const [bunkAnalysis, setBunkAnalysis] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectCalendar, setSubjectCalendar] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchBunkAnalysis();
      fetchAttendance();
    }
  }, [token]);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get("/api/timetable/attendance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendance(res.data || { subjects: [] });
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendance({ subjects: [] });
    }
  };

  const fetchBunkAnalysis = async () => {
    try {
      const res = await axios.get("/api/timetable/attendance/bunk-capacity", {
        headers: { Authorization: `Bearer ${token}` },
        params: { required: 75 },
      });
      setBunkAnalysis(res.data.subjects || []);
    } catch (error) {
      console.error("Error fetching bunk analysis:", error);
      setBunkAnalysis([]);
    }
  };

  const fetchSubjectCalendar = async (subjectCode) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/timetable/attendance/calendar/${subjectCode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSubjectCalendar(res.data.data);
    } catch (error) {
      console.error("Error fetching calendar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectClick = (subjectCode) => {
    setSelectedSubject(subjectCode);
    fetchSubjectCalendar(subjectCode);
  };

  const getStatusIcon = (percentage) => {
    if (percentage >= 75)
      return <CheckCircle className="text-green-400" width={24} height={24} />;
    if (percentage >= 65)
      return <WarningCircle className="text-yellow-400" width={24} height={24} />;
    return <InfoCircle className="text-red-400" width={24} height={24} />;
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 75) return "from-green-600 to-green-800";
    if (percentage >= 65) return "from-yellow-600 to-yellow-800";
    return "from-red-600 to-red-800";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {attendance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6">
            <p className="text-sm text-blue-200 mb-2">Total Classes</p>
            <p className="text-3xl font-bold">
              {attendance.subjects.reduce((sum, s) => sum + s.totalClasses, 0)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6">
            <p className="text-sm text-green-200 mb-2">Classes Attended</p>
            <p className="text-3xl font-bold">
              {attendance.subjects.reduce(
                (sum, s) => sum + s.classesAttended,
                0,
              )}
            </p>
          </div>
          <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-lg p-6">
            <p className="text-sm text-red-200 mb-2">Classes Skipped</p>
            <p className="text-3xl font-bold">
              {attendance.subjects.reduce(
                (sum, s) => sum + s.classesSkipped,
                0,
              )}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6">
            <p className="text-sm text-purple-200 mb-2">Overall %</p>
            <p className="text-3xl font-bold">
              {attendance.subjects.length > 0
                ? (
                    (attendance.subjects.reduce(
                      (sum, s) => sum + s.classesAttended,
                      0,
                    ) /
                      attendance.subjects.reduce(
                        (sum, s) => sum + s.totalClasses,
                        0,
                      )) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>
      )}

      {/* Bunk Calculator */}
      {bunkAnalysis && (
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Medal width={24} height={24} /> Bunk Manager
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bunkAnalysis.map((subject) => (
              <div
                key={subject.subjectCode}
                onClick={() => handleSubjectClick(subject.subjectCode)}
                className="bg-zinc-700/50 rounded-lg p-5 border border-white/10 hover:border-white/20 cursor-pointer transition min-h-[44px]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">
                      {subject.subjectName}
                    </h4>
                    <p className="text-sm text-zinc-400">
                      {subject.subjectCode}
                    </p>
                  </div>
                  {getStatusIcon(subject.currentPercentage)}
                </div>

                {/* Percentage Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-zinc-300">Attendance</span>
                    <span className="font-bold">
                      {subject.currentPercentage}%
                    </span>
                  </div>
                  <div className="bg-zinc-600 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${subject.currentPercentage}%`,
                        backgroundColor:
                          subject.currentPercentage >= 75
                            ? "#10b981"
                            : subject.currentPercentage >= 65
                              ? "#f59e0b"
                              : "#ef4444",
                      }}
                    />
                  </div>
                </div>

                {/* Classes Info */}
                <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                  <div>
                    <p className="text-zinc-400">Total</p>
                    <p className="font-semibold">{subject.totalClasses}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400">Attended</p>
                    <p className="font-semibold text-green-400">
                      {subject.classesAttended}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400">Absent</p>
                    <p className="font-semibold text-red-400">
                      {subject.totalClasses - subject.classesAttended}
                    </p>
                  </div>
                </div>

                {/* Recommendation */}
                {subject.warning === "SAFE" ? (
                  <div className="bg-green-900/20 border border-green-700 rounded p-3">
                    <p className="text-sm font-medium text-green-300 flex items-center gap-2">
                      <GraphUp width={16} height={16} />
                      Can bunk {subject.canBunk} more classes
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-900/20 border border-red-700 rounded p-3">
                    <p className="text-sm font-medium text-red-300 flex items-center gap-2">
                      <InfoCircle width={16} height={16} />
                      Attend {subject.needToAttend} more classes
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Calendar */}
      {selectedSubject && subjectCalendar && (
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Calendar width={24} height={24} /> Attendance Calendar -{" "}
            {subjectCalendar.subjectName}
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Grid */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center font-semibold text-sm text-zinc-400 p-2"
                    >
                      {day}
                    </div>
                  ),
                )}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 42 }, (_, i) => {
                  const date = new Date(2024, 0, 1 + i);
                  const dateStr = date.toISOString().split("T")[0];
                  const record = subjectCalendar.calendar[dateStr];

                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded flex items-center justify-center text-sm font-medium ${
                        record
                          ? record.status === "PRESENT"
                            ? "bg-green-600"
                            : record.status === "ABSENT"
                              ? "bg-red-600"
                              : "bg-yellow-600"
                          : "bg-zinc-700 text-zinc-500"
                      }`}
                      title={record ? record.status : "No data"}
                    >
                      {date.getDate()}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-600 rounded" />
                  <span className="text-sm">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded" />
                  <span className="text-sm">Absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-600 rounded" />
                  <span className="text-sm">Leave</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <div className="bg-zinc-700/50 rounded p-4">
                <p className="text-sm text-zinc-400 mb-2">Total Classes</p>
                <p className="text-2xl font-bold">
                  {subjectCalendar.stats.totalClasses}
                </p>
              </div>
              <div className="bg-green-900/20 border border-green-700 rounded p-4">
                <p className="text-sm text-green-300 mb-2">Present</p>
                <p className="text-2xl font-bold text-green-400">
                  {subjectCalendar.stats.attended}
                </p>
              </div>
              <div className="bg-red-900/20 border border-red-700 rounded p-4">
                <p className="text-sm text-red-300 mb-2">Absent</p>
                <p className="text-2xl font-bold text-red-400">
                  {subjectCalendar.stats.absent}
                </p>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-700 rounded p-4">
                <p className="text-sm text-yellow-300 mb-2">Leave</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {subjectCalendar.stats.leave}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;
