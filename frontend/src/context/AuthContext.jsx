import React, { createContext, useState, useEffect } from "react";
import api from "../api.js";
import { useNavigate } from "react-router-dom";


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

// AuthProvider component definition
export const AuthProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate(); // Now this is safe, as AuthProvider will be inside BrowserRouter

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : GUEST_USER;
    } catch (error) {
      console.error("Failed to parse user from localStorage:", error);
      return GUEST_USER;
    }
  });

  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);
  const [selectedCollege, setSelectedCollege] = useState(
    localStorage.getItem("college") || DEFAULT_COLLEGE
  );
  const [loading, setLoading] = useState(false);

  // Define logout function here
  const logout = () => {
    setUser(GUEST_USER);
    setToken(null);
    setSelectedCollege(GUEST_USER.college);
    localStorage.removeItem("token"); // Explicitly remove from localStorage
    localStorage.removeItem("user"); // Explicitly remove from localStorage
    localStorage.removeItem("college"); // Explicitly remove from localStorage
    setSearchQuery("");
    navigate("/home"); // Redirect to home/login after logout
  };

  useEffect(() => {
    // Sync state with localStorage
    if (token !== localStorage.getItem("token")) {
      if (token) localStorage.setItem("token", token);
      else localStorage.removeItem("token");
    }

    if (selectedCollege !== localStorage.getItem("college")) {
      if (selectedCollege) localStorage.setItem("college", selectedCollege);
      else localStorage.removeItem("college");
    }

    const storedUserString = localStorage.getItem("user");
    const currentUserString = JSON.stringify(user);
    if (currentUserString !== storedUserString) {
      if (user) localStorage.setItem("user", currentUserString);
      else localStorage.setItem("user", JSON.stringify(GUEST_USER));
    }

    setIsLoggedIn(!!token);
  }, [token, selectedCollege, user]);

  // --- NEW: Effect to set up response interceptor once ---
  useEffect(() => {
    const errorInterceptor = api.interceptors.response.use(
      (response) => response, // Just return successful responses
      (error) => {
        // If the error status is 401 (Unauthorized)
        if (error.response && error.response.status === 401) {
          console.warn("Unauthorized (401) response detected. Logging out...");
          logout(); // Call the logout function from AuthContext
          // navigate('/login'); // logout already navigates
        }
        return Promise.reject(error); // Re-throw the error
      }
    );

    // Cleanup function to eject the interceptor when the component unmounts
    return () => {
      api.interceptors.response.eject(errorInterceptor);
    };
  }, [logout, navigate]); // Depend on logout and navigate

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
      console.error(
        "Login failed:",
        error.response?.data?.message || error.message
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
      const { token, user: userDetails } = response.data;
      setToken(token);
      setUser(userDetails);
      setSelectedCollege(userDetails.college);
      setLoading(false);
      return true;
    } catch (error) {
      console.error(
        "Registration failed:",
        error.response?.data?.message || error.message
      );
      setLoading(false);
      return false;
    }
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
        setSearchQuery,
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
