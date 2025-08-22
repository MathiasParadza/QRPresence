import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import './LecturerEnrollmentManager.css';

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
  title: string;
  code: string;
  description?: string;
  credit_hours?: number;
}

interface Enrollment {
  id: number;
  student: Student | string;
  course: Course | number;
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
        <div className="enrollment-loading">
          <div className="enrollment-loading__spinner"></div>
          <span className="enrollment-loading__text">Loading students...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="enrollment-state enrollment-state--error">
          <div className="enrollment-state__icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="enrollment-state__title">Error Loading Students</h3>
          <p className="enrollment-state__message">{formatError(error)}</p>
          <button 
            onClick={fetchStudents}
            className="enrollment-button enrollment-button--secondary"
          >
            Retry
          </button>
        </div>
      );
    }

    if (students.length === 0) {
      return (
        <div className="enrollment-state">
          <div className="enrollment-state__icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="enrollment-state__title">No Students Available</h3>
          <p className="enrollment-state__message">There are no students to enroll at this time</p>
          <button 
            onClick={fetchStudents}
            className="enrollment-button enrollment-button--primary"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="enrollment-students-list">
        {students.map((student) => (
          <div key={student.student_id} className="enrollment-student-item">
            <label className="enrollment-student-label">
              <input
                type="checkbox"
                className="enrollment-student-checkbox"
                checked={selectedStudents.includes(student.student_id)}
                onChange={() => handleStudentSelection(student.student_id)}
                disabled={loading.submitting}
              />
              <div className="enrollment-student-avatar">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div className="enrollment-student-info">
                <h4 className="enrollment-student-name">{student.name}</h4>
                <div className="enrollment-student-details">
                  <div className="enrollment-student-email">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {student.email}
                  </div>
                  <div className="enrollment-student-meta">
                    <span className="enrollment-student-program">{student.program}</span>
                    <span className="enrollment-student-id">ID: {student.student_id}</span>
                  </div>
                </div>
              </div>
            </label>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="enrollment-container">
      <div className="enrollment-container__background">
        <div className="enrollment-container__overlay"></div>
      </div>
      
      <div className="enrollment-content">
        {/* Header */}
        <div className="enrollment-header">
          <div className="enrollment-header__top">
            <div className="enrollment-header__title-section">
              <div className="enrollment-header__icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477 4.5 1.253" />
                </svg>
              </div>
              <div className="enrollment-header__text">
                <h1>Enrollment Management</h1>
                <p>Manage student enrollments in your courses with ease</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="enrollment-button enrollment-button--secondary"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>

          {error && (
            <div className="enrollment-alert enrollment-alert--error">
              <div className="enrollment-alert__icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="enrollment-alert__content">
                <strong>Error:</strong> {formatError(error)}
                {error.status_code && ` (Status: ${error.status_code})`}
              </div>
            </div>
          )}

          {success && (
            <div className="enrollment-alert enrollment-alert--success">
              <div className="enrollment-alert__icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="enrollment-alert__content">
                {success}
              </div>
            </div>
          )}
        </div>

        <div className="enrollment-grid">
          {/* Enrollment Form */}
          <div className="enrollment-card">
            <div className="enrollment-card__header">
              <div className="enrollment-card__header-content">
                <h2>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Enroll Students
                </h2>
                <p>Select a course and add students</p>
              </div>
            </div>
            <div className="enrollment-card__body">
              <div className="enrollment-form-group">
                <label className="enrollment-label">Select Course</label>
                <select
                  className="enrollment-select"
                  value={selectedCourse || ''}
                  onChange={(e) => {
                    setSelectedCourse(Number(e.target.value));
                    fetchEnrollments();
                  }}
                  disabled={loading.courses || loading.submitting}
                  title="Select Course"
                >
                  <option value="">-- Select a course --</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="enrollment-form-group">
                <div className="enrollment-students-header">
                  <label className="enrollment-label">Select Students</label>
                  {selectedStudents.length > 0 && (
                    <span className="enrollment-badge">
                      {selectedStudents.length} selected
                    </span>
                  )}
                </div>
                {renderStudentsList()}
              </div>

              <button
                onClick={handleEnrollStudents}
                disabled={loading.submitting || !selectedCourse || selectedStudents.length === 0}
                className={`enrollment-button enrollment-button--primary enrollment-button--full ${
                  loading.submitting || !selectedCourse || selectedStudents.length === 0 
                    ? 'enrollment-button--disabled' 
                    : ''
                }`}
              >
                {loading.submitting ? (
                  <>
                    <div className="enrollment-loading__spinner"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Enroll Students
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Enrollment List */}
          <div className="enrollment-card">
            <div className="enrollment-card__header enrollment-card__header--alt">
              <div className="enrollment-card__header-content">
                <h2>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Current Enrollments
                </h2>
                <p>View and manage enrollments</p>
              </div>
              <button 
                onClick={() => fetchEnrollments(true)} 
                disabled={refreshing}
                className={`enrollment-button enrollment-button--secondary ${
                  refreshing ? 'enrollment-button--disabled' : ''
                }`}
              >
                {refreshing ? (
                  <>
                    <div className="enrollment-loading__spinner"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>
            <div className="enrollment-card__body">
              {loading.enrollments && enrollments.length === 0 ? (
                <div className="enrollment-loading">
                  <div className="enrollment-loading__spinner"></div>
                  <span className="enrollment-loading__text">Loading enrollments...</span>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="enrollment-state">
                  <div className="enrollment-state__icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="enrollment-state__title">No Enrollments Found</h3>
                  <p className="enrollment-state__message">Start by enrolling students in courses</p>
                </div>
              ) : (
                <div className="enrollment-table-container">
                  <table className="enrollment-table">
                    <thead className="enrollment-table__header">
                      <tr>
                        <th>
                          <div className="enrollment-table__header-content">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Student
                          </div>
                        </th>
                        <th>
                          <div className="enrollment-table__header-content">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477 4.5 1.253" />
                            </svg>
                            Course
                          </div>
                        </th>
                        <th>
                          <div className="enrollment-table__header-content">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 0v6m-3 0h6m-6-3h6" />
                            </svg>
                            Enrolled On
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((enrollment) => {
                        const student = typeof enrollment.student === 'object' 
                          ? enrollment.student 
                          : students.find(s => s.student_id === enrollment.student);
                        
                        const course = typeof enrollment.course === 'object' 
                          ? enrollment.course 
                          : courses.find(c => c.id === enrollment.course);

                        return (
                          <tr key={enrollment.id} className="enrollment-table__row">
                            <td className="enrollment-table__cell">
                              <div className="enrollment-table__student">
                                <div className="enrollment-table__student-avatar">
                                  {(student?.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="enrollment-table__student-info">
                                  <div className="enrollment-table__student-name">
                                    {student?.name || 'Unknown'}
                                  </div>
                                  <div className="enrollment-table__student-id">
                                    {student?.student_id || 'Unknown'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="enrollment-table__cell">
                              <div className="enrollment-table__course">
                                <div className="enrollment-table__course-icon">
                                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477 4.5 1.253" />
                                  </svg>
                                </div>
                                <div className="enrollment-table__course-info">
                                  <div className="enrollment-table__course-code">
                                    {course?.code || 'Unknown'}
                                  </div>
                                  <div className="enrollment-table__course-title">
                                    {course?.title || 'Unknown'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="enrollment-table__cell">
                              <div className="enrollment-table__date">
                                <div className="enrollment-table__date-icon">
                                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 0v6m-3 0h6m-6-3h6" />
                                  </svg>
                                </div>
                                <div className="enrollment-table__date-info">
                                  <div className="enrollment-table__date-value">
                                    {new Date(enrollment.enrolled_at).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                  <div className="enrollment-table__date-time">
                                    {new Date(enrollment.enrolled_at).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </div>
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
    </div>
  );
};

export default LecturerEnrollmentManager;