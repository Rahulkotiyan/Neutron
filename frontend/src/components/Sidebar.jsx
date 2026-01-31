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
  LogOut,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  ChevronLeft,
  UserCircle,
  LogIn,
  Search,
  HomeIcon,
  Crown,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import "../SideBar.css";

const Sidebar = ({ isOpen, toggleSidebar, user, onLogin, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleSidebar}
      />
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-64px)] w-72 bg-black text-zinc-400 flex flex-col z-40 border-r border-white/10 shadow-2xl transition-transform duration-300 font-sans ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Scrollable Navigation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4 scrollbar-hide">
          <div
            onClick={() => {
              navigate("/");
              toggleSidebar();
            }}
          >
            <SidebarItem
              icon={<HomeIcon size={20} />}
              text="Home"
              active={isActive("/")}
            />
          </div>

          <div className="text-xs font-bold text-zinc-600 uppercase tracking-wider px-4 mb-2 mt-2">
            Core
          </div>

          <div
            onClick={() => {
              navigate("/Feed");
              toggleSidebar();
            }}
          >
            <SidebarItem
              icon={<Layout size={20} />}
              text="Campus Feed"
              active={isActive("/Feed")}
            />
          </div>

          <div
            onClick={() => {
              navigate("/groups");
              toggleSidebar();
            }}
          >
            <SidebarItem
              icon={<Users size={20} />}
              text="Groups & Clubs"
              active={isActive("/groups")}
            />
          </div>

          <div
            onClick={() => {
              navigate("/market");
              toggleSidebar();
            }}
          >
            <SidebarItem
              icon={<ShoppingBag size={20} />}
              text="Marketplace"
              active={isActive("/market")}
            />
          </div>

          <div
            onClick={() => {
              navigate("/lost-found");
              toggleSidebar();
            }}
          >
            <SidebarItem
              icon={<Search size={20} />}
              text="Lost & Found"
              active={isActive("/lost-found")}
            />
          </div>

          <div className="text-xs font-bold text-zinc-600 uppercase tracking-wider px-4 mb-2 mt-6">
            Academic
          </div>

          <div
            onClick={() => {
              navigate("/timetable");
              toggleSidebar();
            }}
          >
            <SidebarItem
              icon={<Calendar size={20} />}
              text="Timetable"
              active={isActive("/timetable")}
            />
          </div>

          <div
            onClick={() => {
              navigate("/notes");
              toggleSidebar();
            }}
          >
            <SidebarItem
              icon={<BookOpen size={20} />}
              text="Notes Library"
              active={isActive("/notes")}
            />
          </div>

          <div
            onClick={() => {
              navigate("/notices");
              toggleSidebar();
            }}
          >
            <SidebarItem
              icon={<Bell size={20} />}
              text="Official Notices"
              active={isActive("/notices")}
            />
          </div>

          <div
            onClick={() => {
              navigate("/confessions");
              toggleSidebar();
            }}
            className="opacity-70 hover:opacity-100"
          >
            <SidebarItem
              icon={<MessageSquare size={20} />}
              text="Confessions"
              active={isActive("/confessions")}
            />
          </div>

          <div
            onClick={() => {
              navigate("/premium");
              toggleSidebar();
            }}
            className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg"
          >
            <SidebarItem
              icon={<Crown size={20} className="text-yellow-400" />}
              text="Premium Plans"
              active={isActive("/premium")}
            />
          </div>
        </nav>

        {/* Fixed Profile Card at Bottom */}
        <div className="flex-shrink-0 p-4 bg-black border-t border-white/5">
          {user ? (
            <div
              onClick={() => {
                navigate("/profile");
                toggleSidebar();
              }}
              className="group relative flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-800 hover:border-white/20 transition-all cursor-pointer backdrop-blur-md"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-600 to-zinc-800 flex items-center justify-center text-white font-bold text-sm ring-2 ring-black">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full"></span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 font-semibold truncate">
                  {user.name || "User"}
                </p>
                <p className="text-xs text-zinc-600 truncate">
                  {user.handle || "No handle"}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                title="Logout"
              >
                <LogOut
                  size={18}
                  className="text-zinc-600 group-hover:text-red-400 transition-colors"
                />
              </button>
            </div>
          ) : (
            <div
              onClick={onLogin}
              className="group relative flex items-center gap-3 p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 hover:border-blue-500/40 transition-all cursor-pointer backdrop-blur-md"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 ring-2 ring-black">
                  <UserCircle size={24} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-blue-200 font-semibold truncate">
                  Guest User
                </p>
                <p className="text-xs text-blue-400/70 truncate">
                  Click to Login
                </p>
              </div>
              <LogIn
                size={18}
                className="text-blue-400 group-hover:translate-x-1 transition-transform"
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

const SidebarItem = ({ icon, text, active, hasBadge }) => (
  <div
    className={`group flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-300 ease-out border border-transparent ${
      active
        ? "bg-zinc-900 text-white border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] scale-[1.02]"
        : "text-zinc-500 hover:bg-zinc-900 hover:text-white hover:border-white/5"
    }`}
  >
    <div className="flex items-center gap-3">
      <span
        className={
          active ? "text-white" : "text-zinc-500 group-hover:text-white"
        }
      >
        {icon}
      </span>
      <span className="text-sm font-medium tracking-wide">{text}</span>
    </div>
    {active && (
      <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full blur-[1px]"></div>
    )}
  </div>
);

export default Sidebar;
