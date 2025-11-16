import React, { createContext, useState, useEffect } from "react";
import api from "../api.js";

// --- NEW DEFAULT STATE ---
// We create a default guest user and college
const DEFAULT_COLLEGE = "Dr Ambedkar Institute of technology";
const GUEST_USER = {
  name: "Guest",
  email: "guest@portal.com",
  college: DEFAULT_COLLEGE,
  // We can add a 'role' to easily check
  role: "guest",
};

// 1. Create the context
const AuthContext = createContext();

// 2. Create the provider component
export const AuthProvider = ({ children }) => {
  // Load user from localStorage or default to Guest
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : GUEST_USER;
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      return GUEST_USER;
    }
  });

  // Load token or default to null
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  // isLoggedIn is true ONLY if there is a token
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);

  // Load college or default
  const [selectedCollege, setSelectedCollege] = useState(
    localStorage.getItem("college") || DEFAULT_COLLEGE
  );

  const [loading, setLoading] = useState(false);

  // This effect syncs the React state with localStorage
  useEffect(() => {
    // Only store a token if it's real
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }

    // Always store the selected college
    if (selectedCollege) {
      localStorage.setItem("college", selectedCollege);
    } else {
      localStorage.removeItem("college");
    }

    // Always store the user object (guest or logged-in)
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      // This shouldn't happen, but as a fallback, set guest
      localStorage.setItem("user", JSON.stringify(GUEST_USER));
    }

    // Keep isLoggedIn in sync with the token
    setIsLoggedIn(!!token);
  }, [token, selectedCollege, user]);

  // --- API Functions ---

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;

      setToken(token);
      setUser(user); // This is the REAL user object from the DB
      setSelectedCollege(user.college);

      setLoading(false);
      return true;
    } catch (error) {
      console.error(
        "Login failed:",
        error.response ? error.response.data : error.message
      );
      setLoading(false);
      return false;
    }
  };

  const register = async (username, email, password, college) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/register", {
        username,
        email,
        password,
        college,
      });
      const { token, user } = response.data;

      setToken(token);
      setUser(user);
      setSelectedCollege(user.college);

      setLoading(false);
      return true;
    } catch (error) {
      console.error(
        "Registration failed:",
        error.response ? error.response.data : error.message
      );
      setLoading(false);
      return false;
    }
  };

  // --- MODIFIED LOGOUT ---
  const logout = () => {
    // Revert to guest state instead of null
    setUser(GUEST_USER);
    setToken(null);
    setSelectedCollege(GUEST_USER.college);
    // The useEffect will automatically clear token & update localStorage
  };

  // --- NEW FUNCTION ---
  const changeCollege = (newCollege) => {
    setSelectedCollege(newCollege);
    // Update guest user object if user is a guest
    if (user.role === "guest") {
      setUser({ ...user, college: newCollege });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn,
        selectedCollege,
        loading,
        login,
        register,
        logout,
        changeCollege, // Expose the new function
        setUser,
        setSelectedCollege,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 4. Export the context
export default AuthContext;
