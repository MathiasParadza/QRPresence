import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import CourseManagement from "./pages/LecturerView/CourseManagement";
import BulkEnrollmentManager from "./pages/LecturerView/BulkEnrollmentManager";
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
    return (_jsx(Router, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, { setUser: setUser }) }), _jsx(Route, { path: "/generate-qr", element: _jsx(QRCodeGenerator, {}) }), _jsx(Route, { path: "/dashboard", element: user ? _jsx(Dashboard, {}) : _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/lecturerview", element: user?.role === "lecturer" ? (_jsx(ErrorBoundary, { children: _jsx(LecturerView, {}) })) : (_jsx(Navigate, { to: "/login", replace: true })) }), _jsx(Route, { path: "/manage-courses", element: user?.role === "lecturer" ? (_jsx(ErrorBoundary, { children: _jsx(CourseManagement, {}) })) : (_jsx(Navigate, { to: "/login", replace: true })) }), _jsx(Route, { path: "/enroll-students", element: user?.role === "lecturer" ? (_jsx(ErrorBoundary, { children: _jsx(BulkEnrollmentManager, {}) })) : (_jsx(Navigate, { to: "/login", replace: true })) }), _jsx(Route, { path: "/create-session", element: user?.role === "lecturer" ? (_jsx(CreateSession, {})) : (_jsx(Navigate, { to: "/login", replace: true })) }), _jsx(Route, { path: "/session-list", element: user?.role === "lecturer" ? (_jsx(SessionList, {})) : (_jsx(Navigate, { to: "/login", replace: true })) }), _jsx(Route, { path: "/lecturer/sessions/edit/:id", element: user?.role === "lecturer" ? (_jsx(SessionEdit, {})) : (_jsx(Navigate, { to: "/login", replace: true })) }), _jsx(Route, { path: "/student-manager", element: user?.role === "lecturer" ? (_jsx(StudentManager, {})) : (_jsx(Navigate, { to: "/login", replace: true })) }), _jsx(Route, { path: "/studentview", element: user?.role === "student" ? (_jsx(StudentView, {})) : (_jsx(Navigate, { to: "/login", replace: true })) }), _jsx(Route, { path: "/ai-assistant", element: user ? _jsx(AIChatAssistant, {}) : _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }));
};
export default App;
