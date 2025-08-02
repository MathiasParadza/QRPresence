import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
const CourseManagement = () => {
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        code: '',
        description: '',
        credit_hours: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/lecturer/courses/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
            });
            const data = await res.json();
            if (res.ok)
                setCourses(data);
            else
                throw new Error(data.error || 'Failed to fetch courses');
        }
        catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            }
            else {
                setError('An unexpected error occurred');
            }
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchCourses();
    }, []);
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/lecturer/courses/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: JSON.stringify({
                    ...formData,
                    credit_hours: Number(formData.credit_hours),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setCourses(prev => [...prev, data]);
                setFormData({ title: '', code: '', description: '', credit_hours: '' });
            }
            else {
                throw new Error(data.error || 'Failed to create course');
            }
        }
        catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            }
            else {
                setError('An unexpected error occurred');
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "max-w-4xl mx-auto p-6", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Course Management" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4 mb-8 bg-white shadow p-4 rounded", children: [_jsxs("div", { children: [_jsx("label", { className: "block font-medium", children: "Title" }), _jsx("input", { name: "title", value: formData.title, onChange: handleChange, className: "w-full p-2 border rounded", required: true, placeholder: "Enter course name", title: "Course name" })] }), _jsxs("div", { children: [_jsx("label", { className: "block font-medium", children: "Code" }), _jsx("input", { name: "code", value: formData.code, onChange: handleChange, className: "w-full p-2 border rounded", required: true, title: "Course code", placeholder: "Enter course code" })] }), _jsxs("div", { children: [_jsx("label", { className: "block font-medium", children: "Description" }), _jsx("textarea", { name: "description", value: formData.description, onChange: handleChange, className: "w-full p-2 border rounded", required: true, title: "Course description", placeholder: "Enter course description" })] }), _jsxs("div", { children: [_jsx("label", { className: "block font-medium", children: "Credit Hours" }), _jsx("input", { name: "credit_hours", type: "number", min: 1, value: formData.credit_hours, onChange: handleChange, className: "w-full p-2 border rounded", required: true, title: "Credit hours", placeholder: "Enter credit hours" })] }), _jsx("button", { type: "submit", disabled: loading, className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded", children: loading ? 'Creating...' : 'Add Course' }), error && _jsx("p", { className: "text-red-500 mt-2", children: error })] }), _jsx("h2", { className: "text-xl font-semibold mb-3", children: "Your Courses" }), _jsxs("div", { className: "space-y-4", children: [courses.length === 0 && _jsx("p", { children: "No courses found." }), courses.map(course => (_jsxs("div", { className: "border p-4 rounded shadow-sm bg-gray-50", children: [_jsxs("h3", { className: "text-lg font-bold", children: [course.title, " (", course.code, ")"] }), _jsx("p", { children: course.description }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Credit Hours: ", course.credit_hours] })] }, course.id)))] })] }));
};
export default CourseManagement;
