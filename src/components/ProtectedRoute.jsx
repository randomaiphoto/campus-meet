import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userRole } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Check if user has the required role
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect based on role
    if (userRole === "faculty") {
      return <Navigate to="/faculty" />;
    } else if (userRole === "student") {
      return <Navigate to="/events" />;
    } else {
      return <Navigate to="/" />;
    }
  }

  return children;
}
