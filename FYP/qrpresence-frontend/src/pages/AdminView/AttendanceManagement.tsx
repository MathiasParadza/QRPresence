import React, { useEffect, useState } from 'react';
import { Search, Filter, Calendar, Download, BarChart3, RefreshCw, Brain, Sparkles, Loader2, Clock } from 'lucide-react';
import axios from 'axios';
import './AttendanceManagement.css';

interface AttendanceRecord {
  id: number;
  student: string;
  student_name: string;
  student_id: string;
  session: number;
  session_name: string;
  course_code: string;
  course_title: string;
  status: string;
  check_in_time: string;
  check_out_time: string | null;
  latitude: number;
  longitude: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface AIInsightsResponse {
  response: string;
}

interface ChatHistoryItem {
  query: string;
  response: string;
  timestamp: Date;
}

const suggestedQueries = [
  "Which students were absent last week?",
  "Show attendance trends for Course XYZ",
  "List students with more than 3 absences",
  "Average attendance per session",
  "Highlight late arrivals in the past month"
];

const AttendanceManagement: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);

  // AI Chat states
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);

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

      const data = response.data;
      if (data && 'results' in data) {
        setRecords(data.results || []);
      } else {
        console.error('Unexpected API response format:', data);
        setRecords([]);
        setError('Unexpected data format received from server');
      }
    } catch (err: unknown) {
      console.error('Attendance fetch error:', err);
      setRecords([]);
      setError('Failed to load attendance records. Please try again.');
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
          headers: { Authorization: `Bearer ${token}` },
          params: { search: searchTerm || undefined, status: statusFilter || undefined, date: dateFilter || undefined },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export attendance records');
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
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch {
      return '-';
    }
  };

  const handleApplyFilters = () => fetchAttendanceRecords();
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDateFilter('');
  };

  // AI Chat Handlers
  const handleAIQuery = async () => {
    if (!aiQuery.trim()) return;
    try {
      setAiLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Token missing');

      const res = await axios.post<AIInsightsResponse>(
        'http://127.0.0.1:8000/api/ai-chat/',
        { query: aiQuery },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }
      );

      const answer = res.data.response || 'No response from AI.';
      setAiResponse(answer);
      setChatHistory(prev => [...prev, { query: aiQuery, response: answer, timestamp: new Date() }]);
      setAiQuery('');
    } catch (err) {
      console.error('AI query error:', err);
      setAiResponse('Failed to get response from AI.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAIQuery();
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
              {exporting === 'csv' ? <RefreshCw className="attendance-icon" /> : <Download className="attendance-icon" />}
              {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
            </button>
            <button 
              className={`attendance-button attendance-button--secondary ${exporting === 'pdf' ? 'attendance-button--disabled' : ''}`}
              onClick={() => exportAttendance('pdf')}
              disabled={exporting === 'pdf'}
            >
              {exporting === 'pdf' ? <RefreshCw className="attendance-icon" /> : <Download className="attendance-icon" />}
              {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
            </button>
            <button 
              className="attendance-button attendance-button--primary"
              onClick={() => setShowAIChat(!showAIChat)}
            >
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
                      <th className="attendance-table__header">Check In</th>
                      <th className="attendance-table__header">Check Out</th>
                      <th className="attendance-table__header">Status</th>
                    </tr>
                  </thead>
                  <tbody className="attendance-table__body">
                    {records.length > 0 ? (
                      records.map(record => (
                        <tr key={record.id} className="attendance-table__row">
                          <td className="attendance-table__cell attendance-table__cell--mono">{record.student_id || 'N/A'}</td>
                          <td className="attendance-table__cell attendance-table__cell--name">{record.student_name || 'N/A'}</td>
                          <td className="attendance-table__cell attendance-table__cell--code">{record.course_code || 'N/A'}</td>
                          <td className="attendance-table__cell">{record.session_name || 'N/A'}</td>
                          <td className="attendance-table__cell attendance-table__cell--datetime">{formatDateTime(record.check_in_time)}</td>
                          <td className="attendance-table__cell attendance-table__cell--datetime">{formatDateTime(record.check_out_time)}</td>
                          <td className="attendance-table__cell attendance-table__cell--status">
                            <span className={getStatusBadgeClass(record.status)}>{record.status}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="attendance-table__row--empty">
                        <td colSpan={8} className="attendance-table__cell attendance-table__cell--empty">No Records Found</td>
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
                  <span className="stat-item__value stat-item__value--present">{records.filter(r => r.status.toLowerCase() === 'present').length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-item__label">Absent</span>
                  <span className="stat-item__value stat-item__value--absent">{records.filter(r => r.status.toLowerCase() === 'absent').length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-item__label">Late</span>
                  <span className="stat-item__value stat-item__value--late">{records.filter(r => r.status.toLowerCase() === 'late').length}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* AI Chat Section */}
        {showAIChat && (
          <section className="ai-chat-section">
            <div className="lecturer-card">
              <div className="ai-chat__header">
                <Brain className="lecturer-icon" />
                <h2 className="ai-chat__title">AI Attendance Insights</h2>
              </div>

              {/* Suggested Questions */}
              <div className="ai-chat__suggestions">
                <p className="ai-chat__suggestions-label">Popular questions:</p>
                <div className="ai-chat__suggestion-pills">
                  {suggestedQueries.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => setAiQuery(query)}
                      className="ai-suggestion-pill"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ai-chat__input-section">
                <input
                  type="text"
                  placeholder="Ask about attendance patterns, trends, or insights..."
                  className="ai-chat__input"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={aiLoading}
                />
                <button
                  onClick={handleAIQuery}
                  disabled={aiLoading || !aiQuery.trim()}
                  className={`lecturer-button lecturer-button--primary ${aiLoading || !aiQuery.trim() ? 'lecturer-button--disabled' : ''}`}
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="lecturer-icon lecturer-icon--spinning" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Sparkles className="lecturer-icon" />
                      Ask AI
                    </>
                  )}
                </button>
              </div>

              {aiResponse && (
                <div className="ai-chat__response">
                  <div className="ai-chat__response-header">
                    <Brain className="lecturer-icon" />
                    <span className="ai-chat__response-label">AI Insights:</span>
                  </div>
                  <div className="ai-chat__response-text">{aiResponse}</div>
                </div>
              )}

              {/* Chat History */}
              {chatHistory.length > 0 && (
                <div className="ai-chat__history">
                  <h3 className="ai-chat__history-title">
                    <Clock className="lecturer-icon" />
                    Recent Queries
                  </h3>
                  <div className="ai-chat__history-list">
                    {chatHistory.slice().reverse().map((chat, index) => (
                      <div key={index} className="ai-chat__history-item">
                        <p className="ai-chat__history-question">Q: {chat.query}</p>
                        <p className="ai-chat__history-answer">A: {chat.response}</p>
                        <p className="ai-chat__history-timestamp">{chat.timestamp.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default AttendanceManagement;
