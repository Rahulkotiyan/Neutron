import { useState } from "react";
import axios from "axios";
import {
  X,
  Mail as MailIcon,
  Lock as LockIcon,
  User as UserIcon,
} from "lucide-react";

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const endpoint = isSignup ? "/api/register" : "/api/login";
    const payload = isSignup
      ? formData
      : { email: formData.email, password: formData.password };

    try {
      const res = await axios.post(`http://localhost:5000${endpoint}`, payload);
      onLoginSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl p-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="relative z-10 text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {isSignup ? "Join Neutron" : "Welcome Back"}
          </h2>
          <p className="text-zinc-400 text-sm">
            {isSignup
              ? "Create an account to connect with campus"
              : "Enter your credentials to access your dashboard"}
          </p>
        </div>

        {error && (
          <div className="relative z-10 mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          {isSignup && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 ml-1 uppercase">
                Full Name
              </label>
              <div className="relative">
                <UserIcon
                  className="absolute left-3 top-3 text-zinc-500"
                  size={18}
                />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-700"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 ml-1 uppercase">
              Email Address
            </label>
            <div className="relative">
              <MailIcon
                className="absolute left-3 top-3 text-zinc-500"
                size={18}
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@university.edu"
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-700"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 ml-1 uppercase">
              Password
            </label>
            <div className="relative">
              <LockIcon
                className="absolute left-3 top-3 text-zinc-500"
                size={18}
              />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-95 mt-2"
          >
            {isLoading ? "Loading..." : isSignup ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="relative z-10 mt-6 text-center">
          <p className="text-zinc-500 text-sm">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-blue-400 hover:text-blue-300 font-semibold hover:underline"
            >
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
