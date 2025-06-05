import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";
import { useThemeStore } from "./store/useThemeStore";
import ProfilePage from "./pages/ProfilePage";
import { Toaster } from "react-hot-toast";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";

const App = () => {
  const { theme } = useThemeStore();

  return (
    <div data-theme={theme}>
    <Toaster position="top-right" />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/Profile" element={<ProfilePage />} />
      </Routes>
    </div>
  );
};

export default App;
