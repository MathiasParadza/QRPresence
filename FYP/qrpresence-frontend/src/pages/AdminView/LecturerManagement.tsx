import React, { useState, useEffect } from 'react';
import { 
  Search,  
  Download, 
  Edit, 
  Trash2, 
   Eye,
  Filter,
  Users,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';
import './LecturerManagement.css';

interface Lecturer {
  id: number;
  lecturer_id: string;
  name: string;
  department: string;
  is_admin: boolean;
  user?: {
    email: string;
  };
}

interface Filters {
  department: string;
  is_admin: string;
  search: string;
  ordering: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const LecturerManagement = () => {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    department: '',
    is_admin: '',
    search: '',
    ordering: 'lecturer_id'
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchLecturers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      
      if (filters.department) params.append('department', filters.department);
      if (filters.is_admin) params.append('is_admin', filters.is_admin);
      if (filters.search) params.append('search', filters.search);
      if (filters.ordering) params.append('ordering', filters.ordering);

      const response = await axios.get<Lecturer[] | PaginatedResponse<Lecturer>>(
        `http://localhost:8000/api/admin/lecturers/?${params}`, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Handle both array and paginated responses
      if (Array.isArray(response.data)) {
        setLecturers(response.data);
      } else if (response.data && typeof response.data === 'object' && 'results' in response.data) {
        setLecturers(response.data.results);
      } else {
        console.error('Unexpected API response format:', response.data);
        setLecturers([]);
      }
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch lecturers';
      type AxiosError = {
        response?: {
          data?: {
            message?: string;
          };
        };
      };
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as AxiosError).response?.data?.message
      ) {
        errorMessage = (err as AxiosError).response!.data!.message!;
      }
      setError(errorMessage);
      console.error('Error fetching lecturers:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLecturers();
  }, [fetchLecturers]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDeleteLecturer = async (lecturerId: number) => {
    if (!window.confirm('Are you sure you want to delete this lecturer?')) return;
    
    try {
      setDeletingId(lecturerId);
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://localhost:8000/api/admin/lecturers/${lecturerId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLecturers(prev => prev.filter(lecturer => lecturer.id !== lecturerId));
    } catch (err: unknown) {
      let errorMessage = 'Failed to delete lecturer';
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        errorMessage = (err as { response: { data: { message: string } } }).response.data.message;
      }
      setError(errorMessage);
      console.error('Error deleting lecturer:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Safe department formatting function
  const formatDepartment = (department: string | null | undefined): string => {
    if (!department) return 'N/A';
    return department.replace(/_/g, ' ');
  };

  // Safe name formatting
  const formatName = (name: string | null | undefined): string => {
    return name || 'Unnamed Lecturer';
  };

  if (loading) {
    return (
      <div className="lecturer-container">
        <div className="lecturer-container__background">
          <div className="lecturer-container__overlay"></div>
        </div>
        <div className="lecturer-loading">
          <div className="lecturer-loading__spinner"></div>
          <p className="lecturer-loading__text">Loading lecturers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lecturer-container">
        <div className="lecturer-container__background">
          <div className="lecturer-container__overlay"></div>
        </div>
        <div className="lecturer-error">
          <div className="lecturer-error__card">
            <div className="lecturer-error__content">
              <h3 className="lecturer-error__title">Error Loading Lecturers</h3>
              <p className="lecturer-error__message">{error}</p>
              <button onClick={fetchLecturers} className="lecturer-button lecturer-button--primary">
                <RefreshCw size={16} />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lecturer-container">
      <div className="lecturer-container__background">
        <div className="lecturer-container__overlay"></div>
      </div>
      
      <div className="lecturer-content">
        <div className="lecturer-management">
          {/* Header */}
          <div className="lecturer-header">
            <div className="lecturer-header__title-section">
              <h2 className="lecturer-header__title">Lecturer Management</h2>
              <p className="lecturer-header__subtitle">Manage all lecturer records and permissions</p>
            </div>
            <div className="lecturer-header__actions">
              <button className="lecturer-button lecturer-button--secondary">
                <Download className="lecturer-icon" size={20} />
                Export Data
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="lecturer-filters">
            <div className="lecturer-filters__card">
              {/* Filter Controls */}
              <div className="lecturer-filters__controls">
                <div className="lecturer-filter-group">
                  <label className="lecturer-filter-label">Department</label>
                  <div className="lecturer-filter-input-wrapper">
                    <Filter className="lecturer-filter-icon" size={16} />
                    <select 
                      className="lecturer-filter-input lecturer-filter-select"
                      title="Department"
                      aria-label="Department"
                      value={filters.department} 
                      onChange={(e) => handleFilterChange('department', e.target.value)}
                    >
                      <option value="">All Departments</option>
                      <option value="computer_science">Computer Science</option>
                      <option value="engineering">Engineering</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                </div>

                <div className="lecturer-filter-group">
                  <label className="lecturer-filter-label">Admin Status</label>
                  <div className="lecturer-filter-input-wrapper">
                    <Filter className="lecturer-filter-icon" size={16} />
                    <select 
                      className="lecturer-filter-input lecturer-filter-select"
                      title="Admin Status"
                      aria-label="Admin Status"
                      value={filters.is_admin} 
                      onChange={(e) => handleFilterChange('is_admin', e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="true">Admin Lecturer</option>
                      <option value="false">Regular Lecturer</option>
                    </select>
                  </div>
                </div>

                <div className="lecturer-filter-group">
                  <label className="lecturer-filter-label" htmlFor="sortBySelect">Sort By</label>
                  <div className="lecturer-filter-input-wrapper">
                    <Filter className="lecturer-filter-icon" size={16} />
                    <select 
                      className="lecturer-filter-input lecturer-filter-select"
                      id="sortBySelect"
                      aria-label="Sort By"
                      title="Sort By"
                      value={filters.ordering} 
                      onChange={(e) => handleFilterChange('ordering', e.target.value)}
                    >
                      <option value="lecturer_id">Lecturer ID</option>
                      <option value="-lecturer_id">Lecturer ID (Desc)</option>
                      <option value="name">Name</option>
                      <option value="-name">Name (Desc)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="lecturer-search">
                <div className="lecturer-search-wrapper">
                  <Search className="lecturer-search-icon" size={20} />
                  <input
                    type="text"
                    className="lecturer-search-input"
                    placeholder="Search lecturers..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lecturers Table */}
          <div className="lecturer-table-section">
            <div className="lecturer-table-container">
              <div className="lecturer-table-wrapper">
                <table className="lecturer-table">
                  <thead>
                    <tr>
                      <th>Lecturer ID</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Admin Status</th>
                      <th>Email</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lecturers.length > 0 ? (
                      lecturers.map((lecturer) => (
                        <tr key={lecturer.id} className="lecturer-table-row">
                          <td>
                            <span className="lecturer-table-cell--id">
                              {lecturer.lecturer_id || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className="lecturer-table-cell--name">
                              {formatName(lecturer.name)}
                            </span>
                          </td>
                          <td>
                            <span className="lecturer-department-badge">
                              {formatDepartment(lecturer.department)}
                            </span>
                          </td>
                          <td>
                            <span className={`lecturer-status-badge ${lecturer.is_admin ? 'lecturer-status-badge--admin' : 'lecturer-status-badge--regular'}`}>
                              {lecturer.is_admin ? 'Admin' : 'Regular'}
                            </span>
                          </td>
                          <td>
                            <span className="lecturer-table-cell--email">
                              {lecturer.user?.email || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <div className="lecturer-action-buttons">
                              <button 
                                key={`view-${lecturer.id}`}
                                className="lecturer-action-button lecturer-action-button--view" 
                                title="View"
                              >
                                <Eye className="lecturer-icon" size={16} />
                              </button>
                              <button 
                                key={`edit-${lecturer.id}`}
                                className="lecturer-action-button lecturer-action-button--edit" 
                                title="Edit"
                              >
                                <Edit className="lecturer-icon" size={16} />
                              </button>
                              <button 
                                key={`delete-${lecturer.id}`}
                                className="lecturer-action-button lecturer-action-button--delete" 
                                title="Delete"
                                onClick={() => handleDeleteLecturer(lecturer.id)}
                                disabled={deletingId === lecturer.id}
                              >
                                {deletingId === lecturer.id ? (
                                  <RefreshCw className="lecturer-icon spinner" size={16} />
                                ) : (
                                  <Trash2 className="lecturer-icon" size={16} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr key="no-lecturers">
                        <td colSpan={6} className="lecturer-table-empty-cell">
                          <div className="lecturer-table-empty">
                            <div className="lecturer-table-empty__content">
                              <Users className="lecturer-table-empty__icon" size={48} />
                              <h3 className="lecturer-table-empty__title">No lecturers found</h3>
                              <p className="lecturer-table-empty__message">
                                {filters.search || filters.department || filters.is_admin ? 
                                  'Try adjusting your filters' : 'No lecturers available'}
                              </p>
                              <button 
                                onClick={() => setFilters({
                                  department: '',
                                  is_admin: '',
                                  search: '',
                                  ordering: 'lecturer_id'
                                })}
                                className="lecturer-button lecturer-button--secondary"
                              >
                                Clear Filters
                              </button>
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
        </div>
      </div>
    </div>
  );
};

export default LecturerManagement;