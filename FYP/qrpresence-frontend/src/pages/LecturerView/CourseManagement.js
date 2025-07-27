import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export const CourseManagement = ({ courses, onCreateCourse, onSelectCourse, isLoading = false }) => {
    const [showModal, setShowModal] = useState(false);
    const [courseForm, setCourseForm] = useState({
        code: '',
        title: '',
        description: '',
        credit_hours: 3
    });
    const [error, setError] = useState(null);
    // Add this validation function
    const validateCourseCode = (code) => {
        // Example: Course codes should be like "CS101" - letters followed by numbers
        return /^[A-Za-z]{2,4}\d{3,4}$/.test(code);
    };
    const handleCreate = async () => {
        // Trim all inputs
        const trimmedData = {
            code: courseForm.code.trim(),
            title: courseForm.title.trim(),
            description: courseForm.description.trim(),
            credit_hours: courseForm.credit_hours
        };
        // Validation checks
        if (!trimmedData.code || !trimmedData.title) {
            setError('Course code and title are required');
            return;
        }
        if (!validateCourseCode(trimmedData.code)) {
            setError('Course code must be in format like "CS101" (2-4 letters followed by 3-4 numbers)');
            return;
        }
        if (trimmedData.credit_hours < 1 || trimmedData.credit_hours > 6) {
            setError('Credit hours must be between 1 and 6');
            return;
        }
        try {
            setError(null);
            await onCreateCourse(trimmedData);
            setShowModal(false);
            setCourseForm({
                code: '',
                title: '',
                description: '',
                credit_hours: 3
            });
        }
        catch (err) {
            // Error message will come from handleCreateCourse
            console.error('Creation error:', err);
        }
    };
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setCourseForm(prev => ({
            ...prev,
            [name]: name === 'credit_hours' ? Number(value) : value
        }));
    };
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "bg-white border border-gray-200 rounded-xl p-6 shadow-sm", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h1", { className: "text-xl font-semibold text-purple-800", children: "Your Courses" }), _jsx("button", { onClick: () => setShowModal(true), className: "bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors", "aria-label": "Create new course", children: "+ Create Course" })] }), isLoading ? (_jsx("div", { className: "text-center py-8", children: "Loading courses..." })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: courses.map(course => (_jsxs("article", { className: "border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow", children: [_jsxs("h2", { className: "font-bold text-lg", children: [course.code, " - ", course.title] }), _jsxs("p", { className: "text-gray-600 text-sm mt-1", children: [course.credit_hours, " credit hours"] }), _jsx("p", { className: "text-gray-500 text-sm mt-2 line-clamp-2", children: course.description }), _jsx("button", { onClick: () => onSelectCourse(course.id), className: "mt-3 w-full bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 rounded text-sm transition-colors", "aria-label": `Manage students for ${course.code}`, children: "Manage Students" })] }, course.id))) }))] }), showModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title", children: _jsxs("div", { className: "bg-white rounded-xl p-6 w-full max-w-md", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { id: "modal-title", className: "text-lg font-semibold", children: "Create New Course" }), _jsx("button", { onClick: () => setShowModal(false), className: "text-gray-500 hover:text-gray-700", "aria-label": "Close modal", children: "\u00D7" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "course-code", className: "block text-sm font-medium text-gray-700 mb-1", children: "Course Code*" }), _jsx("input", { id: "course-code", type: "text", name: "code", placeholder: "CS101", className: "w-full border border-gray-300 rounded-lg px-3 py-2", value: courseForm.code, onChange: handleFormChange, required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "course-title", className: "block text-sm font-medium text-gray-700 mb-1", children: "Course Title*" }), _jsx("input", { id: "course-title", type: "text", name: "title", placeholder: "Introduction to Computer Science", className: "w-full border border-gray-300 rounded-lg px-3 py-2", value: courseForm.title, onChange: handleFormChange, required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "course-description", className: "block text-sm font-medium text-gray-700 mb-1", children: "Description" }), _jsx("textarea", { id: "course-description", name: "description", placeholder: "Course description", className: "w-full border border-gray-300 rounded-lg px-3 py-2", rows: 3, value: courseForm.description, onChange: handleFormChange })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "credit-hours", className: "block text-sm font-medium text-gray-700 mb-1", children: "Credit Hours" }), _jsx("input", { id: "credit-hours", type: "number", name: "credit_hours", min: "1", max: "6", className: "w-full border border-gray-300 rounded-lg px-3 py-2", value: courseForm.credit_hours, onChange: handleFormChange })] }), error && (_jsx("p", { className: "text-red-500 text-sm", children: error }))] }), _jsxs("div", { className: "flex justify-end space-x-2 mt-6", children: [_jsx("button", { onClick: () => setShowModal(false), className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors", children: "Cancel" }), _jsx("button", { onClick: handleCreate, disabled: isLoading || !courseForm.code || !courseForm.title, className: "px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300", children: isLoading ? 'Creating...' : 'Create Course' })] })] }) }))] }));
};
