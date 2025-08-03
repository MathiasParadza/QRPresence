import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
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


// Components
import ErrorBoundary from "./components/ErrorBoundary";
import QRCodeGenerator from "./components/QRCodeGenerator";
import LoadingSpinner from "./components/LoadingSpinner";
import AIChatAssistant from "./components/AIChatAssistant";

// Types
import { User } from "./types/user";
import CourseManagement from "./pages/LecturerView/CourseManagement";
import BulkEnrollmentManager from "./pages/LecturerView/BulkEnrollmentManager";

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
        <Route
          path="/login"
          element={<Login setUser={setUser} />}
        />
        <Route path="/generate-qr" element={<QRCodeGenerator />} />

        {/* Authenticated Dashboard */}
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" replace />}
        />

        {/* Lecturer-only */}
        <Route
          path="/lecturerview"
          element={
            user?.role === "lecturer" ? (
              <ErrorBoundary>
                <LecturerView />
              </ErrorBoundary>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
         <Route
          path="/manage-courses"
          element={
            user?.role === "lecturer" ? (
              <ErrorBoundary>
                <CourseManagement />
              </ErrorBoundary>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
         <Route
          path="/enroll-students"
          element={
            user?.role === "lecturer" ? (
              <ErrorBoundary>
                <BulkEnrollmentManager />
              </ErrorBoundary>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/create-session"
          element={
            user?.role === "lecturer" ? (
              <CreateSession />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/session-list"
          element={
            user?.role === "lecturer" ? (
              <SessionList />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/lecturer/sessions/edit/:id"
          element={
            user?.role === "lecturer" ? (
              <SessionEdit />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/student-manager"
          element={
            user?.role === "lecturer" ? (
              <StudentManager />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Student-only */}
        <Route
          path="/studentview"
          element={
            user?.role === "student" ? (
              <StudentView />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* AI Assistant (authenticated only) */}
        <Route
          path="/ai-assistant"
          element={user ? <AIChatAssistant /> : <Navigate to="/login" replace />}
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
