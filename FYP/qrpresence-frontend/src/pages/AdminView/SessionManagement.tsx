import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  Plus,
  Eye,
  Clock,
  User
} from 'lucide-react';
import axios from 'axios';

type Session = {
  id: number;
  session_id: string;
  class_name: string;
  course?: {
    id: number;
    code: string;
    title: string;
  };
  lecturer?: {
    id: number;
    name: string;
    lecturer_id: string;
  };
  timestamp?: string;
  start_time?: string;
  end_time?: string;
  qr_codes?: { id: number; code: string; created_at?: string }[];
};

type Course = {
  id: number;
  code: string;
  title: string;
};

type Lecturer = {
  id: number;
  name: string;
  lecturer_id: string;
};

const SessionManagement = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    course: '',
    lecturer: '',
    search: '',
    ordering: 'timestamp'
  });

  const fetchCourses = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get<Course[]>('http://localhost:8000/api/admin/courses/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCourses(response.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  }, []);

  const fetchLecturers = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get<Lecturer[]>('http://localhost:8000/api/admin/lecturers/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLecturers(response.data);
    } catch (err) {
      console.error('Error fetching lecturers:', err);
    }
  }, []);

  const fetchSessions = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      
      if (filters.course) params.append('course', filters.course);
      if (filters.lecturer) params.append('lecturer', filters.lecturer);
      if (filters.search) params.append('search', filters.search);
      if (filters.ordering) params.append('ordering', filters.ordering);

      const response = await axios.get<Session[]>(`http://localhost:8000/api/admin/sessions/?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSessions(response.data);
    } catch (err) {
      setError('Failed to fetch sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSessions();
    fetchCourses();
    fetchLecturers();
  }, [fetchSessions, fetchCourses, fetchLecturers]);

interface FilterState {
    course: string;
    lecturer: string;
    search: string;
    ordering: string;
}

type FilterKey = keyof FilterState;

const handleFilterChange = (key: FilterKey, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
};

interface DeleteSessionParams {
    sessionId: number;
}

const handleDeleteSession = async (sessionId: DeleteSessionParams['sessionId']): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    
    try {
        const token = localStorage.getItem('access_token');
        await axios.delete(`http://localhost:8000/api/admin/sessions/${sessionId}/`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        setSessions(sessions.filter((session: Session) => session.id !== sessionId));
    } catch (err) {
        setError('Failed to delete session');
        console.error('Error deleting session:', err);
    }
};

interface FormatSessionDurationParams {
    startTime?: string;
    endTime?: string;
}

const formatSessionDuration = (
    startTime: FormatSessionDurationParams['startTime'],
    endTime: FormatSessionDurationParams['endTime']
): string => {
    if (!startTime || !endTime) return 'N/A';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
};

  if (loading) return <div className="admin-loading">Loading sessions...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h2>Session Management</h2>
        <p>Manage all class sessions and attendance tracking</p>
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
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter">
            <label htmlFor="lecturer-select">Lecturer</label>
            <select 
              id="lecturer-select"
              value={filters.lecturer} 
              onChange={(e) => handleFilterChange('lecturer', e.target.value)}
            >
              <option value="">All Lecturers</option>
              {lecturers.map(lecturer => (
                <option key={lecturer.id} value={lecturer.id}>
                  {lecturer.name} ({lecturer.lecturer_id})
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter">
            <label htmlFor="sort-by-select">Sort By</label>
            <select 
              id="sort-by-select"
              value={filters.ordering} 
              onChange={(e) => handleFilterChange('ordering', e.target.value)}
            >
              <option value="timestamp">Session Date</option>
              <option value="-timestamp">Session Date (Desc)</option>
              <option value="class_name">Class Name</option>
              <option value="-class_name">Class Name (Desc)</option>
            </select>
          </div>
        </div>

        <div className="admin-search">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search sessions..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
      </div>

      {/* Sessions Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Session ID</th>
              <th>Class Name</th>
              <th>Course</th>
              <th>Lecturer</th>
              <th>Session Date</th>
              <th>Duration</th>
              <th>QR Code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td>
                  <span className="session-id">
                    {session.session_id}
                  </span>
                </td>
                <td>{session.class_name}</td>
                <td>
                  {session.course && (
                    <span className="course-info">
                      {session.course.code} - {session.course.title}
                    </span>
                  )}
                </td>
                <td>
                  {session.lecturer && (
                    <span className="lecturer-info">
                      <User size={14} />
                      {session.lecturer.name}
                    </span>
                  )}
                </td>
                <td>
                  {session.timestamp && (
                    <span className="session-date">
                      {new Date(session.timestamp).toLocaleDateString()}
                      <br />
                      <small className="text-muted">
                        {new Date(session.timestamp).toLocaleTimeString()}
                      </small>
                    </span>
                  )}
                </td>
                <td>
                  <span className="session-duration">
                    <Clock size={14} />
                    {formatSessionDuration(session.start_time, session.end_time)}
                  </span>
                </td>
                <td>
                  {session.qr_codes && session.qr_codes.length > 0 ? (
                    <span className="qr-status qr-status--active">
                      Active ({session.qr_codes.length})
                    </span>
                  ) : (
                    <span className="qr-status qr-status--inactive">
                      No QR
                    </span>
                  )}
                </td>
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
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sessions.length === 0 && (
          <div className="admin-empty-state">
            <Calendar size={48} />
            <p>No sessions found</p>
          </div>
        )}
      </div>

      <div className="admin-page__actions">
        <button className="admin-button admin-button--primary">
          <Plus size={20} />
          Create New Session
        </button>
        
        <button className="admin-button admin-button--secondary">
          <Download size={20} />
          Export Data
        </button>
      </div>
    </div>
  );
};

export default SessionManagement;