import React, { useEffect, useState } from 'react';
import { Search, Filter, Calendar, Download, BarChart3, RefreshCw } from 'lucide-react';
import axios from 'axios';
import './AttendanceManagement.css';

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
  const [exporting, setExporting] = useState<string | null>(null);

  const fetchAttendanceRecords = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      const response = await axios.get<PaginatedResponse<AttendanceRecord>>(
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
      
      // Handle paginated response
      const data = response.data;
      if (data && typeof data === 'object' && 'results' in data) {
        setRecords(data.results || []);
      } else {
        console.error('Unexpected API response format:', data);
        setRecords([]);
        setError('Unexpected data format received from server');
      }
    } catch (err: unknown) {
      // Use AxiosError type guard
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { status?: number } }).response === 'object' &&
        (err as { response?: { status?: number } }).response !== null &&
        'status' in (err as { response?: { status?: number } }).response!
      ) {
        const status = (err as { response?: { status?: number } }).response!.status;
        if (status === 401) {
          setError('Authentication failed. Please login again.');
        } else if (status === 403) {
          setError('You do not have permission to view attendance records.');
        } else if (status === 404) {
          setError('Attendance endpoint not found.');
        } else {
          setError('Failed to load attendance records. Please try again.');
        }
      } else {
        setError('Failed to load attendance records. Please try again.');
      }
      console.error('Attendance fetch error:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, dateFilter]);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [fetchAttendanceRecords]);

  const exportAttendance = async (format: 'csv' | 'pdf') => {
    try {
      setExporting(format);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        alert('Authentication token not found. Please login again.');
        setExporting(null);
        return;
      }

      const response = await axios.get<Blob>(
        `http://127.0.0.1:8000/api/admin/attendance/export/?format=${format}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            search: searchTerm || undefined,
            status: statusFilter || undefined,
            date: dateFilter || undefined,
          },
          responseType: 'blob',
        }
      );

      // Create a blob link to download the file
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { status?: number } }).response === 'object' &&
        (err as { response?: { status?: number } }).response !== null &&
        'status' in (err as { response?: { status?: number } }).response!
      ) {
        const status = (err as { response?: { status?: number } }).response!.status;
        if (status === 401) {
          alert('Authentication failed. Please login again.');
        } else {
          alert('Failed to export attendance records');
        }
      } else {
        alert('Failed to export attendance records');
      }
      console.error('Export error:', err);
    } finally {
      setExporting(null);
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
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const handleApplyFilters = () => {
    fetchAttendanceRecords();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDateFilter('');
    // Don't fetch immediately, let user click Apply Filters
  };

  if (loading) {
    return (
      <div className="attendance-container">
        <div className="attendance-container__background">
          <div className="attendance-container__overlay"></div>
        </div>
        <div className="attendance-loading">
          <div className="attendance-loading__spinner"></div>
          <p className="attendance-loading__text">Loading attendance records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-container">
      <div className="attendance-container__background">
        <div className="attendance-container__overlay"></div>
      </div>
      
      <div className="attendance-content">
        {/* Header Section */}
        <header className="attendance-header">
          <div className="attendance-header__title-section">
            <h1 className="attendance-header__title">Attendance Overview</h1>
            <p className="attendance-header__subtitle">
              Monitor and manage student attendance records
            </p>
          </div>
          
          <div className="attendance-header__actions">
            <button 
              className={`attendance-button attendance-button--secondary ${exporting === 'csv' ? 'attendance-button--disabled' : ''}`}
              onClick={() => exportAttendance('csv')}
              disabled={exporting === 'csv'}
            >
              {exporting === 'csv' ? (
                <RefreshCw className="attendance-icon" />
              ) : (
                <Download className="attendance-icon" />
              )}
              {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
            </button>
            
            <button 
              className={`attendance-button attendance-button--secondary ${exporting === 'pdf' ? 'attendance-button--disabled' : ''}`}
              onClick={() => exportAttendance('pdf')}
              disabled={exporting === 'pdf'}
            >
              {exporting === 'pdf' ? (
                <RefreshCw className="attendance-icon" />
              ) : (
                <Download className="attendance-icon" />
              )}
              {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
            </button>
            
            <button className="attendance-button attendance-button--primary">
              <BarChart3 className="attendance-icon" />
              Analytics
            </button>
          </div>
        </header>

        {/* Filters Section */}
        <section className="attendance-filters">
          <div className="attendance-filters__card">
            <div className="attendance-filters__content">
              <div className="filter-group">
                <Search className="attendance-icon" />
                <input
                  type="text"
                  placeholder="Search students or sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="filter-input"
                  aria-label="Search students or sessions"
                />
              </div>

              <div className="filter-group">
                <Filter className="attendance-icon" />
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
                <Calendar className="attendance-icon" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="filter-input"
                  placeholder="Select date"
                  title="Filter by date"
                  aria-label="Filter by date"
                />
              </div>

              <div className="attendance-filters__actions">
                <button 
                  className="attendance-button attendance-button--primary"
                  onClick={handleApplyFilters}
                >
                  Apply Filters
                </button>
                
                <button 
                  className="attendance-button attendance-button--secondary"
                  onClick={handleClearFilters}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Error State */}
        {error && (
          <section className="attendance-error">
            <div className="attendance-error__card">
              <div className="attendance-error__content">
                <h3 className="attendance-error__title">Error Loading Data</h3>
                <p className="attendance-error__message">{error}</p>
                <button 
                  onClick={fetchAttendanceRecords} 
                  className="attendance-button attendance-button--primary"
                >
                  Try Again
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Attendance Table Section */}
        {!error && (
          <section className="attendance-table-section">
            <div className="attendance-table-card">
              <div className="attendance-table-container">
                <table className="attendance-table">
                  <thead className="attendance-table__head">
                    <tr>
                      <th className="attendance-table__header">Student ID</th>
                      <th className="attendance-table__header">Student Name</th>
                      <th className="attendance-table__header">Course</th>
                      <th className="attendance-table__header">Session</th>
                      <th className="attendance-table__header">Lecturer</th>
                      <th className="attendance-table__header">Check In</th>
                      <th className="attendance-table__header">Check Out</th>
                      <th className="attendance-table__header">Status</th>
                    </tr>
                  </thead>
                  <tbody className="attendance-table__body">
                    {records.length > 0 ? (
                      records.map((record) => (
                        <tr key={record.id} className="attendance-table__row">
                          <td className="attendance-table__cell attendance-table__cell--mono">
                            {record.student?.student_id || 'N/A'}
                          </td>
                          <td className="attendance-table__cell attendance-table__cell--name">
                            {record.student?.name || 'N/A'}
                          </td>
                          <td className="attendance-table__cell attendance-table__cell--code">
                            {record.session?.course?.code || 'N/A'}
                          </td>
                          <td className="attendance-table__cell">
                            {record.session?.class_name || 'N/A'}
                          </td>
                          <td className="attendance-table__cell">
                            {record.session?.lecturer?.name || 'N/A'}
                          </td>
                          <td className="attendance-table__cell attendance-table__cell--datetime">
                            {formatDateTime(record.check_in_time)}
                          </td>
                          <td className="attendance-table__cell attendance-table__cell--datetime">
                            {formatDateTime(record.check_out_time)}
                          </td>
                          <td className="attendance-table__cell attendance-table__cell--status">
                            <span className={getStatusBadgeClass(record.status)}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="attendance-table__row--empty">
                        <td 
                          colSpan={8} 
                          className="attendance-table__cell attendance-table__cell--empty"
                        >
                          <div className="attendance-empty">
                            <div className="attendance-empty__content">
                              <h3 className="attendance-empty__title">No Records Found</h3>
                              <p className="attendance-empty__message">
                                {searchTerm || statusFilter || dateFilter 
                                  ? 'No attendance records match your current filters' 
                                  : 'No attendance records available'
                                }
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
          </section>
        )}

        {/* Summary Stats */}
        {!error && records.length > 0 && (
          <section className="attendance-stats">
            <div className="attendance-stats__card">
              <div className="attendance-stats__content">
                <div className="stat-item">
                  <span className="stat-item__label">Total Records</span>
                  <span className="stat-item__value">{records.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-item__label">Present</span>
                  <span className="stat-item__value stat-item__value--present">
                    {records.filter(r => r.status.toLowerCase() === 'present').length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-item__label">Absent</span>
                  <span className="stat-item__value stat-item__value--absent">
                    {records.filter(r => r.status.toLowerCase() === 'absent').length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-item__label">Late</span>
                  <span className="stat-item__value stat-item__value--late">
                    {records.filter(r => r.status.toLowerCase() === 'late').length}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AttendanceManagement;