import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx"; // Import .jsx

// Import your pages (with .jsx)
import CollegeSelectionPage from "./pages/CollegeSelectionPage.jsx";
import RegisterPage from "./pages/Register.jsx";
import MainPortal from "./components/MainPortal.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Import the pages for the portal
import HomePage from "./pages/HomePage.jsx";
import CollegeWallPage from "./pages/CollegeWallPage.jsx";
import LearningResourcesPage from "./pages/LearningResourcesPage.jsx";
import CommunityChatPage from "./pages/CommunityChatPage.jsx";
import PlacementsPage from "./pages/PlacementPage.jsx";

function App() {
  return (
    <AuthProvider>
      {" "}
      {/* Wrap the entire app in the Auth provider */}
      <BrowserRouter>
        <Routes>
          {/* Route 1: The public-facing college selection page */}
          <Route path="/" element={<CollegeSelectionPage />} />

          {/* Route 2: The new public-facing register page */}
          <Route path="/register" element={<RegisterPage />} />

          {/* Route 3: The protected portal */}
          <Route element={<ProtectedRoute />}>
            <Route path="/portal" element={<MainPortal />}>
              {/* These are the nested pages inside the portal */}
              <Route path="home" element={<HomePage />} />
              <Route path="wall" element={<CollegeWallPage />} />
              <Route path="resources" element={<LearningResourcesPage />} />
              <Route path="chat" element={<CommunityChatPage />} />
              <Route path="placements" element={<PlacementsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
