import React, { useState, useEffect } from 'react';
import { 
  Search,  
  Download, 
  Edit, 
  Trash2, 
  Plus,
  Eye
} from 'lucide-react';
import axios from 'axios';

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
    } catch (err) {
      setError('Failed to fetch lecturers');
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
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://localhost:8000/api/admin/lecturers/${lecturerId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLecturers(lecturers.filter(lecturer => lecturer.id !== lecturerId));
    } catch (err) {
      setError('Failed to delete lecturer');
      console.error('Error deleting lecturer:', err);
    }
  };

  if (loading) return <div className="admin-loading">Loading lecturers...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h2>Lecturer Management</h2>
        <p>Manage all lecturer records and permissions</p>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-filters__group">
          <div className="admin-filter">
            <label>Department</label>
            <select 
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

          <div className="admin-filter">
            <label>Admin Status</label>
            <select 
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

          <div className="admin-filter">
            <label htmlFor="sortBySelect">Sort By</label>
            <select 
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

        <div className="admin-search">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search lecturers..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
      </div>

      {/* Lecturers Table */}
      <div className="admin-table-container">
        <table className="admin-table">
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
                <tr key={lecturer.id}>
                  <td>{lecturer.lecturer_id}</td>
                  <td>{lecturer.name}</td>
                  <td>
                    <span className="department-badge">
                      {lecturer.department}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${lecturer.is_admin ? 'admin' : 'regular'}`}>
                      {lecturer.is_admin ? 'Admin' : 'Regular'}
                    </span>
                  </td>
                  <td>{lecturer.user?.email || 'N/A'}</td>
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
                        onClick={() => handleDeleteLecturer(lecturer.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="no-data-message">
                  No lecturers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-page__actions">
        <button className="admin-button admin-button--primary">
          <Plus size={20} />
          Add New Lecturer
        </button>
        
        <button className="admin-button admin-button--secondary">
          <Download size={20} />
          Export Data
        </button>
      </div>
    </div>
  );
};

export default LecturerManagement;