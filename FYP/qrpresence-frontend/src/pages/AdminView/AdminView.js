import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import Button from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AttendanceTrends from "@/components/ui/AttendanceTrends";
import Heatmap from "@/components/ui/Heatmap";
import Card from "@/components/ui/card";
import axios from "axios";
const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState([]);
    const [missedSessions, setMissedSessions] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingMissedSessions, setLoadingMissedSessions] = useState(true);
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get("/api/admin/stats/", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                    },
                });
                // Check if response.data is an object; if so, convert it to array
                if (Array.isArray(response.data)) {
                    setStats(response.data);
                }
                else if (typeof response.data === "object" && response.data !== null) {
                    const dataObj = response.data;
                    const convertedStats = Object.keys(dataObj).map((key) => ({
                        label: key,
                        value: dataObj[key],
                    }));
                    setStats(convertedStats);
                }
            }
            catch (error) {
                console.error("Failed to fetch stats:", error);
            }
            finally {
                setLoadingStats(false);
            }
        };
        const fetchMissedSessions = async () => {
            try {
                const response = await axios.get("/api/admin/missed-sessions/", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                    },
                });
                setMissedSessions(response.data);
            }
            catch (error) {
                console.error("Failed to fetch missed sessions:", error);
            }
            finally {
                setLoadingMissedSessions(false);
            }
        };
        fetchStats();
        fetchMissedSessions();
    }, []);
    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.removeItem("access_token"); // <-- Clear token on logout
            navigate("/login");
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-100 p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h1", { className: "text-3xl font-bold", children: "QRPresence Admin Dashboard" }), _jsx(Button, { onClick: handleLogout, className: "bg-red-500 hover:bg-red-600", children: "Logout" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6", children: loadingStats ? (_jsx("p", { children: "Loading stats..." })) : stats.length > 0 ? (stats.map((stat, index) => (_jsxs(Card, { className: "shadow-md", children: [_jsx("p", { className: "text-gray-500 text-sm", children: stat.label }), _jsx("h2", { className: "text-2xl font-bold mt-2", children: stat.value })] }, index)))) : (_jsx("p", { children: "No stats available." })) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-6", children: [_jsxs(Card, { className: "shadow-md", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Manage Users" }), _jsx(Button, { className: "w-full mb-2", onClick: () => navigate("/students/new"), children: "Add New Student" }), _jsx(Button, { className: "w-full mb-2", onClick: () => navigate("/lecturers/new"), children: "Add New Lecturer" }), _jsx(Button, { className: "w-full mb-2", onClick: () => navigate("/users"), children: "View All Users" }), _jsx(Button, { className: "w-full", onClick: () => navigate("/users/search"), children: "Search User" })] }), _jsxs(Card, { className: "shadow-md", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Manage Sessions" }), _jsx(Button, { className: "w-full mb-2", onClick: () => navigate("/sessions/all"), children: "View All Sessions" }), _jsx(Button, { className: "w-full", onClick: () => navigate("/sessions/old"), children: "Delete Old Sessions" })] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: _jsxs(Card, { className: "shadow-md col-span-2", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Analytics" }), _jsx("h3", { className: "text-lg font-semibold mb-2", children: "Attendance Trends" }), _jsx(AttendanceTrends, {}), _jsx("h3", { className: "text-lg font-semibold mt-8 mb-2", children: "Most Missed Sessions" }), loadingMissedSessions ? (_jsx("p", { children: "Loading heatmap..." })) : missedSessions.length > 0 ? (_jsx(Heatmap, { data: missedSessions })) : (_jsx("p", { children: "No missed sessions data available." }))] }) })] }));
};
export default AdminDashboard;
