import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Search, Filter, Calendar, Download, BarChart3, RefreshCw, Brain, Sparkles, Loader2, Clock } from 'lucide-react';
import axios from 'axios';
import './AttendanceManagement.css';
const suggestedQueries = [
    "Which students were absent last week?",
    "Show attendance trends for Course XYZ",
    "List students with more than 3 absences",
    "Average attendance per session",
    "Highlight late arrivals in the past month"
];
const AttendanceManagement = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [exporting, setExporting] = useState(null);
    // AI Chat states
    const [showAIChat, setShowAIChat] = useState(false);
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
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
            const data = response.data;
            if (data && 'results' in data) {
                setRecords(data.results || []);
            }
            else {
                console.error('Unexpected API response format:', data);
                setRecords([]);
                setError('Unexpected data format received from server');
            }
        }
        catch (err) {
            console.error('Attendance fetch error:', err);
            setRecords([]);
            setError('Failed to load attendance records. Please try again.');
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
                headers: { Authorization: `Bearer ${token}` },
                params: { search: searchTerm || undefined, status: statusFilter || undefined, date: dateFilter || undefined },
                responseType: 'blob',
            });
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
            console.error('Export error:', err);
            alert('Failed to export attendance records');
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
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
            });
        }
        catch {
            return '-';
        }
    };
    const handleApplyFilters = () => fetchAttendanceRecords();
    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setDateFilter('');
    };
    // AI Chat Handlers
    const handleAIQuery = async () => {
        if (!aiQuery.trim())
            return;
        try {
            setAiLoading(true);
            const token = localStorage.getItem('access_token');
            if (!token)
                throw new Error('Token missing');
            const res = await axios.post('http://127.0.0.1:8000/api/ai-chat/', { query: aiQuery }, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            const answer = res.data.response || 'No response from AI.';
            setAiResponse(answer);
            setChatHistory(prev => [...prev, { query: aiQuery, response: answer, timestamp: new Date() }]);
            setAiQuery('');
        }
        catch (err) {
            console.error('AI query error:', err);
            setAiResponse('Failed to get response from AI.');
        }
        finally {
            setAiLoading(false);
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter')
            handleAIQuery();
    };
    if (loading) {
        return (_jsxs("div", { className: "attendance-container", children: [_jsx("div", { className: "attendance-container__background", children: _jsx("div", { className: "attendance-container__overlay" }) }), _jsxs("div", { className: "attendance-loading", children: [_jsx("div", { className: "attendance-loading__spinner" }), _jsx("p", { className: "attendance-loading__text", children: "Loading attendance records..." })] })] }));
    }
    return (_jsxs("div", { className: "attendance-container", children: [_jsx("div", { className: "attendance-container__background", children: _jsx("div", { className: "attendance-container__overlay" }) }), _jsxs("div", { className: "attendance-content", children: [_jsxs("header", { className: "attendance-header", children: [_jsxs("div", { className: "attendance-header__title-section", children: [_jsx("h1", { className: "attendance-header__title", children: "Attendance Overview" }), _jsx("p", { className: "attendance-header__subtitle", children: "Monitor and manage student attendance records" })] }), _jsxs("div", { className: "attendance-header__actions", children: [_jsxs("button", { className: `attendance-button attendance-button--secondary ${exporting === 'csv' ? 'attendance-button--disabled' : ''}`, onClick: () => exportAttendance('csv'), disabled: exporting === 'csv', children: [exporting === 'csv' ? _jsx(RefreshCw, { className: "attendance-icon" }) : _jsx(Download, { className: "attendance-icon" }), exporting === 'csv' ? 'Exporting...' : 'Export CSV'] }), _jsxs("button", { className: `attendance-button attendance-button--secondary ${exporting === 'pdf' ? 'attendance-button--disabled' : ''}`, onClick: () => exportAttendance('pdf'), disabled: exporting === 'pdf', children: [exporting === 'pdf' ? _jsx(RefreshCw, { className: "attendance-icon" }) : _jsx(Download, { className: "attendance-icon" }), exporting === 'pdf' ? 'Exporting...' : 'Export PDF'] }), _jsxs("button", { className: "attendance-button attendance-button--primary", onClick: () => setShowAIChat(!showAIChat), children: [_jsx(BarChart3, { className: "attendance-icon" }), "Analytics"] })] })] }), _jsx("section", { className: "attendance-filters", children: _jsx("div", { className: "attendance-filters__card", children: _jsxs("div", { className: "attendance-filters__content", children: [_jsxs("div", { className: "filter-group", children: [_jsx(Search, { className: "attendance-icon" }), _jsx("input", { type: "text", placeholder: "Search students or sessions...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "filter-input", "aria-label": "Search students or sessions" })] }), _jsxs("div", { className: "filter-group", children: [_jsx(Filter, { className: "attendance-icon" }), _jsxs("select", { "aria-label": "Filter by attendance status", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "filter-input", children: [_jsx("option", { value: "", children: "All Statuses" }), _jsx("option", { value: "present", children: "Present" }), _jsx("option", { value: "absent", children: "Absent" }), _jsx("option", { value: "late", children: "Late" })] })] }), _jsxs("div", { className: "filter-group", children: [_jsx(Calendar, { className: "attendance-icon" }), _jsx("input", { type: "date", value: dateFilter, onChange: (e) => setDateFilter(e.target.value), className: "filter-input", placeholder: "Select date", title: "Filter by date", "aria-label": "Filter by date" })] }), _jsxs("div", { className: "attendance-filters__actions", children: [_jsx("button", { className: "attendance-button attendance-button--primary", onClick: handleApplyFilters, children: "Apply Filters" }), _jsx("button", { className: "attendance-button attendance-button--secondary", onClick: handleClearFilters, children: "Clear" })] })] }) }) }), error && (_jsx("section", { className: "attendance-error", children: _jsx("div", { className: "attendance-error__card", children: _jsxs("div", { className: "attendance-error__content", children: [_jsx("h3", { className: "attendance-error__title", children: "Error Loading Data" }), _jsx("p", { className: "attendance-error__message", children: error }), _jsx("button", { onClick: fetchAttendanceRecords, className: "attendance-button attendance-button--primary", children: "Try Again" })] }) }) })), !error && (_jsx("section", { className: "attendance-table-section", children: _jsx("div", { className: "attendance-table-card", children: _jsx("div", { className: "attendance-table-container", children: _jsxs("table", { className: "attendance-table", children: [_jsx("thead", { className: "attendance-table__head", children: _jsxs("tr", { children: [_jsx("th", { className: "attendance-table__header", children: "Student ID" }), _jsx("th", { className: "attendance-table__header", children: "Student Name" }), _jsx("th", { className: "attendance-table__header", children: "Course" }), _jsx("th", { className: "attendance-table__header", children: "Session" }), _jsx("th", { className: "attendance-table__header", children: "Check In" }), _jsx("th", { className: "attendance-table__header", children: "Check Out" }), _jsx("th", { className: "attendance-table__header", children: "Status" })] }) }), _jsx("tbody", { className: "attendance-table__body", children: records.length > 0 ? (records.map(record => (_jsxs("tr", { className: "attendance-table__row", children: [_jsx("td", { className: "attendance-table__cell attendance-table__cell--mono", children: record.student_id || 'N/A' }), _jsx("td", { className: "attendance-table__cell attendance-table__cell--name", children: record.student_name || 'N/A' }), _jsx("td", { className: "attendance-table__cell attendance-table__cell--code", children: record.course_code || 'N/A' }), _jsx("td", { className: "attendance-table__cell", children: record.session_name || 'N/A' }), _jsx("td", { className: "attendance-table__cell attendance-table__cell--datetime", children: formatDateTime(record.check_in_time) }), _jsx("td", { className: "attendance-table__cell attendance-table__cell--datetime", children: formatDateTime(record.check_out_time) }), _jsx("td", { className: "attendance-table__cell attendance-table__cell--status", children: _jsx("span", { className: getStatusBadgeClass(record.status), children: record.status }) })] }, record.id)))) : (_jsx("tr", { className: "attendance-table__row--empty", children: _jsx("td", { colSpan: 8, className: "attendance-table__cell attendance-table__cell--empty", children: "No Records Found" }) })) })] }) }) }) })), !error && records.length > 0 && (_jsx("section", { className: "attendance-stats", children: _jsx("div", { className: "attendance-stats__card", children: _jsxs("div", { className: "attendance-stats__content", children: [_jsxs("div", { className: "stat-item", children: [_jsx("span", { className: "stat-item__label", children: "Total Records" }), _jsx("span", { className: "stat-item__value", children: records.length })] }), _jsxs("div", { className: "stat-item", children: [_jsx("span", { className: "stat-item__label", children: "Present" }), _jsx("span", { className: "stat-item__value stat-item__value--present", children: records.filter(r => r.status.toLowerCase() === 'present').length })] }), _jsxs("div", { className: "stat-item", children: [_jsx("span", { className: "stat-item__label", children: "Absent" }), _jsx("span", { className: "stat-item__value stat-item__value--absent", children: records.filter(r => r.status.toLowerCase() === 'absent').length })] }), _jsxs("div", { className: "stat-item", children: [_jsx("span", { className: "stat-item__label", children: "Late" }), _jsx("span", { className: "stat-item__value stat-item__value--late", children: records.filter(r => r.status.toLowerCase() === 'late').length })] })] }) }) })), showAIChat && (_jsx("section", { className: "ai-chat-section", children: _jsxs("div", { className: "lecturer-card", children: [_jsxs("div", { className: "ai-chat__header", children: [_jsx(Brain, { className: "lecturer-icon" }), _jsx("h2", { className: "ai-chat__title", children: "AI Attendance Insights" })] }), _jsxs("div", { className: "ai-chat__suggestions", children: [_jsx("p", { className: "ai-chat__suggestions-label", children: "Popular questions:" }), _jsx("div", { className: "ai-chat__suggestion-pills", children: suggestedQueries.map((query, index) => (_jsx("button", { onClick: () => setAiQuery(query), className: "ai-suggestion-pill", children: query }, index))) })] }), _jsxs("div", { className: "ai-chat__input-section", children: [_jsx("input", { type: "text", placeholder: "Ask about attendance patterns, trends, or insights...", className: "ai-chat__input", value: aiQuery, onChange: (e) => setAiQuery(e.target.value), onKeyPress: handleKeyPress, disabled: aiLoading }), _jsx("button", { onClick: handleAIQuery, disabled: aiLoading || !aiQuery.trim(), className: `lecturer-button lecturer-button--primary ${aiLoading || !aiQuery.trim() ? 'lecturer-button--disabled' : ''}`, children: aiLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "lecturer-icon lecturer-icon--spinning" }), "Thinking..."] })) : (_jsxs(_Fragment, { children: [_jsx(Sparkles, { className: "lecturer-icon" }), "Ask AI"] })) })] }), aiResponse && (_jsxs("div", { className: "ai-chat__response", children: [_jsxs("div", { className: "ai-chat__response-header", children: [_jsx(Brain, { className: "lecturer-icon" }), _jsx("span", { className: "ai-chat__response-label", children: "AI Insights:" })] }), _jsx("div", { className: "ai-chat__response-text", children: aiResponse })] })), chatHistory.length > 0 && (_jsxs("div", { className: "ai-chat__history", children: [_jsxs("h3", { className: "ai-chat__history-title", children: [_jsx(Clock, { className: "lecturer-icon" }), "Recent Queries"] }), _jsx("div", { className: "ai-chat__history-list", children: chatHistory.slice().reverse().map((chat, index) => (_jsxs("div", { className: "ai-chat__history-item", children: [_jsxs("p", { className: "ai-chat__history-question", children: ["Q: ", chat.query] }), _jsxs("p", { className: "ai-chat__history-answer", children: ["A: ", chat.response] }), _jsx("p", { className: "ai-chat__history-timestamp", children: chat.timestamp.toLocaleString() })] }, index))) })] }))] }) }))] })] }));
};
export default AttendanceManagement;
