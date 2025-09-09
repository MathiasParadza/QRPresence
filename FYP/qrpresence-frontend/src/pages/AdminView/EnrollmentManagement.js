import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
const API_BASE_URL = 'http://127.0.0.1:8000/api';
const getAccessToken = () => localStorage.getItem('access_token');
const EnrollmentManagement = () => {
    const navigate = useNavigate();
    const [enrollments, setEnrollments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Fetch courses
    const fetchCourses = useCallback(async () => {
        const token = getAccessToken();
        if (!token)
            return navigate('/login');
        try {
            const res = await fetch(`${API_BASE_URL}/admin/courses/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok)
                throw new Error('Failed to fetch courses');
            const data = await res.json();
            setCourses(data);
        }
        catch (err) {
            console.error(err);
            setError('Error fetching courses');
        }
    }, [navigate]);
    // Fetch enrollments
    const fetchEnrollments = useCallback(async () => {
        const token = getAccessToken();
        if (!token)
            return navigate('/login');
        setLoading(true);
        setError(null);
        try {
            const url = selectedCourseId
                ? `${API_BASE_URL}/admin/enrollments/?course_id=${selectedCourseId}`
                : `${API_BASE_URL}/admin/enrollments/`;
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) {
                if (res.status === 403) {
                    throw new Error('Access forbidden. Admin privileges required.');
                }
                throw new Error('Failed to fetch enrollments');
            }
            const data = await res.json();
            setEnrollments(data);
        }
        catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Error fetching enrollments');
        }
        finally {
            setLoading(false);
        }
    }, [navigate, selectedCourseId]);
    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);
    useEffect(() => {
        fetchEnrollments();
    }, [fetchEnrollments]);
    // Export CSV with all available data
    const handleExportCSV = async () => {
        const token = getAccessToken();
        if (!token)
            return navigate('/login');
        try {
            const url = selectedCourseId
                ? `${API_BASE_URL}/admin/enrollments/export_csv/?course_id=${selectedCourseId}`
                : `${API_BASE_URL}/admin/enrollments/export_csv/`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                // Generate filename with course name if filtered
                const courseName = selectedCourseId
                    ? courses.find(c => c.id === parseInt(selectedCourseId))?.title || 'course'
                    : 'all_courses';
                a.download = `enrollments_${courseName.replace(/\s+/g, '_')}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            }
            else {
                throw new Error('Failed to export CSV');
            }
        }
        catch (error) {
            console.error('Export error:', error);
            setError('Failed to export CSV. Please try again.');
        }
    };
    if (loading)
        return _jsx(LoadingSpinner, {});
    if (error)
        return _jsx("div", { className: "text-red-600 p-4", children: error });
    return (_jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Admin Enrollment Management" }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { htmlFor: "course-filter", className: "block mb-2 font-semibold", children: "Filter by Course" }), _jsxs("select", { id: "course-filter", value: selectedCourseId, onChange: (e) => setSelectedCourseId(e.target.value), className: "border px-3 py-2 rounded-lg w-full max-w-xs", children: [_jsx("option", { value: "", children: "All Courses" }), courses.map((course) => (_jsxs("option", { value: course.id, children: [course.code, " - ", course.title] }, course.id)))] })] }), _jsx("button", { onClick: handleExportCSV, className: "mb-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg", disabled: enrollments.length === 0, children: "Export CSV" }), _jsxs("h3", { className: "text-xl font-semibold mb-2", children: ["Enrollments (", enrollments.length, ")"] }), enrollments.length > 0 ? (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full border-collapse border border-gray-300", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-100", children: [_jsx("th", { className: "border px-3 py-2", children: "Student ID" }), _jsx("th", { className: "border px-3 py-2", children: "Student Name" }), _jsx("th", { className: "border px-3 py-2", children: "Course Code" }), _jsx("th", { className: "border px-3 py-2", children: "Course Title" }), _jsx("th", { className: "border px-3 py-2", children: "Enrolled By" }), _jsx("th", { className: "border px-3 py-2", children: "Enrollment Date" })] }) }), _jsx("tbody", { children: enrollments.map((enrollment) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "border px-3 py-2", children: enrollment.student_id }), _jsx("td", { className: "border px-3 py-2", children: enrollment.student_name }), _jsx("td", { className: "border px-3 py-2", children: enrollment.course_code }), _jsx("td", { className: "border px-3 py-2", children: enrollment.course_title }), _jsxs("td", { className: "border px-3 py-2", children: [enrollment.enrolled_by_name, " (", enrollment.enrolled_by_username, ")"] }), _jsx("td", { className: "border px-3 py-2", children: new Date(enrollment.enrolled_at).toLocaleDateString() })] }, enrollment.id))) })] }) })) : (_jsxs("div", { className: "text-center py-8 text-gray-500", children: ["No enrollments found", selectedCourseId ? ' for this course' : '', "."] }))] }));
};
export default EnrollmentManagement;
