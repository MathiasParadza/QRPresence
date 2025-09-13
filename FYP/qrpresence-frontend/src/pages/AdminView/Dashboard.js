import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, Calendar, TrendingUp, Download, BarChart3, Activity, Clock, UserCheck, MapPin, Bookmark, Shield, GraduationCap } from 'lucide-react';
import './Dashboard.css';
const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exportError, setExportError] = useState(null);
    const [exportLoading, setExportLoading] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [redirectToLogin, setRedirectToLogin] = useState(false);
    const navigate = useNavigate();
    // Navigate to login safely after render
    useEffect(() => {
        if (redirectToLogin) {
            navigate('/login');
        }
    }, [redirectToLogin, navigate]);
    const fetchDashboardStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setRedirectToLogin(true);
                return;
            }
            const response = await fetch('http://127.0.0.1:8000/api/admin/stats/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status === 401) {
                localStorage.removeItem('access_token');
                setRedirectToLogin(true);
                return;
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setStats(data);
            generateChartData(data);
        }
        catch (err) {
            setError('Failed to load dashboard statistics');
            console.error('Dashboard stats error:', err);
        }
        finally {
            setLoading(false);
        }
    }, []);
    const generateChartData = (data) => {
        const attendanceChartData = {
            labels: ['Present', 'Absent'],
            datasets: [
                {
                    label: 'Attendance Distribution',
                    data: [data.attendance_stats.present_count, data.attendance_stats.absent_count],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderColor: ['#059669', '#dc2626'],
                    borderWidth: 2,
                },
            ],
        };
        setChartData(attendanceChartData);
    };
    useEffect(() => {
        fetchDashboardStats();
    }, [fetchDashboardStats]);
    const exportData = async (type) => {
        setExportError(null);
        setExportLoading(type);
        const token = localStorage.getItem('access_token');
        if (!token) {
            setExportError('No access token found');
            setExportLoading(null);
            setRedirectToLogin(true);
            return;
        }
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/admin/stats/${type}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 401) {
                localStorage.removeItem('access_token');
                setRedirectToLogin(true);
                return;
            }
            if (!response.ok) {
                throw new Error(`Failed to export ${type} data. Status: ${response.status}`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_report.csv`;
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
    const renderSimpleChart = (data) => {
        const total = data.datasets[0].data.reduce((sum, value) => sum + value, 0);
        return (_jsx("div", { className: "simple-chart", children: _jsx("div", { className: "simple-chart__bars", children: data.datasets[0].data.map((value, index) => {
                    const percentage = total > 0 ? (value / total) * 100 : 0;
                    return (_jsxs("div", { className: "simple-chart__bar-container", children: [_jsxs("div", { className: "simple-chart__bar-label", children: [_jsx("span", { children: data.labels[index] }), _jsxs("span", { children: [value, " (", Math.round(percentage), "%)"] })] }), _jsx("div", { className: "simple-chart__bar", children: _jsx("div", { className: `simple-chart__bar-fill simple-chart__bar-fill--${index}`, "data-bar-percentage": percentage }) })] }, index));
                }) }) }));
    };
    if (loading) {
        return (_jsxs("div", { className: "admin-loading", children: [_jsx("div", { className: "admin-loading__spinner" }), _jsx("p", { children: "Loading dashboard..." })] }));
    }
    if (error) {
        return (_jsx("div", { className: "admin-error", children: _jsxs("div", { className: "admin-error__content", children: [_jsx("p", { children: error }), _jsx("button", { onClick: fetchDashboardStats, className: "admin-button admin-button--primary", children: "Retry" })] }) }));
    }
    return (_jsxs("div", { className: "dashboard", children: [_jsxs("div", { className: "dashboard__header", children: [_jsx("h2", { children: "Dashboard Overview" }), _jsx("p", { children: "Welcome to the QRPresence Admin Dashboard" })] }), _jsxs("div", { className: "dashboard-stats", children: [_jsxs("div", { className: "dashboard-stat", children: [_jsx("div", { className: "dashboard-stat__icon dashboard-stat__icon--blue", children: _jsx(Users, { size: 24 }) }), _jsxs("div", { className: "dashboard-stat__content", children: [_jsx("h3", { children: stats?.total_students ?? 0 }), _jsx("p", { children: "Total Students" })] })] }), _jsxs("div", { className: "dashboard-stat", children: [_jsx("div", { className: "dashboard-stat__icon dashboard-stat__icon--purple", children: _jsx(GraduationCap, { size: 24 }) }), _jsxs("div", { className: "dashboard-stat__content", children: [_jsx("h3", { children: stats?.total_lecturers ?? 0 }), _jsx("p", { children: "Total Lecturers" })] })] }), _jsxs("div", { className: "dashboard-stat", children: [_jsx("div", { className: "dashboard-stat__icon dashboard-stat__icon--green", children: _jsx(BookOpen, { size: 24 }) }), _jsxs("div", { className: "dashboard-stat__content", children: [_jsx("h3", { children: stats?.total_courses ?? 0 }), _jsx("p", { children: "Active Courses" })] })] }), _jsxs("div", { className: "dashboard-stat", children: [_jsx("div", { className: "dashboard-stat__icon dashboard-stat__icon--orange", children: _jsx(Calendar, { size: 24 }) }), _jsxs("div", { className: "dashboard-stat__content", children: [_jsx("h3", { children: stats?.active_sessions_today ?? 0 }), _jsx("p", { children: "Sessions Today" })] })] }), _jsxs("div", { className: "dashboard-stat", children: [_jsx("div", { className: "dashboard-stat__icon dashboard-stat__icon--red", children: _jsx(TrendingUp, { size: 24 }) }), _jsxs("div", { className: "dashboard-stat__content", children: [_jsx("h3", { children: stats?.attendance_rate !== undefined
                                            ? `${stats.attendance_rate}%`
                                            : 'N/A' }), _jsx("p", { children: "Attendance Rate" })] })] }), _jsxs("div", { className: "dashboard-stat", children: [_jsx("div", { className: "dashboard-stat__icon dashboard-stat__icon--indigo", children: _jsx(UserCheck, { size: 24 }) }), _jsxs("div", { className: "dashboard-stat__content", children: [_jsx("h3", { children: stats?.attendance_stats?.total_attendance ?? 0 }), _jsx("p", { children: "Total Attendance" })] })] })] }), _jsxs("div", { className: "dashboard-analytics", children: [_jsxs("div", { className: "analytics-card", children: [_jsxs("div", { className: "analytics-card__header", children: [_jsx(Users, { size: 20 }), _jsx("h3", { children: "User Analytics" })] }), _jsx("div", { className: "analytics-card__content", children: _jsxs("div", { className: "analytics-grid", children: [_jsxs("div", { className: "analytics-item", children: [_jsx(Shield, { size: 16 }), _jsx("span", { children: "Admin Users" }), _jsx("strong", { children: stats?.user_stats?.total_admins ?? 0 })] }), _jsxs("div", { className: "analytics-item", children: [_jsx(Clock, { size: 16 }), _jsx("span", { children: "Recent Registrations" }), _jsx("strong", { children: stats?.user_stats?.recent_users ?? 0 })] }), _jsxs("div", { className: "analytics-item", children: [_jsx(Activity, { size: 16 }), _jsx("span", { children: "Today's Registrations" }), _jsx("strong", { children: stats?.user_stats?.today_users ?? 0 })] })] }) })] }), _jsxs("div", { className: "analytics-card", children: [_jsxs("div", { className: "analytics-card__header", children: [_jsx(BarChart3, { size: 20 }), _jsx("h3", { children: "Attendance Analytics" })] }), _jsxs("div", { className: "analytics-card__content", children: [chartData && renderSimpleChart(chartData), _jsxs("div", { className: "attendance-details", children: [_jsxs("div", { className: "attendance-detail", children: [_jsx("span", { className: "present-dot" }), _jsxs("span", { children: ["Present: ", stats?.attendance_stats?.present_count ?? 0] })] }), _jsxs("div", { className: "attendance-detail", children: [_jsx("span", { className: "absent-dot" }), _jsxs("span", { children: ["Absent: ", stats?.attendance_stats?.absent_count ?? 0] })] })] })] })] }), _jsxs("div", { className: "analytics-card", children: [_jsxs("div", { className: "analytics-card__header", children: [_jsx(Calendar, { size: 20 }), _jsx("h3", { children: "Session Analytics" })] }), _jsx("div", { className: "analytics-card__content", children: _jsxs("div", { className: "session-stats", children: [_jsxs("div", { className: "session-stat", children: [_jsx("div", { className: "session-stat__icon", children: _jsx(Clock, { size: 16 }) }), _jsxs("div", { className: "session-stat__info", children: [_jsx("span", { children: "Total Sessions" }), _jsx("strong", { children: stats?.object_stats?.total_sessions ?? 0 })] })] }), _jsxs("div", { className: "session-stat", children: [_jsx("div", { className: "session-stat__icon", children: _jsx(Activity, { size: 16 }) }), _jsxs("div", { className: "session-stat__info", children: [_jsx("span", { children: "Recent Sessions (7d)" }), _jsx("strong", { children: stats?.activity_stats?.recent_sessions ?? 0 })] })] }), _jsxs("div", { className: "session-stat", children: [_jsx("div", { className: "session-stat__icon", children: _jsx(MapPin, { size: 16 }) }), _jsxs("div", { className: "session-stat__info", children: [_jsx("span", { children: "Active Today" }), _jsx("strong", { children: stats?.active_sessions_today ?? 0 })] })] })] }) })] }), _jsxs("div", { className: "analytics-card", children: [_jsxs("div", { className: "analytics-card__header", children: [_jsx(Bookmark, { size: 20 }), _jsx("h3", { children: "Enrollment Analytics" })] }), _jsx("div", { className: "analytics-card__content", children: _jsxs("div", { className: "enrollment-stats", children: [_jsxs("div", { className: "enrollment-stat", children: [_jsx("div", { className: "enrollment-stat__value", children: stats?.object_stats?.total_enrollments ?? 0 }), _jsx("div", { className: "enrollment-stat__label", children: "Total Enrollments" })] }), _jsxs("div", { className: "enrollment-details", children: [_jsxs("div", { className: "enrollment-detail", children: [_jsx("span", { children: "Average per Course" }), _jsx("strong", { children: stats?.total_courses && stats.object_stats?.total_enrollments
                                                                ? Math.round(stats.object_stats.total_enrollments / stats.total_courses)
                                                                : 0 })] }), _jsxs("div", { className: "enrollment-detail", children: [_jsx("span", { children: "Average per Student" }), _jsx("strong", { children: stats?.total_students && stats.object_stats?.total_enrollments
                                                                ? Math.round(stats.object_stats.total_enrollments / stats.total_students)
                                                                : 0 })] })] })] }) })] })] }), _jsxs("div", { className: "dashboard-actions", children: [_jsx("h3", { children: "Quick Actions" }), _jsx("div", { className: "dashboard-actions__grid", children: ['attendance', 'users', 'courses', 'sessions'].map((type) => (_jsxs("button", { className: "dashboard-action", onClick: () => exportData(type), disabled: exportLoading !== null, children: [exportLoading === type ? (_jsx("div", { className: "dashboard-action__spinner" })) : (_jsx(Download, { size: 20 })), _jsx("span", { children: type === 'attendance'
                                        ? 'Export Attendance'
                                        : type === 'users'
                                            ? 'Export Users'
                                            : type === 'courses'
                                                ? 'Export Courses'
                                                : 'Export Sessions' })] }, type))) }), exportError && (_jsx("p", { className: "dashboard-export-error", children: exportError }))] }), _jsxs("div", { className: "dashboard-status", children: [_jsx("h3", { children: "System Status" }), _jsxs("div", { className: "status-grid", children: [_jsxs("div", { className: "status-item status-item--online", children: [_jsx("div", { className: "status-indicator" }), _jsx("span", { children: "API Server" }), _jsx("strong", { children: "Online" })] }), _jsxs("div", { className: "status-item status-item--online", children: [_jsx("div", { className: "status-indicator" }), _jsx("span", { children: "Database" }), _jsx("strong", { children: "Connected" })] }), _jsxs("div", { className: "status-item status-item--online", children: [_jsx("div", { className: "status-indicator" }), _jsx("span", { children: "QR Generation" }), _jsx("strong", { children: "Active" })] }), _jsxs("div", { className: "status-item status-item--online", children: [_jsx("div", { className: "status-indicator" }), _jsx("span", { children: "Geolocation" }), _jsx("strong", { children: "Enabled" })] })] })] })] }));
};
export default Dashboard;
