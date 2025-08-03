import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/BulkEnrollmentManager.css";

// Constants
const API_BASE_URL = 'http://localhost:8000';

interface Student {
  id: number;
  name: string;
  username: string;
  program: string;
  email?: string;
}

interface Course {
  id: number;
  code: string;
  name: string;
}

interface Pagination {
  current: number;
  total: number;
  pageSize: number;
}

interface BulkEnrollment {
  courseId: number;
  studentIds: number[];
}

const BulkEnrollmentManager = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<number | 'global', string>>({} as Record<number | 'global', string>);
  const [successes, setSuccesses] = useState<Record<number | 'global', string>>({} as Record<number | 'global', string>);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    total: 0,
    pageSize: 10,
  });
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const token = localStorage.getItem("access_token");

  // Fetch all students with pagination
  const fetchStudents = useCallback(async (page: number = 1) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/students/?page=${page}&page_size=${pagination.pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      setStudents(data.results || data);
      setFilteredStudents(data.results || data);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: data.count || data.length,
      }));
    } catch {
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
      const initialSelections = (data.results || data).reduce((acc: Record<number, number[]>, course: Course) => {
        acc[course.id] = [];
        return acc;
      }, {});
      setSelectedStudents(initialSelections);
    } catch {
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
    const filtered = students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  // Toggle student selection for a specific course
  const toggleSelect = (courseId: number, studentId: number) => {
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
    setErrors({} as Record<number | 'global', string>);
    setSuccesses({} as Record<number | 'global', string>);

    // Prepare enrollment data
    const enrollments: BulkEnrollment[] = Object.entries(selectedStudents)
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
      if (!res.ok) throw data;

      // Process results
      const newSuccesses: Record<number, string> = {};
      const newErrors: Record<number, string> = {};

      interface EnrollmentResult {
        course_id: number;
        enrolled_count: number;
        skipped_count?: number;
        error?: string;
      }
      data.results.forEach((result: EnrollmentResult) => {
        if (result.error) {
          newErrors[result.course_id] = result.error;
        } else {
          newSuccesses[result.course_id] = 
            `Enrolled ${result.enrolled_count} students` +
            (result.skipped_count ? ` (${result.skipped_count} already enrolled)` : '');
        }
      });

      setSuccesses({ ...newSuccesses, global: "" });
      setErrors({ ...newErrors, global: "" });

      // Refresh data
      fetchStudents();
    } catch {
      setErrors(prev => ({
        ...prev,
        global: "Bulk enrollment failed. Please try again."
      }));
    } finally {
      setLoading(false);
    }
  };

  // Delete student
  const handleDelete = async (studentId: number) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;

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
    } catch {
      setErrors(prev => ({ ...prev, global: "Failed to delete student" }));
      setStudents(previousStudents); // Rollback
    }
  };

  // Update student
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    // Optimistic update
    const previousStudents = [...students];
    setStudents(
      students.map((s) =>
        s.id === editingStudent.id ? { ...s, ...editingStudent } : s
      )
    );

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
    } catch {
      setErrors(prev => ({ ...prev, global: "Failed to update student" }));
      setStudents(previousStudents); // Rollback
    }
  };

  return (
    <div className="bulk-enrollment-container">
      {/* Header with Back Button */}
      <div className="bulk-enrollment-header">
        <h2 className="bulk-enrollment-title">Enrollment Manager</h2>
        <button
          onClick={() => navigate("/dashboard")}
          className="bulk-enrollment-back-btn"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bulk-enrollment-search-section">
        <div className="bulk-enrollment-search-controls">
          <input
            type="text"
            placeholder="Search by name, username, or program..."
            className="bulk-enrollment-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={() => fetchStudents(1)}
            className="bulk-enrollment-refresh-btn"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {errors.global && (
        <div className="bulk-enrollment-alert bulk-enrollment-alert-error">
          {errors.global}
        </div>
      )}
      {successes.global && (
        <div className="bulk-enrollment-alert bulk-enrollment-alert-success">
          {successes.global}
        </div>
      )}

      {/* Edit Modal */}
      {editingStudent && (
        <div className="bulk-enrollment-modal-overlay">
          <div className="bulk-enrollment-modal">
            <h3 className="bulk-enrollment-modal-title">Edit Student</h3>
            <form onSubmit={handleUpdate} className="bulk-enrollment-modal-form">
              <div className="bulk-enrollment-modal-field">
                <label className="bulk-enrollment-modal-label">Name</label>
                <input
                  type="text"
                  className="bulk-enrollment-modal-input"
                  title="Name"
                  value={editingStudent.name}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="bulk-enrollment-modal-field">
                <label className="bulk-enrollment-modal-label">Username</label>
                <input
                  type="text"
                  className="bulk-enrollment-modal-input"
                  title="Username"
                  value={editingStudent.username}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      username: e.target.value,
                    })
                  }
                />
              </div>
              <div className="bulk-enrollment-modal-field">
                <label className="bulk-enrollment-modal-label">Program</label>
                <input
                  type="text"
                  className="bulk-enrollment-modal-input"
                  title="Program"
                  value={editingStudent.program}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      program: e.target.value,
                    })
                  }
                />
              </div>
              <div className="bulk-enrollment-modal-buttons">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="bulk-enrollment-modal-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bulk-enrollment-modal-save"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Courses Selection Header */}
      <div className="bulk-enrollment-courses-section">
        <h3 className="bulk-enrollment-courses-title">Available Courses</h3>
        <div className="bulk-enrollment-courses-list">
          {courses.map(course => (
            <div key={course.id} className="bulk-enrollment-course-badge">
              {course.code} - {course.name}
            </div>
          ))}
        </div>
      </div>

      {/* Students List */}
      <div className="bulk-enrollment-table-container">
        <table className="bulk-enrollment-table">
          <thead className="bulk-enrollment-table-header">
            <tr>
              <th>Student</th>
              {courses.map(course => (
                <th key={course.id} className="center">
                  {course.code}
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="bulk-enrollment-table-body">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student.id} className="bulk-enrollment-table-row">
                  <td className="bulk-enrollment-table-cell">
                    <div className="bulk-enrollment-student-name">{student.name}</div>
                    <div className="bulk-enrollment-student-details">{student.username} - {student.program}</div>
                  </td>
                  {courses.map(course => (
                    <td key={course.id} className="bulk-enrollment-table-cell center">
                      <input
                        type="checkbox"
                        checked={selectedStudents[course.id]?.includes(student.id) || false}
                        onChange={() => toggleSelect(course.id, student.id)}
                        className="bulk-enrollment-checkbox"
                        title={`Enroll in ${course.code}`}
                      />
                    </td>
                  ))}
                  <td className="bulk-enrollment-table-cell">
                    <button
                      onClick={() => setEditingStudent(student)}
                      className="bulk-enrollment-action-btn"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="bulk-enrollment-action-btn delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={courses.length + 2} className="bulk-enrollment-no-data">
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Course-specific status messages */}
      {courses.map(course => (
        <div key={course.id}>
          {errors[course.id] && (
            <div className="bulk-enrollment-alert bulk-enrollment-alert-error bulk-enrollment-alert-small">
              <strong>{course.code}:</strong> {errors[course.id]}
            </div>
          )}
          {successes[course.id] && (
            <div className="bulk-enrollment-alert bulk-enrollment-alert-success bulk-enrollment-alert-small">
              <strong>{course.code}:</strong> {successes[course.id]}
            </div>
          )}
        </div>
      ))}

      {/* Pagination */}
      <div className="bulk-enrollment-pagination">
        <div className="bulk-enrollment-pagination-info">
          Showing {(pagination.current - 1) * pagination.pageSize + 1} to{" "}
          {Math.min(
            pagination.current * pagination.pageSize,
            pagination.total
          )}{" "}
          of {pagination.total} students
        </div>
        <div className="bulk-enrollment-pagination-controls">
          <button
            onClick={() => fetchStudents(pagination.current - 1)}
            disabled={pagination.current === 1}
            className="bulk-enrollment-pagination-btn"
          >
            Previous
          </button>
          <button
            onClick={() => fetchStudents(pagination.current + 1)}
            disabled={
              pagination.current * pagination.pageSize >= pagination.total
            }
            className="bulk-enrollment-pagination-btn"
          >
            Next
          </button>
        </div>
      </div>

      {/* Bulk Enroll Button */}
      <div className="bulk-enrollment-action-section">
        <button
          onClick={handleBulkEnroll}
          disabled={loading || Object.values(selectedStudents).every(arr => arr.length === 0)}
          className="bulk-enrollment-submit-btn"
        >
          {loading && <div className="bulk-enrollment-loading-spinner"></div>}
          {loading ? "Processing..." : "Enroll Selected Students"}
        </button>
      </div>
    </div>
  );
};

export default BulkEnrollmentManager;