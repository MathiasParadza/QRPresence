import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
export const EnrollmentManager = ({ course, students, enrollments = [], onEnroll, isLoading = false, error }) => {
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isLocalLoading, setLocalLoading] = useState(false);
    const loading = isLoading || isLocalLoading;
    const handleEnroll = async () => {
        try {
            setLocalLoading(true);
            await onEnroll(selectedStudents);
            setSelectedStudents([]);
        }
        catch (err) {
            console.error('Enrollment failed:', err);
        }
        finally {
            setLocalLoading(false);
        }
    };
    const handleSelectionChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => Number(option.value));
        setSelectedStudents(selectedOptions);
    };
    return (_jsxs("div", { className: "bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6", role: "region", "aria-label": "Student enrollment", children: [_jsx("div", { className: "flex justify-between items-center mb-4", children: _jsxs("h2", { className: "text-lg font-semibold text-purple-800", id: "enrollment-heading", children: ["Enroll Students in ", course.title] }) }), _jsxs("div", { className: "space-y-4", "aria-labelledby": "enrollment-heading", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "student-select", className: "block text-sm font-medium text-gray-700 mb-1", children: "Select Students" }), _jsx("select", { id: "student-select", multiple: true, value: selectedStudents.map(String), onChange: handleSelectionChange, className: "w-full border border-gray-300 rounded-lg p-2 h-40", "aria-describedby": "student-select-help", "aria-multiselectable": "true", children: students.map(student => (_jsxs("option", { value: student.id, "aria-label": `${student.name}, ${student.program}`, children: [student.student_id, " - ", student.name, " (", student.program, ")"] }, student.id))) }), _jsx("p", { id: "student-select-help", className: "text-sm text-gray-500 mt-1", children: "Hold Ctrl/Cmd to select multiple students" })] }), enrollments.length > 0 && (_jsxs("section", { "aria-labelledby": "enrolled-students-heading", children: [_jsx("h3", { id: "enrolled-students-heading", className: "font-medium text-gray-700 mb-2", children: "Currently Enrolled" }), _jsx("ul", { className: "space-y-1", children: enrollments.map(enrollment => (_jsxs("li", { className: "text-sm text-gray-600", children: [enrollment.student.name, " (", enrollment.student.student_id, ")"] }, enrollment.id))) })] })), error && (_jsx("div", { role: "alert", className: "text-red-500 text-sm mt-2", children: error })), _jsxs("div", { className: "relative", children: [_jsx("button", { type: "button", onClick: handleEnroll, disabled: selectedStudents.length === 0 || loading, className: `w-full ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded-lg font-medium transition-colors`, children: `Enroll ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}` }), loading && (_jsx("span", { className: "sr-only", "aria-live": "polite", children: "Processing enrollment" }))] })] })] }));
};
