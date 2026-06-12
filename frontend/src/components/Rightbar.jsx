import React, { Suspense, lazy } from "react";
import {
  Calendar,
  GraphUp,
  ArrowRight,
  OpenInBrowser,
  Clock,
} from "iconoir-react";

const TimetableWidget = lazy(() => import("./TimetableWidget"));
const AttendanceWidget = lazy(() => import("./AttendanceWidget"));

const Rightbar = () => {
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <aside className="w-80 bg-black border-l border-white/10 p-6 hidden lg:block fixed top-16 right-0 h-full overflow-y-auto no-scrollbar font-sans z-30">
      {/* Timetable Widget */}
      {token && currentUser && (
        <div className="mb-8">
          <Suspense fallback={<div className="h-24 bg-zinc-900/50 rounded-xl animate-pulse" />}>
            <TimetableWidget token={token} currentUser={currentUser} />
          </Suspense>
        </div>
      )}

      {/* Attendance Widget */}
      {token && (
        <div className="mb-8">
          <Suspense fallback={<div className="h-24 bg-zinc-900/50 rounded-xl animate-pulse" />}>
            <AttendanceWidget token={token} />
          </Suspense>
        </div>
      )}

      <div>
        <h3 className="font-bold text-zinc-400 text-sm uppercase mb-5">
          Quick Access
        </h3>
        <div className="bg-zinc-900 border border-white/5 p-4 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-zinc-800 transition-all">
          <OpenInBrowser className="w-4.5 h-4.5 text-zinc-500" />
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
