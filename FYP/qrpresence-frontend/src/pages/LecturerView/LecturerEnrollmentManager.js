import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import './LecturerEnrollmentManager.css';
const API_BASE_URL = 'http://localhost:8000';
const LecturerEnrollmentManager = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [loading, setLoading] = useState({
        enrollments: false,
        courses: false,
        students: false,
        submitting: false
    });
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();
    const handleApiError = useCallback((err) => {
        if (typeof err === 'object' && err !== null) {
            const errorObj = err;
            if (errorObj.status === 401) {
                setError({
                    detail: 'Authentication failed. Please login again.',
                    status_code: 401
                });
                navigate("/login");
            }
            else if (errorObj.detail) {
                setError({ detail: errorObj.detail });
            }
            else if (errorObj.error) {
                setError({ error: errorObj.error });
            }
            else if (errorObj.message) {
                setError({ detail: errorObj.message });
            }
            else {
                setError({ detail: 'An unexpected error occurred' });
            }
        }
        else {
            setError({ detail: 'An unexpected error occurred' });
        }
    }, [navigate]);
    const fetchEnrollments = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        }
        else {
            setLoading(prev => ({ ...prev, enrollments: true }));
        }
        setError(null);
        try {
            const url = selectedCourse
                ? `${API_BASE_URL}/api/lecturer/enrollments/?course_id=${selectedCourse}`
                : `${API_BASE_URL}/api/lecturer/enrollments/`;
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Accept': 'application/json',
                },
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw {
                    status: res.status,
                    ...errorData
                };
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setEnrollments(data);
                if (isRefresh) {
                    setSuccess('Enrollments refreshed successfully');
                    setTimeout(() => setSuccess(null), 3000);
                }
            }
            else if (data.results && Array.isArray(data.results)) {
                setEnrollments(data.results);
            }
            else {
                throw new Error('Invalid data format received for enrollments');
            }
        }
        catch (err) {
            handleApiError(err);
            setEnrollments([]);
        }
        finally {
            setLoading(prev => ({ ...prev, enrollments: false }));
            setRefreshing(false);
        }
    }, [handleApiError, selectedCourse]);
    const fetchCourses = useCallback(async () => {
        setLoading(prev => ({ ...prev, courses: true }));
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/lecturer/courses/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Accept': 'application/json',
                },
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw {
                    status: res.status,
                    ...errorData
                };
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setCourses(data);
            }
            else if (data.results && Array.isArray(data.results)) {
                setCourses(data.results);
            }
            else {
                throw new Error('Invalid data format received for courses');
            }
        }
        catch (err) {
            handleApiError(err);
            setCourses([]);
        }
        finally {
            setLoading(prev => ({ ...prev, courses: false }));
        }
    }, [handleApiError]);
    const fetchStudents = useCallback(async () => {
        setLoading(prev => ({ ...prev, students: true }));
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/students/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Accept': 'application/json',
                },
            });
            const data = await res.json();
            if (data && Array.isArray(data.results)) {
                setStudents(data.results);
            }
            else {
                throw new Error('Invalid students data format');
            }
        }
        catch (err) {
            handleApiError(err);
            setStudents([]);
        }
        finally {
            setLoading(prev => ({ ...prev, students: false }));
        }
    }, [handleApiError]);
    const handleEnrollStudents = async () => {
        if (!selectedCourse) {
            setError({ detail: 'Please select a course' });
            return;
        }
        if (selectedStudents.length === 0) {
            setError({ detail: 'Please select at least one student' });
            return;
        }
        setLoading(prev => ({ ...prev, submitting: true }));
        setError(null);
        setSuccess(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/lecturer/enrollments/?course_id=${selectedCourse}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: JSON.stringify({
                    student_ids: selectedStudents
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw {
                    status: response.status,
                    ...data
                };
            }
            setSuccess(data.message || `${selectedStudents.length} students enrolled successfully`);
            setSelectedStudents([]);
            fetchEnrollments(true);
        }
        catch (err) {
            handleApiError(err);
        }
        finally {
            setLoading(prev => ({ ...prev, submitting: false }));
        }
    };
    useEffect(() => {
        fetchEnrollments();
        fetchCourses();
        fetchStudents();
    }, [fetchEnrollments, fetchCourses, fetchStudents]);
    const handleStudentSelection = (studentId) => {
        setSelectedStudents(prev => prev.includes(studentId)
            ? prev.filter(id => id !== studentId)
            : [...prev, studentId]);
    };
    const formatError = (error) => {
        if (!error)
            return null;
        if (error.detail)
            return error.detail;
        if (error.error)
            return error.error;
        if (error.message)
            return error.message;
        return 'An unknown error occurred';
    };
    const renderStudentsList = () => {
        if (loading.students) {
            return (_jsxs("div", { className: "enrollment-loading", children: [_jsx("div", { className: "enrollment-loading__spinner" }), _jsx("span", { className: "enrollment-loading__text", children: "Loading students..." })] }));
        }
        if (error) {
            return (_jsxs("div", { className: "enrollment-state enrollment-state--error", children: [_jsx("div", { className: "enrollment-state__icon", children: _jsx("svg", { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" }) }) }), _jsx("h3", { className: "enrollment-state__title", children: "Error Loading Students" }), _jsx("p", { className: "enrollment-state__message", children: formatError(error) }), _jsx("button", { onClick: fetchStudents, className: "enrollment-button enrollment-button--secondary", children: "Retry" })] }));
        }
        if (students.length === 0) {
            return (_jsxs("div", { className: "enrollment-state", children: [_jsx("div", { className: "enrollment-state__icon", children: _jsx("svg", { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }) }) }), _jsx("h3", { className: "enrollment-state__title", children: "No Students Available" }), _jsx("p", { className: "enrollment-state__message", children: "There are no students to enroll at this time" }), _jsx("button", { onClick: fetchStudents, className: "enrollment-button enrollment-button--primary", children: "Retry" })] }));
        }
        return (_jsx("div", { className: "enrollment-students-list", children: students.map((student) => (_jsx("div", { className: "enrollment-student-item", children: _jsxs("label", { className: "enrollment-student-label", children: [_jsx("input", { type: "checkbox", className: "enrollment-student-checkbox", checked: selectedStudents.includes(student.student_id), onChange: () => handleStudentSelection(student.student_id), disabled: loading.submitting }), _jsx("div", { className: "enrollment-student-avatar", children: student.name.charAt(0).toUpperCase() }), _jsxs("div", { className: "enrollment-student-info", children: [_jsx("h4", { className: "enrollment-student-name", children: student.name }), _jsxs("div", { className: "enrollment-student-details", children: [_jsxs("div", { className: "enrollment-student-email", children: [_jsx("svg", { width: "14", height: "14", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }) }), student.email] }), _jsxs("div", { className: "enrollment-student-meta", children: [_jsx("span", { className: "enrollment-student-program", children: student.program }), _jsxs("span", { className: "enrollment-student-id", children: ["ID: ", student.student_id] })] })] })] })] }) }, student.student_id))) }));
    };
    return (_jsxs("div", { className: "enrollment-container", children: [_jsx("div", { className: "enrollment-container__background", children: _jsx("div", { className: "enrollment-container__overlay" }) }), _jsxs("div", { className: "enrollment-content", children: [_jsxs("div", { className: "enrollment-header", children: [_jsxs("div", { className: "enrollment-header__top", children: [_jsxs("div", { className: "enrollment-header__title-section", children: [_jsx("div", { className: "enrollment-header__icon", children: _jsx("svg", { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477 4.5 1.253" }) }) }), _jsxs("div", { className: "enrollment-header__text", children: [_jsx("h1", { children: "Enrollment Management" }), _jsx("p", { children: "Manage student enrollments in your courses with ease" })] })] }), _jsxs("button", { onClick: () => navigate("/dashboard"), className: "enrollment-button enrollment-button--secondary", children: [_jsx("svg", { width: "16", height: "16", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 19l-7-7m0 0l7-7m-7 7h18" }) }), "Back to Dashboard"] })] }), error && (_jsxs("div", { className: "enrollment-alert enrollment-alert--error", children: [_jsx("div", { className: "enrollment-alert__icon", children: _jsx("svg", { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }), _jsxs("div", { className: "enrollment-alert__content", children: [_jsx("strong", { children: "Error:" }), " ", formatError(error), error.status_code && ` (Status: ${error.status_code})`] })] })), success && (_jsxs("div", { className: "enrollment-alert enrollment-alert--success", children: [_jsx("div", { className: "enrollment-alert__icon", children: _jsx("svg", { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }), _jsx("div", { className: "enrollment-alert__content", children: success })] }))] }), _jsxs("div", { className: "enrollment-grid", children: [_jsxs("div", { className: "enrollment-card", children: [_jsx("div", { className: "enrollment-card__header", children: _jsxs("div", { className: "enrollment-card__header-content", children: [_jsxs("h2", { children: [_jsx("svg", { width: "20", height: "20", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" }) }), "Enroll Students"] }), _jsx("p", { children: "Select a course and add students" })] }) }), _jsxs("div", { className: "enrollment-card__body", children: [_jsxs("div", { className: "enrollment-form-group", children: [_jsx("label", { className: "enrollment-label", children: "Select Course" }), _jsxs("select", { className: "enrollment-select", value: selectedCourse || '', onChange: (e) => {
                                                            setSelectedCourse(Number(e.target.value));
                                                            fetchEnrollments();
                                                        }, disabled: loading.courses || loading.submitting, title: "Select Course", children: [_jsx("option", { value: "", children: "-- Select a course --" }), courses.map(course => (_jsxs("option", { value: course.id, children: [course.code, " - ", course.title] }, course.id)))] })] }), _jsxs("div", { className: "enrollment-form-group", children: [_jsxs("div", { className: "enrollment-students-header", children: [_jsx("label", { className: "enrollment-label", children: "Select Students" }), selectedStudents.length > 0 && (_jsxs("span", { className: "enrollment-badge", children: [selectedStudents.length, " selected"] }))] }), renderStudentsList()] }), _jsx("button", { onClick: handleEnrollStudents, disabled: loading.submitting || !selectedCourse || selectedStudents.length === 0, className: `enrollment-button enrollment-button--primary enrollment-button--full ${loading.submitting || !selectedCourse || selectedStudents.length === 0
                                                    ? 'enrollment-button--disabled'
                                                    : ''}`, children: loading.submitting ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "enrollment-loading__spinner" }), "Processing..."] })) : (_jsxs(_Fragment, { children: [_jsx("svg", { width: "16", height: "16", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }) }), "Enroll Students"] })) })] })] }), _jsxs("div", { className: "enrollment-card", children: [_jsxs("div", { className: "enrollment-card__header enrollment-card__header--alt", children: [_jsxs("div", { className: "enrollment-card__header-content", children: [_jsxs("h2", { children: [_jsx("svg", { width: "20", height: "20", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" }) }), "Current Enrollments"] }), _jsx("p", { children: "View and manage enrollments" })] }), _jsx("button", { onClick: () => fetchEnrollments(true), disabled: refreshing, className: `enrollment-button enrollment-button--secondary ${refreshing ? 'enrollment-button--disabled' : ''}`, children: refreshing ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "enrollment-loading__spinner" }), "Refreshing..."] })) : (_jsxs(_Fragment, { children: [_jsx("svg", { width: "16", height: "16", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }), "Refresh"] })) })] }), _jsx("div", { className: "enrollment-card__body", children: loading.enrollments && enrollments.length === 0 ? (_jsxs("div", { className: "enrollment-loading", children: [_jsx("div", { className: "enrollment-loading__spinner" }), _jsx("span", { className: "enrollment-loading__text", children: "Loading enrollments..." })] })) : enrollments.length === 0 ? (_jsxs("div", { className: "enrollment-state", children: [_jsx("div", { className: "enrollment-state__icon", children: _jsx("svg", { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" }) }) }), _jsx("h3", { className: "enrollment-state__title", children: "No Enrollments Found" }), _jsx("p", { className: "enrollment-state__message", children: "Start by enrolling students in courses" })] })) : (_jsx("div", { className: "enrollment-table-container", children: _jsxs("table", { className: "enrollment-table", children: [_jsx("thead", { className: "enrollment-table__header", children: _jsxs("tr", { children: [_jsx("th", { children: _jsxs("div", { className: "enrollment-table__header-content", children: [_jsx("svg", { width: "16", height: "16", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }) }), "Student"] }) }), _jsx("th", { children: _jsxs("div", { className: "enrollment-table__header-content", children: [_jsx("svg", { width: "16", height: "16", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477 4.5 1.253" }) }), "Course"] }) }), _jsx("th", { children: _jsxs("div", { className: "enrollment-table__header-content", children: [_jsx("svg", { width: "16", height: "16", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7V3a4 4 0 118 0v4m-4 0v6m-3 0h6m-6-3h6" }) }), "Enrolled On"] }) })] }) }), _jsx("tbody", { children: enrollments.map((enrollment) => {
                                                            const student = typeof enrollment.student === 'object'
                                                                ? enrollment.student
                                                                : students.find(s => s.student_id === enrollment.student);
                                                            const course = typeof enrollment.course === 'object'
                                                                ? enrollment.course
                                                                : courses.find(c => c.id === enrollment.course);
                                                            return (_jsxs("tr", { className: "enrollment-table__row", children: [_jsx("td", { className: "enrollment-table__cell", children: _jsxs("div", { className: "enrollment-table__student", children: [_jsx("div", { className: "enrollment-table__student-avatar", children: (student?.name || 'U').charAt(0).toUpperCase() }), _jsxs("div", { className: "enrollment-table__student-info", children: [_jsx("div", { className: "enrollment-table__student-name", children: student?.name || 'Unknown' }), _jsx("div", { className: "enrollment-table__student-id", children: student?.student_id || 'Unknown' })] })] }) }), _jsx("td", { className: "enrollment-table__cell", children: _jsxs("div", { className: "enrollment-table__course", children: [_jsx("div", { className: "enrollment-table__course-icon", children: _jsx("svg", { width: "16", height: "16", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477 4.5 1.253" }) }) }), _jsxs("div", { className: "enrollment-table__course-info", children: [_jsx("div", { className: "enrollment-table__course-code", children: course?.code || 'Unknown' }), _jsx("div", { className: "enrollment-table__course-title", children: course?.title || 'Unknown' })] })] }) }), _jsx("td", { className: "enrollment-table__cell", children: _jsxs("div", { className: "enrollment-table__date", children: [_jsx("div", { className: "enrollment-table__date-icon", children: _jsx("svg", { width: "16", height: "16", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7V3a4 4 0 118 0v4m-4 0v6m-3 0h6m-6-3h6" }) }) }), _jsxs("div", { className: "enrollment-table__date-info", children: [_jsx("div", { className: "enrollment-table__date-value", children: new Date(enrollment.enrolled_at).toLocaleDateString('en-US', {
                                                                                                year: 'numeric',
                                                                                                month: 'short',
                                                                                                day: 'numeric'
                                                                                            }) }), _jsx("div", { className: "enrollment-table__date-time", children: new Date(enrollment.enrolled_at).toLocaleTimeString('en-US', {
                                                                                                hour: '2-digit',
                                                                                                minute: '2-digit'
                                                                                            }) })] })] }) })] }, enrollment.id));
                                                        }) })] }) })) })] })] })] })] }));
};
export default LecturerEnrollmentManager;
