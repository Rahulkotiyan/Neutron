import React, { useState, useEffect } from "react";
import api from "../utils/api";
import {
  Plus,
  Trash,
  Check,
  Xmark,
  Clock,
  Book,
  InfoCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  EditPencil,
  Bell,
  Palette,
  WarningTriangle,
  CheckCircle,
  MapPin,
  Star,
} from "iconoir-react";
import CustomDropdown from "./CustomDropdown";

const TimetablePageEnhanced = ({ isSidebarOpen, currentUser, token }) => {
  const [activeTab, setActiveTab] = useState("timetable"); // timetable, attendance, exams
  const [viewMode, setViewMode] = useState("WEEK"); // WEEK, DAY
  const [loading, setLoading] = useState(false);
  const [additionalTimeSlots, setAdditionalTimeSlots] = useState([]);
  const [personalTimetable, setPersonalTimetable] = useState(null);
  const [studentExams, setStudentExams] = useState([]);
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [showEditExamModal, setShowEditExamModal] = useState(false);
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
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showDeleteSubjectModal, setShowDeleteSubjectModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [calculatorForm, setCalculatorForm] = useState({
    totalClasses: "",
    attendedClasses: "",
    requiredPercentage: 75,
  });

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

  const [newExam, setNewExam] = useState({
    subject: "",
    subjectCode: "",
    examDate: "",
    startTime: "",
    endTime: "",
    duration: "",
    room: "",
    building: "",
    totalMarks: "",
    instructions: "",
    notificationsEnabled: true,
    notificationTimes: [60, 30, 10], // minutes before exam
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
      fetchStudentExams();
    }
  }, [token]);

  // ==================== TIMETABLE FUNCTIONS ====================

  const fetchPersonalTimetable = async () => {
    try {
      const res = await api.get("/timetable/personal");
      setPersonalTimetable(res.data.data);
    } catch (error) {
      console.error("Error fetching personal timetable:", error);
      setPersonalTimetable(null);
    }
  };

  const fetchTodaySchedule = async () => {
    try {
      const res = await api.get("/timetable/personal/today");
      setTodaySchedule(res.data.data);
    } catch (error) {
      console.error("Error fetching today's schedule:", error);
      setTodaySchedule(null);
    }
  };

  const fetchCurrentClass = async () => {
    try {
      const res = await api.get("/timetable/personal/current-class");
      setCurrentClass(res.data.data);
    } catch (error) {
      console.error("Error fetching current class:", error);
      setCurrentClass(null);
    }
  };

  const fetchFreePeriods = async () => {
    try {
      const res = await api.get("/timetable/personal/free-periods");
      setFreePeriods(res.data.data || []);
    } catch (error) {
      console.error("Error fetching free periods:", error);
      setFreePeriods([]);
    }
  };

  const handleAddClass = async () => {
    try {
      setLoading(true);
      await api.post("/timetable/personal/class", newClass);
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
      alert(
        "Error adding class: " + (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditClass = async () => {
    try {
      setLoading(true);
      await api.put(
        `/timetable/personal/class/${editingDay}/${editingClassId}`,
        editingClass,
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
      await api.delete(`/timetable/personal/class/${day}/${classId}`);
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
      const res = await api.get("/timetable/attendance");
      setAttendance(res.data.data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendance(null);
    }
  };

  const fetchBunkAnalysis = async () => {
    try {
      const res = await api.get("/timetable/attendance/bunk-capacity", {
        params: { required: 75 },
      });
      setBunkAnalysis(res.data.data);
    } catch (error) {
      console.error("Error fetching bunk analysis:", error);
      setBunkAnalysis(null);
    }
  };

  const handleAddSubject = async () => {
    try {
      setLoading(true);
      await api.post("/timetable/attendance/subject", newSubject);
      setShowAddSubjectModal(false);
      setNewSubject({ subjectCode: "", subjectName: "" });
      fetchAttendance();
      fetchBunkAnalysis();
    } catch (error) {
      console.error("Error adding subject:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (subjectCode, date, timeSlot, status, notes = "") => {
    try {
      setLoading(true);
      await api.post("/timetable/attendance/mark", {
        subjectCode,
        date,
        timeSlot,
        status,
        notes,
      });
      fetchAttendance();
      fetchBunkAnalysis();
      setShowMarkAttendanceModal(false);
      setSelectedSubject(null);
      // Reset form
      setAttendanceForm({
        date: new Date().toISOString().split('T')[0],
        timeSlot: "09:00-10:00",
        status: "PRESENT",
        notes: "",
      });
    } catch (error) {
      console.error("Error marking attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectCode) => {
    try {
      setLoading(true);
      await api.delete(`/timetable/attendance/subject/${subjectCode}`);
      setShowDeleteSubjectModal(false);
      setSubjectToDelete(null);
      fetchAttendance();
      fetchBunkAnalysis();
    } catch (error) {
      console.error("Error deleting subject:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOverallAttendanceStats = () => {
    if (!attendance?.subjects || attendance.subjects.length === 0) {
      return {
        totalSubjects: 0,
        averageAttendance: 0,
        safeSubjects: 0,
        criticalSubjects: 0,
        totalClasses: 0,
        totalAttended: 0,
      };
    }

    const subjects = attendance.subjects;
    const totalClasses = subjects.reduce((sum, sub) => sum + sub.totalClasses, 0);
    const totalAttended = subjects.reduce((sum, sub) => sum + sub.classesAttended, 0);
    const averageAttendance = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;
    const safeSubjects = subjects.filter(sub => getAttendancePercentage(sub) >= 75).length;
    const criticalSubjects = subjects.filter(sub => getAttendancePercentage(sub) < 75).length;

    return {
      totalSubjects: subjects.length,
      averageAttendance: averageAttendance.toFixed(1),
      safeSubjects,
      criticalSubjects,
      totalClasses,
      totalAttended,
    };
  };

  const getAttendancePercentage = (subject) => {
    if (!subject || subject.totalClasses === 0) return 0;
    return parseFloat(((subject.classesAttended / subject.totalClasses) * 100).toFixed(1));
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

  const calculateAttendance = () => {
    const totalClasses = parseInt(calculatorForm.totalClasses) || 0;
    const attendedClasses = parseInt(calculatorForm.attendedClasses) || 0;
    const requiredPercentage = calculatorForm.requiredPercentage;
    
    if (totalClasses === 0) {
      return {
        currentPercentage: 0,
        canBunk: 0,
        needToAttend: 0,
        status: "NO DATA",
      };
    }

    const currentPercentage = ((attendedClasses / totalClasses) * 100).toFixed(1);
    
    if (parseFloat(currentPercentage) >= requiredPercentage) {
      // Correct bunk formula: 
      // Let x = number of classes you can bunk
      // (attended / (total + x)) * 100 = required
      // attended = required/100 * (total + x)
      // attended = required/100 * total + required/100 * x
      // attended - required/100 * total = required/100 * x
      // x = (attended - required/100 * total) / (required/100)
      const canBunk = Math.floor(
        (attendedClasses - (requiredPercentage / 100) * totalClasses) / 
        (requiredPercentage / 100)
      );
      return {
        currentPercentage: parseFloat(currentPercentage),
        canBunk: Math.max(0, canBunk),
        needToAttend: 0,
        status: "SAFE",
      };
    } else {
      // Correct need to attend formula:
      // Let x = classes needed to attend
      // (attended + x) / (total + x) * 100 = required
      // attended + x = required/100 * (total + x)
      // attended + x = required/100 * total + required/100 * x
      // attended - required/100 * total = required/100 * x - x
      // attended - required/100 * total = x * (required/100 - 1)
      // x = (attended - required/100 * total) / (required/100 - 1)
      const needToAttend = Math.ceil(
        ((requiredPercentage / 100) * totalClasses - attendedClasses) / 
        (1 - requiredPercentage / 100)
      );
      return {
        currentPercentage: parseFloat(currentPercentage),
        canBunk: 0,
        needToAttend: Math.max(0, needToAttend),
        status: "CRITICAL",
      };
    }
  };

  // ==================== EXAM FUNCTIONS ====================

  const fetchExams = async () => {
    try {
      const res = await api.get("/timetable/exam-schedule", {
        params: {
          college: currentUser?.college,
          branch: currentUser?.branch,
          semester: currentUser?.semester,
        },
      });
      setExams(res.data.data);
    } catch (error) {
      console.error("Error fetching exams:", error);
      // Don't show error alert for missing exam data - it's optional
      setExams(null);
    }
  };

  const fetchStudentExams = async () => {
    try {
      const res = await api.get("/timetable/student-exams");
      setStudentExams(res.data.data || []);
    } catch (error) {
      console.error("Error fetching student exams:", error);
      setStudentExams([]);
    }
  };

  const handleAddExam = async () => {
    try {
      setLoading(true);
      const examData = {
        ...newExam,
        duration: parseInt(newExam.duration) || 120,
        totalMarks: parseInt(newExam.totalMarks) || null,
      };
      
      await api.post("/timetable/student-exam", examData);
      
      setShowAddExamModal(false);
      setNewExam({
        subject: "",
        subjectCode: "",
        examDate: "",
        startTime: "",
        endTime: "",
        duration: "",
        room: "",
        building: "",
        totalMarks: "",
        instructions: "",
        notificationsEnabled: true,
        notificationTimes: [60, 30, 10],
      });
      
      fetchStudentExams();
      
      // Schedule notifications if enabled
      if (examData.notificationsEnabled) {
        scheduleExamNotifications(examData);
      }
    } catch (error) {
      console.error("Error adding exam:", error);
      alert("Error adding exam: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEditExam = async () => {
    try {
      setLoading(true);
      await api.put(`/timetable/student-exam/${editingExam._id}`, editingExam);
      
      setShowEditExamModal(false);
      setEditingExam(null);
      fetchStudentExams();
      
      // Reschedule notifications if enabled
      if (editingExam.notificationsEnabled) {
        scheduleExamNotifications(editingExam);
      }
    } catch (error) {
      console.error("Error editing exam:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    try {
      setLoading(true);
      await api.delete(`/timetable/student-exam/${examId}`);
      fetchStudentExams();
    } catch (error) {
      console.error("Error deleting exam:", error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleExamNotifications = (exam) => {
    if (!exam.notificationsEnabled || !exam.notificationTimes) return;
    
    const examDateTime = new Date(`${exam.examDate}T${exam.startTime}`);
    
    exam.notificationTimes.forEach(minutes => {
      const notificationTime = new Date(examDateTime.getTime() - minutes * 60000);
      const now = new Date();
      
      if (notificationTime > now) {
        // Schedule notification (in a real app, this would integrate with notification service)
        console.log(`Notification scheduled for ${exam.subject} at ${notificationTime.toLocaleString()}`);
      }
    });
  };

  // ==================== RENDER FUNCTIONS ====================

  return (
    <main
      className={`flex-1 bg-black text-zinc-300 overflow-y-auto transition-all duration-300 ${
        isSidebarOpen ? "lg:ml-72" : ""
      }`}
    >
      {/* Background Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none opacity-50"></div>

      {/* Hero Header */}
      <div className="z-10 pt-4 pb-4 px-4 md:pt-6 md:pb-6 md:px-8 max-w-7xl mx-auto border-b border-white/5 sticky top-0 bg-black/50 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black-500/10 border border-white-500/20 text-white-400 text-xs font-bold tracking-wide uppercase mb-4">
               Your Schedule
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
            { id: "exams", label: "Exams", icon: InfoCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-white text-black shadow-lg "
                    : "bg-zinc-900/40 border border-white/5 white-400 hover:border-white/20 hover:bg-zinc-900/60"
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
                        <Book size={16} className="text-blue-400" />
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
                        <Book size={16} className="text-purple-400" />
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

            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-[2rem] p-8 shadow-xl transition-all">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Weekly Timetable
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const nextHour = 14 + additionalTimeSlots.length; // Start from 2 PM
                      if (nextHour <= 23) { // Don't go beyond 11 PM
                        const hour12 = nextHour > 12 ? nextHour - 12 : nextHour === 0 ? 12 : nextHour;
                        const ampm = nextHour >= 12 ? 'PM' : 'AM';
                        const newTimeSlot = `${hour12}:00 ${ampm}`;
                        setAdditionalTimeSlots([...additionalTimeSlots, newTimeSlot]);
                      }
                    }}
                    className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-700 text-white rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
                    title="Add more time slots"
                  >
                    <Plus size={16} />
                    <span className="hidden sm:inline">Add Time</span>
                  </button>
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
              </div>

              {/* Calendar Grid */}
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header Row - Days */}
                  <div className="grid grid-cols-8 gap-2 mb-4">
                    <div className="p-3 text-center">
                      <p className="text-sm font-bold text-zinc-400 uppercase">Time</p>
                    </div>
                    {daysOfWeek.map((day) => (
                      <div key={day} className="p-3 text-center">
                        <p className="text-sm font-bold text-white">{day.slice(0, 3)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Time Slots */}
                  {[
                    ...Array.from({ length: 5 }, (_, i) => {
                      const hour = i + 9; // 9 AM to 1 PM
                      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      return `${hour12}:00 ${ampm}`;
                    }),
                    ...additionalTimeSlots
                  ].map((timeSlot) => {
                    return (
                      <div key={timeSlot} className="grid grid-cols-8 gap-2 mb-2">
                        {/* Time Column */}
                        <div className="p-3 text-center border border-white/5 rounded-lg bg-zinc-800/30">
                          <p className="text-sm font-semibold text-zinc-300">{timeSlot}</p>
                        </div>

                        {/* Day Columns */}
                        {daysOfWeek.map((day) => {
                          const daySchedule = personalTimetable?.schedule?.find(s => s.day === day);
                          
                          // Convert timeSlot back to 24-hour format for comparison
                          const [time, ampm] = timeSlot.split(' ');
                          const [hourStr] = time.split(':');
                          let hour24 = parseInt(hourStr);
                          if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
                          if (ampm === 'AM' && hour24 === 12) hour24 = 0;
                          
                          const classAtTime = daySchedule?.classes?.find(cls => {
                            const startHour = parseInt(cls.startTime.split(':')[0]);
                            return startHour === hour24;
                          });

                          return (
                            <div
                              key={`${day}-${timeSlot}`}
                              className={`p-2 border border-white/5 rounded-lg min-h-[80px] flex flex-col justify-center items-center transition-all ${
                                classAtTime
                                  ? 'bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 hover:from-zinc-700/70 hover:to-zinc-800/50 cursor-pointer group'
                                  : 'bg-zinc-900/20'
                              }`}
                              onClick={classAtTime ? () => {
                                setEditingClass(classAtTime);
                                setEditingDay(day);
                                setEditingClassId(classAtTime._id);
                                setShowEditClassModal(true);
                              } : undefined}
                              style={classAtTime ? {
                                borderLeftColor: classAtTime.color || "#3498db",
                                borderLeftWidth: "3px",
                              } : {}}
                            >
                              {classAtTime ? (
                                <div className="text-center w-full">
                                  <p className="text-xs font-bold text-white mb-1 truncate">
                                    {classAtTime.subject}
                                  </p>
                                  <p className="text-[10px] text-zinc-400 mb-1">
                                    {classAtTime.subjectCode}
                                  </p>
                                  <div className="flex items-center justify-center gap-1">
                                    <MapPin size={10} className="text-zinc-500" />
                                    <p className="text-[10px] text-zinc-400 truncate">
                                      {classAtTime.room}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-center gap-1 mt-1">
                                    <Book size={10} className="text-zinc-500" />
                                    <p className="text-[10px] text-zinc-400 truncate">
                                      {classAtTime.professor}
                                    </p>
                                  </div>
                                  {/* Edit button on hover */}
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                                    <EditPencil size={12} className="text-blue-400 mx-auto" />
                                  </div>
                                </div>
                              ) : (
                                <div className="text-zinc-600 text-xs opacity-30">
                                  Free
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex flex-wrap gap-4 justify-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-zinc-700/50 border border-white/5 rounded"></div>
                    <span className="text-zinc-400">Free Period</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 border border-blue-500 rounded"></div>
                    <span className="text-zinc-400">Class Scheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <EditPencil size={12} className="text-zinc-400" />
                    <span className="text-zinc-400">Click to edit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === "attendance" && (
          <div className="space-y-8">
            {/* Overall Statistics */}
            {attendance?.subjects && attendance.subjects.length > 0 && (
              <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-[2rem] p-8 shadow-xl transition-all">
                <h2 className="text-2xl font-bold text-white tracking-tight mb-6">
                  Attendance Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white mb-2">
                      {getOverallAttendanceStats().totalSubjects}
                    </p>
                    <p className="text-sm text-zinc-400 font-medium">Total Subjects</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white mb-2">
                      {getOverallAttendanceStats().averageAttendance}%
                    </p>
                    <p className="text-sm text-zinc-400 font-medium">Average Attendance</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white mb-2">
                      {getOverallAttendanceStats().safeSubjects}
                    </p>
                    <p className="text-sm text-zinc-400 font-medium">Safe Subjects</p>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!attendance?.subjects || attendance.subjects.length === 0) && (
              <div className="text-center py-12 px-4 border border-white/5 rounded-2xl bg-zinc-900/20 backdrop-blur-sm">
                <CheckCircle size={48} className="mx-auto mb-4 text-zinc-600" />
                <h3 className="text-xl font-bold text-white mb-2">No Subjects Added</h3>
                <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                  Start tracking your attendance by adding your subjects. You'll be able to mark attendance and monitor your bunk capacity.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setShowCalculatorModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
                  >
                    <Clock size={18} />
                    Quick Calculator
                  </button>
                  <button
                    onClick={() => setShowAddSubjectModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
                  >
                    <Plus size={18} />
                    Add Your First Subject
                  </button>
                </div>
              </div>
            )}

            {/* Bunk Calculator */}
            {bunkAnalysis && bunkAnalysis.length > 0 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Bunk Manager
                  </h2>
                  <div className="flex flex-col md:flex-row gap-3">
                    <button
                      onClick={() => setShowCalculatorModal(true)}
                      className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
                    >
                      <Clock size={18} />
                      <span>Calculator</span>
                    </button>
                    <button
                      onClick={() => setShowMarkAttendanceModal(true)}
                      className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
                    >
                      <Check size={18} />
                      <span>Mark Attendance</span>
                    </button>
                    {currentUser && (
                      <button
                        onClick={() => setShowAddSubjectModal(true)}
                        className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
                      >
                        <Plus
                          size={18}
                          className="transition-transform group-hover:rotate-90"
                        />
                        <span>Add Subject</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bunkAnalysis.map((subject) => {
                    const isSafe = subject.warning === "SAFE";
                    return (
                      <div
                        key={subject.subjectCode}
                        className="group relative flex flex-col bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-4xl p-4 md:p-8 shadow-xl transition-all hover:shadow-lg hover:-translate-y-1"
                        style={{
                          borderLeftColor: isSafe ? "#6b7280" : "#ef4444",
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedSubject(subject);
                                setShowMarkAttendanceModal(true);
                              }}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Mark Attendance"
                            >
                              <Check size={16} className="text-zinc-400" />
                            </button>
                            <button
                              onClick={() => {
                                setSubjectToDelete(subject);
                                setShowDeleteSubjectModal(true);
                              }}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Delete Subject"
                            >
                              <Trash size={16} className="text-zinc-400" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col">
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
                                  backgroundColor: isSafe ? "#6b7280" : "#ef4444",
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
                              <p className="font-bold text-lg text-white">
                                {subject.classesAttended}
                              </p>
                            </div>
                          </div>

                          {/* Bunk Info */}
                          {isSafe ? (
                            <div className="bg-zinc-800/50 border border-zinc-600/30 rounded-xl p-4">
                              <p className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                                <CheckCircle size={16} /> Can bunk{" "}
                                {subject.canBunk} more classes
                              </p>
                            </div>
                          ) : (
                            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                              <p className="text-sm font-bold text-red-300 flex items-center gap-2">
                                <WarningTriangle size={16} /> Need to attend{" "}
                                {subject.needToAttend} more
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* EXAMS TAB */}
        {activeTab === "exams" && (
          <div className="space-y-8">
            {/* Header with Add Exam Button */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Exam Schedule
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Faculty exams and your personal study reminders
                </p>
              </div>
              {currentUser && (
                <button
                  onClick={() => setShowAddExamModal(true)}
                  className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50"
                >
                  <Plus size={18} className="transition-transform group-hover:rotate-90" />
                  <span>Add Study Reminder</span>
                </button>
              )}
            </div>

            {/* Faculty Exams Section */}
            {exams && exams.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-center">
                    <InfoCircle size={20} className="text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Faculty Exams
                  </h3>
                </div>
                {exams.map((examPeriod) => (
                  <div
                    key={examPeriod._id}
                    className="bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-[2rem] p-8 shadow-xl overflow-hidden transition-all"
                  >
                    <div className="mb-8 pb-6 border-b border-white/5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-center">
                          <InfoCircle size={20} className="text-yellow-400" />
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
                                  <Star size={16} className="text-yellow-400" />
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
                ))}
              </div>
            )}

            {/* Student Exams Section */}
            {studentExams && studentExams.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center">
                      <Book size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        My Study Reminders
                      </h3>
                      <p className="text-zinc-400 text-sm mt-1">
                        Personal exam and study reminders with notifications
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddExamModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-lg font-bold text-sm transition-all hover:bg-purple-600/30"
                  >
                    <Plus size={16} />
                    Add Reminder
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {studentExams.map((exam) => (
                    <div
                      key={exam._id}
                      className="group relative bg-gradient-to-br from-purple-950/30 to-purple-950/10 backdrop-blur-sm border border-purple-500/20 hover:border-purple-500/40 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-purple-900/20 transition-all p-6"
                      style={{
                        borderLeftColor: "#a855f7",
                        borderLeftWidth: "4px",
                      }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-white mb-1">
                            {exam.subject}
                          </h4>
                          <p className="text-xs text-zinc-400 font-semibold">
                            {exam.subjectCode}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingExam(exam);
                              setShowEditExamModal(true);
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Edit exam"
                          >
                            <EditPencil size={16} className="text-purple-400" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this exam reminder?')) {
                                handleDeleteExam(exam._id);
                              }
                            }}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete exam"
                          >
                            <Xmark size={16} className="text-red-400" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0">
                            <Calendar size={16} className="text-purple-400" />
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

                        {exam.room && (
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0">
                              <MapPin size={16} className="text-purple-400" />
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
                        )}

                        {exam.notificationsEnabled && (
                          <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                            <Bell size={14} className="text-purple-400" />
                            <span className="text-xs text-purple-300">
                              Notifications enabled
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!exams || exams.length === 0) && (!studentExams || studentExams.length === 0) && (
              <div className="text-center py-12 px-4 border border-white/5 rounded-2xl bg-zinc-900/20 backdrop-blur-sm">
                <Calendar size={48} className="mx-auto mb-4 text-zinc-600" />
                <h3 className="text-xl font-bold text-white mb-2">No Exams Scheduled</h3>
                <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                  Create personal study reminders for your exams to stay organized and get notified before important dates.
                </p>
                {currentUser && (
                  <button
                    onClick={() => setShowAddExamModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
                  >
                    <Plus size={18} />
                    Add Study Reminder
                  </button>
                )}
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
                  <Xmark size={20} className="text-zinc-400" />
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
                <Xmark size={20} className="text-zinc-400" />
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

      {/* Edit Class Modal */}
      {showEditClassModal && editingClass && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex flex-col max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-br from-blue-950/40 to-blue-900/20 backdrop-blur-md border-b border-white/5 p-6 md:p-8 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Edit Class
                  </h2>
                  <p className="text-sm text-zinc-400 mt-2">
                    Modify the class details
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEditClassModal(false);
                    setEditingClass(null);
                    setEditingDay(null);
                    setEditingClassId(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
                >
                  <Xmark size={20} className="text-zinc-400" />
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
                      value={editingDay || editingClass?.day || "Monday"}
                      onChange={(value) => setEditingDay(value)}
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
                      value={editingClass?.type || "LECTURE"}
                      onChange={(value) =>
                        setEditingClass({
                          ...editingClass,
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
                      value={editingClass?.startTime || ""}
                      onChange={(e) =>
                        setEditingClass({ ...editingClass, startTime: e.target.value })
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
                      value={editingClass?.endTime || ""}
                      onChange={(e) =>
                        setEditingClass({ ...editingClass, endTime: e.target.value })
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
                    value={editingClass?.subject || ""}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, subject: e.target.value })
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
                      value={editingClass?.subjectCode || ""}
                      onChange={(e) =>
                        setEditingClass({
                          ...editingClass,
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
                      value={editingClass?.color || "#3498db"}
                      onChange={(e) =>
                        setEditingClass({ ...editingClass, color: e.target.value })
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
                    value={editingClass?.professor || ""}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, professor: e.target.value })
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
                    value={editingClass?.professorEmail || ""}
                    onChange={(e) =>
                      setEditingClass({
                        ...editingClass,
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
                      value={editingClass?.room || ""}
                      onChange={(e) =>
                        setEditingClass({ ...editingClass, room: e.target.value })
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
                      value={editingClass?.building || ""}
                      onChange={(e) =>
                        setEditingClass({ ...editingClass, building: e.target.value })
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
                    value={editingClass?.customNote || ""}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, customNote: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-zinc-600 h-24 resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gradient-to-t from-zinc-950 to-zinc-950/50 backdrop-blur-md border-t border-white/5 p-6 md:p-8 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowEditClassModal(false);
                    setEditingClass(null);
                    setEditingDay(null);
                    setEditingClassId(null);
                  }}
                  className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditClass}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-blue-900/30"
                >
                  {loading ? (
                    <>
                      <Clock size={16} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Update Class
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {showMarkAttendanceModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-blue-950/40 to-blue-900/20 backdrop-blur-md border-b border-white/5 p-6 md:p-8 flex items-start justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Mark Attendance
                </h2>
                <p className="text-sm text-zinc-400 mt-2">
                  {selectedSubject ? `For ${selectedSubject.subjectName}` : 'Select a subject and mark attendance'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowMarkAttendanceModal(false);
                  setSelectedSubject(null);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
              >
                <Xmark size={20} className="text-zinc-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-5">
              <div>
                <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                  Subject
                </label>
                <select
                  value={selectedSubject?.subjectCode || ""}
                  onChange={(e) => {
                    const subject = attendance?.subjects?.find(s => s.subjectCode === e.target.value);
                    setSelectedSubject(subject);
                  }}
                  className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                >
                  <option value="">Select Subject</option>
                  {attendance?.subjects?.map((subject) => (
                    <option key={subject.subjectCode} value={subject.subjectCode}>
                      {subject.subjectName} ({subject.subjectCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                  Date
                </label>
                <input
                  type="date"
                  value={attendanceForm.date}
                  onChange={(e) =>
                    setAttendanceForm({ ...attendanceForm, date: e.target.value })
                  }
                  className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                  Time Slot
                </label>
                <input
                  type="text"
                  placeholder="e.g., 09:00-10:00"
                  value={attendanceForm.timeSlot}
                  onChange={(e) =>
                    setAttendanceForm({ ...attendanceForm, timeSlot: e.target.value })
                  }
                  className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["PRESENT", "ABSENT"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setAttendanceForm({ ...attendanceForm, status })}
                      className={`p-3 rounded-lg font-bold text-sm transition-all ${
                        attendanceForm.status === status
                          ? status === "PRESENT"
                            ? "bg-zinc-800 text-white"
                            : "bg-red-900/30 text-red-300"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                  Notes (Optional)
                </label>
                <textarea
                  placeholder="Add any notes..."
                  value={attendanceForm.notes}
                  onChange={(e) =>
                    setAttendanceForm({ ...attendanceForm, notes: e.target.value })
                  }
                  className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-zinc-600 h-20 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gradient-to-t from-zinc-950 to-zinc-950/50 backdrop-blur-md border-t border-white/5 p-6 md:p-8 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowMarkAttendanceModal(false);
                  setSelectedSubject(null);
                }}
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedSubject) {
                    handleMarkAttendance(
                      selectedSubject.subjectCode,
                      attendanceForm.date,
                      attendanceForm.timeSlot,
                      attendanceForm.status,
                      attendanceForm.notes
                    );
                  }
                }}
                disabled={loading || !selectedSubject}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-blue-900/30"
              >
                {loading ? (
                  <>
                    <Clock size={16} className="animate-spin" />
                    Marking...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Mark Attendance
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Subject Modal */}
      {showDeleteSubjectModal && subjectToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-red-950/40 to-red-900/20 backdrop-blur-md border-b border-white/5 p-6 md:p-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center">
                  <WarningTriangle size={24} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Delete Subject
                  </h2>
                  <p className="text-sm text-zinc-400 mt-2">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8">
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-300">
                  Are you sure you want to delete <strong>{subjectToDelete.subjectName}</strong> ({subjectToDelete.subjectCode})? 
                  All attendance records for this subject will be permanently deleted.
                </p>
              </div>

              <div className="space-y-3 text-sm text-zinc-400">
                <p>This will delete:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Subject information</li>
                  <li>All attendance records</li>
                  <li>Attendance statistics</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gradient-to-t from-zinc-950 to-zinc-950/50 backdrop-blur-md border-t border-white/5 p-6 md:p-8 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteSubjectModal(false);
                  setSubjectToDelete(null);
                }}
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSubject(subjectToDelete.subjectCode)}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-red-900/30"
              >
                {loading ? (
                  <>
                    <Clock size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash size={16} />
                    Delete Subject
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Calculator Modal */}
      {showCalculatorModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-lg sm:max-w-xl bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-zinc-900/40 to-zinc-800/20 backdrop-blur-md border-b border-white/5 p-6 md:p-8 flex items-start justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Attendance Calculator
                </h2>
                <p className="text-sm text-zinc-400 mt-2">
                  Quick calculation for attendance and bunk capacity
                </p>
              </div>
              <button
                onClick={() => setShowCalculatorModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
              >
                <Xmark size={20} className="text-zinc-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5">
              <div>
                <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                  Total Classes
                </label>
                <input
                  type="number"
                  min="0"
                  value={calculatorForm.totalClasses}
                  onChange={(e) =>
                    setCalculatorForm({ ...calculatorForm, totalClasses: e.target.value })
                  }
                  className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-zinc-500/50 focus:ring-1 focus:ring-zinc-500/30 transition-all"
                  placeholder="Enter total number of classes"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                  Classes Attended
                </label>
                <input
                  type="number"
                  min="0"
                  max={calculatorForm.totalClasses || 999}
                  value={calculatorForm.attendedClasses}
                  onChange={(e) =>
                    setCalculatorForm({ ...calculatorForm, attendedClasses: e.target.value })
                  }
                  className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-zinc-500/50 focus:ring-1 focus:ring-zinc-500/30 transition-all"
                  placeholder="Enter number of classes attended"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                  Required Percentage (%)
                </label>
                <select
                  value={calculatorForm.requiredPercentage}
                  onChange={(e) =>
                    setCalculatorForm({ ...calculatorForm, requiredPercentage: parseInt(e.target.value) })
                  }
                  className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-zinc-500/50 focus:ring-1 focus:ring-zinc-500/30 transition-all"
                >
                  <option value={60}>60% (Some Colleges)</option>
                  <option value={65}>65% (Liberal)</option>
                  <option value={70}>70% (Moderate)</option>
                  <option value={75}>75% (Standard)</option>
                  <option value={80}>80% (Strict)</option>
                  <option value={85}>85% (Very Strict)</option>
                </select>
              </div>

              {/* Results */}
              {calculatorForm.totalClasses > 0 && (
                <div className="bg-zinc-800/30 border border-white/5 rounded-xl p-4 sm:p-6 space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-zinc-400 mb-2">Current Attendance</p>
                    <p className={`text-3xl sm:text-4xl font-bold ${
                      calculateAttendance().status === "SAFE" ? "text-white" : "text-red-400"
                    }`}>
                      {calculateAttendance().currentPercentage}%
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-zinc-900/50 rounded-lg">
                      <p className="text-xl sm:text-2xl font-bold text-white mb-1">
                        {calculateAttendance().canBunk}
                      </p>
                      <p className="text-xs text-zinc-400">Can Bunk</p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-zinc-900/50 rounded-lg">
                      <p className="text-xl sm:text-2xl font-bold text-red-400 mb-1">
                        {calculateAttendance().needToAttend}
                      </p>
                      <p className="text-xs text-zinc-400">Need to Attend</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                      calculateAttendance().status === "SAFE"
                        ? "bg-zinc-800 text-white border border-zinc-600"
                        : "bg-red-900/30 text-red-300 border border-red-500/20"
                    }`}>
                      {calculateAttendance().status === "SAFE" ? "✓ Safe" : "⚠ Critical"}
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Tips */}
              
            </div>

            {/* Modal Footer */}
            <div className="bg-gradient-to-t from-zinc-950 to-zinc-950/50 backdrop-blur-md border-t border-white/5 p-6 md:p-8 mt-auto">
              <button
                onClick={() => setShowCalculatorModal(false)}
                className="w-full px-6 py-3 bg-white text-black rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                Close Calculator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Exam Modal */}
      {showAddExamModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex flex-col max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-br from-purple-950/40 to-purple-900/20 backdrop-blur-md border-b border-white/5 p-6 md:p-8 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Add Study Reminder
                  </h2>
                  <p className="text-sm text-zinc-400 mt-2">
                    Create a personal exam reminder with notifications
                  </p>
                </div>
                <button
                  onClick={() => setShowAddExamModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
                >
                  <Xmark size={20} className="text-zinc-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 md:p-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Data Structures"
                      value={newExam.subject}
                      onChange={(e) =>
                        setNewExam({ ...newExam, subject: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Subject Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., CS201"
                      value={newExam.subjectCode}
                      onChange={(e) =>
                        setNewExam({
                          ...newExam,
                          subjectCode: e.target.value,
                        })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Exam Date
                    </label>
                    <input
                      type="date"
                      value={newExam.examDate}
                      onChange={(e) =>
                        setNewExam({ ...newExam, examDate: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="30"
                      max="480"
                      placeholder="120"
                      value={newExam.duration}
                      onChange={(e) =>
                        setNewExam({ ...newExam, duration: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-zinc-600"
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
                      value={newExam.startTime}
                      onChange={(e) =>
                        setNewExam({ ...newExam, startTime: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newExam.endTime}
                      onChange={(e) =>
                        setNewExam({ ...newExam, endTime: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Room (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., LT-101"
                      value={newExam.room}
                      onChange={(e) =>
                        setNewExam({ ...newExam, room: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Building (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Academic Block"
                      value={newExam.building}
                      onChange={(e) =>
                        setNewExam({ ...newExam, building: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                    Total Marks (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="100"
                    value={newExam.totalMarks}
                    onChange={(e) =>
                      setNewExam({ ...newExam, totalMarks: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                    Instructions/Notes (Optional)
                  </label>
                  <textarea
                    placeholder="Add any preparation notes, study tips, or important instructions..."
                    value={newExam.instructions}
                    onChange={(e) =>
                      setNewExam({ ...newExam, instructions: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-zinc-600 h-24 resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                    Notification Settings
                  </label>
                  
                  <div className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <input
                      type="checkbox"
                      checked={newExam.notificationsEnabled}
                      onChange={(e) =>
                        setNewExam({
                          ...newExam,
                          notificationsEnabled: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-white/20 bg-purple-500 cursor-pointer"
                    />
                    <label className="text-sm font-medium text-white cursor-pointer">
                      Enable notifications for this exam
                    </label>
                  </div>

                  {newExam.notificationsEnabled && (
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-400">Notify me before the exam:</p>
                      <div className="flex flex-wrap gap-2">
                        {[60, 30, 10].map((minutes) => (
                          <label key={minutes} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newExam.notificationTimes.includes(minutes)}
                              onChange={(e) => {
                                const times = e.target.checked
                                  ? [...newExam.notificationTimes, minutes]
                                  : newExam.notificationTimes.filter(t => t !== minutes);
                                setNewExam({ ...newExam, notificationTimes: times });
                              }}
                              className="w-3 h-3 rounded border-white/20 bg-purple-500 cursor-pointer"
                            />
                            <span className="text-xs text-zinc-300">{minutes} minutes</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gradient-to-t from-zinc-950 to-zinc-950/50 backdrop-blur-md border-t border-white/5 p-6 md:p-8 flex gap-3 justify-end">
                <button
                  onClick={() => setShowAddExamModal(false)}
                  className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExam}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-purple-900/30"
                >
                  {loading ? (
                    <>
                      <Clock size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Reminder
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Exam Modal */}
      {showEditExamModal && editingExam && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex flex-col max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-br from-purple-950/40 to-purple-900/20 backdrop-blur-md border-b border-white/5 p-6 md:p-8 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Edit Study Reminder
                  </h2>
                  <p className="text-sm text-zinc-400 mt-2">
                    Update your exam reminder details
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEditExamModal(false);
                    setEditingExam(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
                >
                  <Xmark size={20} className="text-zinc-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 md:p-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Data Structures"
                      value={editingExam.subject || ""}
                      onChange={(e) =>
                        setEditingExam({ ...editingExam, subject: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Subject Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., CS201"
                      value={editingExam.subjectCode || ""}
                      onChange={(e) =>
                        setEditingExam({
                          ...editingExam,
                          subjectCode: e.target.value,
                        })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Exam Date
                    </label>
                    <input
                      type="date"
                      value={editingExam.examDate || ""}
                      onChange={(e) =>
                        setEditingExam({ ...editingExam, examDate: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="30"
                      max="480"
                      placeholder="120"
                      value={editingExam.duration || ""}
                      onChange={(e) =>
                        setEditingExam({ ...editingExam, duration: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-zinc-600"
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
                      value={editingExam.startTime || ""}
                      onChange={(e) =>
                        setEditingExam({ ...editingExam, startTime: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={editingExam.endTime || ""}
                      onChange={(e) =>
                        setEditingExam({ ...editingExam, endTime: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Room (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., LT-101"
                      value={editingExam.room || ""}
                      onChange={(e) =>
                        setEditingExam({ ...editingExam, room: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                      Building (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Academic Block"
                      value={editingExam.building || ""}
                      onChange={(e) =>
                        setEditingExam({ ...editingExam, building: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                    Total Marks (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="100"
                    value={editingExam.totalMarks || ""}
                    onChange={(e) =>
                      setEditingExam({ ...editingExam, totalMarks: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                    Instructions/Notes (Optional)
                  </label>
                  <textarea
                    placeholder="Add any preparation notes, study tips, or important instructions..."
                    value={editingExam.instructions || ""}
                    onChange={(e) =>
                      setEditingExam({ ...editingExam, instructions: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-zinc-600 h-24 resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-bold text-white mb-2 tracking-tight">
                    Notification Settings
                  </label>
                  
                  <div className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <input
                      type="checkbox"
                      checked={editingExam.notificationsEnabled || false}
                      onChange={(e) =>
                        setEditingExam({
                          ...editingExam,
                          notificationsEnabled: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-white/20 bg-purple-500 cursor-pointer"
                    />
                    <label className="text-sm font-medium text-white cursor-pointer">
                      Enable notifications for this exam
                    </label>
                  </div>

                  {editingExam.notificationsEnabled && (
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-400">Notify me before the exam:</p>
                      <div className="flex flex-wrap gap-2">
                        {[60, 30, 10].map((minutes) => (
                          <label key={minutes} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editingExam.notificationTimes?.includes(minutes) || false}
                              onChange={(e) => {
                                const times = e.target.checked
                                  ? [...(editingExam.notificationTimes || []), minutes]
                                  : (editingExam.notificationTimes || []).filter(t => t !== minutes);
                                setEditingExam({ ...editingExam, notificationTimes: times });
                              }}
                              className="w-3 h-3 rounded border-white/20 bg-purple-500 cursor-pointer"
                            />
                            <span className="text-xs text-zinc-300">{minutes} minutes</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gradient-to-t from-zinc-950 to-zinc-950/50 backdrop-blur-md border-t border-white/5 p-6 md:p-8 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowEditExamModal(false);
                    setEditingExam(null);
                  }}
                  className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditExam}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-purple-900/30"
                >
                  {loading ? (
                    <>
                      <Clock size={16} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Update Reminder
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default TimetablePageEnhanced;
