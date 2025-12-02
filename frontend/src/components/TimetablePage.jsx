import { Menu } from "lucide-react";

const TimetablePage = ({ isSidebarOpen }) => (
  <main
    className={`flex-1 w-full p-6 text-white overflow-y-auto transition-all duration-300 pt-24 ${
      isSidebarOpen ? "lg:ml-72" : "lg:ml-0"
    }`}
  >
    <h2 className="text-2xl font-bold mb-6">Your Timetable</h2>
    <div className="overflow-x-auto">
      <div className="grid grid-cols-6 gap-2 text-center text-sm min-w-[600px]">
        <div className="font-bold text-zinc-500">Time</div>
        <div className="font-bold text-blue-400">Mon</div>
        <div className="font-bold text-blue-400">Tue</div>
        <div className="font-bold text-blue-400">Wed</div>
        <div className="font-bold text-blue-400">Thu</div>
        <div className="font-bold text-blue-400">Fri</div>
        <div className="text-zinc-500 py-4">9:00 AM</div>
        <div className="bg-zinc-900 rounded p-4 border border-white/5">
          Maths
        </div>
        <div className="bg-zinc-900 rounded p-4 border border-white/5">
          Physics
        </div>
        <div className="bg-zinc-900 rounded p-4 border border-white/5">Lab</div>
        <div className="bg-zinc-900 rounded p-4 border border-white/5">CS</div>
        <div className="bg-zinc-900 rounded p-4 border border-white/5">
          Free
        </div>
      </div>
    </div>
  </main>
);
export default TimetablePage;
