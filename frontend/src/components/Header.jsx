import React, { useContext } from "react";
import AuthContext from "../context/AuthContext";
import { Search, Menu } from "lucide-react";

export default function Header({ setIsSidebarOpen }) {
  const { user } = useContext(AuthContext);

  return (
    <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 md:px-6 z-10">
      <button
        className="lg:hidden text-gray-600"
        onClick={() => setIsSidebarOpen(true)}
      >
        <Menu size={28} />
      </button>

      <div className="hidden md:block">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search size={20} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search your subject..."
            className="pl-10 pr-4 py-2 w-72 rounded-full bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="text-gray-500 hover:text-gray-700">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341A6.002 6.002 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            ></path>
          </svg>
        </button>
        <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white text-sm">
          {user ? user.name.charAt(0) : "?"}
        </div>
      </div>
    </header>
  );
}
