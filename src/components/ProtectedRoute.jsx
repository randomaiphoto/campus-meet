// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, loading } = useAuth(); // Get loading state

  if (loading) {
    // If still loading auth state, don't render anything or show a loader
    // Consider rendering a global loading spinner component here for better UX
    return null;
  }

  if (!currentUser) {
    // User is not logged in, redirect to login page
    // Pass the current location to redirect back after login (optional, requires more setup)
    return <Navigate to="/login" replace />;
  }

  // currentUser is available, check role
  // currentUser.role should now exist after changes in AuthContext
  const userRole = currentUser.role;

  // Check if allowedRoles is provided and if the user has one of the allowed roles
  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      // User doesn't have the required role, or role is missing on the currentUser object
      // Redirect to a relevant page, e.g., home or an "unauthorized" page.
      // For now, redirecting to home as per the original logic.
      // Consider navigating to a specific "Unauthorized" page for better UX.
      return <Navigate to="/" replace />;
    }
  }
  // If allowedRoles is not provided (meaning any authenticated user can access),
  // or if the user has one of the allowed roles, render the children.
  return children;
}
