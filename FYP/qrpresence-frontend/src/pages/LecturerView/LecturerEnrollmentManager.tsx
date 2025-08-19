import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface Student {
  student_id: string;
  user: User;
  name: string;
  email: string;
  program: string;
}

interface Course {
  id: number;
  title: string;  // Changed from 'name' to match Django model
  code: string;
  description?: string;
  credit_hours?: number;
}

interface Enrollment {
  id: number;
  student: Student | string; // Can be object or ID
  course: Course | number;   // Can be object or ID
  enrolled_at: string;
}

interface ApiError {
  detail?: string;
  error?: string;
  message?: string;
  status_code?: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const API_BASE_URL = 'http://localhost:8000';

const LecturerEnrollmentManager: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState({
    enrollments: false,
    courses: false,
    students: false,
    submitting: false
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleApiError = useCallback((err: unknown) => {
    if (typeof err === 'object' && err !== null) {
      const errorObj = err as {
        status?: number;
        detail?: string;
        error?: string;
        message?: string;
      };
      
      if (errorObj.status === 401) {
        setError({
          detail: 'Authentication failed. Please login again.',
          status_code: 401
        });
        navigate("/login");
      } else if (errorObj.detail) {
        setError({ detail: errorObj.detail });
      } else if (errorObj.error) {
        setError({ error: errorObj.error });
      } else if (errorObj.message) {
        setError({ detail: errorObj.message });
      } else {
        setError({ detail: 'An unexpected error occurred' });
      }
    } else {
      setError({ detail: 'An unexpected error occurred' });
    }
  }, [navigate]);

  const fetchEnrollments = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(prev => ({ ...prev, enrollments: true }));
    }
    setError(null);
    
    try {
      const url = selectedCourse 
        ? `${API_BASE_URL}/api/lecturer/enrollments/?course_id=${selectedCourse}`
        : `${API_BASE_URL}/api/lecturer/enrollments/`;

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData: ApiError = await res.json();
        throw {
          status: res.status,
          ...errorData
        };
      }

      const data = await res.json();
      console.log('Enrollments data:', data); // Debugging log
      
      if (Array.isArray(data)) {
        setEnrollments(data);
        if (isRefresh) {
          setSuccess('Enrollments refreshed successfully');
          setTimeout(() => setSuccess(null), 3000);
        }
      } else if (data.results && Array.isArray(data.results)) {
        setEnrollments(data.results);
      } else {
        throw new Error('Invalid data format received for enrollments');
      }
    } catch (err) {
      handleApiError(err);
      setEnrollments([]);
    } finally {
      setLoading(prev => ({ ...prev, enrollments: false }));
      setRefreshing(false);
    }
  }, [handleApiError, selectedCourse]);

  const fetchCourses = useCallback(async () => {
    setLoading(prev => ({ ...prev, courses: true }));
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/lecturer/courses/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData: ApiError = await res.json();
        throw {
          status: res.status,
          ...errorData
        };
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setCourses(data);
      } else if (data.results && Array.isArray(data.results)) {
        setCourses(data.results);
      } else {
        throw new Error('Invalid data format received for courses');
      }
    } catch (err) {
      handleApiError(err);
      setCourses([]);
    } finally {
      setLoading(prev => ({ ...prev, courses: false }));
    }
  }, [handleApiError]);

  const fetchStudents = useCallback(async () => {
    setLoading(prev => ({ ...prev, students: true }));
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/students/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData: ApiError = await res.json();
        throw {
          status: res.status,
          ...errorData
        };
      }

      const data: PaginatedResponse<Student> = await res.json();
      if (data && Array.isArray(data.results)) {
        setStudents(data.results);
      } else {
        throw new Error('Invalid students data format');
      }
    } catch (err) {
      handleApiError(err);
      setStudents([]);
    } finally {
      setLoading(prev => ({ ...prev, students: false }));
    }
  }, [handleApiError]);

  const handleEnrollStudents = async () => {
    if (!selectedCourse) {
      setError({ detail: 'Please select a course' });
      return;
    }

    if (selectedStudents.length === 0) {
      setError({ detail: 'Please select at least one student' });
      return;
    }

    setLoading(prev => ({ ...prev, submitting: true }));
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/lecturer/enrollments/?course_id=${selectedCourse}`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({ 
            student_ids: selectedStudents 
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          ...data
        };
      }

      setSuccess(data.message || `${selectedStudents.length} students enrolled successfully`);
      setSelectedStudents([]);
      fetchEnrollments(true);
    } catch (err) {
      handleApiError(err);
      console.error('Enrollment error:', err);
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  useEffect(() => {
    fetchEnrollments();
    fetchCourses();
    fetchStudents();
  }, [fetchEnrollments, fetchCourses, fetchStudents]);

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const formatError = (error: ApiError | null) => {
    if (!error) return null;
    
    if (error.detail) return error.detail;
    if (error.error) return error.error;
    if (error.message) return error.message;
    
    return 'An unknown error occurred';
  };

  const renderStudentsList = () => {
    if (loading.students) {
      return (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading students...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-4 text-red-500">
          <strong>Error:</strong> {formatError(error)}
          <button 
            onClick={fetchStudents}
            className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Retry
          </button>
        </div>
      );
    }

    if (students.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No students available
          <button 
            onClick={fetchStudents}
            className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="max-h-60 overflow-y-auto border rounded divide-y">
        {students.map(student => (
          <div key={student.student_id} className="p-3 hover:bg-gray-50">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStudents.includes(student.student_id)}
                onChange={() => handleStudentSelection(student.student_id)}
                className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                disabled={loading.submitting}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {student.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {student.email}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {student.program} • ID: {student.student_id}
                </p>
              </div>
            </label>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enrollment Management</h1>
            <p className="text-sm text-gray-500">Manage student enrollments in your courses</p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>Error:</strong> {formatError(error)}
                  {error.status_code && ` (Status: ${error.status_code})`}
                </p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  {success}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enrollment Form */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Enroll Students</h2>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-6">
              <label htmlFor="course-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Course
              </label>
              <select
                id="course-select"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={selectedCourse || ''}
                onChange={(e) => {
                  setSelectedCourse(Number(e.target.value));
                  fetchEnrollments();
                }}
                disabled={loading.courses || loading.submitting}
              >
                <option value="">-- Select a course --</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Students
              </label>
              {renderStudentsList()}
            </div>

            <button
              onClick={handleEnrollStudents}
              disabled={loading.submitting || !selectedCourse || selectedStudents.length === 0}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading.submitting || !selectedCourse || selectedStudents.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading.submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : 'Enroll Students'}
            </button>
          </div>
        </div>

        {/* Enrollment List */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Current Enrollments</h2>
            <button 
              onClick={() => fetchEnrollments(true)} 
              disabled={refreshing}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {refreshing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {loading.enrollments && enrollments.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : enrollments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No enrollments found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enrolled On
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enrollments.map(enrollment => {
                      // Handle cases where student/course might be just IDs or full objects
                      const student = typeof enrollment.student === 'object' 
                        ? enrollment.student 
                        : students.find(s => s.student_id === enrollment.student);
                      
                      const course = typeof enrollment.course === 'object' 
                        ? enrollment.course 
                        : courses.find(c => c.id === enrollment.course);

                      return (
                        <tr key={enrollment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <div className="font-medium">{student?.name || 'Unknown'}</div>
                            <div className="text-gray-500">{student?.student_id || 'Unknown'}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {course?.code || 'Unknown'} - {course?.title || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {new Date(enrollment.enrolled_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerEnrollmentManager;