import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import HomePage from "scenes/homePage";
import LoginPage from "scenes/loginPage";
import { useSelector } from "react-redux";
import { useMemo } from "react";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider, CssBaseline } from "@mui/material";

// Basic Theme Configuration
const themeSettings = (mode) => {
  return {
    palette: {
      mode: mode,
      primary: { main: "#00D5FA" },
      neutral: { dark: "#333333", medium: "#666666", light: "#F0F0F0" },
      background: {
        default: mode === "dark" ? "#0A0A0A" : "#F6F6F6",
        alt: mode === "dark" ? "#1A1A1A" : "#FFFFFF",
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
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
