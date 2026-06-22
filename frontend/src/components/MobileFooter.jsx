import React, { memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Building, Book, Calendar, Plus } from "iconoir-react";

const MobileFooter = ({ onOpenCreatePost }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "campus", label: "Campus Feed", icon: Building, path: "/Feed" },
    { id: "notes", label: "Notes Library", icon: Book, path: "/notes" },
    { id: "tools", label: "Tools", icon: Calendar, path: "/tools" },
  ];

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-black backdrop-blur-md border-t border-white/10 z-50 shadow-2xl">
      <div className="flex justify-around items-center h-14 px-2 pb-safe">
        {navItems.slice(0, 2).map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-200 relative group rounded-xl ${
                active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                active ? "bg-white/10" : ""
              }`}>
                <IconComponent
                  size={20}
                  className={`transition-transform duration-200 ${
                    active ? "scale-110" : "group-hover:scale-105"
                  }`}
                />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
        {/* Center FAB */}
        <button
          onClick={onOpenCreatePost}
          className="relative -top-4 flex items-center justify-center w-12 h-12 min-w-12 min-h-12 rounded-full bg-zinc-800 shadow-xl hover:scale-105 active:scale-95 transition-transform flex-shrink-0"
        >
          <Plus size={22} className="text-blue-400" />
        </button>
        {navItems.slice(2).map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-200 relative group rounded-xl ${
                active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                active ? "bg-white/10" : ""
              }`}>
                <IconComponent
                  size={20}
                  className={`transition-transform duration-200 ${
                    active ? "scale-110" : "group-hover:scale-105"
                  }`}
                />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(MobileFooter);
