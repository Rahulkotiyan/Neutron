import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";

// Import your main layout
import MainPortal from "./components/MainPortal.jsx";

// Import the pages for the portal
import HomePage from "./pages/HomePage.jsx";
import CollegeWallPage from "./pages/CollegeWallPage.jsx";
import LearningResourcesPage from "./pages/LearningResourcesPage.jsx";
import CommunityChatPage from "./pages/CommunityChatPage.jsx";
import PlacementsPage from "./pages/PlacementPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx"; // --- IMPORT NEW PAGE ---

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* --- NEW ROUTING --- */}
          {/* The MainPortal is now the root layout */}
          <Route path="/" element={<MainPortal />}>
            {/* Default page is home */}
            <Route index element={<Navigate to="/home" replace />} />

            <Route path="home" element={<HomePage />} />
            <Route path="wall" element={<CollegeWallPage />} />
            <Route path="resources" element={<LearningResourcesPage />} />
            <Route path="chat" element={<CommunityChatPage />} />
            <Route path="placements" element={<PlacementsPage />} />

            {/* --- ADD NEW PROFILE ROUTE --- */}
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
