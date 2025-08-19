import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { QrCodeSection } from './QrCodeSection';
import { Loader2, AlertCircle, Brain, Sparkles, BarChart3, Download, RefreshCw, Search, Filter, ChevronLeft, ChevronRight, Calendar, Users, BookOpen, Clock, LogOut } from 'lucide-react';
const LecturerView = () => {
    const navigate = useNavigate();
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
    // Suggested AI queries
    const suggestedQueries = [
        "What are the overall attendance statistics?",
        "Which courses have the best attendance rates?",
        "Show me students with low attendance",
        "What are the recent attendance trends?",
        "Compare attendance across different programs",
        "Which sessions had the highest absenteeism?",
        "Analyze attendance patterns by time of day"
    ];
    // Fetch QR codes
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
    // Fetch attendance records
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
            setAttendanceReport(response.data.results);
            setTotalRecords(response.data.count || 0);
            setTotalPages(Math.ceil((response.data.count || 0) / 10));
            if (response.data.counts) {
                setStats(response.data.counts);
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
            await axios.delete(`http://127.0.0.1:8000/api/qr-codes/${id}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setQrCodes(prev => prev.filter(qr => qr.id !== id));
        }
        catch (err) {
            console.error('Failed to delete QR code:', err);
            alert('Failed to delete QR code. Please try again.');
        }
    };
    const handleRefreshQrCodes = async () => {
        await fetchQrCodes();
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
            // Add to chat history
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
    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setDateFilter('');
        setCourseFilter('');
        setCurrentPage(1);
    };
    // Format date for display
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
                return 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm';
            case 'absent':
                return 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm';
            case 'late':
                return 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm';
            default:
                return 'bg-slate-50 text-slate-700 border border-slate-200 shadow-sm';
        }
    };
    function handleDownloadQrCode(id) {
        if (!id)
            return;
        const token = localStorage.getItem('access_token');
        const url = `http://127.0.0.1:8000/api/qr-codes/${id}/download/`;
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('target', '_blank');
        if (token) {
            // If you want to send the token, you need to use fetch instead of a direct link
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
            // If no token, just open the link
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50", children: [_jsxs("div", { className: "max-w-7xl mx-auto p-4 sm:p-6 lg:p-8", children: [_jsx("div", { className: "bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-6 sm:p-8 mb-8 border border-white/20", children: _jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h1", { className: "text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent", children: "Lecturer Dashboard" }), _jsx("p", { className: "text-slate-600 text-lg font-medium", children: "Manage attendance, generate QR codes, and analyze data with AI insights" })] }), _jsxs("button", { onClick: handleLogout, className: "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 self-start lg:self-auto", children: [_jsx(LogOut, { className: "w-5 h-5" }), "Logout"] })] }) }), _jsxs("div", { className: "bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-6 sm:p-8 mb-8 border border-white/20", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("div", { className: "p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg", children: _jsx(Brain, { className: "w-8 h-8 text-white" }) }), _jsx("h2", { className: "text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent", children: "AI Attendance Insights" })] }), _jsxs("div", { className: "mb-6", children: [_jsx("p", { className: "text-sm font-medium text-slate-600 mb-3", children: "Popular questions:" }), _jsx("div", { className: "flex flex-wrap gap-2", children: suggestedQueries.map((query, index) => (_jsx("button", { onClick: () => setAiQuery(query), className: "text-xs bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 px-4 py-2 rounded-full hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 border border-indigo-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105", children: query }, index))) })] }), _jsxs("div", { className: "flex flex-col lg:flex-row gap-4 items-stretch mb-6", children: [_jsx("div", { className: "flex-1", children: _jsx("input", { type: "text", placeholder: "Ask about attendance patterns, trends, or insights...", className: "w-full border-2 border-slate-200 rounded-xl px-6 py-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/70 backdrop-blur-sm text-slate-900 placeholder-slate-500 font-medium shadow-sm", value: aiQuery, onChange: (e) => setAiQuery(e.target.value), onKeyPress: handleKeyPress, disabled: aiLoading }) }), _jsx("button", { onClick: handleAIQuery, disabled: aiLoading || !aiQuery.trim(), className: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 min-w-[160px] justify-center", children: aiLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-5 h-5 animate-spin" }), "Thinking..."] })) : (_jsxs(_Fragment, { children: [_jsx(Sparkles, { className: "w-5 h-5" }), "Ask AI"] })) })] }), aiResponse && (_jsxs("div", { className: "bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-100 rounded-2xl p-6 shadow-inner", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg", children: _jsx(Brain, { className: "w-5 h-5 text-white" }) }), _jsx("span", { className: "font-bold text-slate-800 text-lg", children: "AI Insights:" })] }), _jsx("div", { className: "text-slate-700 whitespace-pre-wrap leading-relaxed font-medium", children: aiResponse })] })), chatHistory.length > 0 && (_jsxs("div", { className: "mt-8 pt-6 border-t-2 border-slate-100", children: [_jsxs("h3", { className: "text-xl font-bold text-slate-800 mb-4 flex items-center gap-2", children: [_jsx(Clock, { className: "w-5 h-5" }), "Recent Queries"] }), _jsx("div", { className: "space-y-4 max-h-80 overflow-y-auto custom-scrollbar", children: chatHistory.slice().reverse().map((chat, index) => (_jsxs("div", { className: "bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-200", children: [_jsxs("p", { className: "text-sm font-semibold text-blue-800 mb-2", children: ["Q: ", chat.query] }), _jsxs("p", { className: "text-sm text-blue-700 mb-3 line-clamp-3", children: ["A: ", chat.response] }), _jsx("p", { className: "text-xs text-blue-500 font-medium", children: chat.timestamp.toLocaleString() })] }, index))) })] }))] }), stats && (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [_jsx("div", { className: "bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-semibold text-slate-600 uppercase tracking-wide", children: "Total Records" }), _jsx("p", { className: "text-3xl font-bold text-purple-700", children: stats.total })] }), _jsx("div", { className: "p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg", children: _jsx(BarChart3, { className: "w-8 h-8 text-white" }) })] }) }), _jsx("div", { className: "bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-emerald-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-semibold text-slate-600 uppercase tracking-wide", children: "Present" }), _jsx("p", { className: "text-3xl font-bold text-emerald-700", children: stats.present })] }), _jsx("div", { className: "p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg", children: _jsx(Users, { className: "w-8 h-8 text-white" }) })] }) }), _jsx("div", { className: "bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-rose-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-semibold text-slate-600 uppercase tracking-wide", children: "Absent" }), _jsx("p", { className: "text-3xl font-bold text-rose-700", children: stats.absent })] }), _jsx("div", { className: "p-3 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl shadow-lg", children: _jsx(AlertCircle, { className: "w-8 h-8 text-white" }) })] }) }), _jsx("div", { className: "bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-semibold text-slate-600 uppercase tracking-wide", children: "Today" }), _jsx("p", { className: "text-3xl font-bold text-blue-700", children: stats.by_time_period?.today || 0 })] }), _jsx("div", { className: "p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg", children: _jsx(Calendar, { className: "w-8 h-8 text-white" }) })] }) })] })), _jsx("div", { className: "bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-6 sm:p-8 border border-white/20", children: _jsxs(Tabs, { defaultValue: "actions", className: "w-full", children: [_jsxs(TabsList, { className: "grid grid-cols-3 gap-2 bg-slate-100/80 backdrop-blur-sm border-2 border-slate-200 rounded-2xl p-2 mb-8 shadow-inner", children: [_jsxs(TabsTrigger, { value: "actions", className: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg bg-white/70 text-slate-700 hover:bg-white/90 transition-all duration-300 rounded-xl py-4 font-bold text-sm sm:text-base transform hover:scale-105", children: [_jsx(Sparkles, { className: "w-5 h-5 mr-2" }), "Actions"] }), _jsx(TabsTrigger, { value: "qrcode", className: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg bg-white/70 text-slate-700 hover:bg-white/90 transition-all duration-300 rounded-xl py-4 font-bold text-sm sm:text-base transform hover:scale-105", children: "QR Codes" }), _jsxs(TabsTrigger, { value: "stats", className: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg bg-white/70 text-slate-700 hover:bg-white/90 transition-all duration-300 rounded-xl py-4 font-bold text-sm sm:text-base transform hover:scale-105", children: [_jsx(BarChart3, { className: "w-5 h-5 mr-2" }), "Statistics"] })] }), _jsx(TabsContent, { value: "actions", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6", children: [_jsxs("div", { className: "group bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300", children: _jsx(Sparkles, { className: "w-6 h-6 text-white" }) }), _jsx("h3", { className: "text-lg font-bold text-slate-800", children: "Generate Attendance QR" })] }), _jsx("button", { onClick: () => navigate('/generate-qr'), className: "w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg", children: "\uD83D\uDCF7 Generate QR Code" })] }), _jsxs("div", { className: "group bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "p-2 bg-gradient-to-br from-blue-500 to-teal-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300", children: _jsx(BookOpen, { className: "w-6 h-6 text-white" }) }), _jsx("h3", { className: "text-lg font-bold text-slate-800", children: "Course Management" })] }), _jsx("button", { onClick: () => navigate('/manage-courses'), className: "w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg", children: "\uD83D\uDCDA Manage Courses" })] }), _jsxs("div", { className: "group bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300", children: _jsx(Users, { className: "w-6 h-6 text-white" }) }), _jsx("h3", { className: "text-lg font-bold text-slate-800", children: "Enrollment Manager" })] }), _jsx("button", { onClick: () => navigate('/enroll-students'), className: "w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg", children: "\uD83D\uDCDD Enroll Students" })] }), _jsxs("div", { className: "group bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300", children: _jsx(Clock, { className: "w-6 h-6 text-white" }) }), _jsx("h3", { className: "text-lg font-bold text-slate-800", children: "Session Management" })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("button", { onClick: () => navigate('/create-session'), className: "w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg", children: "\uD83D\uDD27 Create Session" }), _jsx("button", { onClick: () => navigate('/session-list'), className: "w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg", children: "\uD83D\uDCCB View Sessions" })] })] }), _jsxs("div", { className: "group bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300", children: _jsx(Users, { className: "w-6 h-6 text-white" }) }), _jsx("h3", { className: "text-lg font-bold text-slate-800", children: "Students Management" })] }), _jsx("button", { onClick: () => navigate('/student-manager'), className: "w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg", children: "\uD83C\uDF93 Manage Students" })] }), _jsxs("div", { className: "group bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 border-2 border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "p-2 bg-gradient-to-br from-slate-600 to-zinc-700 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300", children: _jsx(Download, { className: "w-6 h-6 text-white" }) }), _jsx("h3", { className: "text-lg font-bold text-slate-800", children: "Quick Reports" })] }), _jsx("button", { onClick: exportCsv, className: "w-full bg-gradient-to-r from-slate-600 to-zinc-700 hover:from-slate-700 hover:to-zinc-800 text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg", children: "\uD83D\uDCCA Export Report" })] })] }) }), _jsx(TabsContent, { value: "qrcode", children: loadingQrCodes ? (
                                    // 🔹 Loading State
                                    _jsxs("div", { className: "flex flex-col items-center justify-center py-16", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-16 h-16 border-4 border-purple-200 rounded-full animate-spin" }), _jsx("div", { className: "w-16 h-16 border-4 border-purple-600 rounded-full animate-spin absolute top-0 left-0", style: { borderTopColor: "transparent" } })] }), _jsx("p", { className: "text-slate-600 mt-6 text-lg font-medium", children: "Loading QR codes..." })] })) : qrCodeError ? (
                                    // 🔹 Error State
                                    _jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-center", children: [_jsx("div", { className: "p-4 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl mb-6", children: _jsx(AlertCircle, { className: "h-16 w-16 text-red-600" }) }), _jsx("p", { className: "text-red-600 text-lg font-semibold mb-6", children: qrCodeError }), _jsxs("button", { onClick: handleRefreshQrCodes, className: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3", children: [_jsx(RefreshCw, { className: "w-5 h-5" }), "Retry"] })] })) : (
                                    // 🔹 Success State → Integrating QrCodeSection
                                    _jsx(QrCodeSection, { qrCodes: qrCodes, latestQrCode: qrCodes.length > 0 ? qrCodes[0] : null, onDownload: handleDownloadQrCode, onDelete: handleDeleteQrCode, onRefresh: handleRefreshQrCodes })) }), _jsxs(TabsContent, { value: "stats", children: [_jsxs("div", { className: "bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-200 shadow-inner", children: [_jsxs("h3", { className: "text-xl font-bold text-slate-800 mb-6 flex items-center gap-3", children: [_jsx(Filter, { className: "w-6 h-6 text-indigo-600" }), "Advanced Filters"] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("label", { htmlFor: "search", className: "block text-sm font-bold text-slate-700 flex items-center gap-2", children: [_jsx(Search, { className: "w-4 h-4 text-indigo-600" }), "Search Students"] }), _jsx("input", { id: "search", type: "text", placeholder: "Search students or sessions...", className: "w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/70 backdrop-blur-sm font-medium shadow-sm", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { htmlFor: "status-filter", className: "block text-sm font-bold text-slate-700 flex items-center gap-2", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-indigo-600" }), "Attendance Status"] }), _jsxs("select", { id: "status-filter", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/70 backdrop-blur-sm font-medium shadow-sm", children: [_jsx("option", { value: "", children: "All Statuses" }), _jsx("option", { value: "Present", children: "Present" }), _jsx("option", { value: "Absent", children: "Absent" }), _jsx("option", { value: "Late", children: "Late" })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { htmlFor: "date-filter", className: "block text-sm font-bold text-slate-700 flex items-center gap-2", children: [_jsx(Calendar, { className: "w-4 h-4 text-indigo-600" }), "Filter by Date"] }), _jsx("input", { id: "date-filter", type: "date", className: "w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/70 backdrop-blur-sm font-medium shadow-sm", value: dateFilter, onChange: (e) => setDateFilter(e.target.value) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { htmlFor: "course-filter", className: "block text-sm font-bold text-slate-700 flex items-center gap-2", children: [_jsx(BookOpen, { className: "w-4 h-4 text-indigo-600" }), "Course Filter"] }), _jsx("input", { id: "course-filter", type: "text", placeholder: "Enter course code...", className: "w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/70 backdrop-blur-sm font-medium shadow-sm", value: courseFilter, onChange: (e) => setCourseFilter(e.target.value) })] })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 items-center justify-between", children: [_jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: clearFilters, className: "bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl", children: "Clear Filters" }), _jsxs("button", { onClick: exportCsv, className: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2", children: [_jsx(Download, { className: "w-5 h-5" }), "Export CSV"] })] }), totalRecords > 0 && (_jsx("div", { className: "bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200 shadow-sm", children: _jsxs("span", { className: "text-sm font-bold text-slate-700", children: ["Showing ", attendanceReport.length, " of ", totalRecords, " records"] }) }))] })] }), _jsx("div", { className: "bg-white/80 backdrop-blur-lg border-2 border-slate-200 rounded-2xl overflow-hidden shadow-xl", children: loadingReport ? (_jsxs("div", { className: "p-16 text-center", children: [_jsxs("div", { className: "relative mb-6", children: [_jsx("div", { className: "w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin mx-auto" }), _jsx("div", { className: "w-16 h-16 border-4 border-indigo-600 rounded-full animate-spin absolute top-0 left-1/2 transform -translate-x-1/2", style: { borderTopColor: 'transparent' } })] }), _jsx("p", { className: "text-slate-600 text-lg font-medium", children: "Loading attendance records..." })] })) : error ? (_jsxs("div", { className: "p-12 text-center", children: [_jsx("div", { className: "p-4 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl inline-block mb-6", children: _jsx(AlertCircle, { className: "h-12 w-12 text-red-600" }) }), _jsx("p", { className: "text-red-600 text-lg font-semibold mb-6", children: error }), _jsx("button", { onClick: fetchAttendanceRecord, className: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl", children: "Retry" })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left px-6 py-5 font-bold text-sm uppercase tracking-wider", children: "Student ID" }), _jsx("th", { className: "text-left px-6 py-5 font-bold text-sm uppercase tracking-wider", children: "Student Name" }), _jsx("th", { className: "text-left px-6 py-5 font-bold text-sm uppercase tracking-wider", children: "Course" }), _jsx("th", { className: "text-left px-6 py-5 font-bold text-sm uppercase tracking-wider", children: "Session" }), _jsx("th", { className: "text-left px-6 py-5 font-bold text-sm uppercase tracking-wider", children: "Check In" }), _jsx("th", { className: "text-left px-6 py-5 font-bold text-sm uppercase tracking-wider", children: "Check Out" }), _jsx("th", { className: "text-left px-6 py-5 font-bold text-sm uppercase tracking-wider", children: "Status" })] }) }), _jsx("tbody", { className: "divide-y-2 divide-slate-100", children: attendanceReport.length > 0 ? (attendanceReport.map((record, index) => (_jsxs("tr", { className: `hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white/70' : 'bg-slate-50/70'}`, children: [_jsx("td", { className: "px-6 py-4 text-slate-900 font-bold text-sm", children: record.student?.student_id || 'N/A' }), _jsx("td", { className: "px-6 py-4 text-slate-800 font-medium", children: record.student?.user?.username || 'N/A' }), _jsx("td", { className: "px-6 py-4 text-slate-800 font-medium", children: record.session?.course?.code || 'N/A' }), _jsx("td", { className: "px-6 py-4 text-slate-800 font-medium", children: record.session?.class_name || 'N/A' }), _jsx("td", { className: "px-6 py-4 text-slate-700 text-sm", children: record.check_in_time ? formatDate(record.check_in_time) : '-' }), _jsx("td", { className: "px-6 py-4 text-slate-700 text-sm", children: record.check_out_time ? formatDate(record.check_out_time) : '-' }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `inline-flex px-4 py-2 text-sm font-bold rounded-full ${getStatusBadgeClass(record.status)}`, children: record.status }) })] }, `${record.id}-${record.check_in_time}`)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "px-6 py-16 text-center", children: _jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "p-4 bg-gradient-to-br from-slate-100 to-gray-100 rounded-2xl mb-6", children: _jsx(Search, { className: "h-16 w-16 text-slate-400" }) }), _jsx("p", { className: "text-xl font-bold text-slate-600 mb-2", children: "No attendance records found" }), _jsx("p", { className: "text-slate-500 font-medium", children: "Try adjusting your filters or search terms" })] }) }) })) })] }) })) }), totalPages > 1 && (_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pt-6 border-t-2 border-slate-100", children: [_jsxs("button", { onClick: () => setCurrentPage((prev) => Math.max(prev - 1, 1)), disabled: currentPage === 1, className: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 justify-center", children: [_jsx(ChevronLeft, { className: "w-5 h-5" }), "Previous"] }), _jsxs("div", { className: "flex items-center gap-4 bg-white/70 backdrop-blur-sm px-6 py-3 rounded-xl border border-slate-200 shadow-sm", children: [_jsxs("span", { className: "text-slate-800 font-bold text-lg", children: ["Page ", currentPage, " of ", totalPages] }), _jsx("span", { className: "text-slate-400 text-2xl", children: "\u2022" }), _jsxs("span", { className: "text-slate-600 font-medium", children: [totalRecords, " total records"] })] }), _jsxs("button", { onClick: () => setCurrentPage((prev) => Math.min(prev + 1, totalPages)), disabled: currentPage === totalPages, className: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 justify-center", children: ["Next", _jsx(ChevronRight, { className: "w-5 h-5" })] })] }))] })] }) })] }), _jsx("style", { children: `
        .custom-scrollbar::-webkit-scrollbar { /* For Webkit browsers (Chrome, Safari) */
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #6366f1, #8b5cf6);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #4f46e5, #7c3aed);
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      ` })] }));
};
export default LecturerView;
