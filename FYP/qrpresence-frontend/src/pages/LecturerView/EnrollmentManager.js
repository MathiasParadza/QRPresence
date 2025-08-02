import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
export const EnrollmentManager = ({ course, students, enrollments = [], onEnroll, isLoading = false, selectedStudents, onSelectStudents, error }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const loading = isLoading || isProcessing;
    const handleEnroll = async () => {
        if (selectedStudents.length === 0)
            return;
        try {
            setIsProcessing(true);
            await onEnroll(selectedStudents);
            onSelectStudents([]);
        }
        catch (err) {
            console.error('Enrollment failed:', err);
        }
        finally {
            setIsProcessing(false);
        }
    };
    const handleSelectionChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => Number(option.value));
        onSelectStudents(selectedOptions);
    };
    return (_jsxs("div", { className: "bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6", role: "region", "aria-label": "Student enrollment management", children: [_jsx("div", { className: "flex justify-between items-center mb-4", children: _jsxs("h2", { className: "text-lg font-semibold text-purple-800", id: "enrollment-heading", children: ["Enroll Students in ", course.title] }) }), _jsxs("div", { className: "space-y-4", "aria-labelledby": "enrollment-heading", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "student-select", className: "block text-sm font-medium text-gray-700 mb-1", children: "Select Students" }), _jsx("select", { id: "student-select", multiple: true, value: selectedStudents.map(String), onChange: handleSelectionChange, className: "w-full border border-gray-300 rounded-lg p-2 h-40 disabled:opacity-50 disabled:cursor-not-allowed", "aria-describedby": "student-select-help", "aria-multiselectable": "true", disabled: loading, children: students.map(student => (_jsxs("option", { value: student.id, "aria-label": `${student.name}, ${student.program}`, disabled: enrollments.some(e => e.student.id === student.id), className: "disabled:opacity-50", children: [student.student_id, " - ", student.name, " (", student.program, ")", enrollments.some(e => e.student.id === student.id) && ' (Already enrolled)'] }, student.id))) }), _jsx("p", { id: "student-select-help", className: "text-sm text-gray-500 mt-1", children: "Hold Ctrl/Cmd to select multiple students" })] }), enrollments.length > 0 && (_jsxs("section", { "aria-labelledby": "enrolled-students-heading", children: [_jsxs("h3", { id: "enrolled-students-heading", className: "font-medium text-gray-700 mb-2", children: ["Currently Enrolled (", enrollments.length, ")"] }), _jsx("ul", { className: "space-y-1", children: enrollments.map(enrollment => (_jsxs("li", { className: "text-sm text-gray-600", children: [enrollment.student.name, " (", enrollment.student.student_id, ")"] }, enrollment.id))) })] })), error && (_jsx("div", { role: "alert", className: "text-red-500 text-sm mt-2 p-2 bg-red-50 rounded", children: error })), _jsxs("div", { className: "relative", children: [_jsx("button", { type: "button", onClick: handleEnroll, disabled: selectedStudents.length === 0 || loading, className: `w-full ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed`, children: loading ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), _jsx("span", { children: "Processing..." })] })) : (`Enroll ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`) }), loading && (_jsx("span", { className: "sr-only", children: "Processing enrollment request" }))] })] })] }));
};
