import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase";

export default function FacultyNavbar() {
  const { currentUser } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <span className="text-xl font-bold text-white">Faculty Dashboard</span>
          </div>

          {/* Right side - Navigation and Profile */}
          <div className="flex items-center space-x-8">
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/faculty"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-white ${
                  isActive('/faculty') ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/faculty/clubs"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-white ${
                  isActive('/faculty/clubs') ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                Clubs
              </Link>
              <Link
                to="/faculty/faculties"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-white ${
                  isActive('/faculty/faculties') ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                Faculties
              </Link>
            </div>

            <div className="relative group">
              <button className="flex items-center space-x-2 text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors">
                <span className="text-white">{currentUser?.email}</span>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="absolute right-0 mt-2 w-48 py-2 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all">
                <Link
                  to="/faculty/profile"
                  className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                >
                  Profile Settings
                </Link>
                <button
                  onClick={() => auth.signOut()}
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className="md:hidden border-t border-white/10">
        <div className="px-2 py-3 space-y-1">
          <Link
            to="/faculty"
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/faculty')
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/faculty/clubs"
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/faculty/clubs')
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Clubs
          </Link>
          <Link
            to="/faculty/faculties"
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/faculty/faculties')
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Faculties
          </Link>
        </div>
      </div>
    </nav>
  );
}
