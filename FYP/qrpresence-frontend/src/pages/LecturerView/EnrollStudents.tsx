import { useEffect, useState } from "react";
import {  useParams } from "react-router-dom";

interface Student {
  id: number;
  name: string;
  username: string;
  program: string;
}

const EnrollStudents = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
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
      } catch {
        setError("Failed to fetch students.");
      }
    };

    interface Enrollment {
      course: { id: number };
      student: { id: number };
    }

    const fetchEnrolledStudents = async () => {
      try {
        const res = await fetch("/api/lecturer/enrollments/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data: Enrollment[] = await res.json();
        const courseEnrollments = data.filter((e: Enrollment) => e.course.id === Number(courseId));
        // Removed setEnrolledStudentIds as it's unused
        setSelectedStudentIds(courseEnrollments.map((e: Enrollment) => e.student.id));
      } catch {
        setError("Failed to fetch enrollments.");
      }
    };

    if (token && courseId) {
      fetchStudents();
      fetchEnrolledStudents();
    }
  }, [token, courseId]);

  const toggleSelect = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
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
      } else {
        setSuccess(result.message || "Students enrolled successfully.");
        // Removed setEnrolledStudentIds as it's unused
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Enroll Students to Course</h2>

      {error && <div className="text-red-600 mb-4">{error}</div>}
      {success && <div className="text-green-600 mb-4">{success}</div>}

      <ul className="mb-6 space-y-2">
        {students.map((student) => (
          <li key={student.id} className="flex items-center gap-2">
            <input
              id={`student-checkbox-${student.id}`}
              type="checkbox"
              checked={selectedStudentIds.includes(student.id)}
              onChange={() => toggleSelect(student.id)}
              title={`Select ${student.name} (${student.username})`}
            />
            <label htmlFor={`student-checkbox-${student.id}`}>
              {student.name} ({student.username}) - {student.program}
            </label>
          </li>
        ))}
      </ul>

      <button
        onClick={handleEnroll}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Enrolling..." : "Enroll Selected Students"}
      </button>
    </div>
  );
};

export default EnrollStudents;
