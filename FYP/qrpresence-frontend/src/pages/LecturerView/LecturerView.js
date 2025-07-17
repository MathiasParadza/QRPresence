import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
const LecturerView = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [attendanceReport, setAttendanceReport] = useState([]);
    const [loadingReport, setLoadingReport] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [ordering, setOrdering] = useState('check_in_time');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    useEffect(() => {
        if (location.state && location.state.qrCodeUrl) {
            setQrCodeUrl(location.state.qrCodeUrl);
        }
    }, [location.state]);
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
                const response = await axios.get('http://127.0.0.1:8000/api/lecturer/lecturer-attendance/', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params: {
                        page: currentPage,
                        search: searchTerm || undefined,
                        status: statusFilter || undefined,
                        ordering: ordering || undefined,
                    },
                });
                setAttendanceReport(response.data.results);
                setTotalPages(Math.ceil(response.data.count / 10));
            }
            catch (err) {
                console.error('Failed to load attendance report:', err);
                setError('Failed to load attendance report.');
            }
            finally {
                setLoadingReport(false);
            }
        };
        fetchAttendanceRecord();
    }, [searchTerm, statusFilter, ordering, currentPage]);
    const exportCsv = () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('No access token found');
            return;
        }
        const query = new URLSearchParams();
        if (searchTerm)
            query.append('search', searchTerm);
        if (statusFilter)
            query.append('status', statusFilter);
        if (ordering)
            query.append('ordering', ordering);
        const url = `http://127.0.0.1:8000/api/lecturer/lecturer-attendance/export-csv/?${query.toString()}`;
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('target', '_blank');
        link.click();
    };
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
    const toggleOrdering = (field) => {
        setOrdering((prev) => (prev === field ? `-${field}` : field));
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-100 py-8 px-4", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsx("div", { className: "bg-white shadow-lg rounded-xl p-6 mb-8", children: _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsx("h1", { className: "text-3xl font-bold text-purple-700", children: "Lecturer Dashboard" }), _jsx("button", { onClick: handleLogout, className: "bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200 self-start sm:self-auto", children: "Logout" })] }) }), _jsx("div", { className: "bg-white shadow-lg rounded-xl p-6", children: _jsxs(Tabs, { defaultValue: "actions", className: "w-full", children: [_jsxs(TabsList, { className: "grid grid-cols-3 gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 mb-8", children: [_jsx(TabsTrigger, { value: "actions", className: "data-[state=active]:bg-purple-600 data-[state=active]:text-white bg-white text-gray-700 hover:bg-gray-100 transition-all duration-200 rounded-lg py-3 font-medium", children: "Actions" }), _jsx(TabsTrigger, { value: "qrcode", className: "data-[state=active]:bg-purple-600 data-[state=active]:text-white bg-white text-gray-700 hover:bg-gray-100 transition-all duration-200 rounded-lg py-3 font-medium", children: "Latest QR" }), _jsx(TabsTrigger, { value: "stats", className: "data-[state=active]:bg-purple-600 data-[state=active]:text-white bg-white text-gray-700 hover:bg-gray-100 transition-all duration-200 rounded-lg py-3 font-medium", children: "Statistics" })] }), _jsx(TabsContent, { value: "actions", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "bg-purple-50 border border-purple-200 rounded-xl p-6 shadow-sm", children: [_jsx("h2", { className: "text-lg font-semibold text-purple-800 mb-4", children: "Generate Attendance QR" }), _jsx("button", { onClick: () => navigate('/generate-qr'), className: "w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors duration-200", children: "\uD83D\uDCF7 Generate QR" })] }), _jsxs("div", { className: "bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold text-green-800", children: "Session Management" }), _jsx("button", { onClick: () => navigate('/create-session'), className: "w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors duration-200", children: "\uD83D\uDD27 Create Session" }), _jsx("button", { onClick: () => navigate('/session-list'), className: "w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors duration-200", children: "\uD83D\uDCCB View Sessions" })] }), _jsxs("div", { className: "bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-800 mb-4", children: "More Tools" }), _jsx("button", { onClick: () => navigate('/more-placeholder'), className: "w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors duration-200", children: "\uD83D\uDD27 Coming Soon" })] })] }) }), _jsx(TabsContent, { value: "qrcode", children: _jsx("div", { className: "text-center", children: qrCodeUrl ? (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-2xl font-semibold text-purple-700", children: "Latest Attendance QR Code" }), _jsx("div", { className: "flex justify-center", children: _jsx("img", { src: qrCodeUrl, alt: "Latest QR Code", className: "w-64 h-64 border-4 border-green-400 rounded-xl shadow-lg" }) }), _jsx("button", { onClick: downloadQRCode, className: "bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200", children: "\u2B07\uFE0F Download QR Code" })] })) : (_jsx("div", { className: "py-16", children: _jsx("p", { className: "text-gray-600 text-lg", children: "No QR Code available yet." }) })) }) }), _jsxs(TabsContent, { value: "stats", children: [_jsx("div", { className: "bg-gray-50 rounded-xl p-6 space-y-4", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "search", className: "block text-sm font-medium text-gray-700", children: "Search" }), _jsx("input", { id: "search", type: "text", placeholder: "Search by student or session...", className: "w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "status-filter", className: "block text-sm font-medium text-gray-700", children: "Status Filter" }), _jsxs("select", { id: "status-filter", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors", children: [_jsx("option", { value: "", children: "All Statuses" }), _jsx("option", { value: "present", children: "Present" }), _jsx("option", { value: "absent", children: "Absent" }), _jsx("option", { value: "late", children: "Late" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Export" }), _jsx("button", { onClick: exportCsv, className: "w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200", children: "\u2B07\uFE0F Export CSV" })] })] }) }), _jsx("div", { className: "bg-white border border-gray-200 rounded-xl overflow-hidden", children: loadingReport ? (_jsx("div", { className: "p-8 text-center", children: _jsx("p", { className: "text-gray-600", children: "Loading attendance records..." }) })) : error ? (_jsx("div", { className: "p-8 text-center", children: _jsx("p", { className: "text-red-600", children: error }) })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-purple-100 border-b border-purple-200", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left px-6 py-4 font-semibold text-purple-800", children: "Student" }), _jsx("th", { className: "text-left px-6 py-4 font-semibold text-purple-800", children: "Student ID" }), _jsx("th", { className: "text-left px-6 py-4 font-semibold text-purple-800", children: "Session" }), _jsxs("th", { className: "text-left px-6 py-4 font-semibold text-purple-800 cursor-pointer hover:bg-purple-200 transition-colors", onClick: () => toggleOrdering('check_in_time'), children: ["Check In ", ordering === 'check_in_time' ? '↑' : ordering === '-check_in_time' ? '↓' : ''] }), _jsxs("th", { className: "text-left px-6 py-4 font-semibold text-purple-800 cursor-pointer hover:bg-purple-200 transition-colors", onClick: () => toggleOrdering('check_out_time'), children: ["Check Out ", ordering === 'check_out_time' ? '↑' : ordering === '-check_out_time' ? '↓' : ''] }), _jsxs("th", { className: "text-left px-6 py-4 font-semibold text-purple-800 cursor-pointer hover:bg-purple-200 transition-colors", onClick: () => toggleOrdering('status'), children: ["Status ", ordering === 'status' ? '↑' : ordering === '-status' ? '↓' : ''] })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: attendanceReport.length > 0 ? (attendanceReport.map((record, idx) => (_jsxs("tr", { className: idx % 2 === 0 ? 'bg-white' : 'bg-gray-50', children: [_jsx("td", { className: "px-6 py-4 text-gray-900", children: record.student?.user?.username || 'N/A' }), _jsx("td", { className: "px-6 py-4 text-gray-900", children: record.student?.student_id || 'N/A' }), _jsx("td", { className: "px-6 py-4 text-gray-900", children: record.session?.class_name || 'N/A' }), _jsx("td", { className: "px-6 py-4 text-gray-900", children: record.check_in_time ? new Date(record.check_in_time).toLocaleString() : '-' }), _jsx("td", { className: "px-6 py-4 text-gray-900", children: record.check_out_time ? new Date(record.check_out_time).toLocaleString() : '-' }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${record.status === 'present' ? 'bg-green-100 text-green-800' :
                                                                            record.status === 'absent' ? 'bg-red-100 text-red-800' :
                                                                                record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                                                                    'bg-gray-100 text-gray-800'}`, children: record.status }) })] }, `${record.id}-${record.check_in_time}`)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-12 text-center text-gray-500", children: "No attendance records found." }) })) })] }) })) }), totalPages > 1 && (_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4", children: [_jsx("button", { onClick: () => setCurrentPage((prev) => Math.max(prev - 1, 1)), disabled: currentPage === 1, className: "bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200", children: "Previous" }), _jsxs("span", { className: "text-gray-600 font-medium", children: ["Page ", currentPage, " of ", totalPages] }), _jsx("button", { onClick: () => setCurrentPage((prev) => Math.min(prev + 1, totalPages)), disabled: currentPage === totalPages, className: "bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200", children: "Next" })] }))] })] }) })] }) }));
};
export default LecturerView;
