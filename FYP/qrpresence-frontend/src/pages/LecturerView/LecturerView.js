import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Add useLocation
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { QrCodeSection } from './QrCodeSection';
import { Loader2, AlertCircle, Brain, Sparkles, BarChart3, Download, RefreshCw, Search, Filter, ChevronLeft, ChevronRight, Calendar, Users, BookOpen, Clock, LogOut } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './LecturerView.css';
const LecturerView = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Add useLocation hook
    const [activeTab, setActiveTab] = useState('actions');
    const [qrCodes, setQrCodes] = useState([]);
    const [attendanceReport, setAttendanceReport] = useState([]);
    const [loadingReport, setLoadingReport] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [aiResponse, setAiResponse] = useState('');
    const [aiQuery, setAiQuery] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [loadingQrCodes, setLoadingQrCodes] = useState(true);
    const [qrCodeError, setQrCodeError] = useState(null);
    const [stats, setStats] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [dateFilter, setDateFilter] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [courseError, setCourseError] = useState(null);
    const suggestedQueries = [
        "What are the overall attendance statistics?",
        "Which courses have the best attendance rates?",
        "Show me students with low attendance",
        "What are the recent attendance trends?",
        "Compare attendance across different programs",
        "Which sessions had the highest absenteeism?",
        "Analyze attendance patterns by time of day"
    ];
    // Add useEffect to handle navigation state
    useEffect(() => {
        // Check if we have navigation state that indicates which tab to activate
        const state = location.state;
        if (state && state.activeTab) {
            setActiveTab(state.activeTab);
            // Clear the state to prevent the tab from switching on every render
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);
    // Add this function to handle QR code generation success
    const navigateToGenerateQr = () => {
        navigate('/generate-qr', {
            state: {
                returnToTab: 'qrcode' // ← Pass a STRING instead of function
            }
        });
    };
    const fetchQrCodes = async () => {
        setLoadingQrCodes(true);
        setQrCodeError(null);
        try {
            const token = localStorage.getItem('access_token');
            const res = await axios.get('http://127.0.0.1:8000/api/qr-codes/', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setQrCodes(res.data.qr_codes || []);
        }
        catch (err) {
            console.error('Failed to load QR codes', err);
            setQrCodeError('Failed to load QR codes. Please try again later.');
        }
        finally {
            setLoadingQrCodes(false);
        }
    };
    useEffect(() => {
        fetchQrCodes();
    }, []);
    const fetchAttendanceRecord = React.useCallback(async () => {
        setLoadingReport(true);
        setError(null);
        const token = localStorage.getItem('access_token');
        if (!token) {
            setError('No access token found');
            setLoadingReport(false);
            return;
        }
        try {
            const params = {
                page: currentPage,
                search: searchTerm || undefined,
                status: statusFilter || undefined,
            };
            if (dateFilter) {
                params.date_from = dateFilter;
                params.date_to = dateFilter;
            }
            if (courseFilter) {
                params.course_id = courseFilter;
            }
            const response = await axios.get('http://127.0.0.1:8000/api/lecturer-attendance/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params,
            });
            // Handle both nested and flat response structures
            let actualResults = [];
            let actualCounts = undefined;
            let actualTotalCount = 0;
            // Check if the response has the nested structure (results.results and results.counts)
            if (response.data.results && typeof response.data.results === 'object' && 'results' in response.data.results) {
                actualResults = response.data.results.results || [];
                actualCounts = response.data.results.counts || undefined;
                actualTotalCount = response.data.count || 0;
            }
            else {
                // Flat structure (results and counts at top level)
                actualResults = response.data.results || [];
                actualCounts = response.data.counts || undefined;
                actualTotalCount = response.data.count || 0;
            }
            setAttendanceReport(actualResults);
            setTotalRecords(actualTotalCount);
            setTotalPages(Math.ceil(actualTotalCount / 10));
            if (actualCounts) {
                setStats(actualCounts);
            }
            else {
                setStats(null); // Clear stats if not available
            }
        }
        catch (err) {
            console.error('Failed to load attendance report:', err);
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const errorObj = err;
                setError(errorObj.response?.data?.detail || 'Failed to load attendance report.');
            }
            else {
                setError('Failed to load attendance report.');
            }
            setStats(null); // Clear stats on error
        }
        finally {
            setLoadingReport(false);
        }
    }, [currentPage, searchTerm, statusFilter, dateFilter, courseFilter]);
    useEffect(() => {
        fetchAttendanceRecord();
    }, [searchTerm, statusFilter, currentPage, dateFilter, courseFilter, fetchAttendanceRecord]);
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
        if (dateFilter) {
            query.append('date_from', dateFilter);
            query.append('date_to', dateFilter);
        }
        if (courseFilter)
            query.append('course_id', courseFilter);
        const url = `http://127.0.0.1:8000/api/lecturer-attendance/export-csv/?${query.toString()}`;
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('target', '_blank');
        link.setAttribute('download', `attendance-report-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const handleDeleteQrCode = async (id) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                alert('No access token found');
                return;
            }
            await axios.delete(`http://127.0.0.1:8000/api/qr-codes/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setQrCodes(prev => prev.filter(qr => qr.id !== id));
            toast.success('QR code deleted successfully!');
        }
        catch (err) {
            console.error('Failed to delete QR code:', err);
            toast.error('Failed to delete QR code. Please try again.');
        }
    };
    const handleRefreshQrCodes = async () => {
        await fetchQrCodes();
        toast.info('QR codes refreshed!');
    };
    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };
    const handleAIQuery = async () => {
        if (!aiQuery.trim())
            return;
        setAiLoading(true);
        setAiResponse('');
        const token = localStorage.getItem('access_token');
        try {
            const res = await axios.post('http://127.0.0.1:8000/api/ai-chat/', { query: aiQuery }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            setAiResponse(res.data.answer);
            setChatHistory(prev => [...prev, {
                    query: aiQuery,
                    response: res.data.answer,
                    timestamp: new Date()
                }]);
        }
        catch (error) {
            console.error('AI query error:', error);
            if (typeof error === 'object' &&
                error !== null &&
                'response' in error &&
                typeof error.response?.status === 'number') {
                const status = error.response?.status;
                if (status === 401) {
                    setAiResponse('Please login again to use AI features.');
                }
                else if (status === 400) {
                    setAiResponse('Please provide a valid question.');
                }
                else {
                    setAiResponse('Sorry, I encountered an error. Please try again later.');
                }
            }
            else {
                setAiResponse('Sorry, I encountered an error. Please try again later.');
            }
        }
        finally {
            setAiLoading(false);
            setAiQuery('');
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAIQuery();
        }
    };
    const fetchCourses = async () => {
        setLoadingCourses(true);
        setCourseError(null);
        try {
            const token = localStorage.getItem('access_token');
            const res = await axios.get('http://127.0.0.1:8000/api/lecturer/courses/', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            setCourses(res.data.results || []);
        }
        catch (err) {
            console.error('Failed to load courses', err);
            setCourseError('Failed to load courses. Please try again later.');
        }
        finally {
            setLoadingCourses(false);
        }
    };
    useEffect(() => {
        fetchCourses();
    }, []);
    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setDateFilter('');
        setCourseFilter('');
        setCurrentPage(1);
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const getStatusBadgeClass = (status) => {
        switch (status.toLowerCase()) {
            case 'present':
                return 'status-badge status-badge--present';
            case 'absent':
                return 'status-badge status-badge--absent';
            case 'late':
                return 'status-badge status-badge--late';
            default:
                return 'status-badge status-badge--default';
        }
    };
    const handleDownloadQrCode = (id) => {
        if (!id)
            return;
        const token = localStorage.getItem('access_token');
        const url = `http://127.0.0.1:8000/api/qr-codes/${id}/download/`;
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('target', '_blank');
        if (token) {
            fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(response => response.blob())
                .then(blob => {
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `qr-code-${id}.png`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(downloadUrl);
            })
                .catch(() => {
                alert('Failed to download QR code. Please try again.');
            });
        }
        else {
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    return (_jsxs("div", { className: "lecturer-container", children: [_jsxs("div", { className: "lecturer-content", children: [_jsx("div", { className: "lecturer-header", children: _jsxs("div", { className: "lecturer-header__content", children: [_jsxs("div", { className: "lecturer-header__text", children: [_jsx("h1", { children: "Lecturer Dashboard" }), _jsx("p", { children: "Manage attendance, generate QR codes, and analyze data with AI insights" })] }), _jsxs("button", { onClick: handleLogout, className: "lecturer-button lecturer-button--danger", children: [_jsx(LogOut, { className: "lecturer-icon" }), "Logout"] })] }) }), _jsxs("div", { className: "lecturer-card ai-chat-section", children: [_jsxs("div", { className: "ai-chat__header", children: [_jsx("div", { className: "ai-chat__icon", children: _jsx(Brain, { className: "lecturer-icon" }) }), _jsx("h2", { className: "ai-chat__title", children: "AI Attendance Insights" })] }), _jsxs("div", { className: "ai-chat__suggestions", children: [_jsx("p", { className: "ai-chat__suggestions-label", children: "Popular questions:" }), _jsx("div", { className: "ai-chat__suggestion-pills", children: suggestedQueries.map((query, index) => (_jsx("button", { onClick: () => setAiQuery(query), className: "ai-suggestion-pill", children: query }, index))) })] }), _jsxs("div", { className: "ai-chat__input-section", children: [_jsx("input", { type: "text", placeholder: "Ask about attendance patterns, trends, or insights...", className: "ai-chat__input", value: aiQuery, onChange: (e) => setAiQuery(e.target.value), onKeyPress: handleKeyPress, disabled: aiLoading }), _jsx("button", { onClick: handleAIQuery, disabled: aiLoading || !aiQuery.trim(), className: `lecturer-button lecturer-button--primary ${aiLoading || !aiQuery.trim() ? 'lecturer-button--disabled' : ''}`, children: aiLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "lecturer-icon lecturer-icon--spinning" }), "Thinking..."] })) : (_jsxs(_Fragment, { children: [_jsx(Sparkles, { className: "lecturer-icon" }), "Ask AI"] })) })] }), aiResponse && (_jsxs("div", { className: "ai-chat__response", children: [_jsxs("div", { className: "ai-chat__response-header", children: [_jsx("div", { className: "ai-chat__response-icon", children: _jsx(Brain, { className: "lecturer-icon" }) }), _jsx("span", { className: "ai-chat__response-label", children: "AI Insights:" })] }), _jsx("div", { className: "ai-chat__response-text", children: aiResponse })] })), chatHistory.length > 0 && (_jsxs("div", { className: "ai-chat__history", children: [_jsxs("h3", { className: "ai-chat__history-title", children: [_jsx(Clock, { className: "lecturer-icon" }), "Recent Queries"] }), _jsx("div", { className: "ai-chat__history-list", children: chatHistory.slice().reverse().map((chat, index) => (_jsxs("div", { className: "ai-chat__history-item", children: [_jsxs("p", { className: "ai-chat__history-question", children: ["Q: ", chat.query] }), _jsxs("p", { className: "ai-chat__history-answer", children: ["A: ", chat.response] }), _jsx("p", { className: "ai-chat__history-timestamp", children: chat.timestamp.toLocaleString() })] }, index))) })] }))] }), stats && (_jsxs("div", { className: "stats-grid", children: [_jsx("div", { className: "stats-card stats-card--purple", children: _jsxs("div", { className: "stats-card__content", children: [_jsxs("div", { className: "stats-card__info", children: [_jsx("span", { className: "stats-card__label", children: "Total Records" }), _jsx("span", { className: "stats-card__value", children: stats.total })] }), _jsx("div", { className: "stats-card__icon", children: _jsx(BarChart3, { className: "lecturer-icon" }) })] }) }), _jsx("div", { className: "stats-card stats-card--emerald", children: _jsxs("div", { className: "stats-card__content", children: [_jsxs("div", { className: "stats-card__info", children: [_jsx("span", { className: "stats-card__label", children: "Present" }), _jsx("span", { className: "stats-card__value", children: stats.present })] }), _jsx("div", { className: "stats-card__icon", children: _jsx(Users, { className: "lecturer-icon" }) })] }) }), _jsx("div", { className: "stats-card stats-card--rose", children: _jsxs("div", { className: "stats-card__content", children: [_jsxs("div", { className: "stats-card__info", children: [_jsx("span", { className: "stats-card__label", children: "Absent" }), _jsx("span", { className: "stats-card__value", children: stats.absent })] }), _jsx("div", { className: "stats-card__icon", children: _jsx(AlertCircle, { className: "lecturer-icon" }) })] }) }), _jsx("div", { className: "stats-card stats-card--blue", children: _jsxs("div", { className: "stats-card__content", children: [_jsxs("div", { className: "stats-card__info", children: [_jsx("span", { className: "stats-card__label", children: "Today" }), _jsx("span", { className: "stats-card__value", children: stats.by_time_period?.today || 0 })] }), _jsx("div", { className: "stats-card__icon", children: _jsx(Calendar, { className: "lecturer-icon" }) })] }) })] })), _jsx("div", { className: "lecturer-card main-content-card", children: _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "lecturer-tabs", children: [_jsxs(TabsList, { className: "lecturer-tabs__list", children: [_jsxs(TabsTrigger, { value: "actions", className: "lecturer-tabs__trigger", children: [_jsx(Sparkles, { className: "lecturer-icon" }), "Actions"] }), _jsx(TabsTrigger, { value: "qrcode", className: "lecturer-tabs__trigger", children: "QR Codes" }), _jsxs(TabsTrigger, { value: "stats", className: "lecturer-tabs__trigger", children: [_jsx(BarChart3, { className: "lecturer-icon" }), "Statistics"] })] }), _jsx(TabsContent, { value: "actions", children: _jsxs("div", { className: "actions-grid", children: [_jsxs("div", { className: "action-card action-card--purple", children: [_jsxs("div", { className: "action-card__header", children: [_jsx("div", { className: "action-card__icon", children: _jsx(Sparkles, { className: "lecturer-icon" }) }), _jsx("h3", { className: "action-card__title", children: "Generate Attendance QR" })] }), _jsx("button", { onClick: navigateToGenerateQr, className: "action-card__button", children: "\uD83D\uDCF7 Generate QR Code" })] }), _jsxs("div", { className: "action-card action-card--blue", children: [_jsxs("div", { className: "action-card__header", children: [_jsx("div", { className: "action-card__icon", children: _jsx(BookOpen, { className: "lecturer-icon" }) }), _jsx("h3", { className: "action-card__title", children: "Course Management" })] }), _jsx("button", { onClick: () => navigate('/manage-courses'), className: "action-card__button", children: "\uD83D\uDCDA Manage Courses" })] }), _jsxs("div", { className: "action-card action-card--emerald", children: [_jsxs("div", { className: "action-card__header", children: [_jsx("div", { className: "action-card__icon", children: _jsx(Users, { className: "lecturer-icon" }) }), _jsx("h3", { className: "action-card__title", children: "Enrollment Manager" })] }), _jsx("button", { onClick: () => navigate('/enroll-students'), className: "action-card__button", children: "\uD83D\uDCDD Enroll Students" })] }), _jsxs("div", { className: "action-card action-card--emerald", children: [_jsxs("div", { className: "action-card__header", children: [_jsx("div", { className: "action-card__icon", children: _jsx(Clock, { className: "lecturer-icon" }) }), _jsx("h3", { className: "action-card__title", children: "Session Management" })] }), _jsxs("div", { className: "action-card__actions", children: [_jsx("button", { onClick: () => navigate('/create-session'), className: "action-card__button", children: "\uD83D\uDD27 Create Session" }), _jsx("button", { onClick: () => navigate('/session-list'), className: "action-card__button", children: "\uD83D\uDCCB View Sessions" })] })] }), _jsxs("div", { className: "action-card action-card--indigo", children: [_jsxs("div", { className: "action-card__header", children: [_jsx("div", { className: "action-card__icon", children: _jsx(Users, { className: "lecturer-icon" }) }), _jsx("h3", { className: "action-card__title", children: "Students Management" })] }), _jsx("button", { onClick: () => navigate('/student-manager'), className: "action-card__button", children: "\uD83C\uDF93 Manage Students" })] }), _jsxs("div", { className: "action-card action-card--slate", children: [_jsxs("div", { className: "action-card__header", children: [_jsx("div", { className: "action-card__icon", children: _jsx(Download, { className: "lecturer-icon" }) }), _jsx("h3", { className: "action-card__title", children: "Quick Reports" })] }), _jsx("button", { onClick: exportCsv, className: "action-card__button", children: "\uD83D\uDCCA Export Report" })] })] }) }), _jsx(TabsContent, { value: "qrcode", children: loadingQrCodes ? (_jsxs("div", { className: "lecturer-loading", children: [_jsx("div", { className: "lecturer-loading__spinner" }), _jsx("p", { className: "lecturer-loading__text", children: "Loading QR codes..." })] })) : qrCodeError ? (_jsxs("div", { className: "lecturer-error", children: [_jsx("div", { className: "lecturer-error__icon", children: _jsx(AlertCircle, { className: "lecturer-icon" }) }), _jsx("h3", { className: "lecturer-error__title", children: "Error" }), _jsx("p", { className: "lecturer-error__message", children: qrCodeError }), _jsxs("button", { onClick: handleRefreshQrCodes, className: "lecturer-button lecturer-button--primary", children: [_jsx(RefreshCw, { className: "lecturer-icon" }), "Retry"] })] })) : (_jsx(QrCodeSection, { qrCodes: qrCodes, latestQrCode: qrCodes.length > 0 ? qrCodes[0] : null, onDownload: handleDownloadQrCode, onDelete: handleDeleteQrCode, onRefresh: handleRefreshQrCodes })) }), _jsxs(TabsContent, { value: "stats", children: [_jsxs("div", { className: "filters-section", children: [_jsxs("h3", { className: "filters-section__title", children: [_jsx(Filter, { className: "lecturer-icon" }), "Advanced Filters"] }), _jsxs("div", { className: "filters-grid", children: [_jsxs("div", { className: "filter-group", children: [_jsxs("label", { htmlFor: "search", className: "filter-label", children: [_jsx(Search, { className: "lecturer-icon" }), "Search Students"] }), _jsx("input", { id: "search", type: "text", placeholder: "Search students or sessions...", className: "filter-input", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })] }), _jsxs("div", { className: "filter-group", children: [_jsxs("label", { htmlFor: "status-filter", className: "filter-label", children: [_jsx(AlertCircle, { className: "lecturer-icon" }), "Attendance Status"] }), _jsxs("select", { id: "status-filter", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "filter-input", children: [_jsx("option", { value: "", children: "All Statuses" }), _jsx("option", { value: "Present", children: "Present" }), _jsx("option", { value: "Absent", children: "Absent" }), _jsx("option", { value: "Late", children: "Late" })] })] }), _jsxs("div", { className: "filter-group", children: [_jsxs("label", { htmlFor: "date-filter", className: "filter-label", children: [_jsx(Calendar, { className: "lecturer-icon" }), "Filter by Date"] }), _jsx("input", { id: "date-filter", type: "date", className: "filter-input", value: dateFilter, onChange: (e) => setDateFilter(e.target.value) })] }), _jsxs("div", { className: "filter-group", children: [_jsxs("label", { htmlFor: "course-filter", className: "filter-label", children: [_jsx(BookOpen, { className: "lecturer-icon" }), "Course Filter"] }), _jsxs("select", { id: "course-filter", value: courseFilter, onChange: (e) => setCourseFilter(e.target.value), className: "filter-input", disabled: loadingCourses, children: [_jsx("option", { value: "", children: "All Courses" }), courses.map((course) => (_jsxs("option", { value: course.id.toString(), children: [course.code, " - ", course.name] }, course.id)))] }), courseError && _jsx("p", { className: "filter-error", children: courseError })] })] }), _jsxs("div", { className: "filters-actions", children: [_jsxs("div", { className: "filters-buttons", children: [_jsx("button", { onClick: clearFilters, className: "lecturer-button lecturer-button--secondary", children: "Clear Filters" }), _jsxs("button", { onClick: exportCsv, className: "lecturer-button lecturer-button--primary", children: [_jsx(Download, { className: "lecturer-icon" }), "Export CSV"] })] }), totalRecords > 0 && (_jsx("div", { className: "filters-info", children: _jsxs("span", { className: "filters-info__text", children: ["Showing ", attendanceReport.length, " of ", totalRecords, " records"] }) }))] })] }), _jsx("div", { className: "table-container", children: loadingReport ? (_jsxs("div", { className: "lecturer-loading", children: [_jsx("div", { className: "lecturer-loading__spinner" }), _jsx("p", { className: "lecturer-loading__text", children: "Loading attendance records..." })] })) : error ? (_jsxs("div", { className: "lecturer-error", children: [_jsx("div", { className: "lecturer-error__icon", children: _jsx(AlertCircle, { className: "lecturer-icon" }) }), _jsx("h3", { className: "lecturer-error__title", children: "Error" }), _jsx("p", { className: "lecturer-error__message", children: error }), _jsx("button", { onClick: fetchAttendanceRecord, className: "lecturer-button lecturer-button--primary", children: "Retry" })] })) : (_jsx("div", { className: "table-wrapper", children: _jsxs("table", { className: "attendance-table", children: [_jsx("thead", { className: "attendance-table__header", children: _jsxs("tr", { children: [_jsx("th", { children: "Student ID" }), _jsx("th", { children: "Student Name" }), _jsx("th", { children: "Course" }), _jsx("th", { children: "Session" }), _jsx("th", { children: "Check In" }), _jsx("th", { children: "Check Out" }), _jsx("th", { children: "Status" })] }) }), _jsx("tbody", { className: "attendance-table__body", children: attendanceReport.length > 0 ? (attendanceReport.map((record, index) => (_jsxs("tr", { className: `attendance-table__row ${index % 2 === 0 ? 'attendance-table__row--even' : 'attendance-table__row--odd'}`, children: [_jsx("td", { children: record.student?.student_id || 'N/A' }), _jsx("td", { children: record.student?.user?.username || 'N/A' }), _jsx("td", { children: record.session?.course?.code || 'N/A' }), _jsx("td", { children: record.session?.class_name || 'N/A' }), _jsx("td", { children: record.check_in_time ? formatDate(record.check_in_time) : '-' }), _jsx("td", { children: record.check_out_time ? formatDate(record.check_out_time) : '-' }), _jsx("td", { children: _jsx("span", { className: getStatusBadgeClass(record.status), children: record.status }) })] }, `${record.id}-${record.check_in_time}`)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "attendance-table__empty", children: _jsxs("div", { className: "attendance-table__empty-content", children: [_jsx(Search, { className: "attendance-table__empty-icon" }), _jsx("p", { className: "attendance-table__empty-text", children: "No attendance records found" }), _jsx("p", { className: "attendance-table__empty-subtext", children: "Try adjusting your filters or search terms" })] }) }) })) })] }) })) }), totalPages > 1 && (_jsxs("div", { className: "pagination", children: [_jsxs("button", { onClick: () => setCurrentPage((prev) => Math.max(prev - 1, 1)), disabled: currentPage === 1, className: `pagination-button pagination-button--prev ${currentPage === 1 ? 'pagination-button--disabled' : ''}`, children: [_jsx(ChevronLeft, { className: "pagination-icon" }), "Previous"] }), _jsxs("div", { className: "pagination-info", children: [_jsxs("span", { className: "pagination-info__text", children: ["Page ", currentPage, " of ", totalPages] }), _jsx("span", { className: "pagination-info__divider", children: "\u2022" }), _jsxs("span", { className: "pagination-info__count", children: [totalRecords, " total records"] })] }), _jsxs("button", { onClick: () => setCurrentPage((prev) => Math.min(prev + 1, totalPages)), disabled: currentPage === totalPages, className: `pagination-button pagination-button--next ${currentPage === totalPages ? 'pagination-button--disabled' : ''}`, children: ["Next", _jsx(ChevronRight, { className: "pagination-icon" })] })] }))] })] }) })] }), _jsx(ToastContainer, { position: "top-right", autoClose: 3000, toastStyle: {
                    background: 'rgba(131, 13, 228, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                } })] }));
};
export default LecturerView;
