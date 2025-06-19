import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase";
import { toast } from "react-hot-toast";

export default function FacultyNavbar() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left side - Logo */}
          <Link to="/faculty" className="text-xl font-bold text-white hover:text-white/80 transition-colors">
            <span className="text-white">Faculty Dashboard</span>
          </Link>

          {/* Right side - Navigation and Profile */}
          <div className="flex items-center space-x-8">
            <div className="hidden md:flex items-center space-x-4">
          {[
            { path: '/faculty', label: 'Dashboard' },
            { path: '/faculty/clubs', label: 'Clubs' },
            { path: '/faculty/faculties', label: 'Faculties' }
          ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive(item.path)
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-white">{item.label}</span>
                </Link>
              ))}
              <Link
                to="/faculty/academic-calendar"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-white ${
                  isActive('/faculty/academic-calendar') ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                Academic Calendar
              </Link>
            </div>

            {/* Profile Dropdown */}
            <div className="relative group">
              <button 
                className="flex items-center space-x-2 text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer"
                onClick={() => {}} // Add click handler if needed
              >
                <span className="text-white">{currentUser?.email}</span>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="absolute right-0 mt-2 w-48 py-2 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all">
                <Link
                  to="/faculty/profile"
                  className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
                >
                  Profile Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-white/10 transition-all duration-200 cursor-pointer"
                >
                  <span className="text-red-400">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className="md:hidden border-t border-white/10">
        <div className="px-2 py-3 space-y-1">
      {[
        { path: '/faculty', label: 'Dashboard' },
        { path: '/faculty/clubs', label: 'Clubs' },
        { path: '/faculty/faculties', label: 'Faculties' }
      ].map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
            isActive(item.path)
              ? 'bg-white/20 text-white'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <span className="text-white">{item.label}</span>
        </Link>
      ))}
        </div>
      </div>
    </nav>
  );
}
