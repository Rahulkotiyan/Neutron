import React, { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import {
  Plus, Trash, Check, Xmark, Clock, Book, InfoCircle,
  ArrowDown, ArrowUp, Calendar, EditPencil, Bell, Palette,
  WarningTriangle, CheckCircle, MapPin, Star, Calculator,
  ArrowLeft, ArrowRight, Code, Globe, VideoCamera, Tools,
  Database, Brain, Shield, GraphUp,
} from "iconoir-react";
import CustomDropdown from "./CustomDropdown";
import CustomModal from "./CustomModal";
import ToolsPanel from "./ToolsPanel";
import TabButton from "./TabButton";
import DeleteConfirmModal from "./DeleteConfirmModal";
import AddSubjectModal from "./AddSubjectModal";
import AttendanceCalculatorModal from "./AttendanceCalculatorModal";
import MarkAttendanceModal from "./MarkAttendanceModal";
import ClassFormModal from "./ClassFormModal";
import TaskModal from "./TaskModal";

const ToolsComponent = ({ isSidebarOpen, currentUser, token }) => {
  const [activeTab, setActiveTab] = useState("tools-tutorials");
  const [visitedTabs, setVisitedTabs] = useState(new Set(["tools-tutorials"]));
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });
  const [additionalTimeSlots, setAdditionalTimeSlots] = useState([]);
  const [personalTimetable, setPersonalTimetable] = useState(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [attendance, setAttendance] = useState(null);
  const [bunkAnalysis, setBunkAnalysis] = useState(null);
  const [currentClass, setCurrentClass] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showDeleteSubjectModal, setShowDeleteSubjectModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [calculatorForm, setCalculatorForm] = useState({
    totalClasses: "",
    attendedClasses: "",
    requiredPercentage: 75,
  });
  const [gpaSubjects, setGpaSubjects] = useState([]);
  const [prevCGPA, setPrevCGPA] = useState("");
  const [prevCredits, setPrevCredits] = useState("");
  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    timeSlot: "09:00-10:00",
    status: "PRESENT",
    notes: "",
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

  const [newTask, setNewTask] = useState({
    subject: "",
    startTime: "",
    examDate: new Date().toISOString().split('T')[0],
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
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setVisitedTabs(prev => {
      if (prev.has(tabId)) return prev;
      const next = new Set(prev);
      next.add(tabId);
      return next;
    });
  }, []);

  useEffect(() => {
    if (token) {
      fetchPersonalTimetable();
      fetchAttendance();
      fetchBunkAnalysis();
      fetchCurrentClass();
      fetchTasks();
    } else {
      setActiveTab("tools-tutorials");
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
      setTodaySchedule(res.data);
    } catch (error) {
      console.error("Error fetching today's schedule:", error);
      setTodaySchedule(null);
    }
  };

  const fetchCurrentClass = async () => {
    try {
      const res = await api.get("/timetable/personal/current-class");
      setCurrentClass({ current: res.data.currentClass, next: res.data.nextClass });
    } catch (error) {
      console.error("Error fetching current class:", error);
      setCurrentClass(null);
    }
  };

  const fetchFreePeriods = async () => {
    try {
      const res = await api.get("/timetable/personal/free-periods");
      setFreePeriods(res.data);
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
      setModalConfig({
        isOpen: true,
        title: "Add Failed",
        message: "Error adding class: " + (error.response?.data?.message || error.message),
        type: "error",
      });
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
      setDeleteSuccessMessage("Class deleted successfully!");
      setShowDeleteClassModal(false);
      setClassToDelete(null);
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setDeleteSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error deleting class:", error);
      setModalConfig({
        isOpen: true,
        title: "Delete Failed",
        message: "Error deleting class: " + (error.response?.data?.message || error.message),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==================== ATTENDANCE FUNCTIONS ====================

  const fetchAttendance = async () => {
    try {
      const res = await api.get("/timetable/attendance");
      setAttendance(res.data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendance(null);
    }
  };

  const fetchBunkAnalysis = async () => {
    try {
      const res = await api.get("/timetable/attendance/bunk-capacity");
      setBunkAnalysis(res.data.subjects);
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

  // ==================== GPA CALCULATOR FUNCTIONS ====================

  const addGpaSubject = () => {
    setGpaSubjects(prev => [...prev, {
      id: Date.now(),
      credits: "",
      grade: "",
    }]);
  };

  const removeGpaSubject = (id) => {
    setGpaSubjects(prev => prev.filter(s => s.id !== id));
  };

  const updateGpaSubject = (id, field, value) => {
    setGpaSubjects(prev => prev.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const calcSGPA = () => {
    if (!gpaSubjects.length) return 0;
    let points = 0, credits = 0;
    gpaSubjects.forEach(s => {
      const c = parseFloat(s.credits) || 0;
      const g = parseFloat(s.grade) || 0;
      if (c > 0 && g > 0) { points += c * g; credits += c; }
    });
    return credits > 0 ? (points / credits).toFixed(2) : 0;
  };

  const calcCGPA = () => {
    const sgpa = parseFloat(calcSGPA()) || 0;
    const p = parseFloat(prevCGPA) || 0;
    const pc = parseFloat(prevCredits) || 0;
    if (!p && !pc) return sgpa;
    const curCredits = gpaSubjects.reduce((sum, s) => sum + (parseFloat(s.credits) || 0), 0);
    if (!curCredits && !pc) return sgpa;
    if (curCredits > 0 && pc > 0) return ((p * pc + sgpa * curCredits) / (pc + curCredits)).toFixed(2);
    if (curCredits > 0) return sgpa;
    return p.toFixed(2);
  };

  const getGradeStatus = (gpa) => {
    if (gpa >= 9) return "Excellent";
    if (gpa >= 8) return "Very Good";
    if (gpa >= 7) return "Good";
    if (gpa >= 6) return "Average";
    if (gpa >= 5) return "Below Average";
    return "Poor";
  };

  // ==================== CALENDAR FUNCTIONS ====================

  const fetchTasks = async () => {
    try {
      const res = await api.get("/timetable/student-exams");
      setTasks((res.data || []).map(t => ({ ...t, _id: t.id })));
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    }
  };

  const handleAddExam = async () => {
    try {
      setLoading(true);
      const taskData = {
        subject: newTask.subject,
        subjectCode: "TASK", // Default value for tasks
        examDate: newTask.examDate,
        startTime: newTask.startTime || "00:00",
        endTime: newTask.startTime ? "23:59" : "23:59", // Default end time
        duration: 120, // Default duration
        room: "N/A", // Not applicable for tasks
        building: "N/A", // Not applicable for tasks
        totalMarks: null, // Not applicable for tasks
        instructions: newTask.subject, // Use subject as instructions
        notificationsEnabled: false, // Disabled by default
        notificationTimes: [], // Empty by default
      };
      
      // Optimistic update - add task to UI immediately
      const tempId = Date.now().toString();
      const optimisticTask = {
        ...taskData,
        _id: tempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: "TASK",
        status: "UPCOMING"
      };
      
      setTasks(prevTasks => [...prevTasks, optimisticTask]);
      
      setShowAddTaskModal(false);
      setNewTask({
        subject: "",
        startTime: "",
        examDate: new Date().toISOString().split('T')[0],
      });
      
      try {
        const response = await api.post("/timetable/student-exam", taskData);
        // Replace optimistic task with real one (normalize id → _id)
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task._id === tempId ? { ...response.data, _id: response.data.id } : task
          )
        );
        
        // Schedule notifications if enabled
        if (taskData.notificationsEnabled) {
          scheduleExamNotifications({ ...response.data, _id: response.data.id });
        }
      } catch (serverError) {
        // Remove optimistic task if server request failed
        setTasks(prevTasks => prevTasks.filter(task => task._id !== tempId));
        throw serverError;
      }
    } catch (error) {
      console.error("Error adding exam:", error);
      setModalConfig({
        isOpen: true,
        title: "Add Failed",
        message: "Error adding task: " + (error.response?.data?.message || error.message),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditExam = async () => {
    try {
      setLoading(true);
      const updatedTaskData = {
        ...editingTask,
        subjectCode: "TASK", // Keep as TASK
        examDate: editingTask.examDate || new Date().toISOString().split('T')[0],
        endTime: editingTask.startTime ? "23:59" : "23:59",
        duration: 120,
        room: "N/A",
        building: "N/A",
        totalMarks: null,
        instructions: editingTask.subject,
        notificationsEnabled: false,
        notificationTimes: [],
      };
      
      // Optimistic update - update task in UI immediately
      const originalTask = tasks.find(task => task._id === editingTask._id);
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === editingTask._id 
            ? { ...task, ...updatedTaskData, updatedAt: new Date().toISOString() }
            : task
        )
      );
      
      setShowEditTaskModal(false);
      setEditingTask(null);
      
      try {
        await api.put(`/timetable/student-exam/${editingTask._id}`, updatedTaskData);
      } catch (serverError) {
        // Restore original task if server request failed
        if (originalTask) {
          setTasks(prevTasks => 
            prevTasks.map(task => 
              task._id === editingTask._id ? originalTask : task
            )
          );
        }
        throw serverError;
      }
    } catch (error) {
      console.error("Error editing task:", error);
      setModalConfig({
        isOpen: true,
        title: "Edit Failed",
        message: "Error editing task: " + (error.response?.data?.message || error.message),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    try {
      setLoading(true);
      
      // Optimistic update - remove task from UI immediately
      const taskToDelete = tasks.find(task => task._id === examId);
      setTasks(prevTasks => prevTasks.filter(task => task._id !== examId));
      
      try {
        await api.delete(`/timetable/student-exam/${examId}`);
        // Success - task already removed from UI
      } catch (serverError) {
        // Restore task if server request failed
        if (taskToDelete) {
          setTasks(prevTasks => [...prevTasks, taskToDelete]);
        }
        throw serverError;
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      setModalConfig({
        isOpen: true,
        title: "Delete Failed",
        message: "Error deleting task: " + (error.response?.data?.message || error.message),
        type: "error",
      });
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
      }
    });
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderTab = (tab, className = "") => {
    const Icon = tab.icon;
    const isDisabled = tab.id === "exams" && !currentUser;
    return (
      <button
        key={tab.id}
        onClick={() => {
          if (isDisabled) {
            setModalConfig({
              isOpen: true,
              title: "Login Required",
              message: "Please login to access your personal calendar",
              type: "warning",
            });
            return;
          }
          handleTabChange(tab.id);
        }}
        disabled={isDisabled}
       className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 whitespace-nowrap active:scale-95 min-h-[44px] ${className} ${
            activeTab === tab.id
              ? "bg-white text-black shadow-lg"
              : isDisabled
              ? "bg-zinc-900/20 border border-white/5 text-zinc-600 cursor-not-allowed opacity-50"
              : "bg-zinc-900/40 border border-white/5 text-zinc-400 hover:border-white/20 hover:bg-zinc-900/60"
          }`}
        >
         <Icon size={16} className="shrink-0" />
         {tab.label}
      </button>
    );
  };

  return (
    <main
      className={`flex-1 bg-black text-zinc-300 overflow-y-auto transition-all duration-300 pb-16 md:pb-0 ${
        isSidebarOpen ? "lg:ml-72" : ""
      }`}
    >
      {/* Background Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-zinc-900/20 blur-[120px] rounded-full pointer-events-none opacity-50"></div>

      {/* Hero Header */}
      <div className="z-10 pt-4 pb-4 px-3 md:pt-6 md:pb-6 md:px-8 max-w-7xl mx-auto border-b border-white/5 sticky top-0 bg-black/50 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black-500/10 border border-white-500/20 text-white-400 text-xs font-bold tracking-wide uppercase mb-4">
               Student Tools
            </div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight mb-3">
              Tools &
              <br />
              Utilities
            </h1>
            <p className="text-zinc-400 text-lg max-w-xl">
              Manage your timetable, track attendance, calculate GPA, and organize your tasks with powerful student tools.
            </p>
          </div>

          {currentClass?.current && (
            <div className="group relative inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] hover:shadow-[0_0_60px_-15px_rgba(59,130,246,0.5)] shrink-0 transition-all hover:scale-105 active:scale-95 min-h-[44px]">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              <p className="text-sm font-bold text-white">
                Currently in: {currentClass.current.subject}
              </p>
            </div>
          )}
        </div>

        {/* Tab Navigation — responsive grid: 2 cols mobile, 4 cols desktop */}
        <div className="flex flex-col items-center mt-8 w-full max-w-xl mx-auto gap-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
            {[
              { id: "tools-tutorials", label: "Tutorials", icon: VideoCamera },
              { id: "tools-github", label: "GitHub Repos", icon: Star },
              { id: "tools-docs", label: "Documentation", icon: Book },
              { id: "tools-dev", label: "Dev Tools", icon: Code },
            ].map((tab) => renderTab(tab, "w-full"))}
          </div>
          <button
            onClick={() => handleTabChange("tools-oss")}
            className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 active:scale-95 min-h-[44px] ${
              activeTab === "tools-oss"
                ? "bg-white text-black shadow-lg"
                : "bg-zinc-900/40 border border-white/5 text-zinc-400 hover:border-white/20 hover:bg-zinc-900/60"
            }`}
          >
            <Globe size={18} />
            Open Source
          </button>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
            {[
              { id: "timetable", label: "Timetable", icon: Calendar },
              { id: "attendance", label: "Attendance", icon: CheckCircle },
              { id: "exams", label: "Calendar", icon: InfoCircle },
              { id: "gpa", label: "GPA Calculator", icon: Calculator },
            ].map((tab) => renderTab(tab, "w-full"))}
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 py-8">
        {/* TIMETABLE TAB */}
        {activeTab === "timetable" && visitedTabs.has("timetable") && (
          <div className="space-y-8">
            {/* Current & Next Class */}
            {(currentClass?.current || currentClass?.next) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                {currentClass?.current && (
                  <div className="group relative flex flex-col bg-zinc-800/40 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-[2rem] overflow-hidden hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-zinc-900/10 hover:shadow-zinc-900/20 p-8">
                    {/* Glow effect */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-500 to-transparent opacity-40"></div>

                    <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-3 opacity-80">
                      ● Live
                    </p>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {currentClass.current.subject}
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-zinc-400" />
                        <p className="text-zinc-300">
                          {currentClass.current.room}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Book size={16} className="text-zinc-400" />
                        <p className="text-zinc-300">
                          {currentClass.current.professor}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-zinc-400" />
                        <p className="text-zinc-300">
                          {currentClass.current.timeSlot}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {currentClass?.next && (
                  <div className="group relative flex flex-col bg-zinc-800/40 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-[2rem] overflow-hidden hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-zinc-900/10 hover:shadow-zinc-900/20 p-8">
                    {/* Glow effect */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-500 to-transparent opacity-40"></div>

                    <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-3 opacity-80">
                      Next Class
                    </p>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {currentClass.next.subject}
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-zinc-400" />
                        <p className="text-zinc-300">
                          {currentClass.next.room}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Book size={16} className="text-zinc-400" />
                        <p className="text-zinc-300">
                          {currentClass.next.professor}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-zinc-400" />
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
                    className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-700 text-white rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 min-h-[44px] shadow-lg"
                    title="Add more time slots"
                  >
                    <Plus size={16} />
                    <span className="hidden sm:inline">Add Time</span>
                  </button>
                  {currentUser && (
                    <button
                      onClick={() => setShowAddClassModal(true)}
                      className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black border border-gray-200 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 min-h-[44px] shadow-lg"
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
                                setEditingClassId(classAtTime.id);
                                setShowEditClassModal(true);
                              } : undefined}
                            >
                              {classAtTime ? (
                                <div className="text-center w-full">
                                  <p className="text-xs font-bold text-white mb-1 truncate">
                                    {classAtTime.subject}
                                  </p>
                                  <p className="text-[10px] md:text-sm text-zinc-400 mb-1">
                                    {classAtTime.subjectCode}
                                  </p>
                                  <div className="flex items-center justify-center gap-1">
                                    <MapPin size={10} className="text-zinc-500" />
                                    <p className="text-[10px] md:text-sm text-zinc-400 truncate">
                                      {classAtTime.room}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-center gap-1 mt-1">
                                    <Book size={10} className="text-zinc-500" />
                                    <p className="text-[10px] md:text-sm text-zinc-400 truncate">
                                      {classAtTime.professor}
                                    </p>
                                  </div>
                                  {/* Edit and Delete buttons on hover */}
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex items-center justify-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingClass(classAtTime);
                                        setEditingDay(day);
                                        setEditingClassId(classAtTime.id);
                                        setShowEditClassModal(true);
                                      }}
                                      className="p-1 hover:bg-white/10 rounded transition-colors active:scale-95 min-h-[44px]"
                                      title="Edit class"
                                    >
                                      <EditPencil size={12} className="text-blue-400" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setClassToDelete({ classData: classAtTime, day, classId: classAtTime.id });
                                        setShowDeleteClassModal(true);
                                      }}
                                      className="p-1 hover:bg-white/10 rounded transition-colors active:scale-95 min-h-[44px]"
                                      title="Delete class"
                                    >
                                      <Trash size={12} className="text-red-400" />
                                    </button>
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
                    <span className="text-zinc-400">Edit class</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trash size={12} className="text-zinc-400" />
                    <span className="text-zinc-400">Delete class</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === "attendance" && visitedTabs.has("attendance") && (
          <div className="space-y-8">
            {!currentUser ? (
              <div className="text-center py-12 px-4 border border-white/5 rounded-2xl bg-zinc-900/20 backdrop-blur-sm">
                <CheckCircle size={48} className="mx-auto mb-4 text-zinc-600" />
                <h3 className="text-xl font-bold text-white mb-2">Login Required for Personal Data</h3>
                <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                  Please login to track your personal attendance data. You can still use the attendance calculator below.
                </p>
                <button
                  onClick={() => setShowCalculatorModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 min-h-[44px] shadow-lg"
                >
                  <Clock size={18} />
                  Use Attendance Calculator
                </button>
              </div>
            ) : (
              <>
            {/* Overall Statistics */}
            {attendance?.subjects && attendance.subjects.length > 0 && (
              <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-[2rem] p-8 shadow-xl transition-all">
                <h2 className="text-2xl font-bold text-white tracking-tight mb-6">
                  Attendance Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
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
                    className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 min-h-[44px] shadow-lg"
                  >
                    <Clock size={18} />
                    Quick Calculator
                  </button>
                  <button
                    onClick={() => setShowAddSubjectModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 min-h-[44px] shadow-lg"
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
                      className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 min-h-[44px] shadow-lg"
                    >
                      <Clock size={18} />
                      <span>Calculator</span>
                    </button>
                    <button
                      onClick={() => setShowMarkAttendanceModal(true)}
                      className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 min-h-[44px] shadow-lg"
                    >
                      <Check size={18} />
                      <span>Mark Attendance</span>
                    </button>
                    {currentUser && (
                      <button
                        onClick={() => setShowAddSubjectModal(true)}
                        className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 min-h-[44px] shadow-lg"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                  {bunkAnalysis.map((subject) => {
                    const isSafe = subject.warning === "SAFE";
                    return (
                      <div
                        key={subject.subjectCode}
                        className="group relative flex flex-col bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-4xl p-4 md:p-8 shadow-xl transition-all hover:shadow-lg hover:-translate-y-1"
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
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-95 min-h-[44px]"
                              title="Mark Attendance"
                            >
                              <Check size={16} className="text-zinc-400" />
                            </button>
                            <button
                              onClick={() => {
                                setSubjectToDelete(subject);
                                setShowDeleteSubjectModal(true);
                              }}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-95 min-h-[44px]"
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
            </>
            )}
          </div>
        )}

        {/* CALENDAR TAB */}
        {activeTab === "exams" && visitedTabs.has("exams") && (
          <div className="space-y-8">
            {!currentUser ? (
              <div className="text-center py-12 px-4 border border-white/5 rounded-2xl bg-zinc-900/20 backdrop-blur-sm">
                <InfoCircle size={48} className="mx-auto mb-4 text-zinc-600" />
                <h3 className="text-xl font-bold text-white mb-2">Login Required</h3>
                <p className="text-zinc-400 max-w-md mx-auto">
                  Please login to access your personal calendar and manage tasks
                </p>
              </div>
            ) : (
              <>
            {/* Header with Add Task Button */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Calendar & Tasks
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Keep track of your daily tasks and future reminders
                </p>
              </div>
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black border border-gray-200 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 min-h-[44px] shadow-lg "
              >
                <Plus size={18} className="transition-transform group-hover:rotate-90" />
                <span>Add Task</span>
              </button>
            </div>

            {/* Tasks Display */}
            {tasks && tasks.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-800/20 border border-zinc-600/30 rounded-lg flex items-center justify-center">
                      <CheckCircle size={20} className="text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        Your Tasks
                      </h3>
                      <p className="text-zinc-400 text-sm mt-1">
                        {tasks.length} task{tasks.length !== 1 ? 's' : ''} scheduled
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddTaskModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-700/20 border border-zinc-600/30 text-zinc-300 rounded-lg font-bold text-sm transition-all hover:bg-zinc-700/30 active:scale-95 min-h-[44px]"
                  >
                    <Plus size={16} />
                    Add Task
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                  {tasks.map((task) => (
                    <div
                      key={task._id}
                      className="group relative bg-zinc-900/40 backdrop-blur-sm border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-zinc-900/20 transition-all p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-white mb-1">
                            {task.subject}
                          </h4>
                          <p className="text-xs text-zinc-400 font-semibold">
                            {task.subjectCode === "TASK" ? "Task" : task.subjectCode}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setShowEditTaskModal(true);
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 transition-opacity active:scale-95 min-h-[44px]"
                            title="Edit task"
                          >
                            <EditPencil size={16} className="text-zinc-400" />
                          </button>
                          <button
                            onClick={() => {
                              setModalConfig({
                                isOpen: true,
                                title: "Delete Task",
                                message: "Are you sure you want to delete this task? This action cannot be undone.",
                                type: "error",
                                onConfirm: () => handleDeleteExam(task._id),
                              });
                            }}
                            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all active:scale-95 min-h-[44px]"
                            title="Delete task"
                          >
                            <Xmark size={16} className="text-red-400" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {task.startTime && (
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-zinc-800/20 rounded-lg flex items-center justify-center shrink-0">
                              <Clock size={16} className="text-zinc-400" />
                            </div>
                            <div>
                              <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase">
                                Time
                              </p>
                              <p className="font-semibold text-white text-sm mt-1">
                                {task.startTime}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-zinc-800/20 rounded-lg flex items-center justify-center shrink-0">
                            <Calendar size={16} className="text-zinc-400" />
                          </div>
                          <div>
                            <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase">
                              Date
                            </p>
                            <p className="font-semibold text-white text-sm mt-1">
                              {task.examDate ? new Date(task.examDate).toLocaleDateString() : "No date"}
                            </p>
                          </div>
                        </div>

                        {task.instructions && (
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-zinc-800/20 rounded-lg flex items-center justify-center shrink-0">
                              <Book size={16} className="text-zinc-400" />
                            </div>
                            <div>
                              <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase">
                                Details
                              </p>
                              <p className="font-semibold text-white text-sm mt-1 line-clamp-2">
                                {task.instructions}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-12 px-4 border border-white/5 rounded-2xl bg-zinc-900/20 backdrop-blur-sm">
                <Calendar size={48} className="mx-auto mb-4 text-zinc-600" />
                <h3 className="text-xl font-bold text-white mb-2">No Tasks Scheduled</h3>
                <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                  Create tasks and reminders to stay organized and productive throughout your day.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setShowAddTaskModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 min-h-[44px] shadow-lg"
                  >
                    <Plus size={18} />
                    Create Your First Task
                  </button>
                </div>
              </div>
            )}
            </>
            )}
          </div>
        )}

        {/* GPA CALCULATOR TAB */}
        {activeTab === "gpa" && visitedTabs.has("gpa") && (
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                GPA Calculator
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                Add your subjects and grades below
              </p>
            </div>

            {/* Results Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-700 rounded-2xl p-6 text-center">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">SGPA</p>
                <p className="text-3xl md:text-4xl font-bold text-white">{calcSGPA()}</p>
                <p className="text-xs text-zinc-500 mt-1">{getGradeStatus(calcSGPA())}</p>
              </div>
              <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-700 rounded-2xl p-6 text-center">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">CGPA</p>
                <p className="text-3xl md:text-4xl font-bold text-white">{calcCGPA()}</p>
                <p className="text-xs text-zinc-500 mt-1">{getGradeStatus(calcCGPA())}</p>
              </div>
            </div>

            {/* Previous GPA (optional) */}
            <details className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl">
              <summary className="px-5 py-3 text-sm font-semibold text-zinc-400 cursor-pointer hover:text-white transition-colors select-none">
                Include previous CGPA for accurate overall CGPA
              </summary>
              <div className="px-5 pb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Previous CGPA</label>
                  <input type="number" step="0.01" min="0" max="10"
                    value={prevCGPA}
                    onChange={e => setPrevCGPA(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/20 transition-colors"
                    placeholder="e.g. 8.5" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Previous Credits</label>
                  <input type="number" min="0"
                    value={prevCredits}
                    onChange={e => setPrevCredits(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/20 transition-colors"
                    placeholder="e.g. 120" />
                </div>
              </div>
            </details>

            {/* Subjects */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-300">Subjects</h3>
                <button onClick={addGpaSubject}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-full font-bold text-xs transition-all hover:scale-105 active:scale-95 min-h-[44px]">
                  <Plus size={14} />
                  Add
                </button>
              </div>

              {gpaSubjects.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-white/5 rounded-lg">
                  <p className="text-zinc-500 text-sm">No subjects added yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {gpaSubjects.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2 bg-zinc-800/30 border border-white/5 rounded-lg px-3 py-2">
                      <span className="text-xs text-zinc-500 w-5 shrink-0">{i + 1}.</span>
                      <input type="number" min="0" max="10" step="0.5"
                        value={s.credits} placeholder="Credits"
                        onChange={e => updateGpaSubject(s.id, 'credits', e.target.value)}
                        className="w-20 px-2 py-1.5 bg-zinc-900 border border-white/10 rounded text-white text-xs text-center focus:outline-none focus:border-white/20 transition-colors" />
                      <input type="number" min="0" max="10" step="0.1"
                        value={s.grade} placeholder="Grade"
                        onChange={e => updateGpaSubject(s.id, 'grade', e.target.value)}
                        className="w-20 px-2 py-1.5 bg-zinc-900 border border-white/10 rounded text-white text-xs text-center focus:outline-none focus:border-white/20 transition-colors" />
                      <span className="text-[10px] md:text-sm text-zinc-500 flex-1">Credits × Grade</span>
                      <button onClick={() => removeGpaSubject(s.id)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors shrink-0 active:scale-95 min-h-[44px]">
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {gpaSubjects.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-xs text-zinc-500">
                  <span>Subjects: {gpaSubjects.length}</span>
                  <span>Total Credits: {gpaSubjects.reduce((sum, s) => sum + (parseFloat(s.credits) || 0), 0)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "tools-docs" && (
          <div className="space-y-8">
            <ToolsPanel slug="documentation-tools" token={token} />
          </div>
        )}
        {activeTab === "tools-dev" && (
          <div className="space-y-8">
            <ToolsPanel slug="project-dev-tools" token={token} />
          </div>
        )}
        {activeTab === "tools-tutorials" && (
          <div className="space-y-8">
            <ToolsPanel slug="tutorials" token={token} />
          </div>
        )}
        {activeTab === "tools-github" && (
          <div className="space-y-8">
            <ToolsPanel slug="github-repos" token={token} />
          </div>
        )}
        {activeTab === "tools-oss" && (
          <div className="space-y-8">
            <ToolsPanel slug="open-source-projects" token={token} />
          </div>
        )}

      </div>

      {/* ==================== MODALS ==================== */}

      <ClassFormModal
        isOpen={showAddClassModal}
        onClose={() => setShowAddClassModal(false)}
        onSubmit={handleAddClass}
        loading={loading}
        isEditing={false}
        formData={newClass}
        onFormChange={(field, value) => setNewClass({ ...newClass, [field]: value })}
        daysOfWeek={daysOfWeek}
        classTypeColors={classTypeColors}
      />

      <ClassFormModal
        isOpen={showEditClassModal && !!editingClass}
        onClose={() => { setShowEditClassModal(false); setEditingClass(null); }}
        onSubmit={handleEditClass}
        loading={loading}
        isEditing={true}
        formData={editingClass || newClass}
        onFormChange={(field, value) => setEditingClass(prev => prev ? { ...prev, [field]: value } : prev)}
        daysOfWeek={daysOfWeek}
        classTypeColors={classTypeColors}
      />
      <AddSubjectModal
        isOpen={showAddSubjectModal}
        onClose={() => setShowAddSubjectModal(false)}
        onSubmit={handleAddSubject}
        loading={loading}
        newSubject={newSubject}
        setNewSubject={setNewSubject}
      />

      <DeleteConfirmModal
        isOpen={showDeleteSubjectModal && !!subjectToDelete}
        onClose={() => { setShowDeleteSubjectModal(false); setSubjectToDelete(null); }}
        onConfirm={() => handleDeleteSubject(subjectToDelete.subjectCode)}
        loading={loading}
        title="Delete Subject"
        message={subjectToDelete ? `Are you sure you want to delete ${subjectToDelete.subjectName} (${subjectToDelete.subjectCode})? All attendance records for this subject will be permanently deleted.` : ""}
        type="subject"
      />

      <DeleteConfirmModal
        isOpen={showDeleteClassModal && !!classToDelete}
        onClose={() => { setShowDeleteClassModal(false); setClassToDelete(null); }}
        onConfirm={() => handleDeleteClass(classToDelete.day, classToDelete.classId)}
        loading={loading}
        title="Delete Class"
        message={classToDelete ? `Are you sure you want to delete ${classToDelete.classData.subject} (${classToDelete.classData.subjectCode}) from ${classToDelete.day} at ${classToDelete.classData.startTime}?` : ""}
        type="class"
      />

      <MarkAttendanceModal
        isOpen={showMarkAttendanceModal}
        onClose={() => { setShowMarkAttendanceModal(false); setSelectedSubject(null); setAttendanceForm({ date: "", timeSlot: "", status: "PRESENT", notes: "" }); }}
        onSubmit={() => {
          if (selectedSubject) {
            handleMarkAttendance(selectedSubject.subjectCode, attendanceForm.date, attendanceForm.timeSlot, attendanceForm.status, attendanceForm.notes);
          }
        }}
        loading={loading}
        subjects={attendance?.subjects || []}
        selectedSubject={selectedSubject}
        onSubjectChange={(subject) => setSelectedSubject(subject)}
        attendanceForm={attendanceForm}
        onFormChange={(field, value) => setAttendanceForm({ ...attendanceForm, [field]: value })}
      />

      <AttendanceCalculatorModal
        isOpen={showCalculatorModal}
        onClose={() => setShowCalculatorModal(false)}
        calculatorForm={calculatorForm}
        setCalculatorForm={setCalculatorForm}
        calculateAttendance={calculateAttendance}
      />

      <TaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSubmit={handleAddExam}
        loading={loading}
        isEditing={false}
        formData={newTask}
        onFormChange={(field, value) => setNewTask({ ...newTask, [field]: value })}
      />

      <TaskModal
        isOpen={showEditTaskModal && !!editingTask}
        onClose={() => { setShowEditTaskModal(false); setEditingTask(null); }}
        onSubmit={handleEditExam}
        loading={loading}
        isEditing={true}
        formData={editingTask || newTask}
        onFormChange={(field, value) => setEditingTask(prev => prev ? { ...prev, [field]: value } : prev)}
      />
      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
      />
    </main>
  );
};

export default ToolsComponent;
