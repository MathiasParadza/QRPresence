import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Users, Search, Download, Edit, Trash2, Plus, Eye, User, BookOpen, Calendar } from 'lucide-react';
import axios from 'axios';
const EnrollmentManagement = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [lecturers, setLecturers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        course: '',
        enrolled_by: '',
        search: '',
        ordering: 'enrolled_at',
        page_size: '10',
    });
    // Pagination
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    // API service functions
    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        return {
            Authorization: `Bearer ${token}`,
        };
    };
    const fetchEnrollments = React.useCallback(async (url) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.course)
                params.append('course', filters.course);
            if (filters.enrolled_by)
                params.append('enrolled_by', filters.enrolled_by);
            if (filters.search)
                params.append('search', filters.search);
            if (filters.ordering)
                params.append('ordering', filters.ordering);
            if (filters.page_size)
                params.append('page_size', filters.page_size);
            const apiUrl = url || `http://localhost:8000/api/admin/enrollments/?${params}`;
            const response = await axios.get(apiUrl, { headers: getAuthHeaders() });
            const data = response.data;
            setEnrollments(data.results || data);
            setNextPage(data.next || null);
            setPrevPage(data.previous || null);
        }
        catch (err) {
            setError('Failed to fetch enrollments');
            console.error('Error fetching enrollments:', err);
        }
        finally {
            setLoading(false);
        }
    }, [filters]);
    const fetchCourses = React.useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/admin/courses/', { headers: getAuthHeaders() });
            const data = response.data;
            setCourses(data.results || data);
        }
        catch (err) {
            console.error('Error fetching courses:', err);
        }
    }, []);
    const fetchLecturers = React.useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/admin/lecturers/', { headers: getAuthHeaders() });
            const data = response.data;
            setLecturers(data.results || data);
        }
        catch (err) {
            console.error('Error fetching lecturers:', err);
        }
    }, []);
    const deleteEnrollment = async (enrollmentId) => {
        try {
            await axios.delete(`http://localhost:8000/api/admin/enrollments/${enrollmentId}/`, { headers: getAuthHeaders() });
            setEnrollments(prev => prev.filter(enrollment => enrollment.id !== enrollmentId));
        }
        catch {
            throw new Error('Failed to delete enrollment');
        }
    };
    const exportEnrollments = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.course)
                params.append('course', filters.course);
            if (filters.enrolled_by)
                params.append('enrolled_by', filters.enrolled_by);
            if (filters.search)
                params.append('search', filters.search);
            const response = await axios.get(`http://localhost:8000/api/admin/enrollments/export/?${params}`, {
                headers: getAuthHeaders(),
                responseType: 'blob'
            });
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'enrollments_export.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
        catch (err) {
            setError('Failed to export enrollments');
            console.error('Error exporting enrollments:', err);
        }
    };
    useEffect(() => {
        fetchEnrollments();
    }, [fetchEnrollments]);
    useEffect(() => {
        fetchCourses();
        fetchLecturers();
    }, [fetchCourses, fetchLecturers]);
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    const handleDeleteEnrollment = async (enrollmentId) => {
        if (!window.confirm('Are you sure you want to delete this enrollment?'))
            return;
        try {
            await deleteEnrollment(enrollmentId);
        }
        catch (err) {
            setError('Failed to delete enrollment');
            console.error('Error deleting enrollment:', err);
        }
    };
    const handleExport = async () => {
        await exportEnrollments();
    };
    const handlePageChange = (url) => {
        if (url)
            fetchEnrollments(url);
    };
    const getStatusBadge = (status) => {
        const statusClasses = {
            active: 'status-badge status-badge--active',
            completed: 'status-badge status-badge--completed',
            dropped: 'status-badge status-badge--dropped'
        };
        const statusLabels = {
            active: 'Active',
            completed: 'Completed',
            dropped: 'Dropped'
        };
        return (_jsx("span", { className: statusClasses[status] || 'status-badge', children: statusLabels[status] || status }));
    };
    if (loading) {
        return (_jsxs("div", { className: "admin-loading", children: [_jsx("div", { className: "admin-loading__spinner" }), _jsx("p", { children: "Loading enrollments..." })] }));
    }
    if (error) {
        return (_jsx("div", { className: "admin-error", children: _jsxs("div", { className: "admin-error__content", children: [_jsx("p", { children: error }), _jsx("button", { onClick: () => setError(null), className: "admin-button admin-button--primary", children: "Try Again" })] }) }));
    }
    return (_jsxs("div", { className: "admin-page", children: [_jsxs("div", { className: "admin-page__header", children: [_jsx("h2", { children: "Enrollment Management" }), _jsx("p", { children: "Manage student course enrollments and registrations" })] }), _jsxs("div", { className: "admin-filters", children: [_jsxs("div", { className: "admin-filters__group", children: [_jsxs("div", { className: "admin-filter", children: [_jsx("label", { htmlFor: "course-select", children: "Course" }), _jsxs("select", { id: "course-select", value: filters.course, onChange: (e) => handleFilterChange('course', e.target.value), children: [_jsx("option", { value: "", children: "All Courses" }, "all-courses"), courses.map(course => (_jsxs("option", { value: course.id, children: [course.code, " - ", course.title] }, `course-${course.id}`)))] })] }), _jsxs("div", { className: "admin-filter", children: [_jsx("label", { htmlFor: "enrolled-by-select", children: "Enrolled By" }), _jsxs("select", { id: "enrolled-by-select", value: filters.enrolled_by, onChange: (e) => handleFilterChange('enrolled_by', e.target.value), children: [_jsx("option", { value: "", children: "All Lecturers" }, "all-lecturers"), lecturers.map(lecturer => (_jsxs("option", { value: lecturer.id, children: [lecturer.name, " (", lecturer.lecturer_id, ")"] }, `lecturer-${lecturer.id}`)))] })] }), _jsxs("div", { className: "admin-filter", children: [_jsx("label", { children: "Sort By" }), _jsxs("select", { id: "sort-by-select", "aria-label": "Sort By", value: filters.ordering, onChange: (e) => handleFilterChange('ordering', e.target.value), children: [_jsx("option", { value: "enrolled_at", children: "Enrollment Date" }, "enrolled_at"), _jsx("option", { value: "-enrolled_at", children: "Enrollment Date (Desc)" }, "-enrolled_at"), _jsx("option", { value: "student__name", children: "Student Name" }, "student__name"), _jsx("option", { value: "-student__name", children: "Student Name (Desc)" }, "-student__name")] })] }), _jsxs("div", { className: "admin-filter", children: [_jsx("label", { htmlFor: "page-size-select", children: "Page Size" }), _jsxs("select", { id: "page-size-select", value: filters.page_size, onChange: (e) => handleFilterChange('page_size', e.target.value), children: [_jsx("option", { value: "10", children: "10" }, "10"), _jsx("option", { value: "20", children: "20" }, "20"), _jsx("option", { value: "50", children: "50" }, "50")] })] })] }), _jsxs("div", { className: "admin-search", children: [_jsx(Search, { size: 20 }), _jsx("input", { type: "text", placeholder: "Search by student ID, name, or course code...", value: filters.search, onChange: (e) => handleFilterChange('search', e.target.value) })] })] }), _jsxs("div", { className: "admin-table-container", children: [_jsxs("table", { className: "admin-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Student ID" }), _jsx("th", { children: "Student Name" }), _jsx("th", { children: "Course" }), _jsx("th", { children: "Enrolled By" }), _jsx("th", { children: "Enrollment Date" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: enrollments.map((enrollment) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx("span", { className: "student-id", children: enrollment.student.student_id }) }), _jsx("td", { children: _jsxs("span", { className: "student-info", children: [_jsx(User, { size: 14 }), enrollment.student.name] }) }), _jsx("td", { children: enrollment.course && (_jsxs("span", { className: "course-info", children: [_jsx(BookOpen, { size: 14 }), enrollment.course.code, " - ", enrollment.course.title] })) }), _jsx("td", { children: enrollment.enrolled_by && (_jsxs("span", { className: "lecturer-info", children: [enrollment.enrolled_by.name, _jsx("br", {}), _jsxs("small", { className: "text-muted", children: ["ID: ", enrollment.enrolled_by.lecturer_id] })] })) }), _jsx("td", { children: _jsxs("span", { className: "enrollment-date", children: [_jsx(Calendar, { size: 14 }), new Date(enrollment.enrolled_at).toLocaleDateString(), _jsx("br", {}), _jsx("small", { className: "text-muted", children: new Date(enrollment.enrolled_at).toLocaleTimeString() })] }) }), _jsx("td", { children: getStatusBadge(enrollment.status) }), _jsx("td", { children: _jsxs("div", { className: "admin-actions", children: [_jsx("button", { className: "admin-action-btn admin-action-btn--view", title: "View Enrollment", children: _jsx(Eye, { size: 16 }) }), _jsx("button", { className: "admin-action-btn admin-action-btn--edit", title: "Edit Enrollment", children: _jsx(Edit, { size: 16 }) }), _jsx("button", { className: "admin-action-btn admin-action-btn--delete", title: "Delete Enrollment", onClick: () => handleDeleteEnrollment(enrollment.id), children: _jsx(Trash2, { size: 16 }) })] }) })] }, enrollment.id))) })] }), enrollments.length === 0 && !loading && (_jsxs("div", { className: "admin-empty-state", children: [_jsx(Users, { size: 48 }), _jsx("p", { children: "No enrollments found" }), filters.course || filters.enrolled_by || filters.search ? (_jsx("p", { className: "text-muted", children: "Try adjusting your filters" })) : null] }))] }), _jsxs("div", { className: "admin-pagination", children: [_jsx("button", { className: "admin-button admin-button--secondary", disabled: !prevPage, onClick: () => handlePageChange(prevPage), children: "Previous" }), _jsx("button", { className: "admin-button admin-button--secondary", disabled: !nextPage, onClick: () => handlePageChange(nextPage), children: "Next" })] }), _jsxs("div", { className: "admin-page__actions", children: [_jsxs("button", { className: "admin-button admin-button--primary", children: [_jsx(Plus, { size: 20 }), "Add New Enrollment"] }), _jsxs("button", { className: "admin-button admin-button--secondary", onClick: handleExport, disabled: enrollments.length === 0, children: [_jsx(Download, { size: 20 }), "Export Data"] })] }), _jsx("style", { children: `
        .admin-pagination {
          display: flex;
          justify-content: center;
          margin: 1rem 0;
          gap: 1rem;
        }
      ` })] }));
};
export default EnrollmentManagement;
