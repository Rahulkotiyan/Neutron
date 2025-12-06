import { useState, useEffect } from "react";
import axios from "axios";
import {
  X,
  Mail as MailIcon,
  Lock as LockIcon,
  User as UserIcon,
} from "lucide-react";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isSignup ? "/api/register" : "/api/login";
      const payload = isSignup
        ? formData
        : { email: formData.email, password: formData.password };

      const res = await axios.post(`http://localhost:5000${endpoint}`, payload);
      console.log("Auth Response:", res.data);
      if (res.data) onLoginSuccess(res.data);
      setFormData({ name: "", email: "", password: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Auth Failed. Check Server.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Firebase Popup Login
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // 2. Get ID Token
      const token = await firebaseUser.getIdToken();
      console.log("Token obtained successfully");

      // 3. Send to Backend
      const mode = isSignup ? "signup" : "login";
      const res = await axios.post("http://localhost:5000/api/google-login", {
        token,
        mode,
      });

      console.log("Google Auth Response:", res.data);
      if (res.data) {
        onLoginSuccess(res.data);
        setFormData({ name: "", email: "", password: "" });
      }
    } catch (err) {
      console.error("Google Sign-In Error:", err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Google login failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-3xl p-8 m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-3xl font-bold text-white mb-2 text-center">
          {isSignup ? "Join Neutron" : "Welcome Back"}
        </h2>

        {error && (
          <p className="text-red-400 text-center mb-4 text-sm">{error}</p>
        )}

        {/* Google Sign-In Button */}
        <div className="flex justify-center mb-6 mt-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex items-center justify-center gap-3 bg-white text-gray-800 px-6 py-3 rounded-full font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors w-full"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? "Connecting..." : `Continue with Google`}
          </button>
        </div>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-white/10 w-full absolute"></div>
          <span className="bg-[#0f172a] px-3 text-zinc-500 text-sm relative z-10 font-medium">
            OR
          </span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {isSignup && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              required={isSignup}
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 disabled:opacity-50 transition-all"
          >
            {loading ? "Loading..." : isSignup ? "Sign Up" : "Login"}
          </button>
        </form>

        <p className="text-center text-zinc-500 mt-4 cursor-pointer hover:text-white">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <span
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
            className="text-blue-400 font-semibold"
          >
            {isSignup ? "Login" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
