import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import StudentDashboard from "./pages/StudentDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Events from "./pages/Events";
import HostEvent from "./pages/HostEvent";
import FacultyClubs from "./pages/FacultyClubs";
import FacultyList from "./pages/FacultyList";
import FacultyProfile from "./pages/FacultyProfile";
import FacultyAcademicCalendar from "./pages/FacultyAcademicCalendar";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/events" element={<Events />} />
          <Route path="/host-event" element={<HostEvent />} />

          {/* Protected Routes */}
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
          <Route
            path="/faculty/clubs"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <FacultyClubs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/faculties"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <FacultyList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/profile"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <FacultyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/academic-calendar"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <FacultyAcademicCalendar />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
