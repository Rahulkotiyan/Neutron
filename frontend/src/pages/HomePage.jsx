import React, { useContext } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Newspaper,
  MessageSquare,
  Briefcase,
  ChevronDown,
} from "lucide-react";
import AuthContext from "../context/AuthContext.jsx";

// --- NEW COLLEGE SELECTOR COMPONENT ---
function CollegeSelector() {
  const { selectedCollege, changeCollege, isLoggedIn } =
    useContext(AuthContext);

  const colleges = [
    "Dr Ambedkar Institute of technology",
    "R.V. College of Engineering",
    "BMS College of Engineering",
    "PES University",
  ];

  const handleChange = (e) => {
    changeCollege(e.target.value);
  };

  // A logged-in user CANNOT change their college (it's fixed to their account)
  // We only show this to guests.
  if (isLoggedIn) {
    return null; // Don't render anything if user is logged in
  }

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
      <label
        htmlFor="college"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Viewing as a Guest. Change college:
      </label>
      <div className="relative">
        <select
          id="college"
          value={selectedCollege}
          onChange={handleChange}
          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
        >
          {colleges.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const quickLinks = [
    {
      name: "Learning Resources",
      icon: BookOpen,
      path: "/resources",
      color: "bg-blue-500",
    },
    {
      name: "College Wall",
      icon: Newspaper,
      path: "/wall",
      color: "bg-green-500",
    },
    {
      name: "Placements",
      icon: Briefcase,
      path: "/placements",
      color: "bg-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 md:p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Welcome to the Neutron Portal
        </h1>
        <p className="mt-2 text-gray-600">
          Your one-stop solution at your selected college.
        </p>
      </div>

      {/* --- ADD THE COLLEGE SELECTOR HERE --- */}
      <CollegeSelector />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`p-6 block rounded-lg shadow-lg text-white text-left transition-transform transform hover:-translate-y-1 ${link.color}`}
          >
            <link.icon size={36} className="mb-3" />
            <h3 className="text-xl font-semibold">{link.name}</h3>
            <p className="text-sm opacity-90">
              Go to {link.name.toLowerCase()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
