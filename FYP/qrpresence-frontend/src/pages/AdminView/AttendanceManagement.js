import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Search, Filter, Calendar, Download, BarChart3, RefreshCw } from 'lucide-react';
import axios from 'axios';
import './AttendanceManagement.css';
const AttendanceManagement = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [exporting, setExporting] = useState(null);
    const fetchAttendanceRecords = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('access_token');
            if (!token) {
                setError('Authentication token not found. Please login again.');
                setLoading(false);
                return;
            }
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
            // Handle paginated response
            const data = response.data;
            if (data && typeof data === 'object' && 'results' in data) {
                setRecords(data.results || []);
            }
            else {
                console.error('Unexpected API response format:', data);
                setRecords([]);
                setError('Unexpected data format received from server');
            }
        }
        catch (err) {
            // Use AxiosError type guard
            if (typeof err === 'object' &&
                err !== null &&
                'response' in err &&
                typeof err.response === 'object' &&
                err.response !== null &&
                'status' in err.response) {
                const status = err.response.status;
                if (status === 401) {
                    setError('Authentication failed. Please login again.');
                }
                else if (status === 403) {
                    setError('You do not have permission to view attendance records.');
                }
                else if (status === 404) {
                    setError('Attendance endpoint not found.');
                }
                else {
                    setError('Failed to load attendance records. Please try again.');
                }
            }
            else {
                setError('Failed to load attendance records. Please try again.');
            }
            console.error('Attendance fetch error:', err);
            setRecords([]);
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
            setExporting(format);
            const token = localStorage.getItem('access_token');
            if (!token) {
                alert('Authentication token not found. Please login again.');
                setExporting(null);
                return;
            }
            const response = await axios.get(`http://127.0.0.1:8000/api/admin/attendance/export/?format=${format}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    search: searchTerm || undefined,
                    status: statusFilter || undefined,
                    date: dateFilter || undefined,
                },
                responseType: 'blob',
            });
            // Create a blob link to download the file
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance-report.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        }
        catch (err) {
            if (typeof err === 'object' &&
                err !== null &&
                'response' in err &&
                typeof err.response === 'object' &&
                err.response !== null &&
                'status' in err.response) {
                const status = err.response.status;
                if (status === 401) {
                    alert('Authentication failed. Please login again.');
                }
                else {
                    alert('Failed to export attendance records');
                }
            }
            else {
                alert('Failed to export attendance records');
            }
            console.error('Export error:', err);
        }
        finally {
            setExporting(null);
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
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
        catch (error) {
            console.error('Error formatting date:', error);
            return '-';
        }
    };
    const handleApplyFilters = () => {
        fetchAttendanceRecords();
    };
    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setDateFilter('');
        // Don't fetch immediately, let user click Apply Filters
    };
    if (loading) {
        return (_jsxs("div", { className: "attendance-container", children: [_jsx("div", { className: "attendance-container__background", children: _jsx("div", { className: "attendance-container__overlay" }) }), _jsxs("div", { className: "attendance-loading", children: [_jsx("div", { className: "attendance-loading__spinner" }), _jsx("p", { className: "attendance-loading__text", children: "Loading attendance records..." })] })] }));
    }
    return (_jsxs("div", { className: "attendance-container", children: [_jsx("div", { className: "attendance-container__background", children: _jsx("div", { className: "attendance-container__overlay" }) }), _jsxs("div", { className: "attendance-content", children: [_jsxs("header", { className: "attendance-header", children: [_jsxs("div", { className: "attendance-header__title-section", children: [_jsx("h1", { className: "attendance-header__title", children: "Attendance Overview" }), _jsx("p", { className: "attendance-header__subtitle", children: "Monitor and manage student attendance records" })] }), _jsxs("div", { className: "attendance-header__actions", children: [_jsxs("button", { className: `attendance-button attendance-button--secondary ${exporting === 'csv' ? 'attendance-button--disabled' : ''}`, onClick: () => exportAttendance('csv'), disabled: exporting === 'csv', children: [exporting === 'csv' ? (_jsx(RefreshCw, { className: "attendance-icon" })) : (_jsx(Download, { className: "attendance-icon" })), exporting === 'csv' ? 'Exporting...' : 'Export CSV'] }), _jsxs("button", { className: `attendance-button attendance-button--secondary ${exporting === 'pdf' ? 'attendance-button--disabled' : ''}`, onClick: () => exportAttendance('pdf'), disabled: exporting === 'pdf', children: [exporting === 'pdf' ? (_jsx(RefreshCw, { className: "attendance-icon" })) : (_jsx(Download, { className: "attendance-icon" })), exporting === 'pdf' ? 'Exporting...' : 'Export PDF'] }), _jsxs("button", { className: "attendance-button attendance-button--primary", children: [_jsx(BarChart3, { className: "attendance-icon" }), "Analytics"] })] })] }), _jsx("section", { className: "attendance-filters", children: _jsx("div", { className: "attendance-filters__card", children: _jsxs("div", { className: "attendance-filters__content", children: [_jsxs("div", { className: "filter-group", children: [_jsx(Search, { className: "attendance-icon" }), _jsx("input", { type: "text", placeholder: "Search students or sessions...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "filter-input", "aria-label": "Search students or sessions" })] }), _jsxs("div", { className: "filter-group", children: [_jsx(Filter, { className: "attendance-icon" }), _jsxs("select", { "aria-label": "Filter by attendance status", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "filter-input", children: [_jsx("option", { value: "", children: "All Statuses" }), _jsx("option", { value: "present", children: "Present" }), _jsx("option", { value: "absent", children: "Absent" }), _jsx("option", { value: "late", children: "Late" })] })] }), _jsxs("div", { className: "filter-group", children: [_jsx(Calendar, { className: "attendance-icon" }), _jsx("input", { type: "date", value: dateFilter, onChange: (e) => setDateFilter(e.target.value), className: "filter-input", placeholder: "Select date", title: "Filter by date", "aria-label": "Filter by date" })] }), _jsxs("div", { className: "attendance-filters__actions", children: [_jsx("button", { className: "attendance-button attendance-button--primary", onClick: handleApplyFilters, children: "Apply Filters" }), _jsx("button", { className: "attendance-button attendance-button--secondary", onClick: handleClearFilters, children: "Clear" })] })] }) }) }), error && (_jsx("section", { className: "attendance-error", children: _jsx("div", { className: "attendance-error__card", children: _jsxs("div", { className: "attendance-error__content", children: [_jsx("h3", { className: "attendance-error__title", children: "Error Loading Data" }), _jsx("p", { className: "attendance-error__message", children: error }), _jsx("button", { onClick: fetchAttendanceRecords, className: "attendance-button attendance-button--primary", children: "Try Again" })] }) }) })), !error && (_jsx("section", { className: "attendance-table-section", children: _jsx("div", { className: "attendance-table-card", children: _jsx("div", { className: "attendance-table-container", children: _jsxs("table", { className: "attendance-table", children: [_jsx("thead", { className: "attendance-table__head", children: _jsxs("tr", { children: [_jsx("th", { className: "attendance-table__header", children: "Student ID" }), _jsx("th", { className: "attendance-table__header", children: "Student Name" }), _jsx("th", { className: "attendance-table__header", children: "Course" }), _jsx("th", { className: "attendance-table__header", children: "Session" }), _jsx("th", { className: "attendance-table__header", children: "Lecturer" }), _jsx("th", { className: "attendance-table__header", children: "Check In" }), _jsx("th", { className: "attendance-table__header", children: "Check Out" }), _jsx("th", { className: "attendance-table__header", children: "Status" })] }) }), _jsx("tbody", { className: "attendance-table__body", children: records.length > 0 ? (records.map((record) => (_jsxs("tr", { className: "attendance-table__row", children: [_jsx("td", { className: "attendance-table__cell attendance-table__cell--mono", children: record.student?.student_id || 'N/A' }), _jsx("td", { className: "attendance-table__cell attendance-table__cell--name", children: record.student?.name || 'N/A' }), _jsx("td", { className: "attendance-table__cell attendance-table__cell--code", children: record.session?.course?.code || 'N/A' }), _jsx("td", { className: "attendance-table__cell", children: record.session?.class_name || 'N/A' }), _jsx("td", { className: "attendance-table__cell", children: record.session?.lecturer?.name || 'N/A' }), _jsx("td", { className: "attendance-table__cell attendance-table__cell--datetime", children: formatDateTime(record.check_in_time) }), _jsx("td", { className: "attendance-table__cell attendance-table__cell--datetime", children: formatDateTime(record.check_out_time) }), _jsx("td", { className: "attendance-table__cell attendance-table__cell--status", children: _jsx("span", { className: getStatusBadgeClass(record.status), children: record.status }) })] }, record.id)))) : (_jsx("tr", { className: "attendance-table__row--empty", children: _jsx("td", { colSpan: 8, className: "attendance-table__cell attendance-table__cell--empty", children: _jsx("div", { className: "attendance-empty", children: _jsxs("div", { className: "attendance-empty__content", children: [_jsx("h3", { className: "attendance-empty__title", children: "No Records Found" }), _jsx("p", { className: "attendance-empty__message", children: searchTerm || statusFilter || dateFilter
                                                                        ? 'No attendance records match your current filters'
                                                                        : 'No attendance records available' })] }) }) }) })) })] }) }) }) })), !error && records.length > 0 && (_jsx("section", { className: "attendance-stats", children: _jsx("div", { className: "attendance-stats__card", children: _jsxs("div", { className: "attendance-stats__content", children: [_jsxs("div", { className: "stat-item", children: [_jsx("span", { className: "stat-item__label", children: "Total Records" }), _jsx("span", { className: "stat-item__value", children: records.length })] }), _jsxs("div", { className: "stat-item", children: [_jsx("span", { className: "stat-item__label", children: "Present" }), _jsx("span", { className: "stat-item__value stat-item__value--present", children: records.filter(r => r.status.toLowerCase() === 'present').length })] }), _jsxs("div", { className: "stat-item", children: [_jsx("span", { className: "stat-item__label", children: "Absent" }), _jsx("span", { className: "stat-item__value stat-item__value--absent", children: records.filter(r => r.status.toLowerCase() === 'absent').length })] }), _jsxs("div", { className: "stat-item", children: [_jsx("span", { className: "stat-item__label", children: "Late" }), _jsx("span", { className: "stat-item__value stat-item__value--late", children: records.filter(r => r.status.toLowerCase() === 'late').length })] })] }) }) }))] })] }));
};
export default AttendanceManagement;
