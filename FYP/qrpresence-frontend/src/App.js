import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import AdminView from './pages/AdminView/AdminView';
import HomePage from './pages/HomePage';
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentView from "./pages/StudentView/StudentView";
import LecturerView from "./pages/LecturerView/LecturerView";
import Dashboard from "./pages/Dashboard";
import ErrorBoundary from "./components/ErrorBoundary";
import QRCodeGenerator from "./components/QRCodeGenerator";
import CreateSession from "./pages/LecturerView/CreateSession";
import SessionList from "./pages/LecturerView/SessionList"; // ✅ NEW
import LoadingSpinner from "./components/LoadingSpinner";
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
                const response = await axios.get("http://127.0.0.1:8000/api/user/", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(response.data);
            }
            catch (error) {
                console.error("Failed to fetch user:", error);
                localStorage.removeItem("access_token");
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
    console.log("Current user:", user);
    return (_jsx(Router, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, { setUser: setUser }) }), _jsx(Route, { path: "/generate-qr", element: _jsx(QRCodeGenerator, {}) }), _jsx(Route, { path: "/create-session", element: user && user.role === "lecturer" ? (_jsx(CreateSession, {})) : (_jsx(Navigate, { to: "/login" })) }), _jsx(Route, { path: "/sessions", element: user && user.role === "lecturer" ? (_jsx(SessionList, {})) : (_jsx(Navigate, { to: "/login" })) }), _jsx(Route, { path: "/dashboard", element: user ? _jsx(Dashboard, {}) : _jsx(Navigate, { to: "/login" }) }), _jsx(Route, { path: "/lecturerview", element: user && user.role === "lecturer" ? (_jsx(ErrorBoundary, { children: _jsx(LecturerView, {}) })) : (_jsx(Navigate, { to: "/login" })) }), _jsx(Route, { path: "/studentview", element: user && user.role === "student" ? (_jsx(StudentView, {})) : (_jsx(Navigate, { to: "/login" })) }), _jsx(Route, { path: "/adminview", element: user && user.role === "admin" ? (_jsx(AdminView, {})) : (_jsx(Navigate, { to: "/login" })) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/" }) })] }) }));
};
export default App;
