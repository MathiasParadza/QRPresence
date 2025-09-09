import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';


interface Course {
  id: number;
  code: string;
  title: string;
  credit_hours?: number;
}

interface Enrollment {
  id: number;
  student_id: string;
  student_name: string;
  course_id: number;
  course_code: string;
  course_title: string;
  enrolled_by_username: string;
  enrolled_by_name: string;
  enrolled_at: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const getAccessToken = (): string | null => localStorage.getItem('access_token');

const EnrollmentManagement: React.FC = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return navigate('/login');

    try {
      const res = await fetch(`${API_BASE_URL}/admin/courses/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch courses');
      const data: Course[] = await res.json();
      setCourses(data);
    } catch (err) {
      console.error(err);
      setError('Error fetching courses');
    }
  }, [navigate]);

  // Fetch enrollments
  const fetchEnrollments = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return navigate('/login');

    setLoading(true);
    setError(null);

    try {
      const url = selectedCourseId
        ? `${API_BASE_URL}/admin/enrollments/?course_id=${selectedCourseId}`
        : `${API_BASE_URL}/admin/enrollments/`;

      const res = await fetch(url, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      });
      
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access forbidden. Admin privileges required.');
        }
        throw new Error('Failed to fetch enrollments');
      }
      
      const data: Enrollment[] = await res.json();
      setEnrollments(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error fetching enrollments');
    } finally {
      setLoading(false);
    }
  }, [navigate, selectedCourseId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // Export CSV with all available data
  const handleExportCSV = async () => {
    const token = getAccessToken();
    if (!token) return navigate('/login');

    try {
      const url = selectedCourseId
        ? `${API_BASE_URL}/admin/enrollments/export_csv/?course_id=${selectedCourseId}`
        : `${API_BASE_URL}/admin/enrollments/export_csv/`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate filename with course name if filtered
        const courseName = selectedCourseId
          ? courses.find(c => c.id === parseInt(selectedCourseId))?.title || 'course'
          : 'all_courses';
        
        a.download = `enrollments_${courseName.replace(/\s+/g, '_')}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to export CSV');
      }
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export CSV. Please try again.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600 p-4">{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Enrollment Management</h2>

      <div className="mb-6">
        <label htmlFor="course-filter" className="block mb-2 font-semibold">Filter by Course</label>
        <select
          id="course-filter"
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="border px-3 py-2 rounded-lg w-full max-w-xs"
        >
          <option value="">All Courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.title}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleExportCSV}
        className="mb-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        disabled={enrollments.length === 0}
      >
        Export CSV
      </button>

      <h3 className="text-xl font-semibold mb-2">Enrollments ({enrollments.length})</h3>
      
      {enrollments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2">Student ID</th>
                <th className="border px-3 py-2">Student Name</th>
                <th className="border px-3 py-2">Course Code</th>
                <th className="border px-3 py-2">Course Title</th>
                <th className="border px-3 py-2">Enrolled By</th>
                <th className="border px-3 py-2">Enrollment Date</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">{enrollment.student_id}</td>
                  <td className="border px-3 py-2">{enrollment.student_name}</td>
                  <td className="border px-3 py-2">{enrollment.course_code}</td>
                  <td className="border px-3 py-2">{enrollment.course_title}</td>
                  <td className="border px-3 py-2">
                    {enrollment.enrolled_by_name} ({enrollment.enrolled_by_username})
                  </td>
                  <td className="border px-3 py-2">
                    {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No enrollments found{selectedCourseId ? ' for this course' : ''}.
        </div>
      )}
    </div>
  );
};

export default EnrollmentManagement;