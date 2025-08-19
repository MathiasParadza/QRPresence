import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
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
            console.log('Enrollments data:', data); // Debugging log
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
            if (!res.ok) {
                const errorData = await res.json();
                throw {
                    status: res.status,
                    ...errorData
                };
            }
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
            console.error('Enrollment error:', err);
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
            return (_jsxs("div", { className: "flex justify-center items-center py-4", children: [_jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" }), _jsx("span", { className: "ml-2", children: "Loading students..." })] }));
        }
        if (error) {
            return (_jsxs("div", { className: "text-center py-4 text-red-500", children: [_jsx("strong", { children: "Error:" }), " ", formatError(error), _jsx("button", { onClick: fetchStudents, className: "ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200", children: "Retry" })] }));
        }
        if (students.length === 0) {
            return (_jsxs("div", { className: "text-center py-4 text-gray-500", children: ["No students available", _jsx("button", { onClick: fetchStudents, className: "ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200", children: "Retry" })] }));
        }
        return (_jsx("div", { className: "max-h-60 overflow-y-auto border rounded divide-y", children: students.map(student => (_jsx("div", { className: "p-3 hover:bg-gray-50", children: _jsxs("label", { className: "flex items-start space-x-3 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: selectedStudents.includes(student.student_id), onChange: () => handleStudentSelection(student.student_id), className: "mt-1 rounded text-blue-600 focus:ring-blue-500", disabled: loading.submitting }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: student.name }), _jsx("p", { className: "text-xs text-gray-500 truncate", children: student.email }), _jsxs("p", { className: "text-xs text-gray-400 mt-1", children: [student.program, " \u2022 ID: ", student.student_id] })] })] }) }, student.student_id))) }));
    };
    return (_jsxs("div", { className: "container mx-auto px-4 py-8 max-w-6xl", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Enrollment Management" }), _jsx("p", { className: "text-sm text-gray-500", children: "Manage student enrollments in your courses" })] }), _jsxs("button", { onClick: () => navigate("/dashboard"), className: "flex items-center text-blue-600 hover:text-blue-800", children: [_jsx("svg", { className: "w-5 h-5 mr-1", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 19l-7-7m0 0l7-7m-7 7h18" }) }), "Back to Dashboard"] })] }), error && (_jsx("div", { className: "bg-red-50 border-l-4 border-red-400 p-4 mb-6", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("svg", { className: "h-5 w-5 text-red-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }), _jsx("div", { className: "ml-3", children: _jsxs("p", { className: "text-sm text-red-700", children: [_jsx("strong", { children: "Error:" }), " ", formatError(error), error.status_code && ` (Status: ${error.status_code})`] }) })] }) })), success && (_jsx("div", { className: "bg-green-50 border-l-4 border-green-400 p-4 mb-6", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("svg", { className: "h-5 w-5 text-green-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }), _jsx("div", { className: "ml-3", children: _jsx("p", { className: "text-sm text-green-700", children: success }) })] }) }))] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsxs("div", { className: "bg-white shadow overflow-hidden rounded-lg", children: [_jsx("div", { className: "px-4 py-5 sm:px-6 border-b border-gray-200", children: _jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Enroll Students" }) }), _jsxs("div", { className: "px-4 py-5 sm:p-6", children: [_jsxs("div", { className: "mb-6", children: [_jsx("label", { htmlFor: "course-select", className: "block text-sm font-medium text-gray-700 mb-1", children: "Select Course" }), _jsxs("select", { id: "course-select", className: "block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md", value: selectedCourse || '', onChange: (e) => {
                                                    setSelectedCourse(Number(e.target.value));
                                                    fetchEnrollments();
                                                }, disabled: loading.courses || loading.submitting, children: [_jsx("option", { value: "", children: "-- Select a course --" }), courses.map(course => (_jsxs("option", { value: course.id, children: [course.code, " - ", course.title] }, course.id)))] })] }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Select Students" }), renderStudentsList()] }), _jsx("button", { onClick: handleEnrollStudents, disabled: loading.submitting || !selectedCourse || selectedStudents.length === 0, className: `w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading.submitting || !selectedCourse || selectedStudents.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`, children: loading.submitting ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Processing..."] })) : 'Enroll Students' })] })] }), _jsxs("div", { className: "bg-white shadow overflow-hidden rounded-lg", children: [_jsxs("div", { className: "px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center", children: [_jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Current Enrollments" }), _jsx("button", { onClick: () => fetchEnrollments(true), disabled: refreshing, className: "inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: refreshing ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Refreshing..."] })) : (_jsxs(_Fragment, { children: [_jsx("svg", { className: "-ml-1 mr-2 h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }), "Refresh"] })) })] }), _jsx("div", { className: "px-4 py-5 sm:p-6", children: loading.enrollments && enrollments.length === 0 ? (_jsx("div", { className: "flex justify-center items-center py-8", children: _jsxs("svg", { className: "animate-spin h-8 w-8 text-blue-600", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }) })) : enrollments.length === 0 ? (_jsx("div", { className: "text-center py-8 text-gray-500", children: "No enrollments found" })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { scope: "col", className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Student" }), _jsx("th", { scope: "col", className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Course" }), _jsx("th", { scope: "col", className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Enrolled On" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: enrollments.map(enrollment => {
                                                    // Handle cases where student/course might be just IDs or full objects
                                                    const student = typeof enrollment.student === 'object'
                                                        ? enrollment.student
                                                        : students.find(s => s.student_id === enrollment.student);
                                                    const course = typeof enrollment.course === 'object'
                                                        ? enrollment.course
                                                        : courses.find(c => c.id === enrollment.course);
                                                    return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsxs("td", { className: "px-4 py-3 whitespace-nowrap text-sm text-gray-900", children: [_jsx("div", { className: "font-medium", children: student?.name || 'Unknown' }), _jsx("div", { className: "text-gray-500", children: student?.student_id || 'Unknown' })] }), _jsxs("td", { className: "px-4 py-3 whitespace-nowrap text-sm text-gray-500", children: [course?.code || 'Unknown', " - ", course?.title || 'Unknown'] }), _jsx("td", { className: "px-4 py-3 whitespace-nowrap text-sm text-gray-500", children: new Date(enrollment.enrolled_at).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                }) })] }, enrollment.id));
                                                }) })] }) })) })] })] })] }));
};
export default LecturerEnrollmentManager;
