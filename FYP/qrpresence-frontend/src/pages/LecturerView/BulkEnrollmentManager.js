import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/BulkEnrollmentManager.css";
// Constants
const API_BASE_URL = 'http://localhost:8000';
const BulkEnrollmentManager = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState({});
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [successes, setSuccesses] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({
        current: 1,
        total: 0,
        pageSize: 10,
    });
    const [editingStudent, setEditingStudent] = useState(null);
    const token = localStorage.getItem("access_token");
    // Fetch all students with pagination
    const fetchStudents = useCallback(async (page = 1) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/students/?page=${page}&page_size=${pagination.pageSize}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            setStudents(data.results || data);
            setFilteredStudents(data.results || data);
            setPagination(prev => ({
                ...prev,
                current: page,
                total: data.count || data.length,
            }));
        }
        catch {
            setErrors(prev => ({ ...prev, global: "Failed to fetch students." }));
        }
    }, [pagination.pageSize, token]);
    // Fetch all courses for the lecturer
    const fetchCourses = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/lecturer/courses/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            setCourses(data.results || data);
            // Initialize empty selections for each course
            const initialSelections = (data.results || data).reduce((acc, course) => {
                acc[course.id] = [];
                return acc;
            }, {});
            setSelectedStudents(initialSelections);
        }
        catch {
            setErrors(prev => ({ ...prev, global: "Failed to fetch courses." }));
        }
    }, [token]);
    // Initial data loading
    useEffect(() => {
        if (token) {
            fetchStudents();
            fetchCourses();
        }
    }, [token, fetchStudents, fetchCourses]);
    // Filter students based on search term
    useEffect(() => {
        const filtered = students.filter((student) => student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.username.toLowerCase().includes(searchTerm.toLowerCase()));
        setFilteredStudents(filtered);
    }, [searchTerm, students]);
    // Toggle student selection for a specific course
    const toggleSelect = (courseId, studentId) => {
        setSelectedStudents(prev => {
            const currentSelections = prev[courseId] || [];
            return {
                ...prev,
                [courseId]: currentSelections.includes(studentId)
                    ? currentSelections.filter(id => id !== studentId)
                    : [...currentSelections, studentId]
            };
        });
    };
    // Handle bulk enrollment
    const handleBulkEnroll = async () => {
        setLoading(true);
        setErrors({});
        setSuccesses({});
        // Prepare enrollment data
        const enrollments = Object.entries(selectedStudents)
            .filter(([, studentIds]) => studentIds.length > 0)
            .map(([courseId, studentIds]) => ({
            courseId: Number(courseId),
            studentIds
        }));
        if (enrollments.length === 0) {
            setErrors(prev => ({ ...prev, global: "Please select at least one student for at least one course." }));
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/api/lecturer/enrollments/bulk/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(enrollments),
            });
            const data = await res.json();
            if (!res.ok)
                throw data;
            // Process results
            const newSuccesses = {};
            const newErrors = {};
            data.results.forEach((result) => {
                if (result.error) {
                    newErrors[result.course_id] = result.error;
                }
                else {
                    newSuccesses[result.course_id] =
                        `Enrolled ${result.enrolled_count} students` +
                            (result.skipped_count ? ` (${result.skipped_count} already enrolled)` : '');
                }
            });
            setSuccesses({ ...newSuccesses, global: "" });
            setErrors({ ...newErrors, global: "" });
            // Refresh data
            fetchStudents();
        }
        catch {
            setErrors(prev => ({
                ...prev,
                global: "Bulk enrollment failed. Please try again."
            }));
        }
        finally {
            setLoading(false);
        }
    };
    // Delete student
    const handleDelete = async (studentId) => {
        if (!window.confirm("Are you sure you want to delete this student?"))
            return;
        // Optimistic update
        const previousStudents = [...students];
        setStudents(students.filter((s) => s.id !== studentId));
        try {
            const res = await fetch(`${API_BASE_URL}/api/students/${studentId}/`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                throw new Error("Failed to delete student");
            }
            setSuccesses(prev => ({ ...prev, global: "Student deleted successfully!" }));
            fetchStudents(pagination.current); // Refresh data
        }
        catch {
            setErrors(prev => ({ ...prev, global: "Failed to delete student" }));
            setStudents(previousStudents); // Rollback
        }
    };
    // Update student
    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingStudent)
            return;
        // Optimistic update
        const previousStudents = [...students];
        setStudents(students.map((s) => s.id === editingStudent.id ? { ...s, ...editingStudent } : s));
        try {
            const res = await fetch(`${API_BASE_URL}/api/students/${editingStudent.id}/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editingStudent),
            });
            if (!res.ok) {
                throw new Error("Failed to update student");
            }
            setSuccesses(prev => ({ ...prev, global: "Student updated successfully!" }));
            setEditingStudent(null);
        }
        catch {
            setErrors(prev => ({ ...prev, global: "Failed to update student" }));
            setStudents(previousStudents); // Rollback
        }
    };
    return (_jsxs("div", { className: "bulk-enrollment-container", children: [_jsxs("div", { className: "bulk-enrollment-header", children: [_jsx("h2", { className: "bulk-enrollment-title", children: "Enrollment Manager" }), _jsx("button", { onClick: () => navigate("/dashboard"), className: "bulk-enrollment-back-btn", children: "\u2190 Back to Dashboard" })] }), _jsx("div", { className: "bulk-enrollment-search-section", children: _jsxs("div", { className: "bulk-enrollment-search-controls", children: [_jsx("input", { type: "text", placeholder: "Search by name, username, or program...", className: "bulk-enrollment-search-input", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) }), _jsx("button", { onClick: () => fetchStudents(1), className: "bulk-enrollment-refresh-btn", children: "Refresh" })] }) }), errors.global && (_jsx("div", { className: "bulk-enrollment-alert bulk-enrollment-alert-error", children: errors.global })), successes.global && (_jsx("div", { className: "bulk-enrollment-alert bulk-enrollment-alert-success", children: successes.global })), editingStudent && (_jsx("div", { className: "bulk-enrollment-modal-overlay", children: _jsxs("div", { className: "bulk-enrollment-modal", children: [_jsx("h3", { className: "bulk-enrollment-modal-title", children: "Edit Student" }), _jsxs("form", { onSubmit: handleUpdate, className: "bulk-enrollment-modal-form", children: [_jsxs("div", { className: "bulk-enrollment-modal-field", children: [_jsx("label", { className: "bulk-enrollment-modal-label", children: "Name" }), _jsx("input", { type: "text", className: "bulk-enrollment-modal-input", title: "Name", value: editingStudent.name, onChange: (e) => setEditingStudent({
                                                ...editingStudent,
                                                name: e.target.value,
                                            }) })] }), _jsxs("div", { className: "bulk-enrollment-modal-field", children: [_jsx("label", { className: "bulk-enrollment-modal-label", children: "Username" }), _jsx("input", { type: "text", className: "bulk-enrollment-modal-input", title: "Username", value: editingStudent.username, onChange: (e) => setEditingStudent({
                                                ...editingStudent,
                                                username: e.target.value,
                                            }) })] }), _jsxs("div", { className: "bulk-enrollment-modal-field", children: [_jsx("label", { className: "bulk-enrollment-modal-label", children: "Program" }), _jsx("input", { type: "text", className: "bulk-enrollment-modal-input", title: "Program", value: editingStudent.program, onChange: (e) => setEditingStudent({
                                                ...editingStudent,
                                                program: e.target.value,
                                            }) })] }), _jsxs("div", { className: "bulk-enrollment-modal-buttons", children: [_jsx("button", { type: "button", onClick: () => setEditingStudent(null), className: "bulk-enrollment-modal-cancel", children: "Cancel" }), _jsx("button", { type: "submit", className: "bulk-enrollment-modal-save", children: "Save" })] })] })] }) })), _jsxs("div", { className: "bulk-enrollment-courses-section", children: [_jsx("h3", { className: "bulk-enrollment-courses-title", children: "Available Courses" }), _jsx("div", { className: "bulk-enrollment-courses-list", children: courses.map(course => (_jsxs("div", { className: "bulk-enrollment-course-badge", children: [course.code, " - ", course.name] }, course.id))) })] }), _jsx("div", { className: "bulk-enrollment-table-container", children: _jsxs("table", { className: "bulk-enrollment-table", children: [_jsx("thead", { className: "bulk-enrollment-table-header", children: _jsxs("tr", { children: [_jsx("th", { children: "Student" }), courses.map(course => (_jsx("th", { className: "center", children: course.code }, course.id))), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { className: "bulk-enrollment-table-body", children: filteredStudents.length > 0 ? (filteredStudents.map((student) => (_jsxs("tr", { className: "bulk-enrollment-table-row", children: [_jsxs("td", { className: "bulk-enrollment-table-cell", children: [_jsx("div", { className: "bulk-enrollment-student-name", children: student.name }), _jsxs("div", { className: "bulk-enrollment-student-details", children: [student.username, " - ", student.program] })] }), courses.map(course => (_jsx("td", { className: "bulk-enrollment-table-cell center", children: _jsx("input", { type: "checkbox", checked: selectedStudents[course.id]?.includes(student.id) || false, onChange: () => toggleSelect(course.id, student.id), className: "bulk-enrollment-checkbox", title: `Enroll in ${course.code}` }) }, course.id))), _jsxs("td", { className: "bulk-enrollment-table-cell", children: [_jsx("button", { onClick: () => setEditingStudent(student), className: "bulk-enrollment-action-btn", children: "Edit" }), _jsx("button", { onClick: () => handleDelete(student.id), className: "bulk-enrollment-action-btn delete", children: "Delete" })] })] }, student.id)))) : (_jsx("tr", { children: _jsx("td", { colSpan: courses.length + 2, className: "bulk-enrollment-no-data", children: "No students found" }) })) })] }) }), courses.map(course => (_jsxs("div", { children: [errors[course.id] && (_jsxs("div", { className: "bulk-enrollment-alert bulk-enrollment-alert-error bulk-enrollment-alert-small", children: [_jsxs("strong", { children: [course.code, ":"] }), " ", errors[course.id]] })), successes[course.id] && (_jsxs("div", { className: "bulk-enrollment-alert bulk-enrollment-alert-success bulk-enrollment-alert-small", children: [_jsxs("strong", { children: [course.code, ":"] }), " ", successes[course.id]] }))] }, course.id))), _jsxs("div", { className: "bulk-enrollment-pagination", children: [_jsxs("div", { className: "bulk-enrollment-pagination-info", children: ["Showing ", (pagination.current - 1) * pagination.pageSize + 1, " to", " ", Math.min(pagination.current * pagination.pageSize, pagination.total), " ", "of ", pagination.total, " students"] }), _jsxs("div", { className: "bulk-enrollment-pagination-controls", children: [_jsx("button", { onClick: () => fetchStudents(pagination.current - 1), disabled: pagination.current === 1, className: "bulk-enrollment-pagination-btn", children: "Previous" }), _jsx("button", { onClick: () => fetchStudents(pagination.current + 1), disabled: pagination.current * pagination.pageSize >= pagination.total, className: "bulk-enrollment-pagination-btn", children: "Next" })] })] }), _jsx("div", { className: "bulk-enrollment-action-section", children: _jsxs("button", { onClick: handleBulkEnroll, disabled: loading || Object.values(selectedStudents).every(arr => arr.length === 0), className: "bulk-enrollment-submit-btn", children: [loading && _jsx("div", { className: "bulk-enrollment-loading-spinner" }), loading ? "Processing..." : "Enroll Selected Students"] }) })] }));
};
export default BulkEnrollmentManager;
