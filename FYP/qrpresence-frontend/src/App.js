import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import QRCodeManagement from "./pages/AdminView/QRCodeManagement";
/**
 * Protected route wrapper to enforce authentication and roles
 */
const ProtectedRoute = ({ user, role, children }) => {
    const navigate = useNavigate();
    useEffect(() => {
        if (!user) {
            navigate("/login", { replace: true });
        }
        else if (role && user.role !== role) {
            navigate("/login", { replace: true });
        }
    }, [user, role, navigate]);
    if (!user || (role && user.role !== role)) {
        return null; // don’t render until redirect happens
    }
    return _jsx(_Fragment, { children: children });
};
const App = () => {
    const [user, setUser] = useState(null);
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
                if (!response.ok)
                    throw new Error("Not authenticated");
                const userData = await response.json();
                setUser(userData);
            }
            catch {
                setUser(null);
            }
            finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);
    if (loading) {
        return _jsx(LoadingSpinner, {});
    }
    return (_jsx(Router, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, { setUser: setUser }) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { user: user, children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/lecturerview", element: _jsx(ProtectedRoute, { user: user, role: "lecturer", children: _jsx(ErrorBoundary, { children: _jsx(LecturerView, {}) }) }) }), _jsx(Route, { path: "/generate-qr", element: _jsx(ProtectedRoute, { user: user, role: "lecturer", children: _jsx(ErrorBoundary, { children: _jsx(QRCodeGenerator, {}) }) }) }), _jsx(Route, { path: "/manage-courses", element: _jsx(ProtectedRoute, { user: user, role: "lecturer", children: _jsx(ErrorBoundary, { children: _jsx(CourseManagement, {}) }) }) }), _jsx(Route, { path: "/enroll-students", element: _jsx(ProtectedRoute, { user: user, role: "lecturer", children: _jsx(ErrorBoundary, { children: _jsx(LecturerEnrollmentManager, {}) }) }) }), _jsx(Route, { path: "/create-session", element: _jsx(ProtectedRoute, { user: user, role: "lecturer", children: _jsx(CreateSession, {}) }) }), _jsx(Route, { path: "/session-list", element: _jsx(ProtectedRoute, { user: user, role: "lecturer", children: _jsx(SessionList, {}) }) }), _jsx(Route, { path: "/lecturer/sessions/edit/:id", element: _jsx(ProtectedRoute, { user: user, role: "lecturer", children: _jsx(SessionEdit, {}) }) }), _jsx(Route, { path: "/student-manager", element: _jsx(ProtectedRoute, { user: user, role: "lecturer", children: _jsx(StudentManager, {}) }) }), _jsxs(Route, { path: "/admin/*", element: _jsx(ProtectedRoute, { user: user, role: "admin", children: _jsx(ErrorBoundary, { children: _jsx(AdminLayout, {}) }) }), children: [_jsx(Route, { index: true, element: _jsx(AdminDashboard, {}) }), _jsx(Route, { path: "users", element: _jsx(UserManagement, {}) }), _jsx(Route, { path: "lecturers", element: _jsx(LecturerManagement, {}) }), _jsx(Route, { path: "students", element: _jsx(StudentManagement, {}) }), _jsx(Route, { path: "courses", element: _jsx(CourseManagementAdmin, {}) }), _jsx(Route, { path: "enrollments", element: _jsx(EnrollmentManagement, {}) }), _jsx(Route, { path: "attendance", element: _jsx(AttendanceManagement, {}) }), _jsx(Route, { path: "settings", element: _jsx(AdminSettings, {}) }), _jsx(Route, { path: "QrCodes", element: _jsx(QRCodeManagement, {}) })] }), _jsx(Route, { path: "/studentview", element: _jsx(ProtectedRoute, { user: user, role: "student", children: _jsx(StudentView, {}) }) }), _jsx(Route, { path: "/ai-assistant", element: _jsx(ProtectedRoute, { user: user, children: _jsx(AIChatAssistant, {}) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }));
};
export default App;
