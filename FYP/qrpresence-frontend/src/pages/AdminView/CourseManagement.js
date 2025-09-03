import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/admin/Courses/CourseManager.tsx
import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, BookOpen } from 'lucide-react';
import axios from 'axios';
const CourseManager = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    useEffect(() => {
        fetchCourses();
    }, []);
    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get('http://127.0.0.1:8000/api/admin/courses/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = response.data;
            setCourses(Array.isArray(data) ? data : data.results || []);
        }
        catch (err) {
            setError('Failed to load courses');
            console.error('Courses fetch error:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm('Are you sure you want to delete this course?'))
            return;
        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`http://127.0.0.1:8000/api/admin/courses/${courseId}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setCourses(courses.filter(course => course.id !== courseId));
        }
        catch (err) {
            alert('Failed to delete course');
            console.error('Course delete error:', err);
        }
    };
    const filteredCourses = courses.filter(course => course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.title.toLowerCase().includes(searchTerm.toLowerCase()));
    if (loading) {
        return (_jsxs("div", { className: "admin-loading", children: [_jsx("div", { className: "admin-loading__spinner" }), _jsx("p", { children: "Loading courses..." })] }));
    }
    return (_jsxs("div", { className: "course-manager", children: [_jsxs("div", { className: "course-manager__header", children: [_jsx("h2", { children: "Course Management" }), _jsxs("button", { className: "admin-button admin-button--primary", children: [_jsx(Plus, { size: 16 }), "Add Course"] })] }), _jsx("div", { className: "course-manager__search", children: _jsxs("div", { className: "search-group", children: [_jsx(Search, { size: 18 }), _jsx("input", { type: "text", placeholder: "Search courses...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "search-input" })] }) }), error && (_jsxs("div", { className: "admin-error", children: [_jsx("p", { children: error }), _jsx("button", { onClick: fetchCourses, className: "admin-button admin-button--primary", children: "Retry" })] })), _jsxs("div", { className: "admin-table-container", children: [_jsxs("table", { className: "admin-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Code" }), _jsx("th", { children: "Title" }), _jsx("th", { children: "Credit Hours" }), _jsx("th", { children: "Created" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: filteredCourses.map((course) => (_jsxs("tr", { children: [_jsx("td", { children: _jsxs("div", { className: "course-code", children: [_jsx(BookOpen, { size: 16 }), course.code] }) }), _jsx("td", { children: course.title }), _jsx("td", { children: course.credit_hours }), _jsx("td", { children: new Date(course.created_at).toLocaleDateString() }), _jsx("td", { children: _jsxs("div", { className: "action-buttons", children: [_jsx("button", { className: "action-button action-button--edit", title: "Edit Course", children: _jsx(Edit, { size: 16 }) }), _jsx("button", { className: "action-button action-button--delete", onClick: () => handleDeleteCourse(course.id), title: "Delete Course", children: _jsx(Trash2, { size: 16 }) })] }) })] }, course.id))) })] }), filteredCourses.length === 0 && !loading && (_jsx("div", { className: "admin-table-empty", children: _jsx("p", { children: "No courses found" }) }))] })] }));
};
export default CourseManager;
