import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { currentUser, role, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };
  
  const getDashboardLink = () => {
    if (!role) return "/";
    return `/${role}`;
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-indigo-600">
                Campus Events
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            {currentUser ? (
              <div className="flex items-center space-x-4">
                {role && (
                  <Link to={getDashboardLink()} className="text-gray-700 hover:text-indigo-600">
                    Dashboard
                  </Link>
                )}
                <span className="text-sm text-gray-600">
                  {currentUser.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="ml-4 px-3 py-1 rounded-md text-sm bg-red-500 text-white hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-indigo-600">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1 rounded-md text-sm bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
