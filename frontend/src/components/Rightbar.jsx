import React from "react";
import { Calendar } from "lucide-react";

const Rightbar = () => {
  return (
    <aside className="w-80 bg-white border-l border-slate-200 p-6 hidden lg:block overflow-y-auto">
      <div className="mb-8">
        <h3>What's Trending</h3>
        <ul className="space-y-3 text-sm font-medium text-blue-500">
          {["#IPLFinal", "#SemesterExams", "#DAIT_FEST24"].map((tag) => (
            <li key={tag} className="cursor-pointer hover:underline">
              {tag}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-slate-700 mb-4">Upcoming Events</h3>
        <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-3 border border-slate-100">
          <div className="bg-blue-100 p-2.5 rounded-full text-blue-600">
            <Calendar size={20} />
          </div>
          <div>
            <p className="font=bold text-sm text-slate-800">Hackathon</p>
            <p className="text-xs text-slate-500">Sports Meet - June 10</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Rightbar;
