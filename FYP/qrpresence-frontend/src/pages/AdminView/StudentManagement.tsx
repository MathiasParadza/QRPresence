import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
   Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  GraduationCap
} from 'lucide-react';
import axios from 'axios';
import './StudentManagement.css';

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

  if (loading) {
    return (
      <div className="student-container">
        <div className="student-container__background">
          <div className="student-container__overlay"></div>
        </div>
        <div className="student-loading">
          <div className="student-loading__spinner"></div>
          <p className="student-loading__text">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-container">
        <div className="student-container__background">
          <div className="student-container__overlay"></div>
        </div>
        <div className="student-error">
          <div className="student-error__card">
            <div className="student-error__content">
              <h3 className="student-error__title">Error Loading Students</h3>
              <p className="student-error__message">{error}</p>
              <button onClick={() => fetchStudents()} className="student-button student-button--primary">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-container">
      <div className="student-container__background">
        <div className="student-container__overlay"></div>
      </div>
      
      <div className="student-content">
        <div className="student-management">
          {/* Header */}
          <div className="student-header">
            <div className="student-header__title-section">
              <h2 className="student-header__title">Student Management</h2>
              <p className="student-header__subtitle">Manage all student records and information</p>
            </div>
            <div className="student-header__actions">

              <button className="student-button student-button--secondary">
                <Download className="student-icon" size={20} />
                Export Data
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="student-filters">
            <div className="student-filters__card">
              {/* Filter Controls */}
              <div className="student-filters__controls">
                <div className="student-filter-group">
                  <label className="student-filter-label" htmlFor="programSelect">Program</label>
                  <div className="student-filter-input-wrapper">
                    <Filter className="student-filter-icon" size={16} />
                    <select 
                      id="programSelect"
                      className="student-filter-input student-filter-select"
                      value={filters.program} 
                      onChange={(e) => handleFilterChange('program', e.target.value)}
                    >
                      <option value="">All Programs</option>
                      <option value="computer_science">Computer Science</option>
                      <option value="engineering">Engineering</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                </div>

                <div className="student-filter-group">
                  <label className="student-filter-label" htmlFor="sortBySelect">Sort By</label>
                  <div className="student-filter-input-wrapper">
                    <Filter className="student-filter-icon" size={16} />
                    <select 
                      id="sortBySelect"
                      className="student-filter-input student-filter-select"
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
              </div>

              {/* Search */}
              <div className="student-search">
                <div className="student-search-wrapper">
                  <Search className="student-search-icon" size={20} />
                  <input
                    type="text"
                    className="student-search-input"
                    placeholder="Search students..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="student-table-section">
            <div className="student-table-container">
              <div className="student-table-wrapper">
                <table className="student-table">
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
                        <tr key={`${student.id}-${student.student_id}`} className="student-table-row">
                          <td>
                            <span className="student-table-cell--id">{student.student_id}</span>
                          </td>
                          <td>
                            <span className="student-table-cell--name">{student.name}</span>
                          </td>
                          <td>
                            <span className="student-program-badge">
                              <GraduationCap className="student-icon" size={14} />
                              {student.program.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <span className="student-table-cell--email">
                              {student.user?.email || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className="student-table-cell--username">
                              {student.user?.username || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <div className="student-action-buttons">
                              <button className="student-action-button student-action-button--view" title="View">
                                <Eye className="student-icon" size={16} />
                              </button>
                              <button className="student-action-button student-action-button--edit" title="Edit">
                                <Edit className="student-icon" size={16} />
                              </button>
                              <button 
                                className="student-action-button student-action-button--delete" 
                                title="Delete"
                                onClick={() => handleDeleteStudent(student.id)}
                              >
                                <Trash2 className="student-icon" size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr key="no-data">
                        <td colSpan={6} className="student-table-empty-cell">
                          <div className="student-table-empty">
                            <div className="student-table-empty__content">
                              <Users className="student-table-empty__icon" size={48} />
                              <h3 className="student-table-empty__title">No students found</h3>
                              <p className="student-table-empty__message">
                                {filters.search || filters.program ? 
                                  'Try adjusting your filters' : 'No students available'}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className="student-pagination">
            <div className="student-pagination__card">
              <div className="student-pagination__content">
                <button 
                  className={`student-button student-button--secondary student-pagination__button ${!previous ? 'student-button--disabled' : ''}`}
                  disabled={!previous}
                  onClick={() => previous && fetchStudents(previous)}
                >
                  <ChevronLeft className="student-icon" size={16} />
                  Previous
                </button>

                <div className="student-pagination__info">
                  <span className="student-pagination__page">Page {currentPage}</span>
                  <span className="student-pagination__divider"></span>
                  <span className="student-pagination__total">
                    {Math.ceil(count / 10) || 1} total pages
                  </span>
                  <span className="student-pagination__divider"></span>
                  <span className="student-pagination__count">{count} students</span>
                </div>

                <button 
                  className={`student-button student-button--secondary student-pagination__button ${!next ? 'student-button--disabled' : ''}`}
                  disabled={!next}
                  onClick={() => next && fetchStudents(next)}
                >
                  Next
                  <ChevronRight className="student-icon" size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;