import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const ProtectedRoute = () => {
  const { selectedCollege } = useContext(AuthContext);

  if (!selectedCollege) {
    // If no college is selected, redirect to the home/selection page
    return <Navigate to="/" replace />;
  }

  // If college is selected, render the child component (e.g., the MainPortal)
  return <Outlet />;
};

export default ProtectedRoute;
