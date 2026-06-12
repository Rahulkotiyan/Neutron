import React, { useState, useEffect, memo } from "react";
import axios from "axios";
import {
  Home,
  ViewGrid,
  OpenBook,
  Calendar,
  Xmark,
} from "iconoir-react";
import { useNavigate, useLocation } from "react-router-dom";
import "../SideBar.css";

const Sidebar = ({ isOpen, toggleSidebar, user, onLogin, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[90] lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleSidebar}
      />
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-64px)] w-72 bg-black text-zinc-600 flex flex-col z-[100] border-r border-white/[0.03] shadow-2xl transition-transform duration-300 font-sans ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={toggleSidebar}
          className="lg:hidden absolute -top-14 right-4 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-200 hover:text-white transition-all border border-zinc-700 shadow-lg"
        >
          <Xmark className="w-5 h-5" />
        </button>
        {/* Scrollable Navigation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4 scrollbar-hide">
          <div
            onClick={() => {
              navigate("/Feed");
              toggleSidebar();
            }}
          >
            <SidebarItem
              icon={<ViewGrid className="w-5 h-5" />}
              text="Campus Feed"
              active={isActive("/Feed")}
            />
          </div>

          <div className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.2em] px-5 mb-2 mt-2">
            Core
          </div>

          <div
            onClick={() => {
              navigate("/");
              toggleSidebar();
            }}
          >
            <SidebarItem
              icon={<Home className="w-5 h-5" />}
              text="Home"
              active={isActive("/")}
            />
          </div>

          <div className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.2em] px-5 mb-2 mt-6">
            Academic
          </div>

          <div
            onClick={() => {
              navigate("/tools");
              toggleSidebar();
            }}
          >
            <SidebarItem
              icon={<Calendar className="w-5 h-5" />}
              text="Tools"
              active={isActive("/tools")}
            />
          </div>

          <div
            onClick={() => {
              navigate("/notes");
              toggleSidebar();
            }}
          >
            <SidebarItem
              icon={<OpenBook className="w-5 h-5" />}
              text="Notes Library"
              active={isActive("/notes")}
            />
          </div>
        </nav>

        
      </aside>
    </>
  );
};

const SidebarItem = ({ icon, text, active, hasBadge }) => (
  <div
    className={`group flex items-center justify-between px-5 py-3.5 rounded-xl cursor-pointer transition-all duration-200 ease-out border active:scale-[0.98] ${
      active
        ? "bg-white/[0.05] text-white border-white/10 shadow-2xl shadow-black"
        : "text-zinc-600 hover:bg-white/[0.02] hover:text-white border-transparent hover:border-white/[0.01]"
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

export default memo(Sidebar);
