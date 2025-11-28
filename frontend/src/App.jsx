import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import HomePage from "scenes/homePage";
import LoginPage from "scenes/loginPage";
import { useSelector } from "react-redux";
import { useMemo } from "react";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider, CssBaseline } from "@mui/material";
import MarketplacePage from "scenes/marketplacePage";
import ResourcesPage from "scenes/resourcesPage";
import AdminPage from "./scenes/adminPage"
import GroupsPage from "scenes/groupsPage";


// Basic Theme Configuration
const themeSettings = (mode) => {
  return {
    palette: {
      mode: mode,
      primary: {
        main: "#0056b3", // Darker blue for primary actions
        light: "#e3f2fd", // Light blue background
      },
      neutral: {
        dark: "#333333",
        medium: "#666666",
        light: "#f0f2f5", // Light gray for general background
      },
      background: {
        default: mode === "dark" ? "#0A0A0A" : "#f0f2f5", // Light gray background for the whole app
        alt: mode === "dark" ? "#1A1A1A" : "#FFFFFF", // White for cards
      },
    },
    typography: {
      fontFamily: ["Inter", "sans-serif"].join(","),
      fontSize: 12,
      h1: {
        fontFamily: ["Inter", "sans-serif"].join(","),
        fontSize: 40,
      },
      h2: {
        fontFamily: ["Inter", "sans-serif"].join(","),
        fontSize: 32,
      },
      h3: {
        fontFamily: ["Inter", "sans-serif"].join(","),
        fontSize: 24,
      },
      h4: {
        fontFamily: ["Inter", "sans-serif"].join(","),
        fontSize: 20,
      },
      h5: {
        fontFamily: ["Inter", "sans-serif"].join(","),
        fontSize: 16,
      },
      h6: {
        fontFamily: ["Inter", "sans-serif"].join(","),
        fontSize: 14,
      },
    },
  };
};

function App() {
  const mode = useSelector((state) => state.mode);
  const isAuth = Boolean(useSelector((state) => state.token));
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);

  return (
    <div className="app">
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route
              path="/home"
              element={isAuth ? <HomePage /> : <Navigate to="/" />}
            />
            <Route
              path="/feed"
              element={isAuth ? <HomePage /> : <Navigate to="/" />}
            />
            <Route
              path="/market"
              element={isAuth ? <MarketplacePage /> : <Navigate to="/" />}
            />
            <Route
              path="/resources"
              element={isAuth ? <ResourcesPage /> : <Navigate to="/" />}
            />
            <Route
              path="/groups"
              element={isAuth ? <GroupsPage /> : <Navigate to="/" />}
            />
            <Route
              path="/admin"
              element={isAuth ? <AdminPage /> : <Navigate to="/" />}
            />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
