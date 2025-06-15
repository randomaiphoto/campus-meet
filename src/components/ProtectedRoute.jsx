import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser } = useAuth();

  // For demo purposes only - in a real app, you'd check user roles from your database or auth provider
  const userRole = "student"; // This would come from your user database

  if (!currentUser) {
    // User is not logged in, redirect to login
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // User doesn't have the required role, redirect to home
    return <Navigate to="/" />;
  }

  // User is logged in and has the required role, render the protected component
  return children;
}
