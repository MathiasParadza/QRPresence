import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  Plus,
  Eye,
  User,
  BookOpen,
  Calendar
} from 'lucide-react';
import axios from 'axios';

// TypeScript interfaces
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  date_joined?: string;
  is_active?: boolean;
}

interface Student {
  id: number;
  student_id: string;
  name: string;
  program: string;
  user: User;
  created_at?: string;
  updated_at?: string;
}

interface Course {
  id: number;
  code: string;
  title: string;
  description?: string;
  credit_hours: number;
  created_at?: string;
  updated_at?: string;
}

interface Lecturer {
  id: number;
  lecturer_id: string;
  name: string;
  department: string;
  is_admin?: boolean;
  user: User;
  created_at?: string;
  updated_at?: string;
}

interface Enrollment {
  id: number;
  student: Student;
  course: Course;
  enrolled_by: Lecturer;
  enrolled_at: string;
  status: 'active' | 'completed' | 'dropped';
  created_at?: string;
  updated_at?: string;
}

interface Filters {
  course: string;
  enrolled_by: string;
  search: string;
  ordering: string;
  page_size: string;
}

const EnrollmentManagement: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    course: '',
    enrolled_by: '',
    search: '',
    ordering: 'enrolled_at',
    page_size: '10',
  });

  // Pagination
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);

  // API service functions
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchEnrollments = React.useCallback(async (url?: string): Promise<void> => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.course) params.append('course', filters.course);
      if (filters.enrolled_by) params.append('enrolled_by', filters.enrolled_by);
      if (filters.search) params.append('search', filters.search);
      if (filters.ordering) params.append('ordering', filters.ordering);
      if (filters.page_size) params.append('page_size', filters.page_size);

      const apiUrl = url || `http://localhost:8000/api/admin/enrollments/?${params}`;
      const response = await axios.get(apiUrl, { headers: getAuthHeaders() });

      const data = response.data as { results?: Enrollment[]; next?: string | null; previous?: string | null } | Enrollment[];
      setEnrollments((data as { results?: Enrollment[] }).results || (data as Enrollment[]));
      setNextPage((data as { next?: string | null }).next || null);
      setPrevPage((data as { previous?: string | null }).previous || null);
    } catch (err) {
      setError('Failed to fetch enrollments');
      console.error('Error fetching enrollments:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCourses = React.useCallback(async (): Promise<void> => {
    try {
      const response = await axios.get(
        'http://localhost:8000/api/admin/courses/',
        { headers: getAuthHeaders() }
      );
      
      const data = response.data as { results?: Course[] } | Course[];
      setCourses((data as { results?: Course[] }).results || (data as Course[]));
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  }, []);

  const fetchLecturers = React.useCallback(async (): Promise<void> => {
    try {
      const response = await axios.get(
        'http://localhost:8000/api/admin/lecturers/',
        { headers: getAuthHeaders() }
      );
      
      const data = response.data as { results?: Lecturer[] } | Lecturer[];
      setLecturers((data as { results?: Lecturer[] }).results || (data as Lecturer[]));
    } catch (err) {
      console.error('Error fetching lecturers:', err);
    }
  }, []);

  const deleteEnrollment = async (enrollmentId: number): Promise<void> => {
    try {
      await axios.delete(
        `http://localhost:8000/api/admin/enrollments/${enrollmentId}/`,
        { headers: getAuthHeaders() }
      );
      
      setEnrollments(prev => prev.filter(enrollment => enrollment.id !== enrollmentId));
    } catch {
      throw new Error('Failed to delete enrollment');
    }
  };

  const exportEnrollments = async (): Promise<void> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.course) params.append('course', filters.course);
      if (filters.enrolled_by) params.append('enrolled_by', filters.enrolled_by);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(
        `http://localhost:8000/api/admin/enrollments/export/?${params}`,
        {
          headers: getAuthHeaders(),
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'enrollments_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export enrollments');
      console.error('Error exporting enrollments:', err);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  useEffect(() => {
    fetchCourses();
    fetchLecturers();
  }, [fetchCourses, fetchLecturers]);

  const handleFilterChange = (key: keyof Filters, value: string): void => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDeleteEnrollment = async (enrollmentId: number): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this enrollment?')) return;
    
    try {
      await deleteEnrollment(enrollmentId);
    } catch (err) {
      setError('Failed to delete enrollment');
      console.error('Error deleting enrollment:', err);
    }
  };

  const handleExport = async (): Promise<void> => {
    await exportEnrollments();
  };

  const handlePageChange = (url: string | null) => {
    if (url) fetchEnrollments(url);
  };

  const getStatusBadge = (status: string): React.JSX.Element => {
    const statusClasses: Record<string, string> = {
      active: 'status-badge status-badge--active',
      completed: 'status-badge status-badge--completed',
      dropped: 'status-badge status-badge--dropped'
    };

    const statusLabels: Record<string, string> = {
      active: 'Active',
      completed: 'Completed',
      dropped: 'Dropped'
    };

    return (
      <span className={statusClasses[status] || 'status-badge'}>
        {statusLabels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading__spinner"></div>
        <p>Loading enrollments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <div className="admin-error__content">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="admin-button admin-button--primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h2>Enrollment Management</h2>
        <p>Manage student course enrollments and registrations</p>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-filters__group">
          <div className="admin-filter">
            <label htmlFor="course-select">Course</label>
            <select 
              id="course-select"
              value={filters.course} 
              onChange={(e) => handleFilterChange('course', e.target.value)}
            >
              <option key="all-courses" value="">All Courses</option>
              {courses.map(course => (
                <option key={`course-${course.id}`} value={course.id}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter">
            <label htmlFor="enrolled-by-select">Enrolled By</label>
            <select 
              id="enrolled-by-select"
              value={filters.enrolled_by} 
              onChange={(e) => handleFilterChange('enrolled_by', e.target.value)}
            >
              <option key="all-lecturers" value="">All Lecturers</option>
              {lecturers.map(lecturer => (
                <option key={`lecturer-${lecturer.id}`} value={lecturer.id}>
                  {lecturer.name} ({lecturer.lecturer_id})
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter">
            <label>Sort By</label>
            <select 
              id="sort-by-select"
              aria-label="Sort By"
              value={filters.ordering} 
              onChange={(e) => handleFilterChange('ordering', e.target.value)}
            >
              <option key="enrolled_at" value="enrolled_at">Enrollment Date</option>
              <option key="-enrolled_at" value="-enrolled_at">Enrollment Date (Desc)</option>
              <option key="student__name" value="student__name">Student Name</option>
              <option key="-student__name" value="-student__name">Student Name (Desc)</option>
            </select>
          </div>

          <div className="admin-filter">
            <label htmlFor="page-size-select">Page Size</label>
            <select
              id="page-size-select"
              value={filters.page_size}
              onChange={(e) => handleFilterChange('page_size', e.target.value)}
            >
              <option key="10" value="10">10</option>
              <option key="20" value="20">20</option>
              <option key="50" value="50">50</option>
            </select>
          </div>
        </div>

        <div className="admin-search">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by student ID, name, or course code..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Student Name</th>
              <th>Course</th>
              <th>Enrolled By</th>
              <th>Enrollment Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enrollment) => (
              <tr key={enrollment.id}>
                <td>
                  <span className="student-id">
                    {enrollment.student.student_id}
                  </span>
                </td>
                <td>
                  <span className="student-info">
                    <User size={14} />
                    {enrollment.student.name}
                  </span>
                </td>
                <td>
                  {enrollment.course && (
                    <span className="course-info">
                      <BookOpen size={14} />
                      {enrollment.course.code} - {enrollment.course.title}
                    </span>
                  )}
                </td>
                <td>
                  {enrollment.enrolled_by && (
                    <span className="lecturer-info">
                      {enrollment.enrolled_by.name}
                      <br />
                      <small className="text-muted">
                        ID: {enrollment.enrolled_by.lecturer_id}
                      </small>
                    </span>
                  )}
                </td>
                <td>
                  <span className="enrollment-date">
                    <Calendar size={14} />
                    {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    <br />
                    <small className="text-muted">
                      {new Date(enrollment.enrolled_at).toLocaleTimeString()}
                    </small>
                  </span>
                </td>
                <td>
                  {getStatusBadge(enrollment.status)}
                </td>
                <td>
                  <div className="admin-actions">
                    <button 
                      className="admin-action-btn admin-action-btn--view" 
                      title="View Enrollment"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="admin-action-btn admin-action-btn--edit" 
                      title="Edit Enrollment"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="admin-action-btn admin-action-btn--delete" 
                      title="Delete Enrollment"
                      onClick={() => handleDeleteEnrollment(enrollment.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {enrollments.length === 0 && !loading && (
          <div className="admin-empty-state">
            <Users size={48} />
            <p>No enrollments found</p>
            {filters.course || filters.enrolled_by || filters.search ? (
              <p className="text-muted">Try adjusting your filters</p>
            ) : null}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="admin-pagination">
        <button
          className="admin-button admin-button--secondary"
          disabled={!prevPage}
          onClick={() => handlePageChange(prevPage)}
        >
          Previous
        </button>
        <button
          className="admin-button admin-button--secondary"
          disabled={!nextPage}
          onClick={() => handlePageChange(nextPage)}
        >
          Next
        </button>
      </div>

      <div className="admin-page__actions">
        <button className="admin-button admin-button--primary">
          <Plus size={20} />
          Add New Enrollment
        </button>
        
        <button 
          className="admin-button admin-button--secondary"
          onClick={handleExport}
          disabled={enrollments.length === 0}
        >
          <Download size={20} />
          Export Data
        </button>
      </div>

      <style>{`
        .admin-pagination {
          display: flex;
          justify-content: center;
          margin: 1rem 0;
          gap: 1rem;
        }
      `}</style>
    </div>
  );
};

export default EnrollmentManagement;
