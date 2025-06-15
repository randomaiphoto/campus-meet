import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/login";
import Register from "./pages/register";
import Home from "./pages/Home";
import StudentDashboard from "./pages/StudentDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer"
            element={
              <ProtectedRoute allowedRoles={["organizer"]}>
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <FacultyDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
