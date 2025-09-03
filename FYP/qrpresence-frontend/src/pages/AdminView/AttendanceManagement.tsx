import React, { useEffect, useState } from 'react';
import { Search, Filter, Calendar, Download, BarChart3 } from 'lucide-react';
import axios from 'axios';

interface Course {
  code: string;
  title: string;
}

interface Lecturer {
  name: string;
}

interface Session {
  class_name: string;
  course?: Course;
  lecturer?: Lecturer;
}

interface Student {
  student_id: string;
  name: string;
}

interface AttendanceRecord {
  id: number;
  student: Student;
  session: Session;
  status: string;
  check_in_time: string;
  check_out_time: string | null;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const AttendanceManagement: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchAttendanceRecords = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      const response = await axios.get<AttendanceRecord[] | PaginatedResponse<AttendanceRecord>>(
        'http://127.0.0.1:8000/api/admin/attendance/',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            search: searchTerm || undefined,
            status: statusFilter || undefined,
            date: dateFilter || undefined,
          },
        }
      );
      
      // Handle both array and paginated responses
      const data = response.data;
      if (Array.isArray(data)) {
        setRecords(data);
      } else if (data && typeof data === 'object' && 'results' in data) {
        setRecords(data.results || []);
      } else {
        console.error('Unexpected API response format:', data);
        setRecords([]);
      }
    } catch (err) {
      setError('Failed to load attendance records');
      console.error('Attendance fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, dateFilter]);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [fetchAttendanceRecords]);

  const exportAttendance = async (format: 'csv' | 'pdf') => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `http://127.0.0.1:8000/api/admin/attendance/export/?format=${format}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      );

      // Create a blob link to download the file
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export attendance records');
      console.error('Export error:', err);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present': return 'status-badge status-badge--present';
      case 'absent': return 'status-badge status-badge--absent';
      case 'late': return 'status-badge status-badge--late';
      default: return 'status-badge status-badge--default';
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading__spinner"></div>
        <p>Loading attendance records...</p>
      </div>
    );
  }

  return (
    <div className="attendance-overview">
      <div className="attendance-overview__header">
        <h2>Attendance Overview</h2>
        <div className="attendance-overview__actions">
          <button 
            className="admin-button admin-button--secondary"
            onClick={() => exportAttendance('csv')}
          >
            <Download size={16} />
            Export CSV
          </button>
          <button 
            className="admin-button admin-button--secondary"
            onClick={() => exportAttendance('pdf')}
          >
            <Download size={16} />
            Export PDF
          </button>
          <button className="admin-button admin-button--primary">
            <BarChart3 size={16} />
            Analytics
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="attendance-overview__filters">
        <div className="filter-group">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search students or sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <Filter size={18} />
          <select
            aria-label="Filter by attendance status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-input"
          >
            <option value="">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
        </div>

        <div className="filter-group">
          <Calendar size={18} />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-input"
            placeholder="Select date"
            title="Filter by date"
          />
        </div>

        <button 
          className="admin-button admin-button--primary"
          onClick={fetchAttendanceRecords}
        >
          Apply Filters
        </button>
      </div>

      {error && (
        <div className="admin-error">
          <p>{error}</p>
          <button onClick={fetchAttendanceRecords} className="admin-button admin-button--primary">
            Retry
          </button>
        </div>
      )}

      {/* Attendance Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Student Name</th>
              <th>Course</th>
              <th>Session</th>
              <th>Lecturer</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? (
              records.map((record) => (
                <tr key={record.id}>
                  <td>{record.student?.student_id || 'N/A'}</td>
                  <td>{record.student?.name || 'N/A'}</td>
                  <td>{record.session?.course?.code || 'N/A'}</td>
                  <td>{record.session?.class_name || 'N/A'}</td>
                  <td>{record.session?.lecturer?.name || 'N/A'}</td>
                  <td>{formatDateTime(record.check_in_time)}</td>
                  <td>{formatDateTime(record.check_out_time)}</td>
                  <td>
                    <span className={getStatusBadgeClass(record.status)}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr key="no-data">
                <td colSpan={8} className="no-data-message">
                  No attendance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceManagement;