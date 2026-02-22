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
  Edit2,
  Bell,
  Palette,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import CustomDropdown from "./CustomDropdown";

const TimetablePageEnhanced = ({ isSidebarOpen, currentUser, token }) => {
  const [activeTab, setActiveTab] = useState("timetable"); // timetable, attendance, exams
  const [viewMode, setViewMode] = useState("WEEK"); // WEEK, DAY
  const [loading, setLoading] = useState(false);
  const [personalTimetable, setPersonalTimetable] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [bunkAnalysis, setBunkAnalysis] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [currentClass, setCurrentClass] = useState(null);
  const [freePeriods, setFreePeriods] = useState([]);
  const [exams, setExams] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);

  // Form states
  const [newClass, setNewClass] = useState({
    day: "Monday",
    startTime: "09:00",
    endTime: "10:00",
    subject: "",
    subjectCode: "",
    professor: "",
    professorEmail: "",
    room: "",
    building: "",
    type: "LECTURE",
    color: "#3498db",
    customNote: "",
    notificationsEnabled: true,
    notificationTimes: [10, 30],
  });

  const [editingClass, setEditingClass] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [editingClassId, setEditingClassId] = useState(null);

  const [newSubject, setNewSubject] = useState({
    subjectCode: "",
    subjectName: "",
  });

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const classTypeColors = {
    LECTURE: "#3498db",
    LAB: "#2ecc71",
    TUTORIAL: "#e74c3c",
  };

  // Fetch data on mount
  useEffect(() => {
    if (token) {
      fetchPersonalTimetable();
      fetchAttendance();
      fetchBunkAnalysis();
      fetchTodaySchedule();
      fetchCurrentClass();
      fetchFreePeriods();
      fetchExams();
    }
  }, [token]);

  // ==================== TIMETABLE FUNCTIONS ====================

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

  const fetchTodaySchedule = async () => {
    try {
      const res = await axios.get("/api/timetable/personal/today", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodaySchedule(res.data.data);
    } catch (error) {
      console.error("Error fetching today's schedule:", error);
    }
  };

  const fetchCurrentClass = async () => {
    try {
      const res = await axios.get("/api/timetable/personal/current-class", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentClass(res.data.data);
    } catch (error) {
      console.error("Error fetching current class:", error);
    }
  };

  const fetchFreePeriods = async () => {
    try {
      const res = await axios.get("/api/timetable/personal/free-periods", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFreePeriods(res.data.data || []);
    } catch (error) {
      console.error("Error fetching free periods:", error);
      setFreePeriods([]);
    }
  };

  const handleAddClass = async () => {
    try {
      setLoading(true);
      await axios.post("/api/timetable/personal/class", newClass, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowAddClassModal(false);
      setNewClass({
        day: "Monday",
        startTime: "09:00",
        endTime: "10:00",
        subject: "",
        subjectCode: "",
        professor: "",
        professorEmail: "",
        room: "",
        building: "",
        type: "LECTURE",
        color: "#3498db",
        customNote: "",
        notificationsEnabled: true,
        notificationTimes: [10, 30],
      });
      fetchPersonalTimetable();
    } catch (error) {
      console.error("Error adding class:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClass = async () => {
    try {
      setLoading(true);
      await axios.put(
        `/api/timetable/personal/class/${editingDay}/${editingClassId}`,
        editingClass,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setShowEditClassModal(false);
      fetchPersonalTimetable();
    } catch (error) {
      console.error("Error editing class:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (day, classId) => {
    try {
      setLoading(true);
      await axios.delete(`/api/timetable/personal/class/${day}/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPersonalTimetable();
    } catch (error) {
      console.error("Error deleting class:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== ATTENDANCE FUNCTIONS ====================

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

  const fetchBunkAnalysis = async () => {
    try {
      const res = await axios.get("/api/timetable/attendance/bunk-capacity", {
        headers: { Authorization: `Bearer ${token}` },
        params: { required: 75 },
      });
      setBunkAnalysis(res.data.data);
    } catch (error) {
      console.error("Error fetching bunk analysis:", error);
    }
  };

  const handleAddSubject = async () => {
    try {
      setLoading(true);
      await axios.post("/api/timetable/attendance/subject", newSubject, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowAddSubjectModal(false);
      setNewSubject({ subjectCode: "", subjectName: "" });
      fetchAttendance();
    } catch (error) {
      console.error("Error adding subject:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return "#2ecc71"; // Green
    if (percentage >= 65) return "#f39c12"; // Yellow
    return "#e74c3c"; // Red
  };

  const getAttendanceStatus = (percentage) => {
    if (percentage >= 75) return "SAFE";
    if (percentage >= 65) return "WARNING";
    return "CRITICAL";
  };

  // ==================== EXAM FUNCTIONS ====================

  const fetchExams = async () => {
    try {
      const res = await axios.get("/api/timetable/exam-schedule", {
        params: {
          college: currentUser?.college,
          branch: currentUser?.branch,
          semester: currentUser?.semester,
        },
      });
      setExams(res.data.data);
    } catch (error) {
      console.error("Error fetching exams:", error);
    }
  };

  // ==================== RENDER FUNCTIONS ====================

  return (
    <main
      className={`flex-1 bg-zinc-900 text-white overflow-y-auto ${
        isSidebarOpen ? "" : ""
      }`}
    >
      {/* Header */}
      <div className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-white/10 p-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Timetable & Attendance</h1>
            {currentClass?.current && (
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 rounded-lg">
                <p className="text-sm font-medium">
                  Currently in: {currentClass.current.subject}
                </p>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2">
            {[
              { id: "timetable", label: "Timetable", icon: Calendar },
              {
                id: "attendance",
                label: "Attendance",
                icon: CheckCircle,
              },
              { id: "exams", label: "Exams", icon: AlertCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    activeTab === tab.id
                      ? "bg-blue-600"
                      : "bg-zinc-800 hover:bg-zinc-700"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* TIMETABLE TAB */}
        {activeTab === "timetable" && (
          <div className="space-y-6">
            {/* Current & Next Class */}
            {(currentClass?.current || currentClass?.next) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentClass?.current && (
                  <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6">
                    <p className="text-sm font-medium text-blue-200 mb-2">
                      CURRENT CLASS
                    </p>
                    <h3 className="text-2xl font-bold mb-2">
                      {currentClass.current.subject}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>📍 {currentClass.current.room}</p>
                      <p>👨‍🏫 {currentClass.current.professor}</p>
                      <p>🕐 {currentClass.current.timeSlot}</p>
                    </div>
                  </div>
                )}
                {currentClass?.next && (
                  <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6">
                    <p className="text-sm font-medium text-purple-200 mb-2">
                      NEXT CLASS
                    </p>
                    <h3 className="text-2xl font-bold mb-2">
                      {currentClass.next.subject}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>📍 {currentClass.next.room}</p>
                      <p>👨‍🏫 {currentClass.next.professor}</p>
                      <p>🕐 {currentClass.next.timeSlot}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Free Periods */}
            {freePeriods && freePeriods.length > 0 && (
              <div className="bg-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock size={20} /> Free Periods Today
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {freePeriods.map((period, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-700 rounded p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {period.start} - {period.end}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {period.duration} minutes
                        </p>
                      </div>
                      <Clock size={20} className="text-green-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Week View */}
            <div className="bg-zinc-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Weekly Schedule</h3>
                <button
                  onClick={() => setShowAddClassModal(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition"
                >
                  <Plus size={18} />
                  Add Class
                </button>
              </div>

              <div className="space-y-3">
                {personalTimetable?.schedule &&
                personalTimetable.schedule.length > 0 ? (
                  personalTimetable.schedule.map((daySchedule) => (
                    <div
                      key={daySchedule.day}
                      className="border border-white/10 rounded"
                    >
                      <button
                        onClick={() =>
                          setExpandedDay(
                            expandedDay === daySchedule.day
                              ? null
                              : daySchedule.day,
                          )
                        }
                        className="w-full px-4 py-3 flex justify-between items-center hover:bg-zinc-700/50 transition"
                      >
                        <span className="font-semibold text-lg">
                          {daySchedule.day}
                        </span>
                        <span className="text-sm text-zinc-400">
                          {daySchedule.classes ? daySchedule.classes.length : 0}{" "}
                          classes
                        </span>
                        {expandedDay === daySchedule.day ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>

                      {expandedDay === daySchedule.day && (
                        <div className="border-t border-white/10 p-4 space-y-3">
                          {daySchedule.classes.length > 0 ? (
                            daySchedule.classes.map((cls) => (
                              <div
                                key={cls._id}
                                className="bg-zinc-700/50 rounded p-4 border-l-4"
                                style={{
                                  borderLeftColor: cls.color || "#3498db",
                                }}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-semibold text-lg">
                                      {cls.subject}
                                    </h4>
                                    <p className="text-sm text-zinc-400">
                                      {cls.subjectCode}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingClass(cls);
                                        setEditingDay(daySchedule.day);
                                        setEditingClassId(cls._id);
                                        setShowEditClassModal(true);
                                      }}
                                      className="p-2 hover:bg-zinc-600 rounded transition"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteClass(
                                          daySchedule.day,
                                          cls._id,
                                        )
                                      }
                                      className="p-2 hover:bg-red-900/30 rounded transition"
                                    >
                                      <Trash2
                                        size={16}
                                        className="text-red-400"
                                      />
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-zinc-400">Time</p>
                                    <p className="font-medium">
                                      {cls.startTime} - {cls.endTime}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-zinc-400">Type</p>
                                    <p className="font-medium">{cls.type}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-zinc-400">Professor</p>
                                    <p className="font-medium">
                                      {cls.professor}
                                    </p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-zinc-400">Location</p>
                                    <p className="font-medium">
                                      {cls.room}
                                      {cls.building && `, ${cls.building}`}
                                    </p>
                                  </div>
                                  {cls.customNote && (
                                    <div className="col-span-2">
                                      <p className="text-zinc-400">Note</p>
                                      <p className="text-sm">
                                        {cls.customNote}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {cls.isEdited && (
                                  <p className="text-xs text-blue-400 mt-2">
                                    ✏️ Manually edited
                                  </p>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-zinc-400 py-4">
                              No classes scheduled
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-zinc-400">
                    <p>No classes added yet. Add your first class!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            {/* Bunk Calculator */}
            {bunkAnalysis && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Bunk Manager</h3>
                  <button
                    onClick={() => setShowAddSubjectModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition"
                  >
                    <Plus size={18} />
                    Add Subject
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bunkAnalysis.map((subject) => {
                    const isSafe = subject.warning === "SAFE";
                    return (
                      <div
                        key={subject.subjectCode}
                        className="bg-zinc-800 rounded-lg p-6 border-l-4"
                        style={{
                          borderLeftColor: getAttendanceColor(
                            subject.currentPercentage,
                          ),
                        }}
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
                          {isSafe ? (
                            <CheckCircle size={24} className="text-green-400" />
                          ) : (
                            <AlertTriangle size={24} className="text-red-400" />
                          )}
                        </div>

                        {/* Percentage */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm">Attendance</span>
                            <span className="font-bold text-lg">
                              {subject.currentPercentage}%
                            </span>
                          </div>
                          <div className="bg-zinc-700 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${subject.currentPercentage}%`,
                                backgroundColor: getAttendanceColor(
                                  subject.currentPercentage,
                                ),
                              }}
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                          <div>
                            <p className="text-zinc-400">Total Classes</p>
                            <p className="font-semibold">
                              {subject.totalClasses}
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-400">Attended</p>
                            <p className="font-semibold text-green-400">
                              {subject.classesAttended}
                            </p>
                          </div>
                        </div>

                        {/* Bunk Info */}
                        {isSafe ? (
                          <div className="bg-green-900/20 border border-green-700 rounded p-3">
                            <p className="text-sm font-medium text-green-300">
                              ✅ Can bunk {subject.canBunk} more classes
                            </p>
                          </div>
                        ) : (
                          <div className="bg-red-900/20 border border-red-700 rounded p-3">
                            <p className="text-sm font-medium text-red-300">
                              ⚠️ Need to attend {subject.needToAttend} more
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subject Attendance Details */}
            {attendance?.subjects && (
              <div className="bg-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Subject Details</h3>
                <div className="space-y-3">
                  {attendance.subjects.map((subject) => (
                    <button
                      key={subject.subjectCode}
                      onClick={() =>
                        setExpandedSubject(
                          expandedSubject === subject.subjectCode
                            ? null
                            : subject.subjectCode,
                        )
                      }
                      className="w-full bg-zinc-700/50 hover:bg-zinc-700 rounded p-4 flex justify-between items-center transition border border-white/10"
                    >
                      <div className="text-left">
                        <p className="font-semibold">{subject.subjectName}</p>
                        <p className="text-sm text-zinc-400">
                          {subject.subjectCode}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-lg font-bold">
                            {subject.attendancePercentage}%
                          </p>
                        </div>
                        {expandedSubject === subject.subjectCode ? (
                          <ChevronUp />
                        ) : (
                          <ChevronDown />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* EXAMS TAB */}
        {activeTab === "exams" && (
          <div className="space-y-6">
            {exams && exams.length > 0 ? (
              exams.map((examPeriod) => (
                <div
                  key={examPeriod._id}
                  className="bg-zinc-800 rounded-lg p-6"
                >
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">
                      {examPeriod.examType} Exams
                    </h3>
                    <p className="text-sm text-zinc-400">
                      {new Date(
                        examPeriod.examPeriod.startDate,
                      ).toLocaleDateString()}{" "}
                      -{" "}
                      {new Date(
                        examPeriod.examPeriod.endDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {examPeriod.exams.map((exam, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-700/50 rounded p-4 border-l-4 border-yellow-500"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{exam.subject}</h4>
                            <p className="text-sm text-zinc-400">
                              {exam.subjectCode}
                            </p>
                          </div>
                          <span className="text-sm bg-yellow-900/30 text-yellow-300 px-3 py-1 rounded">
                            {exam.duration} min
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-zinc-400">Date & Time</p>
                            <p className="font-medium">
                              {new Date(exam.examDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm">
                              {exam.startTime} - {exam.endTime}
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-400">Location</p>
                            <p className="font-medium">{exam.room}</p>
                            {exam.building && (
                              <p className="text-sm">{exam.building}</p>
                            )}
                          </div>
                          {exam.totalMarks && (
                            <div>
                              <p className="text-zinc-400">Total Marks</p>
                              <p className="font-medium">{exam.totalMarks}</p>
                            </div>
                          )}
                        </div>

                        {exam.instructions && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-sm text-zinc-400">
                              Instructions:
                            </p>
                            <p className="text-sm mt-1">{exam.instructions}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-zinc-800 rounded-lg p-12 text-center">
                <Calendar size={48} className="mx-auto mb-4 text-zinc-600" />
                <p className="text-zinc-400">No exam schedules available yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Add Class</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Day</label>
                <CustomDropdown
                  colorScheme="green"
                  options={daysOfWeek.map((day) => ({
                    value: day,
                    label: day,
                  }))}
                  value={newClass.day}
                  onChange={(value) => setNewClass({ ...newClass, day: value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newClass.startTime}
                    onChange={(e) =>
                      setNewClass({ ...newClass, startTime: e.target.value })
                    }
                    className="w-full bg-zinc-700 border border-white/10 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newClass.endTime}
                    onChange={(e) =>
                      setNewClass({ ...newClass, endTime: e.target.value })
                    }
                    className="w-full bg-zinc-700 border border-white/10 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g., Data Structures"
                  value={newClass.subject}
                  onChange={(e) =>
                    setNewClass({ ...newClass, subject: e.target.value })
                  }
                  className="w-full bg-zinc-700 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  placeholder="e.g., CS201"
                  value={newClass.subjectCode}
                  onChange={(e) =>
                    setNewClass({ ...newClass, subjectCode: e.target.value })
                  }
                  className="w-full bg-zinc-700 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Professor
                </label>
                <input
                  type="text"
                  placeholder="Professor name"
                  value={newClass.professor}
                  onChange={(e) =>
                    setNewClass({ ...newClass, professor: e.target.value })
                  }
                  className="w-full bg-zinc-700 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Professor Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="professor@college.edu"
                  value={newClass.professorEmail}
                  onChange={(e) =>
                    setNewClass({ ...newClass, professorEmail: e.target.value })
                  }
                  className="w-full bg-zinc-700 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Room</label>
                  <input
                    type="text"
                    placeholder="e.g., 101"
                    value={newClass.room}
                    onChange={(e) =>
                      setNewClass({ ...newClass, room: e.target.value })
                    }
                    className="w-full bg-zinc-700 border border-white/10 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Building (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Building A"
                    value={newClass.building}
                    onChange={(e) =>
                      setNewClass({ ...newClass, building: e.target.value })
                    }
                    className="w-full bg-zinc-700 border border-white/10 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <CustomDropdown
                    colorScheme="green"
                    options={[
                      { value: "LECTURE", label: "Lecture" },
                      { value: "LAB", label: "Lab" },
                      { value: "TUTORIAL", label: "Tutorial" },
                    ]}
                    value={newClass.type}
                    onChange={(value) =>
                      setNewClass({
                        ...newClass,
                        type: value,
                        color: classTypeColors[value],
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={newClass.color}
                    onChange={(e) =>
                      setNewClass({ ...newClass, color: e.target.value })
                    }
                    className="w-full h-10 bg-zinc-700 border border-white/10 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Custom Note (Optional)
                </label>
                <textarea
                  placeholder="Any additional notes"
                  value={newClass.customNote}
                  onChange={(e) =>
                    setNewClass({ ...newClass, customNote: e.target.value })
                  }
                  className="w-full bg-zinc-700 border border-white/10 rounded px-3 py-2 text-white h-20 resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={newClass.notificationsEnabled}
                  onChange={(e) =>
                    setNewClass({
                      ...newClass,
                      notificationsEnabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <label className="text-sm font-medium">
                  Enable Notifications
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddClassModal(false)}
                className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClass}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Class"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Add Subject</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  placeholder="e.g., CS201"
                  value={newSubject.subjectCode}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      subjectCode: e.target.value,
                    })
                  }
                  className="w-full bg-zinc-700 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Data Structures"
                  value={newSubject.subjectName}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      subjectName: e.target.value,
                    })
                  }
                  className="w-full bg-zinc-700 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubject}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Subject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TimetablePageEnhanced;
