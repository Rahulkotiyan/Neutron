import { Menu } from "lucide-react";

const TimetablePage = ({ toggleSidebar }) => (
  // FIX: lg:ml-72
  <main className="flex-1 w-full p-6 text-white overflow-y-auto lg:ml-72">
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={toggleSidebar}
        className="hover:text-white transition-colors p-2 bg-zinc-900 rounded-xl text-zinc-400"
      >
        <Menu size={20} />
      </button>
      <h2 className="text-2xl font-bold">Your Timetable</h2>
    </div>
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
        <div className="text-zinc-500 py-4">11:00 AM</div>
        <div className="bg-zinc-900 rounded p-4 border border-white/5">
          English
        </div>
        <div className="bg-zinc-900 rounded p-4 border border-white/5">
          Maths
        </div>
        <div className="bg-zinc-900 rounded p-4 border border-white/5">Lab</div>
        <div className="bg-zinc-900 rounded p-4 border border-white/5">
          Physics
        </div>
        <div className="bg-zinc-900 rounded p-4 border border-white/5">CS</div>
      </div>
    </div>
  </main>
);
export default TimetablePage;
