import React from "react";
import {
  Calendar,
  GraphUp,
  ArrowRight,
  OpenInBrowser,
  Clock,
} from "iconoir-react";
import { useState } from "react";
import { useEffect } from "react";
import axios from "axios";
import TimetableWidget from "./TimetableWidget";
import AttendanceWidget from "./AttendanceWidget";

const Rightbar = () => {
  const [events, setEvents] = useState([]);
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/notices?noticeType=EVENT")
      .then((res) => setEvents(res.data))
      .catch(console.error);
  }, []);

  return (
    <aside className="w-80 bg-black border-l border-white/10 p-6 hidden lg:block fixed top-16 right-0 h-full overflow-y-auto no-scrollbar font-sans z-30">
      {/* Timetable Widget */}
      {token && currentUser && (
        <div className="mb-8">
          <TimetableWidget token={token} currentUser={currentUser} />
        </div>
      )}

      {/* Attendance Widget */}
      {token && (
        <div className="mb-8">
          <AttendanceWidget token={token} />
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Calendar iconSize={18} className="text-white" />
          <h3 className="font-bold text-zinc-400 text-sm uppercase">
            Upcoming Events
          </h3>
        </div>
        <div className="space-y-4">
          {events.length > 0 ? (
            events.map((evt, i) => (
              <div
                key={i}
                className="group p-4 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/20 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 blur-2xl"></div>
                <h4 className="font-bold text-zinc-200">{evt.title}</h4>
                <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                  <Clock iconSize={12} /> {evt.eventDate ? new Date(evt.eventDate).toLocaleDateString() : "TBA"} • {evt.location || "N/A"}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-zinc-600 italic">No upcoming events</p>
          )}
        </div>
      </div>
      <div>
        <h3 className="font-bold text-zinc-400 text-sm uppercase mb-5">
          Quick Access
        </h3>
        <div className="bg-zinc-900 border border-white/5 p-4 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-zinc-800 transition-all">
          <OpenInBrowser iconSize={18} className="text-zinc-500" />
          <div>
            <p className="text-sm font-bold text-white">Student Portal</p>
            <p className="text-[10px] text-zinc-500">Attendance & Grades</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Rightbar;
