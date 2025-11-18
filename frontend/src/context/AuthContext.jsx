import React, { createContext, useState, useEffect } from "react";
import api from "../api.js";

// --- NEW DEFAULT STATE ---
// We create a default guest user and college
const AuthContext = createContext();
const DEFAULT_COLLEGE = "Dr Ambedkar Institute of technology";
const GUEST_USER = {
  name: "Guest",
  email: "guest@portal.com",
  college: DEFAULT_COLLEGE,
  role: "guest",
};

export const AuthProvider = ({ children }) => {
  // --- GLOBAL SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState("");

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : GUEST_USER;
    } catch (error) {
      return GUEST_USER;
    }
  });

  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);
  const [selectedCollege, setSelectedCollege] = useState(
    localStorage.getItem("college") || DEFAULT_COLLEGE
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");

    if (selectedCollege) localStorage.setItem("college", selectedCollege);
    else localStorage.removeItem("college");

    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.setItem("user", JSON.stringify(GUEST_USER));

    setIsLoggedIn(!!token);
  }, [token, selectedCollege, user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user: userDetails } = response.data;
      setToken(token);
      setUser(userDetails);
      setSelectedCollege(userDetails.college);
      setLoading(false);
      return true;
    } catch (error) {
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
      const { token, user: userDetails } = response.data;
      setToken(token);
      setUser(userDetails);
      setSelectedCollege(userDetails.college);
      setLoading(false);
      return true;
    } catch (error) {
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(GUEST_USER);
    setToken(null);
    setSelectedCollege(GUEST_USER.college);
    setSearchQuery(""); // Clear search on logout
  };

  const changeCollege = (newCollege) => {
    setSelectedCollege(newCollege);
    if (user && user.role === "guest") {
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
        changeCollege,
        searchQuery,
        setSearchQuery, // Export search state
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
