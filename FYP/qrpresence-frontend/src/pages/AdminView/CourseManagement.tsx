// src/components/admin/Courses/CourseManager.tsx
import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, BookOpen } from 'lucide-react';
import axios from 'axios';
import './CourseManagement.css';

interface Course {
  id: number;
  code: string;
  title: string;
  description: string;
  credit_hours: number;
  created_by: number;
  created_at: string;
}

const CourseManager: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://127.0.0.1:8000/api/admin/courses/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = response.data as { results?: Course[] } | Course[];
      setCourses(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError('Failed to load courses');
      console.error('Courses fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://127.0.0.1:8000/api/admin/courses/${courseId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCourses(courses.filter(course => course.id !== courseId));
    } catch (err) {
      alert('Failed to delete course');
      console.error('Course delete error:', err);
    }
  };

  const filteredCourses = courses.filter(course => 
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading__spinner"></div>
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="course-manager">
      <div className="course-manager__header">
        <h2>Course Management</h2>
        <button className="admin-button admin-button--primary">
          <Plus size={16} />
          Add Course
        </button>
      </div>

      {/* Search */}
      <div className="course-manager__search">
        <div className="search-group">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {error && (
        <div className="admin-error">
          <p>{error}</p>
          <button onClick={fetchCourses} className="admin-button admin-button--primary">
            Retry
          </button>
        </div>
      )}

      {/* Courses Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Title</th>
              <th>Credit Hours</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map((course) => (
              <tr key={course.id}>
                <td>
                  <div className="course-code">
                    <BookOpen size={16} />
                    {course.code}
                  </div>
                </td>
                <td>{course.title}</td>
                <td>{course.credit_hours}</td>
                <td>{new Date(course.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button className="action-button action-button--edit" title="Edit Course">
                      <Edit size={16} />
                    </button>
                    <button 
                      className="action-button action-button--delete"
                      onClick={() => handleDeleteCourse(course.id)}
                      title="Delete Course"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCourses.length === 0 && !loading && (
          <div className="admin-table-empty">
            <p>No courses found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManager;