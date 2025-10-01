import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from "react-router-dom";

import "../../styles/CourseManagement.css";

interface Course {
  id: number;
  title: string;
  code: string;
  description: string;
  credit_hours: number;
}

interface ApiError {
  detail?: string;
  error?: string;
  message?: string;
  status_code?: number;
}

const API_BASE_URL = 'http://localhost:8000';

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    credit_hours: '',
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);

  const navigate = useNavigate();

  const handleApiError = useCallback((err: unknown) => {
    if (typeof err === 'object' && err !== null) {
      const errorObj = err as { status?: number; detail?: string; error?: string; message?: string; };
      if (errorObj.status === 401) {
        setError({ detail: 'Authentication failed. Please login again.', status_code: 401 });
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
  }, []);

  const fetchCourses = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
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
        throw { status: res.status, ...errorData };
      }

      const data: Course[] = await res.json();
      setCourses(data);
      if (isRefresh) {
        setSuccess('Courses refreshed successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const method = editingCourseId ? 'PUT' : 'POST';
    const url = editingCourseId
      ? `${API_BASE_URL}/api/lecturer/courses/${editingCourseId}`
      : `${API_BASE_URL}/api/lecturer/courses/create/`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          credit_hours: Number(formData.credit_hours),
        }),
      });

      if (!res.ok) {
        const errorData: ApiError = await res.json();
        throw { status: res.status, ...errorData };
      }

      const data: Course = await res.json();

      if (editingCourseId) {
        setCourses(prev => prev.map(course => (course.id === data.id ? data : course)));
        setSuccess('Course updated successfully!');
        setEditingCourseId(null);
      } else {
        setCourses(prev => [...prev, data]);
        setSuccess('Course created successfully!');
      }

      setFormData({ title: '', code: '', description: '', credit_hours: '' });
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCourse = (course: Course) => {
    setFormData({
      title: course.title,
      code: course.code,
      description: course.description,
      credit_hours: course.credit_hours.toString(),
    });
    setEditingCourseId(course.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCourse = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/lecturer/courses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to delete course');

      setCourses(prev => prev.filter(course => course.id !== id));
      setSuccess('Course deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError({ detail: 'Error deleting course' });
    }
  };

  const formatError = (error: ApiError | null) => {
    if (!error) return null;
    if (error.detail) return error.detail;
    if (error.error) return error.error;
    if (error.message) return error.message;
    return 'An unknown error occurred';
  };

  return (
    <div className="course-management-container">
      {/* Header */}
      <div className="course-management-header">
        <h1 className="course-management-title">Course Management</h1>
        <p className="course-management-subtitle">Create and manage your courses</p>
        <button onClick={() => navigate("/dashboard")} className="course-manager-back-btn">
          ← Back to Dashboard
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="course-alert course-alert-error">
          <div className="course-alert-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="course-alert-content">
            <strong>Error:</strong> {formatError(error)} {error.status_code && `(Status: ${error.status_code})`}
          </div>
        </div>
      )}

      {success && (
        <div className="course-alert course-alert-success">
          <div className="course-alert-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="course-alert-content">{success}</div>
        </div>
      )}

      {/* Form */}
      <div className="course-form-container">
        <div className="course-form-header">
          <h2 className="course-form-title">{editingCourseId ? 'Update Course' : 'Create New Course'}</h2>
        </div>
        <div className="course-form-content">
          <form onSubmit={handleSubmit} className="course-form-fields">
            <div className="course-form-row">
              <div className="course-form-field">
                <label className="course-form-label">Course Title</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="course-form-input"
                  required
                  placeholder="Enter course name"
                />
              </div>
              <div className="course-form-field">
                <label className="course-form-label">Course Code</label>
                <input
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="course-form-input"
                  required
                  placeholder="Enter course code (e.g., CS101)"
                />
              </div>
            </div>
            <div className="course-form-field">
              <label className="course-form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="course-form-textarea"
                required
                placeholder="Enter course description"
                rows={4}
              />
            </div>
            <div className="course-form-row">
              <div className="course-form-field">
                <label className="course-form-label">Credit Hours</label>
                <input
                  name="credit_hours"
                  type="number"
                  min={1}
                  max={10}
                  value={formData.credit_hours}
                  onChange={handleChange}
                  className="course-form-input"
                  required
                  placeholder="Enter credit hours"
                />
              </div>
            </div>
            <div className="course-form-buttons">
              <button type="submit" disabled={loading} className="course-form-submit">
                {loading && <span className="course-form-loading-spinner" />}
                {editingCourseId ? 'Update Course' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Course List */}
      <div className="course-list-container">
        <div className="course-list-header">
          <h2 className="course-list-title">Your Courses</h2>
          <button
            onClick={() => fetchCourses(true)}
            className="course-list-refresh"
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh List'}
          </button>
        </div>
        <div className="course-list-content">
          {loading && courses.length === 0 ? (
            <div className="course-list-loading">
              <div className="course-list-loading-spinner" />
              <p className="course-list-loading-text">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="course-list-empty">
              <div className="course-list-empty-icon">📚</div>
              <h3 className="course-list-empty-title">No Courses Found</h3>
              <p className="course-list-empty-subtitle">Create a course to get started</p>
            </div>
          ) : (
            <div className="course-list-items">
              {courses.map(course => (
                <div key={course.id} className="course-item">
                  <div className="course-item-content">
                    <div className="course-item-header">
                      <div className="course-item-info">
                        <h3 className="course-item-title">{course.title}</h3>
                        <div className="course-item-code">{course.code}</div>
                        <p className="course-item-description">{course.description}</p>
                      </div>
                      <div className="course-item-credits">
                        <span className="course-credits-badge">
                          {course.credit_hours} credit{course.credit_hours !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    {/* Edit/Delete Buttons */}
                    <div className="course-item-actions">
                      <button
                        className="course-item-button course-item-edit"
                        onClick={() => handleEditCourse(course)}
                      >
                        Edit
                      </button>
                      <button
                        className="course-item-button course-item-delete"
                        onClick={() => handleDeleteCourse(course.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseManagement;
