import React, { useState, useContext } from "react";
import AuthContext from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";

// --- Login Form Component ---
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate("/home"); // Redirect to home on success
    } else {
      alert("Login Failed. Invalid email or password.");
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Login</h2>
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
      >
        <LogIn size={20} />
        <span>{loading ? "Logging in..." : "Login"}</span>
      </button>
    </form>
  );
}

// --- Register Form Component ---
function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [college, setCollege] = useState("Dr Ambedkar Institute of technology");
  const { register, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const colleges = [
    "Dr Ambedkar Institute of technology",
    "R.V. College of Engineering",
    "BMS College of Engineering",
    "PES University",
  ];

  const handleRegister = async (e) => {
    e.preventDefault();
    const success = await register(username, email, password, college);
    if (success) {
      navigate("/home"); // Redirect to home on success
    } else {
      alert("Registration Failed. User may already exist.");
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sign Up</h2>
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Username
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your Name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>
      <div>
        <label
          htmlFor="email-reg"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          type="email"
          id="email-reg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="student@email.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>
      <div>
        <label
          htmlFor="password-reg"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </label>
        <input
          type="password"
          id="password-reg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>
      <div>
        <label
          htmlFor="college-reg"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Select Your College
        </label>
        <select
          id="college-reg"
          value={college}
          onChange={(e) => setCollege(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          {colleges.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
      >
        <UserPlus size={20} />
        <span>{loading ? "Creating Account..." : "Sign Up"}</span>
      </button>
    </form>
  );
}

// --- Main Profile Page Component ---
export default function ProfilePage() {
  const { user, isLoggedIn } = useContext(AuthContext);
  // --- MODIFICATION: State to toggle between forms ---
  const [showLogin, setShowLogin] = useState(true);

  // If user is already logged in, show their profile
  if (isLoggedIn) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user.username}!
        </h1>
        <p className="text-lg text-gray-600">You are logged in as:</p>
        <p className="text-md text-gray-800 mt-4">{user.email}</p>
        <p className="text-md text-gray-800">{user.college}</p>
      </div>
    );
  }

  // If user is a GUEST, show Login and Register forms
  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div className="text-center p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900">
          You are currently browsing as a Guest.
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          Log in or create an account to post and upload resources.
        </p>
      </div>

      {/* --- MODIFICATION: Toggled form container --- */}
      <div className="bg-white rounded-lg shadow-md p-8">
        {showLogin ? <LoginForm /> : <RegisterForm />}

        <p className="text-center text-sm text-gray-600 mt-6">
          {showLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setShowLogin(!showLogin)} // Toggle the state
            className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
          >
            {showLogin ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
