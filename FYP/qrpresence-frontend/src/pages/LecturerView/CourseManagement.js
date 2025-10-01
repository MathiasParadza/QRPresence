import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import "../../styles/CourseManagement.css";
const API_BASE_URL = 'http://localhost:8000';
const CourseManagement = () => {
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        code: '',
        description: '',
        credit_hours: '',
    });
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [editingCourseId, setEditingCourseId] = useState(null);
    const navigate = useNavigate();
    const handleApiError = useCallback((err) => {
        if (typeof err === 'object' && err !== null) {
            const errorObj = err;
            if (errorObj.status === 401) {
                setError({ detail: 'Authentication failed. Please login again.', status_code: 401 });
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
    }, []);
    const fetchCourses = useCallback(async (isRefresh = false) => {
        if (isRefresh)
            setRefreshing(true);
        else
            setLoading(true);
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
                throw { status: res.status, ...errorData };
            }
            const data = await res.json();
            setCourses(data);
            if (isRefresh) {
                setSuccess('Courses refreshed successfully');
                setTimeout(() => setSuccess(null), 3000);
            }
        }
        catch (err) {
            handleApiError(err);
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [handleApiError]);
    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        const method = editingCourseId ? 'PUT' : 'POST';
        const url = editingCourseId
            ? `${API_BASE_URL}/api/lecturer/courses/${editingCourseId}`
            : `${API_BASE_URL}/api/lecturer/courses/create/`;
        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    credit_hours: Number(formData.credit_hours),
                }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw { status: res.status, ...errorData };
            }
            const data = await res.json();
            if (editingCourseId) {
                setCourses(prev => prev.map(course => (course.id === data.id ? data : course)));
                setSuccess('Course updated successfully!');
                setEditingCourseId(null);
            }
            else {
                setCourses(prev => [...prev, data]);
                setSuccess('Course created successfully!');
            }
            setFormData({ title: '', code: '', description: '', credit_hours: '' });
            setTimeout(() => setSuccess(null), 5000);
        }
        catch (err) {
            handleApiError(err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleEditCourse = (course) => {
        setFormData({
            title: course.title,
            code: course.code,
            description: course.description,
            credit_hours: course.credit_hours.toString(),
        });
        setEditingCourseId(course.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleDeleteCourse = async (id) => {
        if (!window.confirm("Are you sure you want to delete this course?"))
            return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/lecturer/courses/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Accept': 'application/json',
                },
            });
            if (!res.ok)
                throw new Error('Failed to delete course');
            setCourses(prev => prev.filter(course => course.id !== id));
            setSuccess('Course deleted successfully!');
            setTimeout(() => setSuccess(null), 3000);
        }
        catch {
            setError({ detail: 'Error deleting course' });
        }
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
    return (_jsxs("div", { className: "course-management-container", children: [_jsxs("div", { className: "course-management-header", children: [_jsx("h1", { className: "course-management-title", children: "Course Management" }), _jsx("p", { className: "course-management-subtitle", children: "Create and manage your courses" }), _jsx("button", { onClick: () => navigate("/dashboard"), className: "course-manager-back-btn", children: "\u2190 Back to Dashboard" })] }), error && (_jsxs("div", { className: "course-alert course-alert-error", children: [_jsx("div", { className: "course-alert-icon", children: _jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }), _jsxs("div", { className: "course-alert-content", children: [_jsx("strong", { children: "Error:" }), " ", formatError(error), " ", error.status_code && `(Status: ${error.status_code})`] })] })), success && (_jsxs("div", { className: "course-alert course-alert-success", children: [_jsx("div", { className: "course-alert-icon", children: _jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }), _jsx("div", { className: "course-alert-content", children: success })] })), _jsxs("div", { className: "course-form-container", children: [_jsx("div", { className: "course-form-header", children: _jsx("h2", { className: "course-form-title", children: editingCourseId ? 'Update Course' : 'Create New Course' }) }), _jsx("div", { className: "course-form-content", children: _jsxs("form", { onSubmit: handleSubmit, className: "course-form-fields", children: [_jsxs("div", { className: "course-form-row", children: [_jsxs("div", { className: "course-form-field", children: [_jsx("label", { className: "course-form-label", children: "Course Title" }), _jsx("input", { name: "title", value: formData.title, onChange: handleChange, className: "course-form-input", required: true, placeholder: "Enter course name" })] }), _jsxs("div", { className: "course-form-field", children: [_jsx("label", { className: "course-form-label", children: "Course Code" }), _jsx("input", { name: "code", value: formData.code, onChange: handleChange, className: "course-form-input", required: true, placeholder: "Enter course code (e.g., CS101)" })] })] }), _jsxs("div", { className: "course-form-field", children: [_jsx("label", { className: "course-form-label", children: "Description" }), _jsx("textarea", { name: "description", value: formData.description, onChange: handleChange, className: "course-form-textarea", required: true, placeholder: "Enter course description", rows: 4 })] }), _jsx("div", { className: "course-form-row", children: _jsxs("div", { className: "course-form-field", children: [_jsx("label", { className: "course-form-label", children: "Credit Hours" }), _jsx("input", { name: "credit_hours", type: "number", min: 1, max: 10, value: formData.credit_hours, onChange: handleChange, className: "course-form-input", required: true, placeholder: "Enter credit hours" })] }) }), _jsx("div", { className: "course-form-buttons", children: _jsxs("button", { type: "submit", disabled: loading, className: "course-form-submit", children: [loading && _jsx("span", { className: "course-form-loading-spinner" }), editingCourseId ? 'Update Course' : 'Create Course'] }) })] }) })] }), _jsxs("div", { className: "course-list-container", children: [_jsxs("div", { className: "course-list-header", children: [_jsx("h2", { className: "course-list-title", children: "Your Courses" }), _jsx("button", { onClick: () => fetchCourses(true), className: "course-list-refresh", disabled: refreshing, children: refreshing ? 'Refreshing...' : 'Refresh List' })] }), _jsx("div", { className: "course-list-content", children: loading && courses.length === 0 ? (_jsxs("div", { className: "course-list-loading", children: [_jsx("div", { className: "course-list-loading-spinner" }), _jsx("p", { className: "course-list-loading-text", children: "Loading courses..." })] })) : courses.length === 0 ? (_jsxs("div", { className: "course-list-empty", children: [_jsx("div", { className: "course-list-empty-icon", children: "\uD83D\uDCDA" }), _jsx("h3", { className: "course-list-empty-title", children: "No Courses Found" }), _jsx("p", { className: "course-list-empty-subtitle", children: "Create a course to get started" })] })) : (_jsx("div", { className: "course-list-items", children: courses.map(course => (_jsx("div", { className: "course-item", children: _jsxs("div", { className: "course-item-content", children: [_jsxs("div", { className: "course-item-header", children: [_jsxs("div", { className: "course-item-info", children: [_jsx("h3", { className: "course-item-title", children: course.title }), _jsx("div", { className: "course-item-code", children: course.code }), _jsx("p", { className: "course-item-description", children: course.description })] }), _jsx("div", { className: "course-item-credits", children: _jsxs("span", { className: "course-credits-badge", children: [course.credit_hours, " credit", course.credit_hours !== 1 ? 's' : ''] }) })] }), _jsxs("div", { className: "course-item-actions", children: [_jsx("button", { className: "course-item-button course-item-edit", onClick: () => handleEditCourse(course), children: "Edit" }), _jsx("button", { className: "course-item-button course-item-delete", onClick: () => handleDeleteCourse(course.id), children: "Delete" })] })] }) }, course.id))) })) })] })] }));
};
export default CourseManagement;
