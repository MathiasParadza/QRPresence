import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Calendar, Search, Download, Edit, Trash2, Plus, Eye, Clock, User } from 'lucide-react';
import axios from 'axios';
const SessionManagement = () => {
    const [sessions, setSessions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [lecturers, setLecturers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        course: '',
        lecturer: '',
        search: '',
        ordering: 'timestamp'
    });
    const fetchCourses = React.useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get('http://localhost:8000/api/admin/courses/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCourses(response.data);
        }
        catch (err) {
            console.error('Error fetching courses:', err);
        }
    }, []);
    const fetchLecturers = React.useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get('http://localhost:8000/api/admin/lecturers/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLecturers(response.data);
        }
        catch (err) {
            console.error('Error fetching lecturers:', err);
        }
    }, []);
    const fetchSessions = React.useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const params = new URLSearchParams();
            if (filters.course)
                params.append('course', filters.course);
            if (filters.lecturer)
                params.append('lecturer', filters.lecturer);
            if (filters.search)
                params.append('search', filters.search);
            if (filters.ordering)
                params.append('ordering', filters.ordering);
            const response = await axios.get(`http://localhost:8000/api/admin/sessions/?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSessions(response.data);
        }
        catch (err) {
            setError('Failed to fetch sessions');
            console.error('Error fetching sessions:', err);
        }
        finally {
            setLoading(false);
        }
    }, [filters]);
    useEffect(() => {
        fetchSessions();
        fetchCourses();
        fetchLecturers();
    }, [fetchSessions, fetchCourses, fetchLecturers]);
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    const handleDeleteSession = async (sessionId) => {
        if (!window.confirm('Are you sure you want to delete this session?'))
            return;
        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`http://localhost:8000/api/admin/sessions/${sessionId}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSessions(sessions.filter((session) => session.id !== sessionId));
        }
        catch (err) {
            setError('Failed to delete session');
            console.error('Error deleting session:', err);
        }
    };
    const formatSessionDuration = (startTime, endTime) => {
        if (!startTime || !endTime)
            return 'N/A';
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationMs = end.getTime() - start.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };
    if (loading)
        return _jsx("div", { className: "admin-loading", children: "Loading sessions..." });
    if (error)
        return _jsx("div", { className: "admin-error", children: error });
    return (_jsxs("div", { className: "admin-page", children: [_jsxs("div", { className: "admin-page__header", children: [_jsx("h2", { children: "Session Management" }), _jsx("p", { children: "Manage all class sessions and attendance tracking" })] }), _jsxs("div", { className: "admin-filters", children: [_jsxs("div", { className: "admin-filters__group", children: [_jsxs("div", { className: "admin-filter", children: [_jsx("label", { htmlFor: "course-select", children: "Course" }), _jsxs("select", { id: "course-select", value: filters.course, onChange: (e) => handleFilterChange('course', e.target.value), children: [_jsx("option", { value: "", children: "All Courses" }), courses.map(course => (_jsxs("option", { value: course.id, children: [course.code, " - ", course.title] }, course.id)))] })] }), _jsxs("div", { className: "admin-filter", children: [_jsx("label", { htmlFor: "lecturer-select", children: "Lecturer" }), _jsxs("select", { id: "lecturer-select", value: filters.lecturer, onChange: (e) => handleFilterChange('lecturer', e.target.value), children: [_jsx("option", { value: "", children: "All Lecturers" }), lecturers.map(lecturer => (_jsxs("option", { value: lecturer.id, children: [lecturer.name, " (", lecturer.lecturer_id, ")"] }, lecturer.id)))] })] }), _jsxs("div", { className: "admin-filter", children: [_jsx("label", { htmlFor: "sort-by-select", children: "Sort By" }), _jsxs("select", { id: "sort-by-select", value: filters.ordering, onChange: (e) => handleFilterChange('ordering', e.target.value), children: [_jsx("option", { value: "timestamp", children: "Session Date" }), _jsx("option", { value: "-timestamp", children: "Session Date (Desc)" }), _jsx("option", { value: "class_name", children: "Class Name" }), _jsx("option", { value: "-class_name", children: "Class Name (Desc)" })] })] })] }), _jsxs("div", { className: "admin-search", children: [_jsx(Search, { size: 20 }), _jsx("input", { type: "text", placeholder: "Search sessions...", value: filters.search, onChange: (e) => handleFilterChange('search', e.target.value) })] })] }), _jsxs("div", { className: "admin-table-container", children: [_jsxs("table", { className: "admin-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Session ID" }), _jsx("th", { children: "Class Name" }), _jsx("th", { children: "Course" }), _jsx("th", { children: "Lecturer" }), _jsx("th", { children: "Session Date" }), _jsx("th", { children: "Duration" }), _jsx("th", { children: "QR Code" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: sessions.map((session) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx("span", { className: "session-id", children: session.session_id }) }), _jsx("td", { children: session.class_name }), _jsx("td", { children: session.course && (_jsxs("span", { className: "course-info", children: [session.course.code, " - ", session.course.title] })) }), _jsx("td", { children: session.lecturer && (_jsxs("span", { className: "lecturer-info", children: [_jsx(User, { size: 14 }), session.lecturer.name] })) }), _jsx("td", { children: session.timestamp && (_jsxs("span", { className: "session-date", children: [new Date(session.timestamp).toLocaleDateString(), _jsx("br", {}), _jsx("small", { className: "text-muted", children: new Date(session.timestamp).toLocaleTimeString() })] })) }), _jsx("td", { children: _jsxs("span", { className: "session-duration", children: [_jsx(Clock, { size: 14 }), formatSessionDuration(session.start_time, session.end_time)] }) }), _jsx("td", { children: session.qr_codes && session.qr_codes.length > 0 ? (_jsxs("span", { className: "qr-status qr-status--active", children: ["Active (", session.qr_codes.length, ")"] })) : (_jsx("span", { className: "qr-status qr-status--inactive", children: "No QR" })) }), _jsx("td", { children: _jsxs("div", { className: "admin-actions", children: [_jsx("button", { className: "admin-action-btn admin-action-btn--view", title: "View", children: _jsx(Eye, { size: 16 }) }), _jsx("button", { className: "admin-action-btn admin-action-btn--edit", title: "Edit", children: _jsx(Edit, { size: 16 }) }), _jsx("button", { className: "admin-action-btn admin-action-btn--delete", title: "Delete", onClick: () => handleDeleteSession(session.id), children: _jsx(Trash2, { size: 16 }) })] }) })] }, session.id))) })] }), sessions.length === 0 && (_jsxs("div", { className: "admin-empty-state", children: [_jsx(Calendar, { size: 48 }), _jsx("p", { children: "No sessions found" })] }))] }), _jsxs("div", { className: "admin-page__actions", children: [_jsxs("button", { className: "admin-button admin-button--primary", children: [_jsx(Plus, { size: 20 }), "Create New Session"] }), _jsxs("button", { className: "admin-button admin-button--secondary", children: [_jsx(Download, { size: 20 }), "Export Data"] })] })] }));
};
export default SessionManagement;
