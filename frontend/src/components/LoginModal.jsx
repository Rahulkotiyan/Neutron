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

  if (!isOpen) return null;
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isSignup ? "/api/register" : "/api/login";
      const res = await axios.post(
        `http://localhost:5000${endpoint}`,
        formData
      );
      if (res.data) onLoginSuccess(res.data);
    } catch (err) {
      setError("Auth Failed. Check Server.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-3xl p-8 m-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          <X size={20} />
        </button>
        <h2 className="text-3xl font-bold text-white mb-2 text-center">
          {isSignup ? "Join Neutron" : "Welcome Back"}
        </h2>
        {error && <p className="text-red-400 text-center mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {isSignup && (
            <input
              type="text"
              placeholder="Name"
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white"
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          )}
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white"
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white"
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
          <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-all">
            {isSignup ? "Sign Up" : "Login"}
          </button>
        </form>
        <p
          className="text-center text-zinc-500 mt-4 cursor-pointer hover:text-white"
          onClick={() => setIsSignup(!isSignup)}
        >
          {isSignup ? "Login instead" : "Create Account"}
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
