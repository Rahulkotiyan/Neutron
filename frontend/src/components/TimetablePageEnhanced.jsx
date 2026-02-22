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
  MapPin,
  Zap,
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
      className={`flex-1 bg-black text-zinc-300 overflow-y-auto ${
        isSidebarOpen ? "" : ""
      }`}
    >
      {/* Background Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none opacity-50"></div>

      {/* Hero Header */}
      <div className="z-10 pt-4 pb-4 px-4 md:pt-6 md:pb-6 md:px-8 max-w-7xl mx-auto border-b border-white/5 sticky top-0 bg-black/50 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-wide uppercase mb-4">
              <Calendar size={14} /> Your Schedule
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3">
              Timetable &
              <br />
              Attendance
            </h1>
            <p className="text-zinc-400 text-lg max-w-xl">
              Manage your classes, track attendance, and prepare for upcoming
              exams all in one place.
            </p>
          </div>

          {currentClass?.current && (
            <div className="group relative inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] hover:shadow-[0_0_60px_-15px_rgba(59,130,246,0.5)] shrink-0 transition-all hover:scale-105 active:scale-95">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              <p className="text-sm font-bold text-white">
                Currently in: {currentClass.current.subject}
              </p>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-8">
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
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-900/30"
                    : "bg-zinc-900/40 border border-white/5 text-zinc-400 hover:border-white/20 hover:bg-zinc-900/60"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 py-8">
        {/* TIMETABLE TAB */}
        {activeTab === "timetable" && (
          <div className="space-y-8">
            {/* Current & Next Class */}
            {(currentClass?.current || currentClass?.next) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentClass?.current && (
                  <div className="group relative flex flex-col bg-gradient-to-br from-blue-950/40 via-blue-900/30 to-blue-950/40 backdrop-blur-md border border-blue-500/20 hover:border-blue-500/40 rounded-[2rem] overflow-hidden hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-blue-900/10 hover:shadow-blue-900/20 p-8">
                    {/* Glow effect */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-40"></div>

                    <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-3 opacity-80">
                      ● Live
                    </p>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {currentClass.current.subject}
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-blue-400" />
                        <p className="text-zinc-300">
                          {currentClass.current.room}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <BookOpen size={16} className="text-blue-400" />
                        <p className="text-zinc-300">
                          {currentClass.current.professor}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-blue-400" />
                        <p className="text-zinc-300">
                          {currentClass.current.timeSlot}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {currentClass?.next && (
                  <div className="group relative flex flex-col bg-gradient-to-br from-purple-950/40 via-purple-900/30 to-purple-950/40 backdrop-blur-md border border-purple-500/20 hover:border-purple-500/40 rounded-[2rem] overflow-hidden hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-purple-900/10 hover:shadow-purple-900/20 p-8">
                    {/* Glow effect */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-40"></div>

                    <p className="text-xs font-bold text-purple-300 uppercase tracking-widest mb-3 opacity-80">
                      Next Class
                    </p>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {currentClass.next.subject}
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-purple-400" />
                        <p className="text-zinc-300">
                          {currentClass.next.room}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <BookOpen size={16} className="text-purple-400" />
                        <p className="text-zinc-300">
                          {currentClass.next.professor}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-purple-400" />
                        <p className="text-zinc-300">
                          {currentClass.next.timeSlot}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Free Periods */}
            {freePeriods && freePeriods.length > 0 && (
              <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-[2rem] p-8 shadow-xl transition-all">
                <h3 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center">
                    <Clock size={20} className="text-green-400" />
                  </div>
                  Free Periods Today
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {freePeriods.map((period, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-br from-green-950/30 to-green-950/20 border border-green-500/20 hover:border-green-500/40 rounded-xl p-4 flex items-center justify-between transition-all hover:shadow-lg hover:shadow-green-900/20"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">
                          {period.start} - {period.end}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {period.duration} minutes free
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <Clock size={18} className="text-green-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Week View */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-[2rem] p-8 shadow-xl transition-all">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Weekly Schedule
                </h3>
                {currentUser && (
                  <button
                    onClick={() => setShowAddClassModal(true)}
                    className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50"
                  >
                    <Plus
                      size={18}
                      className="transition-transform group-hover:rotate-90"
                    />
                    <span>Add Class</span>
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {personalTimetable?.schedule &&
                personalTimetable.schedule.length > 0 ? (
                  personalTimetable.schedule.map((daySchedule) => (
                    <div
                      key={daySchedule.day}
                      className="border border-white/5 bg-zinc-900/30 hover:bg-zinc-900/50 rounded-2xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() =>
                          setExpandedDay(
                            expandedDay === daySchedule.day
                              ? null
                              : daySchedule.day,
                          )
                        }
                        className="w-full px-6 py-4 flex justify-between items-center hover:bg-white/5 transition"
                      >
                        <span className="font-bold text-lg text-white tracking-tight">
                          {daySchedule.day}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-zinc-400 font-semibold">
                            {daySchedule.classes
                              ? daySchedule.classes.length
                              : 0}{" "}
                            {daySchedule.classes?.length === 1
                              ? "class"
                              : "classes"}
                          </span>
                          {expandedDay === daySchedule.day ? (
                            <ChevronUp size={20} className="text-zinc-400" />
                          ) : (
                            <ChevronDown size={20} className="text-zinc-400" />
                          )}
                        </div>
                      </button>

                      {expandedDay === daySchedule.day && (
                        <div className="border-t border-white/5 p-6 space-y-4 bg-zinc-950/30">
                          {daySchedule.classes.length > 0 ? (
                            daySchedule.classes.map((cls) => (
                              <div
                                key={cls._id}
                                className="group relative bg-gradient-to-br from-zinc-800/60 to-zinc-900/40 backdrop-blur-sm border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-blue-900/10 transition-all p-6"
                                style={{
                                  borderLeftColor: cls.color || "#3498db",
                                  borderLeftWidth: "4px",
                                }}
                              >
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex-1">
                                    <h4 className="font-bold text-lg text-white mb-1">
                                      {cls.subject}
                                    </h4>
                                    <p className="text-xs text-zinc-400 font-semibold">
                                      {cls.subjectCode}
                                    </p>
                                  </div>
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => {
                                        setEditingClass(cls);
                                        setEditingDay(daySchedule.day);
                                        setEditingClassId(cls._id);
                                        setShowEditClassModal(true);
                                      }}
                                      className="p-2 hover:bg-blue-500/20 rounded-lg transition"
                                      title="Edit class"
                                    >
                                      <Edit2
                                        size={16}
                                        className="text-blue-400"
                                      />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteClass(
                                          daySchedule.day,
                                          cls._id,
                                        )
                                      }
                                      className="p-2 hover:bg-red-500/20 rounded-lg transition"
                                      title="Delete class"
                                    >
                                      <Trash2
                                        size={16}
                                        className="text-red-400"
                                      />
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                  <div className="flex items-center gap-2">
                                    <Clock
                                      size={14}
                                      className="text-zinc-500"
                                    />
                                    <div>
                                      <p className="text-[10px] text-zinc-500 uppercase font-bold">
                                        Time
                                      </p>
                                      <p className="font-semibold text-white">
                                        {cls.startTime} - {cls.endTime}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Palette
                                      size={14}
                                      className="text-zinc-500"
                                    />
                                    <div>
                                      <p className="text-[10px] text-zinc-500 uppercase font-bold">
                                        Type
                                      </p>
                                      <span
                                        className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                                        style={{
                                          backgroundColor: `${cls.color || "#3498db"}33`,
                                        }}
                                      >
                                        {cls.type}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="col-span-2 flex items-center gap-2">
                                    <BookOpen
                                      size={14}
                                      className="text-zinc-500"
                                    />
                                    <div>
                                      <p className="text-[10px] text-zinc-500 uppercase font-bold">
                                        Professor
                                      </p>
                                      <p className="font-semibold text-white">
                                        {cls.professor}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="col-span-2 flex items-center gap-2">
                                    <MapPin
                                      size={14}
                                      className="text-zinc-500"
                                    />
                                    <div>
                                      <p className="text-[10px] text-zinc-500 uppercase font-bold">
                                        Location
                                      </p>
                                      <p className="font-semibold text-white">
                                        {cls.room}
                                        {cls.building && `, ${cls.building}`}
                                      </p>
                                    </div>
                                  </div>
                                  {cls.customNote && (
                                    <div className="col-span-2 flex items-start gap-2">
                                      <AlertCircle
                                        size={14}
                                        className="text-zinc-500 mt-1"
                                      />
                                      <div>
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold">
                                          Note
                                        </p>
                                        <p className="text-sm text-zinc-300">
                                          {cls.customNote}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {cls.isEdited && (
                                  <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                                    <Edit2
                                      size={12}
                                      className="text-blue-400"
                                    />
                                    <p className="text-xs text-blue-400 font-medium">
                                      Manually edited
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-zinc-500">
                              <Clock
                                size={32}
                                className="mx-auto mb-3 opacity-50"
                              />
                              <p className="font-medium">
                                No classes scheduled
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 px-4 border border-white/5 rounded-2xl bg-zinc-900/20 backdrop-blur-sm">
                    <BookOpen
                      size={40}
                      className="mx-auto mb-4 text-zinc-600"
                    />
                    <p className="text-zinc-400 font-medium">
                      No classes added yet. Add your first class!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === "attendance" && (
          <div className="space-y-8">
            {/* Bunk Calculator */}
            {bunkAnalysis && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Bunk Manager
                  </h2>
                  {currentUser && (
                    <button
                      onClick={() => setShowAddSubjectModal(true)}
                      className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-900/30 hover:shadow-green-900/50"
                    >
                      <Plus
                        size={18}
                        className="transition-transform group-hover:rotate-90"
                      />
                      <span>Add Subject</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bunkAnalysis.map((subject) => {
                    const isSafe = subject.warning === "SAFE";
                    return (
                      <div
                        key={subject.subjectCode}
                        className="group relative flex flex-col bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-4xl p-8 shadow-xl transition-all hover:shadow-lg hover:-translate-y-1"
                        style={{
                          borderLeftColor: getAttendanceColor(
                            subject.currentPercentage,
                          ),
                          borderLeftWidth: "4px",
                        }}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-white mb-1">
                              {subject.subjectName}
                            </h4>
                            <p className="text-xs text-zinc-400 font-semibold">
                              {subject.subjectCode}
                            </p>
                          </div>
                          {isSafe ? (
                            <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center">
                              <CheckCircle
                                size={20}
                                className="text-green-400"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center">
                              <AlertTriangle
                                size={20}
                                className="text-red-400"
                              />
                            </div>
                          )}
                        </div>

                        {/* Percentage */}
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium text-zinc-400">
                              Attendance
                            </span>
                            <span className="font-bold text-2xl text-white">
                              {subject.currentPercentage}%
                            </span>
                          </div>
                          <div className="bg-zinc-800/50 rounded-full h-3 overflow-hidden border border-white/5">
                            <div
                              className="h-3 rounded-full transition-all duration-500"
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
                        <div className="grid grid-cols-2 gap-4 text-sm mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                          <div>
                            <p className="text-xs font-bold text-zinc-500 uppercase mb-1">
                              Total Classes
                            </p>
                            <p className="font-bold text-lg text-white">
                              {subject.totalClasses}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-500 uppercase mb-1">
                              Attended
                            </p>
                            <p className="font-bold text-lg text-green-400">
                              {subject.classesAttended}
                            </p>
                          </div>
                        </div>

                        {/* Bunk Info */}
                        {isSafe ? (
                          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                            <p className="text-sm font-bold text-green-300 flex items-center gap-2">
                              <CheckCircle size={16} /> Can bunk{" "}
                              {subject.canBunk} more classes
                            </p>
                          </div>
                        ) : (
                          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                            <p className="text-sm font-bold text-red-300 flex items-center gap-2">
                              <AlertTriangle size={16} /> Need to attend{" "}
                              {subject.needToAttend} more
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
              <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-[2rem] p-8 shadow-xl transition-all">
                <h3 className="text-xl font-bold text-white tracking-tight mb-6">
                  Subject Details
                </h3>
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
                      className="w-full bg-gradient-to-r from-zinc-800/50 to-zinc-900/30 hover:from-zinc-800/70 hover:to-zinc-900/50 rounded-xl p-5 flex justify-between items-center transition-all border border-white/5 hover:border-white/10"
                    >
                      <div className="text-left flex-1">
                        <p className="font-bold text-white">
                          {subject.subjectName}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          {subject.subjectCode}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-6">
                        <div>
                          <p className="text-2xl font-bold text-white">
                            {subject.attendancePercentage}%
                          </p>
                        </div>
                        {expandedSubject === subject.subjectCode ? (
                          <ChevronUp className="text-zinc-400" />
                        ) : (
                          <ChevronDown className="text-zinc-400" />
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
          <div className="space-y-8">
            {exams && exams.length > 0 ? (
              exams.map((examPeriod) => (
                <div
                  key={examPeriod._id}
                  className="bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-[2rem] p-8 shadow-xl overflow-hidden transition-all"
                >
                  <div className="mb-8 pb-6 border-b border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-center">
                        <AlertCircle size={20} className="text-yellow-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">
                        {examPeriod.examType} Exams
                      </h3>
                    </div>
                    <p className="text-sm text-zinc-400 font-medium">
                      {new Date(
                        examPeriod.examPeriod.startDate,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      -{" "}
                      {new Date(
                        examPeriod.examPeriod.endDate,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {examPeriod.exams.map((exam, idx) => (
                      <div
                        key={idx}
                        className="group relative bg-gradient-to-br from-yellow-950/30 to-yellow-950/10 backdrop-blur-sm border border-yellow-500/20 hover:border-yellow-500/40 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-yellow-900/20 transition-all p-6"
                        style={{
                          borderLeftColor: "#f59e0b",
                          borderLeftWidth: "4px",
                        }}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-white mb-1">
                              {exam.subject}
                            </h4>
                            <p className="text-xs text-zinc-400 font-semibold">
                              {exam.subjectCode}
                            </p>
                          </div>
                          <span className="px-3 py-1.5 bg-yellow-900/30 border border-yellow-500/30 text-yellow-300 rounded-lg text-xs font-bold flex items-center gap-2">
                            <Clock size={12} />
                            {exam.duration} min
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center shrink-0">
                              <Calendar size={16} className="text-yellow-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase">
                                Date & Time
                              </p>
                              <p className="font-semibold text-white text-sm mt-1">
                                {new Date(exam.examDate).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-zinc-400">
                                {exam.startTime} - {exam.endTime}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center shrink-0">
                              <MapPin size={16} className="text-yellow-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase">
                                Location
                              </p>
                              <p className="font-semibold text-white text-sm mt-1">
                                {exam.room}
                              </p>
                              {exam.building && (
                                <p className="text-xs text-zinc-400">
                                  {exam.building}
                                </p>
                              )}
                            </div>
                          </div>
                          {exam.totalMarks && (
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center shrink-0">
                                <Zap size={16} className="text-yellow-400" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase">
                                  Total Marks
                                </p>
                                <p className="font-bold text-white text-lg mt-1">
                                  {exam.totalMarks}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {exam.instructions && (
                          <div className="pt-6 border-t border-white/5">
                            <p className="text-xs font-bold text-zinc-500 uppercase mb-2">
                              Instructions
                            </p>
                            <p className="text-sm text-zinc-300 leading-relaxed">
                              {exam.instructions}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-16 text-center">
                <Calendar size={48} className="mx-auto mb-4 text-zinc-600" />
                <p className="text-zinc-400 font-medium text-lg">
                  No exam schedules available yet
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex flex-col max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-br from-blue-950/40 to-blue-900/20 backdrop-blur-md border-b border-white/5 p-6 md:p-8 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Add Class
                  </h2>
                  <p className="text-sm text-zinc-400 mt-2">
                    Schedule a new class to your timetable
                  </p>
                </div>
                <button
                  onClick={() => setShowAddClassModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
                >
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 md:p-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Day
                    </label>
                    <CustomDropdown
                      colorScheme="blue"
                      options={daysOfWeek.map((day) => ({
                        value: day,
                        label: day,
                      }))}
                      value={newClass.day}
                      onChange={(value) =>
                        setNewClass({ ...newClass, day: value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Type
                    </label>
                    <CustomDropdown
                      colorScheme="blue"
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newClass.startTime}
                      onChange={(e) =>
                        setNewClass({ ...newClass, startTime: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newClass.endTime}
                      onChange={(e) =>
                        setNewClass({ ...newClass, endTime: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Data Structures"
                    value={newClass.subject}
                    onChange={(e) =>
                      setNewClass({ ...newClass, subject: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-zinc-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Subject Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., CS201"
                      value={newClass.subjectCode}
                      onChange={(e) =>
                        setNewClass({
                          ...newClass,
                          subjectCode: e.target.value,
                        })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Color
                    </label>
                    <input
                      type="color"
                      value={newClass.color}
                      onChange={(e) =>
                        setNewClass({ ...newClass, color: e.target.value })
                      }
                      className="w-full h-11 bg-zinc-900 border border-white/10 rounded-lg cursor-pointer transition-all hover:border-white/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                    Professor
                  </label>
                  <input
                    type="text"
                    placeholder="Professor name"
                    value={newClass.professor}
                    onChange={(e) =>
                      setNewClass({ ...newClass, professor: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                    Professor Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="professor@college.edu"
                    value={newClass.professorEmail}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        professorEmail: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-zinc-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Room
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 101"
                      value={newClass.room}
                      onChange={(e) =>
                        setNewClass({ ...newClass, room: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Building (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Building A"
                      value={newClass.building}
                      onChange={(e) =>
                        setNewClass({ ...newClass, building: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                    Custom Note (Optional)
                  </label>
                  <textarea
                    placeholder="Add any additional notes about this class..."
                    value={newClass.customNote}
                    onChange={(e) =>
                      setNewClass({ ...newClass, customNote: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-zinc-600 h-24 resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <input
                    type="checkbox"
                    checked={newClass.notificationsEnabled}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        notificationsEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-white/20 bg-blue-500 cursor-pointer"
                  />
                  <label className="text-sm font-medium text-white cursor-pointer">
                    Enable notifications for this class
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gradient-to-t from-zinc-950 to-zinc-950/50 backdrop-blur-md border-t border-white/5 p-6 md:p-8 flex gap-3 justify-end">
                <button
                  onClick={() => setShowAddClassModal(false)}
                  className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddClass}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-blue-900/30"
                >
                  {loading ? (
                    <>
                      <Clock size={16} className="animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add Class
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-green-950/40 to-green-900/20 backdrop-blur-md border-b border-white/5 p-6 md:p-8 flex items-start justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Add Subject
                </h2>
                <p className="text-sm text-zinc-400 mt-2">
                  Add a subject to track attendance
                </p>
              </div>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
              >
                <X size={20} className="text-zinc-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-5">
              <div>
                <label className="block text-sm font-bold text-white mb-2 tracking-tight">
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
                  className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-all placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2 tracking-tight">
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
                  className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-all placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gradient-to-t from-zinc-950 to-zinc-950/50 backdrop-blur-md border-t border-white/5 p-6 md:p-8 flex gap-3 justify-end">
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubject}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-green-900/30"
              >
                {loading ? (
                  <>
                    <Clock size={16} className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Add Subject
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TimetablePageEnhanced;
