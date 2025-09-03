import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Users, BookOpen, Calendar, TrendingUp, Download } from 'lucide-react';
import './Dashboard.css';
const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exportError, setExportError] = useState(null);
    const [exportLoading, setExportLoading] = useState(null);
    useEffect(() => {
        fetchDashboardStats();
    }, []);
    const fetchDashboardStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            if (!token)
                throw new Error('No access token found');
            const response = await fetch('http://127.0.0.1:8000/api/admin/stats/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setStats(data);
        }
        catch (err) {
            setError('Failed to load dashboard statistics');
            console.error('Dashboard stats error:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const exportData = async (type) => {
        setExportError(null);
        setExportLoading(type);
        const token = localStorage.getItem('access_token');
        if (!token) {
            setExportError('No access token found');
            setExportLoading(null);
            return;
        }
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/admin/export/${type}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                throw new Error(`Failed to export ${type} data. Status: ${response.status}`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        }
        catch (err) {
            console.error('Export error:', err);
            setExportError(`Failed to export ${type} data.`);
        }
        finally {
            setExportLoading(null);
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "admin-loading", children: [_jsx("div", { className: "admin-loading__spinner" }), _jsx("p", { children: "Loading dashboard..." })] }));
    }
    if (error) {
        return (_jsx("div", { className: "admin-error", children: _jsxs("div", { className: "admin-error__content", children: [_jsx("p", { children: error }), _jsx("button", { onClick: fetchDashboardStats, className: "admin-button admin-button--primary", children: "Retry" })] }) }));
    }
    return (_jsxs("div", { className: "dashboard", children: [_jsxs("div", { className: "dashboard__header", children: [_jsx("h2", { children: "Dashboard Overview" }), _jsx("p", { children: "Welcome to the QRPresence Admin Dashboard" })] }), _jsxs("div", { className: "dashboard-stats", children: [_jsxs("div", { className: "dashboard-stat", children: [_jsx("div", { className: "dashboard-stat__icon dashboard-stat__icon--blue", children: _jsx(Users, { size: 24 }) }), _jsxs("div", { className: "dashboard-stat__content", children: [_jsx("h3", { children: stats?.total_students ?? 0 }), _jsx("p", { children: "Total Students" })] })] }), _jsxs("div", { className: "dashboard-stat", children: [_jsx("div", { className: "dashboard-stat__icon dashboard-stat__icon--purple", children: _jsx(Users, { size: 24 }) }), _jsxs("div", { className: "dashboard-stat__content", children: [_jsx("h3", { children: stats?.total_lecturers ?? 0 }), _jsx("p", { children: "Total Lecturers" })] })] }), _jsxs("div", { className: "dashboard-stat", children: [_jsx("div", { className: "dashboard-stat__icon dashboard-stat__icon--green", children: _jsx(BookOpen, { size: 24 }) }), _jsxs("div", { className: "dashboard-stat__content", children: [_jsx("h3", { children: stats?.total_courses ?? 0 }), _jsx("p", { children: "Active Courses" })] })] }), _jsxs("div", { className: "dashboard-stat", children: [_jsx("div", { className: "dashboard-stat__icon dashboard-stat__icon--orange", children: _jsx(Calendar, { size: 24 }) }), _jsxs("div", { className: "dashboard-stat__content", children: [_jsx("h3", { children: stats?.active_sessions_today ?? 0 }), _jsx("p", { children: "Sessions Today" })] })] }), _jsxs("div", { className: "dashboard-stat", children: [_jsx("div", { className: "dashboard-stat__icon dashboard-stat__icon--red", children: _jsx(TrendingUp, { size: 24 }) }), _jsxs("div", { className: "dashboard-stat__content", children: [_jsx("h3", { children: stats?.attendance_rate !== undefined
                                            ? `${stats.attendance_rate}%`
                                            : 'N/A' }), _jsx("p", { children: "Attendance Rate" })] })] })] }), _jsxs("div", { className: "dashboard-actions", children: [_jsx("h3", { children: "Quick Actions" }), _jsx("div", { className: "dashboard-actions__grid", children: ['attendance', 'users', 'courses'].map((type) => (_jsxs("button", { className: "dashboard-action", onClick: () => exportData(type), disabled: exportLoading !== null, children: [exportLoading === type ? (_jsx("span", { className: "spinner" }) // Add CSS spinner style
                                ) : (_jsx(Download, { size: 20 })), _jsx("span", { children: type === 'attendance'
                                        ? 'Export Attendance'
                                        : type === 'users'
                                            ? 'Export User Report'
                                            : 'Export Course Data' })] }, type))) }), exportError && (_jsx("p", { className: "dashboard-export-error", children: exportError }))] }), _jsx("div", { className: "dashboard-content", children: _jsxs("div", { className: "dashboard-section", children: [_jsx("h3", { children: "System Overview" }), _jsx("div", { className: "dashboard-section__content", children: _jsx("p", { children: "More analytics and charts would be displayed here in a full implementation." }) })] }) })] }));
};
export default Dashboard;
