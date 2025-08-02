import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
const EnrollStudents = () => {
    const { courseId } = useParams();
    const [students, setStudents] = useState([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const token = localStorage.getItem("access_token");
    // Fetch all students
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await fetch("/api/students/", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();
                setStudents(data.results || data);
            }
            catch {
                setError("Failed to fetch students.");
            }
        };
        const fetchEnrolledStudents = async () => {
            try {
                const res = await fetch("/api/lecturer/enrollments/", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();
                const courseEnrollments = data.filter((e) => e.course.id === Number(courseId));
                // Removed setEnrolledStudentIds as it's unused
                setSelectedStudentIds(courseEnrollments.map((e) => e.student.id));
            }
            catch {
                setError("Failed to fetch enrollments.");
            }
        };
        if (token && courseId) {
            fetchStudents();
            fetchEnrolledStudents();
        }
    }, [token, courseId]);
    const toggleSelect = (id) => {
        setSelectedStudentIds((prev) => prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]);
    };
    const handleEnroll = async () => {
        setError("");
        setSuccess("");
        if (!courseId || selectedStudentIds.length === 0) {
            setError("Please select at least one student.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/lecturer/enrollments/${courseId}/enroll/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ student_ids: selectedStudentIds }),
            });
            const result = await res.json();
            if (!res.ok) {
                setError(result.error || "Enrollment failed.");
            }
            else {
                setSuccess(result.message || "Students enrolled successfully.");
                // Removed setEnrolledStudentIds as it's unused
            }
        }
        catch {
            setError("Something went wrong. Please try again.");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "p-6 max-w-3xl mx-auto", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Enroll Students to Course" }), error && _jsx("div", { className: "text-red-600 mb-4", children: error }), success && _jsx("div", { className: "text-green-600 mb-4", children: success }), _jsx("ul", { className: "mb-6 space-y-2", children: students.map((student) => (_jsxs("li", { className: "flex items-center gap-2", children: [_jsx("input", { id: `student-checkbox-${student.id}`, type: "checkbox", checked: selectedStudentIds.includes(student.id), onChange: () => toggleSelect(student.id), title: `Select ${student.name} (${student.username})` }), _jsxs("label", { htmlFor: `student-checkbox-${student.id}`, children: [student.name, " (", student.username, ") - ", student.program] })] }, student.id))) }), _jsx("button", { onClick: handleEnroll, disabled: loading, className: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400", children: loading ? "Enrolling..." : "Enroll Selected Students" })] }));
};
export default EnrollStudents;
