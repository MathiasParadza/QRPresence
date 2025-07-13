import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
const LecturerView = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    // Attendance report state
    const [attendanceReport, setAttendanceReport] = useState([]);
    const [loadingReport, setLoadingReport] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (location.state && location.state.qrCodeUrl) {
            setQrCodeUrl(location.state.qrCodeUrl);
        }
    }, [location.state]);
    // Fetch attendance records for stats tab
    useEffect(() => {
        const fetchAttendanceRecord = async () => {
            setLoadingReport(true);
            setError(null);
            const token = localStorage.getItem('access_token');
            if (!token) {
                setError('No access token found');
                setLoadingReport(false);
                return;
            }
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/report/', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setAttendanceReport(response.data.attendance_record);
            }
            catch (err) {
                console.error("Failed to load attendance report:", err);
                setError('Failed to load attendance report.');
            }
            finally {
                setLoadingReport(false);
            }
        };
        fetchAttendanceRecord();
    }, []);
    const downloadQRCode = () => {
        if (!qrCodeUrl)
            return;
        const link = document.createElement('a');
        link.href = qrCodeUrl;
        link.download = 'attendance_qr.png';
        link.click();
    };
    const handleLogout = () => {
        localStorage.removeItem('access_token');
        navigate('/login');
    };
    return (_jsx("div", { className: "min-h-screen bg-white flex items-center justify-center px-4 py-10", children: _jsxs("div", { className: "w-full max-w-5xl bg-purple-50 shadow-xl rounded-2xl p-8", children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsx("h1", { className: "text-4xl font-bold text-purple-700 text-center flex-1", children: "Lecturer Dashboard" }), _jsx("button", { onClick: handleLogout, className: "ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold", children: "Logout" })] }), _jsx("p", { className: "text-center text-gray-700 mb-8", children: "Manage your sessions and track attendance." }), _jsxs(Tabs, { defaultValue: "actions", className: "w-full", children: [_jsxs(TabsList, { className: "grid grid-cols-3 gap-2 bg-white border border-purple-200 rounded-xl p-2 mb-6 shadow-sm", children: [_jsx(TabsTrigger, { value: "actions", className: "data-[state=active]:bg-purple-600 data-[state=active]:text-white transition rounded-lg py-2", children: "Actions" }), _jsx(TabsTrigger, { value: "qrcode", className: "data-[state=active]:bg-purple-600 data-[state=active]:text-white transition rounded-lg py-2", children: "Latest QR" }), _jsx(TabsTrigger, { value: "stats", className: "data-[state=active]:bg-purple-600 data-[state=active]:text-white transition rounded-lg py-2", children: "Statistics" })] }), _jsx(TabsContent, { value: "actions", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-purple-100 p-4 rounded-xl shadow-sm", children: [_jsx("h2", { className: "text-lg font-semibold text-purple-800 mb-2", children: "Generate Attendance QR" }), _jsx("button", { onClick: () => navigate('/generate-qr'), className: "w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium", children: "\uD83D\uDCF7 Generate QR" })] }), _jsxs("div", { className: "bg-green-100 p-4 rounded-xl shadow-sm", children: [_jsx("h2", { className: "text-lg font-semibold text-green-800 mb-2", children: "Sessions" }), _jsx("button", { onClick: () => navigate('/create-session'), className: "w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium", children: "\uD83D\uDCDA Session Management" })] }), _jsxs("div", { className: "bg-gray-100 p-4 rounded-xl shadow-sm", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-800 mb-2", children: "More Tools" }), _jsx("button", { onClick: () => navigate('/more-placeholder'), className: "w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-medium", children: "\uD83D\uDD27 Coming Soon" })] })] }) }), _jsx(TabsContent, { value: "qrcode", children: qrCodeUrl ? (_jsxs("div", { className: "text-center mt-4", children: [_jsx("h2", { className: "text-xl font-semibold text-purple-700 mb-4", children: "Latest Attendance QR Code" }), _jsx("img", { src: qrCodeUrl, alt: "Latest QR Code", className: "w-64 h-64 mx-auto border-4 border-green-400 rounded-xl" }), _jsx("button", { onClick: downloadQRCode, className: "mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold", children: "\u2B07\uFE0F Download QR Code" })] })) : (_jsx("p", { className: "text-center text-gray-600 mt-4", children: "No QR Code available yet." })) }), _jsx(TabsContent, { value: "stats", children: _jsxs("div", { className: "text-gray-700", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4", children: "Attendance Records" }), loadingReport && _jsx("p", { children: "Loading attendance records..." }), error && _jsx("p", { className: "text-red-600", children: error }), !loadingReport && !error && (_jsx("div", { className: "overflow-x-auto max-h-96", children: _jsxs("table", { className: "min-w-full border border-gray-300 rounded-lg overflow-hidden", children: [_jsx("thead", { className: "bg-purple-200 sticky top-0", children: _jsxs("tr", { children: [_jsx("th", { className: "border border-gray-300 px-4 py-2 text-left", children: "Student ID" }), _jsx("th", { className: "border border-gray-300 px-4 py-2 text-left", children: "Session ID" }), _jsx("th", { className: "border border-gray-300 px-4 py-2 text-left", children: "Timestamp" }), _jsx("th", { className: "border border-gray-300 px-4 py-2 text-left", children: "Status" })] }) }), _jsx("tbody", { children: attendanceReport.length > 0 ? (attendanceReport.map((record, idx) => (_jsxs("tr", { className: idx % 2 === 0 ? 'bg-white' : 'bg-purple-50', children: [_jsx("td", { className: "border border-gray-300 px-4 py-2", children: record.student_id }), _jsx("td", { className: "border border-gray-300 px-4 py-2", children: record.session_id }), _jsx("td", { className: "border border-gray-300 px-4 py-2", children: new Date(record.timestamp).toLocaleString() }), _jsx("td", { className: "border border-gray-300 px-4 py-2", children: record.status })] }, idx)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "text-center p-4 text-gray-500", children: "No attendance records found." }) })) })] }) }))] }) })] })] }) }));
};
export default LecturerView;
