import { useState } from "react";
import axios from "axios";
import { Xmark } from "iconoir-react";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { API_URL } from "../utils/api";

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Firebase Popup Login
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // 2. Get ID Token
      const token = await firebaseUser.getIdToken();

      // 3. Send to Backend
      const mode = isSignup ? "signup" : "login";
      const res = await axios.post(`${API_URL}/auth/google-login`, {
        token,
        mode,
      });

      if (res.data) {
        onLoginSuccess(res.data);
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
        className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 to-black border border-white/10 rounded-3xl p-8 m-4 backdrop-blur-xl shadow-[0_0_50px_rgba(255,255,255,0.05)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white active:scale-95 min-h-[44px]"
        >
          <Xmark size={20} />
        </button>

        <h2 className="text-3xl font-bold text-white mb-2 text-center">
          Welcome to Neutron
        </h2>
        <p className="text-zinc-400 text-center mb-6 text-sm">
          Your all-in-one campus companion for academics, community, and growth
        </p>

        {error && (
          <p className="text-red-400 text-center mb-4 text-sm">{error}</p>
        )}

        {/* Google Sign-In Button */}
        <div className="flex justify-center mb-6 mt-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full font-medium hover:bg-white/20 disabled:opacity-50 transition-all w-full active:scale-95 min-h-[44px]"
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

        <p className="text-center text-zinc-500 mt-4 cursor-pointer hover:text-white">
          {isSignup ? "Already part of Neutron? " : "New to Neutron? "}
          <span
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
            className="text-blue-400 font-semibold"
          >
            {isSignup ? "Sign In" : "Join Now"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
