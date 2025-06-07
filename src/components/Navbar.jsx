import { Link, useNavigate } from "react-router-dom";
import { LogOut, MessageSquare, Settings, User } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import NotificationDropdown from "./NotificationDropdown";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.log('Logout button clicked');

    try {
      // Call the logout function from store
      logout();

      // Force a small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate to login page
      navigate('/login', { replace: true });

      console.log('Redirected to login page');
    } catch (error) {
      console.error('Error during logout:', error);

      // Force logout even if there's an error
      localStorage.clear();
      navigate('/login', { replace: true });
    }
  };

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40
    backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">MessUp</h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <NotificationDropdown />
                <Link
                  to="/profile"
                  className="btn btn-sm gap-2 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
                <Link
                  to="/settings"
                  className="btn btn-sm gap-2 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn btn-sm gap-2 transition-colors hover:btn-error"
                  type="button"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="btn btn-sm gap-2 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
