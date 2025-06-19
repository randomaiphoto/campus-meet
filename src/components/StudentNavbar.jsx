import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase";
import { toast } from "react-hot-toast";

export default function StudentNavbar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate('/login');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error('Failed to sign out');
    }
  };

  // Helper function to check if link is active
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Make sure it's clickable */}
          <Link 
            to="/events" 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">CampusMeet</span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {/* Host Event Button */}
            <Link 
              to="/host-event"
              className={`button-scale bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-2 ${
                isActive('/host-event') ? 'ring-2 ring-white/50' : ''
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Host Event</span>
            </Link>

            {/* Notifications Button */}
            <Link
              to="/notifications"
              className={`button-scale relative p-2 text-white hover:bg-white/10 rounded-xl transition-all ${
                isActive('/notifications') ? 'bg-white/20' : ''
              }`}
            >
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </Link>

            {/* Profile Dropdown */}
            <div className="relative group">
              <button 
                className="button-scale flex items-center space-x-3 p-2 text-white hover:bg-white/10 rounded-xl transition-all"
                onClick={() => {}} // Add click handler if needed
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                  {currentUser?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 py-2 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 invisible group-hover:visible transition-all opacity-0 group-hover:opacity-100">
                <div className="px-4 py-2 border-b border-white/10">
                  <p className="text-sm text-white truncate">{currentUser?.email}</p>
                </div>
                <Link 
                  to="/profile" 
                  className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-all"
                >
                  Profile Settings
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-white/10 transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
