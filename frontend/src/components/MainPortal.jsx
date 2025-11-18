import React, { useState } from "react";
import { Outlet } from "react-router-dom"; // This will render the child pages
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainPortal() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 font-inter">
      {/* This is the only state the portal needs to manage.
        The *desktop* collapsed state will be managed *inside* the Sidebar.
      */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setIsSidebarOpen={setIsSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
