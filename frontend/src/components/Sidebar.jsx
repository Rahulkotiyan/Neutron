import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Home,
  Group,
  ViewGrid,
  OpenBook,
  ShoppingBag,
  Calendar,
  Page,
  Bell,
  ChatBubble,
  Message,
  LogOut,
  MediaImage as ImageIcon,
  Link as LinkIcon,
  X,
  ArrowLeft,
  UserCircle,
  LogIn,
  Search,
  Home as HomeIcon,
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
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden transition-opacity duration-300 ${
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
          className="lg:hidden absolute top-4 right-4 p-2.5 bg-white/[0.03] hover:bg-white/[0.05] rounded-xl text-zinc-700 hover:text-white transition-all border border-white/[0.05]"
        >
          <X className="w-5 h-5" />
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

          <div
            onClick={() => {
              navigate("/groups");
              toggleSidebar();
            }}
          >
            <SidebarItem
              icon={<Group className="w-5 h-5" />}
              text="Groups & Clubs"
              active={isActive("/groups")}
            />
          </div>

          {/* <div
            onClick={() => {
              navigate("/chats");
              toggleSidebar();
            }}
          >
            <SidebarItem
              icon={<MessageSquare size={20} />}
              text="Chats"
              active={isActive("/chats")}
            />
          </div> */}

          {/* <div
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
          </div> */}

          {/* <div
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
          </div> */}

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

        {/* Fixed Profile Card at Bottom */}
        <div className="flex-shrink-0 p-4 bg-black border-t border-white/5">
          {user ? (
            <div
              onClick={() => {
                navigate("/profile");
                toggleSidebar();
              }}
              className="group relative flex items-center gap-3 p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.03] hover:border-white/[0.05] transition-all cursor-pointer backdrop-blur-3xl"
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
                  className="w-4.5 h-4.5 text-zinc-600 group-hover:text-red-400 transition-colors"
                />
              </button>
            </div>
          ) : (
            <div
              onClick={onLogin}
              className="group relative flex items-center gap-3 p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.03] hover:border-white/[0.1] transition-all cursor-pointer backdrop-blur-3xl"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 ring-2 ring-black">
                  <UserCircle className="w-6 h-6" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 font-semibold truncate">
                  Guest User
                </p>
                <p className="text-xs text-zinc-600 truncate">
                  Click to Login
                </p>
              </div>
              <LogIn
                className="w-4.5 h-4.5 text-zinc-400 group-hover:translate-x-1 transition-transform"
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

export default Sidebar;
