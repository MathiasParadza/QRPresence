import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';

interface Student {
  id: number;
  student_id: string;
  name: string;
  program: string;
  user?: {
    email: string;
    username: string;
  };
}

interface Filters {
  program: string;
  search: string;
  ordering: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    program: '',
    search: '',
    ordering: 'student_id'
  });

  // Pagination state
  const [count, setCount] = useState(0);
  const [next, setNext] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchStudents = React.useCallback(
    async (url?: string) => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('access_token');
        let requestUrl: string;

        if (url) {
          requestUrl = url; // direct next/previous page URL
        } else {
          const params = new URLSearchParams();
          if (filters.program) params.append('program', filters.program);
          if (filters.search) params.append('search', filters.search);
          if (filters.ordering) params.append('ordering', filters.ordering);
          requestUrl = `http://localhost:8000/api/admin/students/?${params}`;
        }

        const response = await axios.get<PaginatedResponse<Student>>(
          requestUrl,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data && 'results' in response.data) {
          setStudents(response.data.results);
          setCount(response.data.count);
          setNext(response.data.next);
          setPrevious(response.data.previous);

          // Extract page number from URL (if present)
          const urlParams = new URL(requestUrl, window.location.origin);
          const pageParam = urlParams.searchParams.get("page");
          setCurrentPage(pageParam ? parseInt(pageParam, 10) : 1);
        } else {
          setStudents([]);
          setCount(0);
          setNext(null);
          setPrevious(null);
        }
      } catch (err) {
        setError('Failed to fetch students');
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://localhost:8000/api/admin/students/${studentId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(students.filter(student => student.id !== studentId));
    } catch (err) {
      setError('Failed to delete student');
      console.error('Error deleting student:', err);
    }
  };

  if (loading) return <div className="admin-loading">Loading students...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h2>Student Management</h2>
        <p>Manage all student records and information</p>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-filters__group">
          <div className="admin-filter">
            <label htmlFor="programSelect">Program</label>
            <select 
              id="programSelect"
              value={filters.program} 
              onChange={(e) => handleFilterChange('program', e.target.value)}
            >
              <option value="">All Programs</option>
              <option value="computer_science">Computer Science</option>
              <option value="engineering">Engineering</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div className="admin-filter">
            <label htmlFor="sortBySelect">Sort By</label>
            <select 
              id="sortBySelect"
              value={filters.ordering} 
              onChange={(e) => handleFilterChange('ordering', e.target.value)}
            >
              <option value="student_id">Student ID</option>
              <option value="-student_id">Student ID (Desc)</option>
              <option value="name">Name</option>
              <option value="-name">Name (Desc)</option>
            </select>
          </div>
        </div>

        <div className="admin-search">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search students..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Program</th>
              <th>Email</th>
              <th>Username</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map((student) => (
                <tr key={`${student.id}-${student.student_id}`}>
                  <td>{student.student_id}</td>
                  <td>{student.name}</td>
                  <td>
                    <span className="program-badge">
                      {student.program}
                    </span>
                  </td>
                  <td>{student.user?.email || 'N/A'}</td>
                  <td>{student.user?.username || 'N/A'}</td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-action-btn admin-action-btn--view" title="View">
                        <Eye size={16} />
                      </button>
                      <button className="admin-action-btn admin-action-btn--edit" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button 
                        className="admin-action-btn admin-action-btn--delete" 
                        title="Delete"
                        onClick={() => handleDeleteStudent(student.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr key="no-data">
                <td colSpan={6} className="no-data-message">
                  <div className="admin-empty-state">
                    <Users size={48} />
                    <p>No students found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="admin-pagination">
        <button 
          className="admin-button admin-button--secondary"
          disabled={!previous}
          onClick={() => previous && fetchStudents(previous)}
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <span className="admin-pagination__info">
          Page {currentPage} of {Math.ceil(count / 10) || 1}
        </span>

        <button 
          className="admin-button admin-button--secondary"
          disabled={!next}
          onClick={() => next && fetchStudents(next)}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>

      <div className="admin-page__actions">
        <button className="admin-button admin-button--primary">
          <Plus size={20} />
          Add New Student
        </button>
        
        <button className="admin-button admin-button--secondary">
          <Download size={20} />
          Export Data
        </button>
      </div>
    </div>
  );
};

export default StudentManagement;
