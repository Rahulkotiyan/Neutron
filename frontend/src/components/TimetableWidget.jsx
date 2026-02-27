import React, { useState, useEffect } from "react";
import axios from "axios";
import { Clock, ArrowRight, WarningCircle, Book } from "iconoir-react";
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
      <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[2rem] p-6 border border-white/10 shadow-premium">
        <h3 className="text-[10px] font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-zinc-500">
          <Book size={16} /> Today's Core
        </h3>
        <p className="text-zinc-400 text-center py-6">
          No classes scheduled for today 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[2rem] p-6 border border-white/10 shadow-premium">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest text-zinc-500">
          <Book size={16} /> Today's Core
        </h3>
        <Link
          to="/timetable"
          className="text-white hover:text-white/70 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
        >
          Access <ArrowRight size={12} />
        </Link>
      </div>

      {/* Current Class Highlight */}
      {currentClass?.current && (
        <div className="mb-6 bg-white text-black rounded-2xl p-5 shadow-premium">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60 mb-1">
            Active Core
          </p>
          <p className="text-lg font-black">{currentClass.current.subject}</p>
          <p className="text-xs font-bold opacity-70">
            {currentClass.current.timeSlot} • {currentClass.current.room}
          </p>
        </div>
      )}

      {/* Classes List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {todaySchedule.classes.slice(0, 4).map((cls, idx) => (
          <div
            key={idx}
            className="bg-white/[0.03] hover:bg-white/[0.08] rounded-xl p-4 transition border border-white/5"
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
