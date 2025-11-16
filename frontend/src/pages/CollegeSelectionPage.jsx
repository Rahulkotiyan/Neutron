import React, { useState, useContext } from "react";
import AuthContext from "../context/AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, User } from "lucide-react";

export default function CollegeSelectionPage() {
  const [college, setCollege] = useState("Dr Ambedkar Institute of technology");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, selectCollegeAsGuest, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const colleges = [
    "Dr Ambedkar Institute of technology",
    "R.V. College of Engineering",
    "BMS College of Engineering",
    "PES University",
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate("/portal/home"); // Redirect to portal on success
    } else {
      alert("Login Failed. Invalid email or password.");
    }
  };

  const handleGuest = () => {
    selectCollegeAsGuest(college);
    navigate("/portal/home"); // Redirect to portal
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-900">
          Welcome to <span className="text-blue-600">Neutron Portal</span>
        </h1>

        <form onSubmit={handleLogin} className="space-y-4 mt-6">
          <div>
            <label
              htmlFor="college"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Your College
            </label>
            <select
              id="college"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {colleges.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <LogIn size={20} />
            <span>{loading ? "Logging in..." : "Login"}</span>
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        <button
          onClick={handleGuest}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200"
        >
          <User size={20} />
          <span>Continue as Guest</span>
        </button>

        {/* --- HERE IS THE SIGN UP OPTION --- */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
