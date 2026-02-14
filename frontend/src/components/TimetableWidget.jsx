import React, { useState, useEffect } from "react";
import axios from "axios";
import { Clock, ChevronRight, AlertCircle, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const TimetableWidget = ({ token, currentUser }) => {
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [currentClass, setCurrentClass] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchData();
      // Refresh every 60 seconds
      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [todayRes, currentRes] = await Promise.all([
        axios.get("/api/timetable/personal/today", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/timetable/personal/current-class", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setTodaySchedule(todayRes.data.data || { classes: [] });
      setCurrentClass(currentRes.data.data || null);
    } catch (error) {
      console.error("Error fetching timetable widget data:", error);
      setTodaySchedule({ classes: [] });
      setCurrentClass(null);
    } finally {
      setLoading(false);
    }
  };

  if (!todaySchedule?.classes || todaySchedule.classes.length === 0) {
    return (
      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg p-6 border border-white/10">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BookOpen size={20} /> Today's Schedule
        </h3>
        <p className="text-zinc-400 text-center py-6">
          No classes scheduled for today 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg p-6 border border-white/10 hover:border-white/20 transition">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <BookOpen size={20} /> Today's Schedule
        </h3>
        <Link
          to="/timetable"
          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
        >
          View All <ChevronRight size={16} />
        </Link>
      </div>

      {/* Current Class Highlight */}
      {currentClass?.current && (
        <div className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded p-4">
          <p className="text-xs font-medium text-blue-100 mb-1">
            🔴 HAPPENING NOW
          </p>
          <p className="font-bold text-white">{currentClass.current.subject}</p>
          <p className="text-sm text-blue-100">
            {currentClass.current.timeSlot} • {currentClass.current.room}
          </p>
        </div>
      )}

      {/* Classes List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {todaySchedule.classes.slice(0, 4).map((cls, idx) => (
          <div
            key={idx}
            className="bg-zinc-700/50 hover:bg-zinc-700 rounded p-3 transition border-l-4"
            style={{ borderLeftColor: cls.color || "#3498db" }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-semibold text-sm">{cls.subject}</p>
                <p className="text-xs text-zinc-400">{cls.subjectCode}</p>
              </div>
              <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded">
                {cls.type}
              </span>
            </div>
            <div className="flex gap-3 text-xs text-zinc-400 mt-2">
              <span className="flex items-center gap-1">
                <Clock size={14} /> {cls.startTime}
              </span>
              <span>📍 {cls.room}</span>
            </div>
          </div>
        ))}
      </div>

      {todaySchedule.classes.length > 4 && (
        <p className="text-xs text-zinc-400 mt-3 text-center">
          +{todaySchedule.classes.length - 4} more classes
        </p>
      )}
    </div>
  );
};

export default TimetableWidget;
