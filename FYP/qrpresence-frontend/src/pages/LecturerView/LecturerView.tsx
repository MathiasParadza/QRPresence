import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Add useLocation
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { QrCodeSection } from './QrCodeSection';
import { Loader2, AlertCircle, Brain, Sparkles, BarChart3, Download, RefreshCw, Search, Filter, ChevronLeft, ChevronRight, Calendar, Users, BookOpen, Clock, LogOut } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './LecturerView.css';

interface AttendanceRecord {
  id: number;
  student?: {
    student_id?: string;
    user?: {
      username?: string;
    };
  };
  session?: {
    class_name?: string;
    course?: {
      code?: string;
      title?: string;
    };
  };
  status: string;
  check_in_time: string;
  check_out_time: string | null;
  latitude?: number;
  longitude?: number;
}

interface PaginatedResponse {
  results: AttendanceRecord[];
  count: number;
  next: string | null;
  previous: string | null;
  counts?: {
    total: number;
    present: number;
    absent: number;
    by_time_period: {
      today: number;
      this_week: number;
      this_month: number;
      this_year: number;
    };
  };
}

interface QrCodeItem {
  id: number;
  url: string;
  filename: string;
  name: string;
  session: string;
  created_at: string;
  expires_at: string | null;
  is_expired?: boolean;
}

interface QrCodeResponse {
  qr_codes: QrCodeItem[];
}

interface ChatHistoryItem {
  query: string;
  response: string;
  timestamp: Date;
}

interface Course {
  id: number;
  code: string;
  name: string;
}

interface AIInsightsResponse {
  answer: string;
}

interface NavigationState {
  activeTab?: string;
  qrCodeUrl?: string;
}

const LecturerView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Add useLocation hook
  const [activeTab, setActiveTab] = useState<string>('actions');
  const [qrCodes, setQrCodes] = useState<QrCodeItem[]>([]);
  const [attendanceReport, setAttendanceReport] = useState<AttendanceRecord[]>([]);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [aiQuery, setAiQuery] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [loadingQrCodes, setLoadingQrCodes] = useState<boolean>(true);
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);
  const [stats, setStats] = useState<PaginatedResponse['counts'] | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [courseFilter, setCourseFilter] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);
  const [courseError, setCourseError] = useState<string | null>(null);

  const suggestedQueries = [
    "What are the overall attendance statistics?",
    "Which courses have the best attendance rates?",
    "Show me students with low attendance",
    "What are the recent attendance trends?",
    "Compare attendance across different programs",
    "Which sessions had the highest absenteeism?",
    "Analyze attendance patterns by time of day"
  ];

  // Add useEffect to handle navigation state
  useEffect(() => {
    // Check if we have navigation state that indicates which tab to activate
    const state = location.state as NavigationState;
    if (state && state.activeTab) {
      setActiveTab(state.activeTab);
      
      // Clear the state to prevent the tab from switching on every render
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Add this function to handle QR code generation success
 const navigateToGenerateQr = () => {
  navigate('/generate-qr', { 
    state: { 
      returnToTab: 'qrcode'  // ← Pass a STRING instead of function
    } 
  });
};

  const fetchQrCodes = async () => {
    setLoadingQrCodes(true);
    setQrCodeError(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get<QrCodeResponse>('http://127.0.0.1:8000/api/qr-codes/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setQrCodes(res.data.qr_codes || []);
    } catch (err) {
      console.error('Failed to load QR codes', err);
      setQrCodeError('Failed to load QR codes. Please try again later.');
    } finally {
      setLoadingQrCodes(false);
    }
  };

  useEffect(() => {
    fetchQrCodes();
  }, []);

  const fetchAttendanceRecord = React.useCallback(async (): Promise<void> => {
    setLoadingReport(true);
    setError(null);

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('No access token found');
      setLoadingReport(false);
      return;
    }

    try {
      const params: {
        page: number;
        search?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
        course_id?: string;
      } = {
        page: currentPage,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      };

      if (dateFilter) {
        params.date_from = dateFilter;
        params.date_to = dateFilter;
      }

      if (courseFilter) {
        params.course_id = courseFilter;
      }

      const response = await axios.get<PaginatedResponse>('http://127.0.0.1:8000/api/lecturer-attendance/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });
      
      // Handle both nested and flat response structures
      let actualResults: AttendanceRecord[] = [];
      let actualCounts: PaginatedResponse['counts'] = undefined;
      let actualTotalCount: number = 0;

      // Check if the response has the nested structure (results.results and results.counts)
      if (response.data.results && typeof response.data.results === 'object' && 'results' in response.data.results) {
        actualResults = (response.data.results as { results: AttendanceRecord[]; counts?: PaginatedResponse['counts'] }).results || [];
        actualCounts = (response.data.results as { results: AttendanceRecord[]; counts?: PaginatedResponse['counts'] }).counts || undefined;
        actualTotalCount = response.data.count || 0;
      } else {
        // Flat structure (results and counts at top level)
        actualResults = response.data.results || [];
        actualCounts = response.data.counts || undefined;
        actualTotalCount = response.data.count || 0;
      }
      
      setAttendanceReport(actualResults);
      setTotalRecords(actualTotalCount);
      setTotalPages(Math.ceil(actualTotalCount / 10));
      
      if (actualCounts) {
        setStats(actualCounts);
      } else {
        setStats(null); // Clear stats if not available
      }
    } catch (err: unknown) {
      console.error('Failed to load attendance report:', err);
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const errorObj = err as { response?: { data?: { detail?: string } } };
        setError(errorObj.response?.data?.detail || 'Failed to load attendance report.');
      } else {
        setError('Failed to load attendance report.');
      }
      setStats(null); // Clear stats on error
    } finally {
      setLoadingReport(false);
    }
  }, [currentPage, searchTerm, statusFilter, dateFilter, courseFilter]);

  useEffect(() => {
    fetchAttendanceRecord();
  }, [searchTerm, statusFilter, currentPage, dateFilter, courseFilter, fetchAttendanceRecord]);

  
  const exportCsv = (): void => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('No access token found');
      return;
    }

    const query = new URLSearchParams();
    if (searchTerm) query.append('search', searchTerm);
    if (statusFilter) query.append('status', statusFilter);
    if (dateFilter) {
      query.append('date_from', dateFilter);
      query.append('date_to', dateFilter);
    }
    if (courseFilter) query.append('course_id', courseFilter);

    const url = `http://127.0.0.1:8000/api/lecturer-attendance/export-csv/?${query.toString()}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('target', '_blank');
    link.setAttribute('download', `attendance-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteQrCode = async (id: number) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('No access token found');
        return;
      }

      await axios.delete(`http://127.0.0.1:8000/api/qr-codes/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setQrCodes(prev => prev.filter(qr => qr.id !== id));
      toast.success('QR code deleted successfully!');
    } catch (err) {
      console.error('Failed to delete QR code:', err);
      toast.error('Failed to delete QR code. Please try again.');
    }
  };

  const handleRefreshQrCodes = async () => {
    await fetchQrCodes();
    toast.info('QR codes refreshed!');
  };

  const handleLogout = (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const handleAIQuery = async () => {
    if (!aiQuery.trim()) return;
    
    setAiLoading(true);
    setAiResponse('');
    const token = localStorage.getItem('access_token');
    
    try {
      const res = await axios.post<AIInsightsResponse>(
        'http://127.0.0.1:8000/api/ai-chat/',
        { query: aiQuery },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      setAiResponse(res.data.answer);
      
      setChatHistory(prev => [...prev, { 
        query: aiQuery, 
        response: res.data.answer,
        timestamp: new Date()
      }]);
      
    } catch (error: unknown) {
      console.error('AI query error:', error);

      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { status?: number } }).response?.status === 'number'
      ) {
        const status = (error as { response?: { status?: number } }).response?.status;
        if (status === 401) {
          setAiResponse('Please login again to use AI features.');
        } else if (status === 400) {
          setAiResponse('Please provide a valid question.');
        } else {
          setAiResponse('Sorry, I encountered an error. Please try again later.');
        }
      } else {
        setAiResponse('Sorry, I encountered an error. Please try again later.');
      }
    } finally {
      setAiLoading(false);
      setAiQuery('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAIQuery();
    }
  };

  const fetchCourses = async () => {
    setLoadingCourses(true);
    setCourseError(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get<{ results: Course[] }>('http://127.0.0.1:8000/api/lecturer/courses/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setCourses(res.data.results || []);
    } catch (err) {
      console.error('Failed to load courses', err);
      setCourseError('Failed to load courses. Please try again later.');
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDateFilter('');
    setCourseFilter('');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'status-badge status-badge--present';
      case 'absent':
        return 'status-badge status-badge--absent';
      case 'late':
        return 'status-badge status-badge--late';
      default:
        return 'status-badge status-badge--default';
    }
  };

  const handleDownloadQrCode = (id?: number): void => {
    if (!id) return;
    const token = localStorage.getItem('access_token');
    const url = `http://127.0.0.1:8000/api/qr-codes/${id}/download/`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('target', '_blank');
    if (token) {
      fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => response.blob())
        .then(blob => {
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `qr-code-${id}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(downloadUrl);
        })
        .catch(() => {
          alert('Failed to download QR code. Please try again.');
        });
    } else {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="lecturer-container">
      <div className="lecturer-content">
        {/* Header */}
        <div className="lecturer-header">
          <div className="lecturer-header__content">
            <div className="lecturer-header__text">
              <h1>Lecturer Dashboard</h1>
              <p>Manage attendance, generate QR codes, and analyze data with AI insights</p>
            </div>
            <button
              onClick={handleLogout}
              className="lecturer-button lecturer-button--danger"
            >
              <LogOut className="lecturer-icon" />
              Logout
            </button>
          </div>
        </div>

        {/* AI Chat Section */}
        <div className="lecturer-card ai-chat-section">
          <div className="ai-chat__header">
            <div className="ai-chat__icon">
              <Brain className="lecturer-icon" />
            </div>
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
                <div className="ai-chat__response-icon">
                  <Brain className="lecturer-icon" />
                </div>
                <span className="ai-chat__response-label">AI Insights:</span>
              </div>
              <div className="ai-chat__response-text">
                {aiResponse}
              </div>
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
                    <p className="ai-chat__history-timestamp">
                      {chat.timestamp.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Statistics Overview Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stats-card stats-card--purple">
              <div className="stats-card__content">
                <div className="stats-card__info">
                  <span className="stats-card__label">Total Records</span>
                  <span className="stats-card__value">{stats.total}</span>
                </div>
                <div className="stats-card__icon">
                  <BarChart3 className="lecturer-icon" />
                </div>
              </div>
            </div>

            <div className="stats-card stats-card--emerald">
              <div className="stats-card__content">
                <div className="stats-card__info">
                  <span className="stats-card__label">Present</span>
                  <span className="stats-card__value">{stats.present}</span>
                </div>
                <div className="stats-card__icon">
                  <Users className="lecturer-icon" />
                </div>
              </div>
            </div>

            <div className="stats-card stats-card--rose">
              <div className="stats-card__content">
                <div className="stats-card__info">
                  <span className="stats-card__label">Absent</span>
                  <span className="stats-card__value">{stats.absent}</span>
                </div>
                <div className="stats-card__icon">
                  <AlertCircle className="lecturer-icon" />
                </div>
              </div>
            </div>

            <div className="stats-card stats-card--blue">
              <div className="stats-card__content">
                <div className="stats-card__info">
                  <span className="stats-card__label">Today</span>
                  <span className="stats-card__value">{stats.by_time_period?.today || 0}</span>
                </div>
                <div className="stats-card__icon">
                  <Calendar className="lecturer-icon" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="lecturer-card main-content-card">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="lecturer-tabs">
            <TabsList className="lecturer-tabs__list">
              <TabsTrigger value="actions" className="lecturer-tabs__trigger">
                <Sparkles className="lecturer-icon" />
                Actions
              </TabsTrigger>
              <TabsTrigger value="qrcode" className="lecturer-tabs__trigger">
                QR Codes
              </TabsTrigger>
              <TabsTrigger value="stats" className="lecturer-tabs__trigger">
                <BarChart3 className="lecturer-icon" />
                Statistics
              </TabsTrigger>
            </TabsList>

            {/* Actions Tab */}
            <TabsContent value="actions">
              <div className="actions-grid">
                <div className="action-card action-card--purple">
                  <div className="action-card__header">
                    <div className="action-card__icon">
                      <Sparkles className="lecturer-icon" />
                    </div>
                    <h3 className="action-card__title">Generate Attendance QR</h3>
                  </div>
                  <button
                    onClick={navigateToGenerateQr}
                    className="action-card__button"
                  >
                    📷 Generate QR Code
                  </button>
                </div>

                <div className="action-card action-card--blue">
                  <div className="action-card__header">
                    <div className="action-card__icon">
                      <BookOpen className="lecturer-icon" />
                    </div>
                    <h3 className="action-card__title">Course Management</h3>
                  </div>
                  <button
                    onClick={() => navigate('/manage-courses')}
                    className="action-card__button"
                  >
                    📚 Manage Courses
                  </button>
                </div>

                <div className="action-card action-card--emerald">
                  <div className="action-card__header">
                    <div className="action-card__icon">
                      <Users className="lecturer-icon" />
                    </div>
                    <h3 className="action-card__title">Enrollment Manager</h3>
                  </div>
                  <button
                    onClick={() => navigate('/enroll-students')}
                    className="action-card__button"
                  >
                    📝 Enroll Students
                  </button>
                </div>
                
                <div className="action-card action-card--emerald">
                  <div className="action-card__header">
                    <div className="action-card__icon">
                      <Clock className="lecturer-icon" />
                    </div>
                    <h3 className="action-card__title">Session Management</h3>
                  </div>
                  <div className="action-card__actions">
                    <button
                      onClick={() => navigate('/create-session')}
                      className="action-card__button"
                    >
                      🔧 Create Session
                    </button>
                    <button
                      onClick={() => navigate('/session-list')}
                      className="action-card__button"
                    >
                      📋 View Sessions
                    </button>
                  </div>
                </div>

                <div className="action-card action-card--indigo">
                  <div className="action-card__header">
                    <div className="action-card__icon">
                      <Users className="lecturer-icon" />
                    </div>
                    <h3 className="action-card__title">Students Management</h3>
                  </div>
                  <button
                    onClick={() => navigate('/student-manager')}
                    className="action-card__button"
                  >
                    🎓 Manage Students
                  </button>
                </div>

                <div className="action-card action-card--slate">
                  <div className="action-card__header">
                    <div className="action-card__icon">
                      <Download className="lecturer-icon" />
                    </div>
                    <h3 className="action-card__title">Quick Reports</h3>
                  </div>
                  <button
                    onClick={exportCsv}
                    className="action-card__button"
                  >
                    📊 Export Report
                  </button>
                </div>
              </div>
            </TabsContent>

            {/* QR Code Tab */}
            <TabsContent value="qrcode">
              {loadingQrCodes ? (
                <div className="lecturer-loading">
                  <div className="lecturer-loading__spinner"></div>
                  <p className="lecturer-loading__text">Loading QR codes...</p>
                </div>
              ) : qrCodeError ? (
                <div className="lecturer-error">
                  <div className="lecturer-error__icon">
                    <AlertCircle className="lecturer-icon" />
                  </div>
                  <h3 className="lecturer-error__title">Error</h3>
                  <p className="lecturer-error__message">{qrCodeError}</p>
                  <button
                    onClick={handleRefreshQrCodes}
                    className="lecturer-button lecturer-button--primary"
                  >
                    <RefreshCw className="lecturer-icon" />
                    Retry
                  </button>
                </div>
              ) : (
                <QrCodeSection
                  qrCodes={qrCodes}
                  latestQrCode={qrCodes.length > 0 ? qrCodes[0] : null}
                  onDownload={handleDownloadQrCode}
                  onDelete={handleDeleteQrCode}
                  onRefresh={handleRefreshQrCodes}
                />
              )}
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="stats">
              {/* Enhanced Filters */}
              <div className="filters-section">
                <h3 className="filters-section__title">
                  <Filter className="lecturer-icon" />
                  Advanced Filters
                </h3>

                <div className="filters-grid">
                  <div className="filter-group">
                    <label htmlFor="search" className="filter-label">
                      <Search className="lecturer-icon" />
                      Search Students
                    </label>
                    <input
                      id="search"
                      type="text"
                      placeholder="Search students or sessions..."
                      className="filter-input"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="filter-group">
                    <label htmlFor="status-filter" className="filter-label">
                      <AlertCircle className="lecturer-icon" />
                      Attendance Status
                    </label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="filter-input"
                    >
                      <option value="">All Statuses</option>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label htmlFor="date-filter" className="filter-label">
                      <Calendar className="lecturer-icon" />
                      Filter by Date
                    </label>
                    <input
                      id="date-filter"
                      type="date"
                      className="filter-input"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                  </div>

                  <div className="filter-group">
                    <label htmlFor="course-filter" className="filter-label">
                      <BookOpen className="lecturer-icon" />
                      Course Filter
                    </label>
                    <select
                      id="course-filter"
                      value={courseFilter}
                      onChange={(e) => setCourseFilter(e.target.value)}
                      className="filter-input"
                      disabled={loadingCourses}
                    >
                      <option value="">All Courses</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id.toString()}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                    {courseError && <p className="filter-error">{courseError}</p>}
                  </div>
                </div>

                <div className="filters-actions">
                  <div className="filters-buttons">
                    <button
                      onClick={clearFilters}
                      className="lecturer-button lecturer-button--secondary"
                    >
                      Clear Filters
                    </button>
                    <button
                      onClick={exportCsv}
                      className="lecturer-button lecturer-button--primary"
                    >
                      <Download className="lecturer-icon" />
                      Export CSV
                    </button>
                  </div>

                  {totalRecords > 0 && (
                    <div className="filters-info">
                      <span className="filters-info__text">
                        Showing {attendanceReport.length} of {totalRecords} records
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Table */}
              <div className="table-container">
                {loadingReport ? (
                  <div className="lecturer-loading">
                    <div className="lecturer-loading__spinner"></div>
                    <p className="lecturer-loading__text">Loading attendance records...</p>
                  </div>
                ) : error ? (
                  <div className="lecturer-error">
                    <div className="lecturer-error__icon">
                      <AlertCircle className="lecturer-icon" />
                    </div>
                    <h3 className="lecturer-error__title">Error</h3>
                    <p className="lecturer-error__message">{error}</p>
                    <button
                      onClick={fetchAttendanceRecord}
                      className="lecturer-button lecturer-button--primary"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="attendance-table">
                      <thead className="attendance-table__header">
                        <tr>
                          <th>Student ID</th>
                          <th>Student Name</th>
                          <th>Course</th>
                          <th>Session</th>
                          <th>Check In</th>
                          <th>Check Out</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody className="attendance-table__body">
                        {attendanceReport.length > 0 ? (
                          attendanceReport.map((record, index) => (
                            <tr
                              key={`${record.id}-${record.check_in_time}`}
                              className={`attendance-table__row ${index % 2 === 0 ? 'attendance-table__row--even' : 'attendance-table__row--odd'}`}
                            >
                              <td>{record.student?.student_id || 'N/A'}</td>
                              <td>{record.student?.user?.username || 'N/A'}</td>
                              <td>{record.session?.course?.code || 'N/A'}</td>
                              <td>{record.session?.class_name || 'N/A'}</td>
                              <td>{record.check_in_time ? formatDate(record.check_in_time) : '-'}</td>
                              <td>{record.check_out_time ? formatDate(record.check_out_time) : '-'}</td>
                              <td>
                                <span className={getStatusBadgeClass(record.status)}>
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="attendance-table__empty">
                              <div className="attendance-table__empty-content">
                                <Search className="attendance-table__empty-icon" />
                                <p className="attendance-table__empty-text">No attendance records found</p>
                                <p className="attendance-table__empty-subtext">Try adjusting your filters or search terms</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`pagination-button pagination-button--prev ${currentPage === 1 ? 'pagination-button--disabled' : ''}`}
                  >
                    <ChevronLeft className="pagination-icon" />
                    Previous
                  </button>

                  <div className="pagination-info">
                    <span className="pagination-info__text">
                      Page {currentPage} of {totalPages}
                    </span>
                    <span className="pagination-info__divider">•</span>
                    <span className="pagination-info__count">{totalRecords} total records</span>
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`pagination-button pagination-button--next ${currentPage === totalPages ? 'pagination-button--disabled' : ''}`}
                  >
                    Next
                    <ChevronRight className="pagination-icon" />
                  </button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add Toast Container */}
      <ToastContainer 
        position="top-right" 
        autoClose={3000}
        toastStyle={{
          background: 'rgba(131, 13, 228, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      />
    </div>
  );
};

export default LecturerView;