import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";
import { useThemeStore } from "./store/useThemeStore";
import ProfilePage from "./pages/ProfilePage";
import { Toaster } from "react-hot-toast";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthStore } from "./store/useAuthStore";

const App = () => {
  const { theme } = useThemeStore();
  const { isAuthenticated, checkAuthStatus } = useAuthStore();

  // Check auth status on app load and periodically
  useEffect(() => {
    // Check immediately
    checkAuthStatus();
    
    // Check every 5 minutes
    const interval = setInterval(() => {
      checkAuthStatus();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [checkAuthStatus]);

  return (
    <div data-theme={theme}>
      <Toaster position="top-right" />
      <Navbar />
      <Routes>
        {/* Redirect from root to login if not authenticated */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Auth routes - accessible only when not logged in */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/" /> : <SignUpPage />}
        />

        {/* Protected routes - require authentication */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;