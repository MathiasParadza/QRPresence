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
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
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

    try {
      const res = await fetch(`${API_BASE_URL}/api/lecturer/courses/create/`, {
        method: 'POST',
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
        throw {
          status: res.status,
          ...errorData
        };
      }

      const data: Course = await res.json();
      setCourses(prev => [...prev, data]);
      setFormData({ title: '', code: '', description: '', credit_hours: '' });
      setSuccess('Course created successfully!');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
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
        <button
          onClick={() => navigate("/dashboard")}
          className="course-manager-back-btn"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Global Alert Messages */}
      {error && (
        <div className="course-alert course-alert-error">
          <div className="course-alert-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="course-alert-content">
            <strong>Error:</strong> {formatError(error)}
            {error.status_code && ` (Status: ${error.status_code})`}
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
          <div className="course-alert-content">
            {success}
          </div>
        </div>
      )}

      {/* Create Course Form */}
      <div className="course-form-container">
        <div className="course-form-header">
          <h2 className="course-form-title">Create New Course</h2>
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
              <button
                type="submit"
                disabled={loading}
                className="course-form-submit"
              >
                {loading && <div className="course-form-loading-spinner"></div>}
                {loading ? 'Creating Course...' : 'Create Course'}
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
            disabled={refreshing}
            className="course-list-refresh"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        <div className="course-list-content">
          {loading && courses.length === 0 ? (
            <div className="course-list-loading">
              <div className="course-list-loading-spinner"></div>
              <p className="course-list-loading-text">Loading your courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="course-list-empty">
              <div className="course-list-empty-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="course-list-empty-title">No courses found</h3>
              <p className="course-list-empty-subtitle">Create your first course using the form above</p>
            </div>
          ) : (
            <div className="course-list-items">
              {courses.map(course => (
                <div key={course.id} className="course-item">
                  <div className="course-item-content">
                    <div className="course-item-header">
                      <div className="course-item-info">
                        <h3 className="course-item-title">
                          {course.title}
                        </h3>
                        <div className="course-item-code">{course.code}</div>
                        <p className="course-item-description">{course.description}</p>
                      </div>
                      <div className="course-item-credits">
                        <span className="course-credits-badge">
                          {course.credit_hours} credit{course.credit_hours !== 1 ? 's' : ''}
                        </span>
                      </div>
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