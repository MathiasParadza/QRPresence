import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Search, Filter, Calendar, Download, BarChart3 } from 'lucide-react';
import axios from 'axios';
const AttendanceManagement = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const fetchAttendanceRecords = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('access_token');
            const response = await axios.get('http://127.0.0.1:8000/api/admin/attendance/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    search: searchTerm || undefined,
                    status: statusFilter || undefined,
                    date: dateFilter || undefined,
                },
            });
            // Handle both array and paginated responses
            const data = response.data;
            if (Array.isArray(data)) {
                setRecords(data);
            }
            else if (data && typeof data === 'object' && 'results' in data) {
                setRecords(data.results || []);
            }
            else {
                console.error('Unexpected API response format:', data);
                setRecords([]);
            }
        }
        catch (err) {
            setError('Failed to load attendance records');
            console.error('Attendance fetch error:', err);
        }
        finally {
            setLoading(false);
        }
    }, [searchTerm, statusFilter, dateFilter]);
    useEffect(() => {
        fetchAttendanceRecords();
    }, [fetchAttendanceRecords]);
    const exportAttendance = async (format) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`http://127.0.0.1:8000/api/admin/attendance/export/?format=${format}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: 'blob',
            });
            // Create a blob link to download the file
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance-report.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
        catch (err) {
            alert('Failed to export attendance records');
            console.error('Export error:', err);
        }
    };
    const getStatusBadgeClass = (status) => {
        switch (status.toLowerCase()) {
            case 'present': return 'status-badge status-badge--present';
            case 'absent': return 'status-badge status-badge--absent';
            case 'late': return 'status-badge status-badge--late';
            default: return 'status-badge status-badge--default';
        }
    };
    const formatDateTime = (dateString) => {
        if (!dateString)
            return '-';
        try {
            return new Date(dateString).toLocaleString();
        }
        catch (error) {
            console.error('Error formatting date:', error);
            return '-';
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "admin-loading", children: [_jsx("div", { className: "admin-loading__spinner" }), _jsx("p", { children: "Loading attendance records..." })] }));
    }
    return (_jsxs("div", { className: "attendance-overview", children: [_jsxs("div", { className: "attendance-overview__header", children: [_jsx("h2", { children: "Attendance Overview" }), _jsxs("div", { className: "attendance-overview__actions", children: [_jsxs("button", { className: "admin-button admin-button--secondary", onClick: () => exportAttendance('csv'), children: [_jsx(Download, { size: 16 }), "Export CSV"] }), _jsxs("button", { className: "admin-button admin-button--secondary", onClick: () => exportAttendance('pdf'), children: [_jsx(Download, { size: 16 }), "Export PDF"] }), _jsxs("button", { className: "admin-button admin-button--primary", children: [_jsx(BarChart3, { size: 16 }), "Analytics"] })] })] }), _jsxs("div", { className: "attendance-overview__filters", children: [_jsxs("div", { className: "filter-group", children: [_jsx(Search, { size: 18 }), _jsx("input", { type: "text", placeholder: "Search students or sessions...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "filter-input" })] }), _jsxs("div", { className: "filter-group", children: [_jsx(Filter, { size: 18 }), _jsxs("select", { "aria-label": "Filter by attendance status", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "filter-input", children: [_jsx("option", { value: "", children: "All Statuses" }), _jsx("option", { value: "present", children: "Present" }), _jsx("option", { value: "absent", children: "Absent" }), _jsx("option", { value: "late", children: "Late" })] })] }), _jsxs("div", { className: "filter-group", children: [_jsx(Calendar, { size: 18 }), _jsx("input", { type: "date", value: dateFilter, onChange: (e) => setDateFilter(e.target.value), className: "filter-input", placeholder: "Select date", title: "Filter by date" })] }), _jsx("button", { className: "admin-button admin-button--primary", onClick: fetchAttendanceRecords, children: "Apply Filters" })] }), error && (_jsxs("div", { className: "admin-error", children: [_jsx("p", { children: error }), _jsx("button", { onClick: fetchAttendanceRecords, className: "admin-button admin-button--primary", children: "Retry" })] })), _jsx("div", { className: "admin-table-container", children: _jsxs("table", { className: "admin-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Student ID" }), _jsx("th", { children: "Student Name" }), _jsx("th", { children: "Course" }), _jsx("th", { children: "Session" }), _jsx("th", { children: "Lecturer" }), _jsx("th", { children: "Check In" }), _jsx("th", { children: "Check Out" }), _jsx("th", { children: "Status" })] }) }), _jsx("tbody", { children: records.length > 0 ? (records.map((record) => (_jsxs("tr", { children: [_jsx("td", { children: record.student?.student_id || 'N/A' }), _jsx("td", { children: record.student?.name || 'N/A' }), _jsx("td", { children: record.session?.course?.code || 'N/A' }), _jsx("td", { children: record.session?.class_name || 'N/A' }), _jsx("td", { children: record.session?.lecturer?.name || 'N/A' }), _jsx("td", { children: formatDateTime(record.check_in_time) }), _jsx("td", { children: formatDateTime(record.check_out_time) }), _jsx("td", { children: _jsx("span", { className: getStatusBadgeClass(record.status), children: record.status }) })] }, record.id)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 8, className: "no-data-message", children: "No attendance records found" }) }, "no-data")) })] }) })] }));
};
export default AttendanceManagement;
