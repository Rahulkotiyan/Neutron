import React, { memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Globe, Book, Calendar, Building } from "iconoir-react";

const MobileFooter = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: "campus",
      label: "Campus Feed",
      icon: Building,
      path: "/Feed",
    },
    {
      id: "notes",
      label: "Notes Library",
      icon: Book,
      path: "/notes",
    },
    {
      id: "tools",
      label: "Tools",
      icon: Calendar,
      path: "/tools",
    },
  ];

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-black backdrop-blur-md border-t border-white/10 z-50 shadow-2xl">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 relative group rounded-lg ${
                active
                  ? "text-white bg-white/10"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <IconComponent
                size={24}
                className={`transition-transform duration-200 ${
                  active ? "scale-110" : "group-hover:scale-105"
                }`}
              />
              <span className="text-[0.65rem] sm:text-xs md:text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(MobileFooter);
