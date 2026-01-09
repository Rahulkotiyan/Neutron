import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Trash2,
  Check,
  X,
  Clock,
  BookOpen,
  TrendingDown,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";

const TimetablePage = ({ isSidebarOpen, currentUser, token }) => {
  const [activeTab, setActiveTab] = useState("college"); // college, personal, attendance
  const [loading, setLoading] = useState(false);
  const [collegeTimetable, setCollegeTimetable] = useState(null);
  const [personalTimetable, setPersonalTimetable] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);

  // Form states
  const [newClass, setNewClass] = useState({
    day: "Monday",
    timeSlot: "",
    subject: "",
    subjectCode: "",
    professor: "",
    room: "",
    type: "LECTURE",
  });

  const [newSubject, setNewSubject] = useState({
    subjectCode: "",
    subjectName: "",
  });

  const [attendanceMarking, setAttendanceMarking] = useState({
    subjectCode: "",
    date: new Date().toISOString().split("T")[0],
    timeSlot: "",
    status: "PRESENT",
    notes: "",
  });

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Fetch college timetable
  const fetchCollegeTimetable = async () => {
    try {
      if (
        !currentUser?.college ||
        !currentUser?.branch ||
        !currentUser?.semester
      ) {
        console.log("Missing user college/branch/semester info");
        return;
      }

      const res = await axios.get("/api/timetable/college", {
        params: {
          college: currentUser.college,
          branch: currentUser.branch,
          semester: currentUser.semester,
        },
      });

      setCollegeTimetable(res.data.data);
    } catch (error) {
      console.log("College timetable not found or error:", error.message);
    }
  };

  // Fetch personal timetable
  const fetchPersonalTimetable = async () => {
    try {
      const res = await axios.get("/api/timetable/personal", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPersonalTimetable(res.data.data);
    } catch (error) {
      console.error("Error fetching personal timetable:", error);
    }
  };

  // Fetch attendance
  const fetchAttendance = async () => {
    try {
      const res = await axios.get("/api/timetable/attendance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendance(res.data.data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  // Fetch attendance stats
  const fetchAttendanceStats = async () => {
    try {
      const res = await axios.get("/api/timetable/attendance/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendanceStats(res.data.data);
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
    }
  };

  useEffect(() => {
    if (token && currentUser) {
      fetchCollegeTimetable();
      fetchPersonalTimetable();
      fetchAttendance();
      fetchAttendanceStats();
    }
  }, [token, currentUser]);

  // Add class to personal timetable
  const handleAddClass = async () => {
    if (!newClass.timeSlot || !newClass.subject || !newClass.subjectCode) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const updatedSchedule = personalTimetable?.schedule || [];
      const dayIndex = updatedSchedule.findIndex((d) => d.day === newClass.day);

      if (dayIndex !== -1) {
        updatedSchedule[dayIndex].classes.push({
          ...newClass,
          customNote: "",
        });
      } else {
        updatedSchedule.push({
          day: newClass.day,
          classes: [{ ...newClass, customNote: "" }],
        });
      }

      const res = await axios.put(
        "/api/timetable/personal",
        { schedule: updatedSchedule },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPersonalTimetable(res.data.data);
      setNewClass({
        day: "Monday",
        timeSlot: "",
        subject: "",
        subjectCode: "",
        professor: "",
        room: "",
        type: "LECTURE",
      });
      setShowAddClassModal(false);
    } catch (error) {
      console.error("Error adding class:", error);
      alert("Failed to add class");
    } finally {
      setLoading(false);
    }
  };

  // Delete class
  const handleDeleteClass = async (day, classIndex) => {
    try {
      setLoading(true);

      const updatedSchedule = personalTimetable.schedule.map((d) => {
        if (d.day === day) {
          return {
            ...d,
            classes: d.classes.filter((_, idx) => idx !== classIndex),
          };
        }
        return d;
      });

      const res = await axios.put(
        "/api/timetable/personal",
        { schedule: updatedSchedule },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPersonalTimetable(res.data.data);
    } catch (error) {
      console.error("Error deleting class:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add subject for attendance tracking
  const handleAddSubject = async () => {
    if (!newSubject.subjectCode || !newSubject.subjectName) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "/api/timetable/attendance/subject",
        newSubject,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAttendance(res.data.data);
      setNewSubject({ subjectCode: "", subjectName: "" });
      setShowAddSubjectModal(false);
    } catch (error) {
      console.error("Error adding subject:", error);
      alert(error.response?.data?.message || "Failed to add subject");
    } finally {
      setLoading(false);
    }
  };

  // Mark attendance
  const handleMarkAttendance = async () => {
    if (!attendanceMarking.subjectCode || !attendanceMarking.timeSlot) {
      alert("Please select subject and time slot");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "/api/timetable/attendance/mark",
        attendanceMarking,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAttendance(res.data.data);
      await fetchAttendanceStats();
      setAttendanceMarking({
        subjectCode: "",
        date: new Date().toISOString().split("T")[0],
        timeSlot: "",
        status: "PRESENT",
        notes: "",
      });
      setShowMarkAttendanceModal(false);
    } catch (error) {
      console.error("Error marking attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete subject
  const handleDeleteSubject = async (subjectCode) => {
    if (confirm("Are you sure you want to delete this subject?")) {
      try {
        setLoading(true);

        const res = await axios.delete(
          `/api/timetable/attendance/subject/${subjectCode}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setAttendance(res.data.data);
        await fetchAttendanceStats();
      } catch (error) {
        console.error("Error deleting subject:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Render college timetable
  const renderCollegeTimetable = () => {
    if (!collegeTimetable) {
      return (
        <div className="text-center py-8 text-zinc-400">
          <p>No college timetable available for your section</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {daysOfWeek.map((day) => {
          const dayClasses = collegeTimetable.schedule.find(
            (s) => s.day === day
          );

          return (
            <div key={day} className="border border-white/10 rounded-lg">
              <button
                onClick={() => setExpandedDay(expandedDay === day ? null : day)}
                className="w-full flex items-center justify-between p-4 hover:bg-zinc-900/50 transition"
              >
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-blue-400" />
                  <span className="font-semibold text-lg">{day}</span>
                </div>
                {expandedDay === day ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>

              {expandedDay === day && (
                <div className="border-t border-white/10 p-4 space-y-3">
                  {dayClasses && dayClasses.classes.length > 0 ? (
                    dayClasses.classes.map((classItem, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-900/50 p-3 rounded border border-white/5"
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="font-semibold text-blue-400">
                              {classItem.subject}
                            </div>
                            <div className="flex gap-4 text-sm text-zinc-400">
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                {classItem.timeSlot}
                              </div>
                              <div>{classItem.room}</div>
                              <div className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                                {classItem.type}
                              </div>
                            </div>
                            {classItem.professor && (
                              <div className="text-sm text-zinc-500">
                                Prof. {classItem.professor}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500 text-sm">
                      No classes scheduled
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render personal timetable
  const renderPersonalTimetable = () => {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowAddClassModal(true)}
          className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          <Plus size={20} />
          Add Class
        </button>

        {personalTimetable?.schedule &&
        personalTimetable.schedule.length > 0 ? (
          daysOfWeek.map((day) => {
            const dayClasses = personalTimetable.schedule.find(
              (s) => s.day === day
            );

            return (
              <div key={day} className="border border-white/10 rounded-lg">
                <button
                  onClick={() =>
                    setExpandedDay(expandedDay === day ? null : day)
                  }
                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-900/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen size={20} className="text-purple-400" />
                    <span className="font-semibold text-lg">{day}</span>
                  </div>
                  {expandedDay === day ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>

                {expandedDay === day && (
                  <div className="border-t border-white/10 p-4 space-y-3">
                    {dayClasses && dayClasses.classes.length > 0 ? (
                      dayClasses.classes.map((classItem, idx) => (
                        <div
                          key={idx}
                          className="bg-zinc-900/50 p-3 rounded border border-white/5 flex justify-between items-start"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="font-semibold text-purple-400">
                              {classItem.subject}
                            </div>
                            <div className="flex gap-4 text-sm text-zinc-400">
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                {classItem.timeSlot}
                              </div>
                              <div>{classItem.room || "TBA"}</div>
                              <div className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                                {classItem.type}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteClass(day, idx)}
                            className="text-red-400 hover:text-red-500 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-500 text-sm">
                        No classes on this day
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-zinc-400">
            <p>No classes added yet</p>
          </div>
        )}
      </div>
    );
  };

  // Render attendance tracker
  const renderAttendanceTracker = () => {
    return (
      <div className="space-y-6">
        {/* Add Subject */}
        <button
          onClick={() => setShowAddSubjectModal(true)}
          className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-700 rounded-lg transition"
        >
          <Plus size={20} />
          Add Subject
        </button>

        {/* Overall Stats */}
        {attendanceStats?.overallStats && (
          <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4">Overall Attendance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {attendanceStats.overallStats.totalClasses}
                </div>
                <div className="text-sm text-zinc-400">Total Classes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {attendanceStats.overallStats.totalAttended}
                </div>
                <div className="text-sm text-zinc-400">Attended</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {attendanceStats.overallStats.totalSkipped}
                </div>
                <div className="text-sm text-zinc-400">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {attendanceStats.overallStats.overallPercentage}%
                </div>
                <div className="text-sm text-zinc-400">Percentage</div>
              </div>
            </div>
          </div>
        )}

        {/* Mark Attendance Button */}
        <button
          onClick={() => setShowMarkAttendanceModal(true)}
          className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          <Check size={20} />
          Mark Attendance
        </button>

        {/* Subject Attendance Cards */}
        {attendance?.subjects && attendance.subjects.length > 0 ? (
          <div className="space-y-4">
            {attendance.subjects.map((subject) => {
              const stats = attendanceStats?.subjectStats?.find(
                (s) => s.subjectCode === subject.subjectCode
              );

              const projection = attendanceStats?.bunkingProjections?.find(
                (p) => p.subjectCode === subject.subjectCode
              );

              return (
                <div
                  key={subject.subjectCode}
                  className="bg-zinc-900/50 border border-white/10 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg">
                        {subject.subjectName}
                      </h4>
                      <p className="text-sm text-zinc-500">
                        {subject.subjectCode}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteSubject(subject.subjectCode)}
                      className="text-red-400 hover:text-red-500 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {stats && (
                    <div className="mb-4">
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-zinc-400">Attendance</span>
                          <span
                            className={
                              stats.attendancePercentage >= 75
                                ? "text-green-400 font-semibold"
                                : "text-red-400 font-semibold"
                            }
                          >
                            {stats.attendancePercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              stats.attendancePercentage >= 75
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${stats.attendancePercentage}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Attendance Stats */}
                      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                        <div className="text-center">
                          <div className="font-semibold text-blue-400">
                            {stats.totalClasses}
                          </div>
                          <div className="text-zinc-500">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-green-400">
                            {stats.classesAttended}
                          </div>
                          <div className="text-zinc-500">Present</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-red-400">
                            {stats.classesSkipped}
                          </div>
                          <div className="text-zinc-500">Absent</div>
                        </div>
                      </div>

                      {/* Bunking Projection */}
                      {projection && (
                        <div
                          className={`p-2 rounded flex items-gap-2 text-sm ${
                            projection.status === "SAFE"
                              ? "bg-green-500/10 text-green-300"
                              : "bg-red-500/10 text-red-300"
                          }`}
                        >
                          <AlertCircle
                            size={16}
                            className="mr-2 flex-shrink-0 mt-0.5"
                          />
                          <div>
                            {projection.status === "SAFE" ? (
                              <span>
                                You can skip{" "}
                                <strong>{projection.classesCanBeBunked}</strong>{" "}
                                more classes
                              </span>
                            ) : (
                              <span>
                                Need to attend{" "}
                                <strong>{projection.classesNeeded}</strong> more
                                classes
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attendance Records */}
                  {subject.attendanceRecords &&
                    subject.attendanceRecords.length > 0 && (
                      <div className="border-t border-white/5 pt-3 mt-3">
                        <div className="text-xs text-zinc-500 mb-2">
                          Recent Records:
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                          {subject.attendanceRecords
                            .slice(-5)
                            .reverse()
                            .map((record, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-zinc-400"
                              >
                                <span>
                                  {new Date(record.date).toLocaleDateString()}
                                </span>
                                <span
                                  className={
                                    record.status === "PRESENT"
                                      ? "text-green-400"
                                      : record.status === "ABSENT"
                                      ? "text-red-400"
                                      : "text-yellow-400"
                                  }
                                >
                                  {record.status}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-400">
            <p>No subjects added yet</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <main
      className={`flex-1 w-full p-6 text-white overflow-y-auto transition-all duration-300 pt-24 ${
        isSidebarOpen ? "lg:ml-72" : "lg:ml-0"
      }`}
    >
      <h2 className="text-3xl font-bold mb-6">Timetable & Attendance</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        <button
          onClick={() => setActiveTab("college")}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === "college"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-zinc-400 hover:text-zinc-300"
          }`}
        >
          College Schedule
        </button>
        <button
          onClick={() => setActiveTab("personal")}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === "personal"
              ? "text-purple-400 border-b-2 border-purple-400"
              : "text-zinc-400 hover:text-zinc-300"
          }`}
        >
          My Schedule
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === "attendance"
              ? "text-green-400 border-b-2 border-green-400"
              : "text-zinc-400 hover:text-zinc-300"
          }`}
        >
          Attendance
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "college" && renderCollegeTimetable()}
        {activeTab === "personal" && renderPersonalTimetable()}
        {activeTab === "attendance" && renderAttendanceTracker()}
      </div>

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg max-w-md w-full p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-4">Add Class</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Day</label>
                <select
                  value={newClass.day}
                  onChange={(e) =>
                    setNewClass({ ...newClass, day: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-white"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Time Slot
                </label>
                <input
                  type="text"
                  placeholder="e.g., 9:00 AM - 10:00 AM"
                  value={newClass.timeSlot}
                  onChange={(e) =>
                    setNewClass({ ...newClass, timeSlot: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Subject name"
                  value={newClass.subject}
                  onChange={(e) =>
                    setNewClass({ ...newClass, subject: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  placeholder="e.g., CS101"
                  value={newClass.subjectCode}
                  onChange={(e) =>
                    setNewClass({ ...newClass, subjectCode: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Professor (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Professor name"
                  value={newClass.professor}
                  onChange={(e) =>
                    setNewClass({ ...newClass, professor: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Room (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Room number"
                  value={newClass.room}
                  onChange={(e) =>
                    setNewClass({ ...newClass, room: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newClass.type}
                  onChange={(e) =>
                    setNewClass({ ...newClass, type: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-white"
                >
                  <option value="LECTURE">Lecture</option>
                  <option value="LAB">Lab</option>
                  <option value="TUTORIAL">Tutorial</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddClassModal(false)}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClass}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Class"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg max-w-md w-full p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-4">Add Subject for Tracking</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  placeholder="e.g., CS101"
                  value={newSubject.subjectCode}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      subjectCode: e.target.value,
                    })
                  }
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  placeholder="Subject name"
                  value={newSubject.subjectName}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      subjectName: e.target.value,
                    })
                  }
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubject}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Subject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {showMarkAttendanceModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg max-w-md w-full p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-4">Mark Attendance</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Subject
                </label>
                <select
                  value={attendanceMarking.subjectCode}
                  onChange={(e) =>
                    setAttendanceMarking({
                      ...attendanceMarking,
                      subjectCode: e.target.value,
                    })
                  }
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-white"
                >
                  <option value="">Select Subject</option>
                  {attendance?.subjects?.map((s) => (
                    <option key={s.subjectCode} value={s.subjectCode}>
                      {s.subjectName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={attendanceMarking.date}
                  onChange={(e) =>
                    setAttendanceMarking({
                      ...attendanceMarking,
                      date: e.target.value,
                    })
                  }
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Time Slot
                </label>
                <input
                  type="text"
                  placeholder="e.g., 9:00 AM - 10:00 AM"
                  value={attendanceMarking.timeSlot}
                  onChange={(e) =>
                    setAttendanceMarking({
                      ...attendanceMarking,
                      timeSlot: e.target.value,
                    })
                  }
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={attendanceMarking.status}
                  onChange={(e) =>
                    setAttendanceMarking({
                      ...attendanceMarking,
                      status: e.target.value,
                    })
                  }
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-white"
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LEAVE">Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  placeholder="Any notes"
                  value={attendanceMarking.notes}
                  onChange={(e) =>
                    setAttendanceMarking({
                      ...attendanceMarking,
                      notes: e.target.value,
                    })
                  }
                  className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-white h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMarkAttendanceModal(false)}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAttendance}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition disabled:opacity-50"
              >
                {loading ? "Marking..." : "Mark"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TimetablePage;
