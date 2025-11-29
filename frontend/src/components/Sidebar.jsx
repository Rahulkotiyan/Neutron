import React, { useState, useEffect } from "react";
import axios from "axios";
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
  LogOut, // Sidebar Icons
  TrendingUp,
  ChevronRight,
  ExternalLink,
  Clock, // Rightbar Icons
  MoreHorizontal,
  Share2,
  Bookmark,
  ArrowBigUp,
  Heart, // PostCard Icons
  Image as ImageIcon,
  Link as LinkIcon,
  Video, // App Icons
} from "lucide-react";

// ==========================================
// 1. SIDEBAR COMPONENT (Stealth / Black Style)
// ==========================================
const Sidebar = () => {
  return (
    <aside className="w-72 bg-black text-zinc-400 flex flex-col fixed h-full z-20 border-r border-white/10 shadow-2xl transition-all font-sans">
      {/* --- LOGO SECTION --- */}
      <div className="p-8 pb-6">
        <h1 className="text-3xl font-extrabold flex items-center gap-3 tracking-tight">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-black shadow-lg shadow-zinc-500/10 text-white border border-white/10">
            N{/* White glow dot */}
            <span className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full animate-pulse -mr-0.5 -mt-0.5 shadow-[0_0_10px_rgba(255,255,255,0.8)]"></span>
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
            NEUTRON
          </span>
        </h1>
        <p className="text-[10px] font-bold text-zinc-600 mt-2 uppercase tracking-[0.2em] pl-1">
          Obsidian Dashboard
        </p>
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar py-4">
        <div className="text-xs font-bold text-zinc-600 uppercase tracking-wider px-4 mb-2 mt-2">
          Menu
        </div>

        <SidebarItem icon={<Home size={20} />} text="Home" />
        <SidebarItem icon={<Users size={20} />} text="Groups" />
        <SidebarItem icon={<Layout size={20} />} text="Campus Feed"/>
        <SidebarItem icon={<BookOpen size={20} />} text="Mentorship" />
        <SidebarItem icon={<ShoppingBag size={20} />} text="Marketplace" />

        <div className="text-xs font-bold text-zinc-600 uppercase tracking-wider px-4 mb-2 mt-6">
          Academic
        </div>

        <SidebarItem icon={<Calendar size={20} />} text="Timetable" />
        <SidebarItem icon={<FileText size={20} />} text="Resources" />
        <SidebarItem icon={<Bell size={20} />} text="Notices" hasBadge />
        <SidebarItem icon={<MessageSquare size={20} />} text="Confessions" />
      </nav>

      {/* --- PROFILE CARD --- */}
      <div className="p-4">
        <div className="group relative flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-800 hover:border-white/20 transition-all cursor-pointer backdrop-blur-md">
          <div className="relative">
            {/* Monochrome Gradient Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-600 to-zinc-800 flex items-center justify-center text-white font-bold text-sm ring-2 ring-black">
              RK
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full"></span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-200 font-semibold truncate group-hover:text-white transition-colors">
              Rahul Kotiyan
            </p>
            <p className="text-xs text-zinc-600 truncate">@rahul_k</p>
          </div>

          <LogOut
            size={18}
            className="text-zinc-600 group-hover:text-red-400 transition-colors"
          />
        </div>
      </div>
    </aside>
  );
};

const SidebarItem = ({ icon, text, active, hasBadge }) => (
  <div
    className={`group flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-300 ease-out border border-transparent
      ${
        active
          ? "bg-zinc-900 text-white border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] scale-[1.02]"
          : "text-zinc-500 hover:bg-zinc-900 hover:text-white hover:border-white/5"
      }`}
  >
    <div className="flex items-center gap-3">
      <span
        className={`transition-transform duration-300 ${
          !active && "group-hover:scale-110 group-hover:rotate-3"
        } ${active ? "text-white" : "text-zinc-500 group-hover:text-white"}`}
      >
        {icon}
      </span>
      <span className="text-sm font-medium tracking-wide">{text}</span>
    </div>
    {hasBadge && (
      <span className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]"></span>
    )}
    {/* White active bar */}
    {active && (
      <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full blur-[1px]"></div>
    )}
  </div>
);
export default Sidebar;