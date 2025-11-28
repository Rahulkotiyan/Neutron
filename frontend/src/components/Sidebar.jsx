import React from "react";
import {
  Home,
  Users,
  Layout,
  BookOpen,
  ShoppingBag,
  Calendar,
  FileText,
  Bell,
  MessageSquare,
} from "lucide-react";

const Sidebar = ()=>{
    return (
      <aside className="w-64 bg-blue-900 text-slate-300 flex flex-col flex-shrink-0 transition-all">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="bg-white/10 p-1 rounded text-blue-400">N</span>{" "}
            Neutron
          </h1>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
            Institute of technology
          </p>
        </div>
        <nav>
          <SidebarItem icon={<Home size={20} />} text="Home" />
          <SidebarItem icon={<Users size={20} />} text="Groups" />
          <SidebarItem icon={<Layout size={20} />} text="Campus Feed" />
          <SidebarItem icon={<BookOpen size={20} />} text="Mentorship" />
          <SidebarItem icon={<ShoppingBag size={20} />} text="Marketplace" />
          <SidebarItem icon={<Calendar size={20} />} text="Timetable" />
          <SidebarItem icon={<FileText size={20} />} text="Resources" />
          <SidebarItem icon={<Bell size={20} />} text="Official Notices" />
          <SidebarItem
            icon={<MessageSquare size={20} />}
            text="Anonymous Confession"
          />
        </nav>

        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              RK
            </div>
            <div>
              <p className="text-sm text-white font-medium">Rahul Kotiyan</p>
              <p className="text-xs text-slate-500 cursor-pointer hover:text-blue-400">
                View profile
              </p>
            </div>
          </div>
        </div>
      </aside>
    );
};

const SidebarItem = ({ icon, text, active }) => (
  <div
    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
      active
        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    } `}
  >
    {icon}
    <span className="text-sm font-medium">{text}</span>
  </div>
);

export default Sidebar;