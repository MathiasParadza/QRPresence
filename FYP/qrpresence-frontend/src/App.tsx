import { BrowserRouter as Router, Route, Routes, useNavigate, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

// Pages
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import StudentView from "./pages/StudentView/StudentView";
import LecturerView from "./pages/LecturerView/LecturerView";
import CreateSession from "./pages/LecturerView/CreateSession";
import SessionList from "./pages/LecturerView/SessionList";
import SessionEdit from "./pages/LecturerView/SessionEdit";
import StudentManager from "./pages/LecturerView/StudentManager";
import QRCodeGenerator from "./components/QRCodeGenerator";
import CourseManagement from "./pages/LecturerView/CourseManagement";
import LecturerEnrollmentManager from "./pages/LecturerView/LecturerEnrollmentManager";

// Admin Components
import AdminLayout from "./pages/AdminView/AdminLayout";
import AdminDashboard from "./pages/AdminView/Dashboard";
import UserManagement from "./pages/AdminView/UserManager";
import LecturerManagement from "./pages/AdminView/LecturerManagement";
import StudentManagement from "./pages/AdminView/StudentManagement";
import CourseManagementAdmin from "./pages/AdminView/CourseManagement";
import EnrollmentManagement from "./pages/AdminView/EnrollmentManagement";
import AttendanceManagement from "./pages/AdminView/AttendanceManagement";
import AdminSettings from "./pages/AdminView/SiteSettings";

// Components
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import AIChatAssistant from "./components/AIChatAssistant";

// Types
import { User } from "./types/user";

/**
 * Protected route wrapper to enforce authentication and roles
 */
const ProtectedRoute: React.FC<{
  user: User | null;
  role?: string;
  children: React.ReactNode;
}> = ({ user, role, children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    } else if (role && user.role !== role) {
      navigate("/login", { replace: true });
    }
  }, [user, role, navigate]);

  if (!user || (role && user.role !== role)) {
    return null; // don’t render until redirect happens
  }

  return <>{children}</>;
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:8001/api/current-user/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Not authenticated");

        const userData: User = await response.json();
        setUser(userData);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login setUser={setUser} />} />

        {/* Authenticated Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Lecturer-only */}
        <Route
          path="/lecturerview"
          element={
            <ProtectedRoute user={user} role="lecturer">
              <ErrorBoundary>
                <LecturerView />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/generate-qr"
          element={
            <ProtectedRoute user={user} role="lecturer">
              <ErrorBoundary>
                <QRCodeGenerator />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-courses"
          element={
            <ProtectedRoute user={user} role="lecturer">
              <ErrorBoundary>
                <CourseManagement />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/enroll-students"
          element={
            <ProtectedRoute user={user} role="lecturer">
              <ErrorBoundary>
                <LecturerEnrollmentManager />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-session"
          element={
            <ProtectedRoute user={user} role="lecturer">
              <CreateSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session-list"
          element={
            <ProtectedRoute user={user} role="lecturer">
              <SessionList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lecturer/sessions/edit/:id"
          element={
            <ProtectedRoute user={user} role="lecturer">
              <SessionEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-manager"
          element={
            <ProtectedRoute user={user} role="lecturer">
              <StudentManager />
            </ProtectedRoute>
          }
        />

        {/* Admin-only */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute user={user} role="admin">
              <ErrorBoundary>
                <AdminLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="lecturers" element={<LecturerManagement />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="courses" element={<CourseManagementAdmin />} />
          <Route path="enrollments" element={<EnrollmentManagement />} />
          <Route path="attendance" element={<AttendanceManagement />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Student-only */}
        <Route
          path="/studentview"
          element={
            <ProtectedRoute user={user} role="student">
              <StudentView />
            </ProtectedRoute>
          }
        />

        {/* AI Assistant (authenticated only) */}
        <Route
          path="/ai-assistant"
          element={
            <ProtectedRoute user={user}>
              <AIChatAssistant />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
