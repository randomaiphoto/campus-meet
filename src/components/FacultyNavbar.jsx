import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function FacultyNavbar({ activeItem = "" }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  // Define navigation items
  const navItems = [
    { id: "dashboard", name: "Dashboard", path: "/faculty" },
    { id: "academicCalendar", name: "Academic Calendar", path: "/faculty/academic-calendar" },
    { id: "clubs", name: "Clubs", path: "/faculty/clubs" },
    { id: "faculties", name: "Faculties", path: "/faculty/faculties" },
  ];

  // Helper function to check if a nav item is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/faculty" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">CampusMeet</span>
          </Link>

          {/* Navigation Items - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path) || activeItem === item.id
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-white">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 focus:outline-none"
            >
              <svg
                className={`${mobileMenuOpen ? "hidden" : "block"} h-6 w-6 text-white`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${mobileMenuOpen ? "block" : "hidden"} h-6 w-6 text-white`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Profile Dropdown */}
          <div className="hidden md:flex items-center">
            <div className="relative group">
              <button className="flex items-center space-x-3 p-2 text-white hover:bg-white/10 rounded-xl transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                  {currentUser?.email?.[0]?.toUpperCase() || 'F'}
                </div>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 py-2 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 invisible group-hover:visible transition-all opacity-0 group-hover:opacity-100 z-50">
                <div className="px-4 py-2 border-b border-white/10">
                  <p className="text-sm text-white truncate">{currentUser?.email}</p>
                </div>
                <Link to="/faculty/profile" className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors">
                  <span className="text-white">Profile Settings</span>
                </Link>
                <button 
                  onClick={logout} 
                  className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-white/10 transition-colors"
                >
                  <span className="text-red-400">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1 px-2">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(item.path) || activeItem === item.id
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-white">{item.name}</span>
              </Link>
            ))}
            <Link
              to="/faculty/profile"
              className="block px-3 py-2 rounded-md text-base font-medium text-white/70 hover:text-white hover:bg-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-white">Profile</span>
            </Link>
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-300 hover:bg-white/10"
            >
              <span className="text-red-400">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}