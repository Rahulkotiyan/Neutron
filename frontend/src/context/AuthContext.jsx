import React, { createContext, useState, useEffect } from "react";
import api from "../api.js"; // This path assumes api.js is in src/

// 1. Create the context
const AuthContext = createContext();

// 2. Create the provider component
export const AuthProvider = ({ children }) => {
  // Load user from localStorage using a function
  // This prevents errors if localStorage has malformed JSON
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      return null;
    }
  });

  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);
  const [selectedCollege, setSelectedCollege] = useState(
    localStorage.getItem("college") || null
  );
  const [loading, setLoading] = useState(false);

  // This effect syncs the React state with localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }

    if (selectedCollege) {
      localStorage.setItem("college", selectedCollege);
    } else {
      localStorage.removeItem("college");
    }

    // Save the entire user object to localStorage
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }

    // Keep isLoggedIn in sync with the token
    setIsLoggedIn(!!token);
  }, [token, selectedCollege, user]); // Run this effect when any of these change

  // --- API Functions ---

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;

      setToken(token);
      setUser(user);
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

  const selectCollegeAsGuest = (college) => {
    // Create a user object for the guest
    const guestUser = {
      name: "Guest",
      email: "guest@portal.com",
      college: college,
    };
    setSelectedCollege(college);
    setUser(guestUser); // Save the guest user object
    setIsLoggedIn(false); // A guest is not "logged in" with a token
  };

  const logout = () => {
    // Clear React state
    setUser(null);
    setToken(null);
    setSelectedCollege(null);
    // The useEffect will automatically clear localStorage
  };

  // 3. Provide these values to all child components
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
        selectCollegeAsGuest,
        setUser,
        setSelectedCollege,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 4. Export the context to be used by other components
export default AuthContext;
