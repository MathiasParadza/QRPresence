import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { QrCodeSection } from './QrCodeSection';
import { Loader2, AlertCircle, Brain, Sparkles, BarChart3, Download, RefreshCw, Search, Filter, ChevronLeft, ChevronRight, Calendar, Users, BookOpen, Clock, LogOut } from 'lucide-react';

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

const LecturerView: React.FC = () => {
  const navigate = useNavigate();
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
  interface StatsType {
    total: number;
    present: number;
    absent: number;
    by_time_period: {
      today: number;
      this_week: number;
      this_month: number;
      this_year: number;
    };
  }
  const [stats, setStats] = useState<StatsType | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [courseFilter, setCourseFilter] = useState<string>('');

  // Suggested AI queries
  const suggestedQueries = [
    "What are the overall attendance statistics?",
    "Which courses have the best attendance rates?",
    "Show me students with low attendance",
    "What are the recent attendance trends?",
    "Compare attendance across different programs",
    "Which sessions had the highest absenteeism?",
    "Analyze attendance patterns by time of day"
  ];

  // Fetch QR codes
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

  // Fetch attendance records
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
      
      setAttendanceReport(response.data.results);
      setTotalRecords(response.data.count || 0);
      setTotalPages(Math.ceil((response.data.count || 0) / 10));
      
      if (response.data.counts) {
        setStats(response.data.counts);
      }
    } catch (err: unknown) {
      console.error('Failed to load attendance report:', err);
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const errorObj = err as { response?: { data?: { detail?: string } } };
        setError(errorObj.response?.data?.detail || 'Failed to load attendance report.');
      } else {
        setError('Failed to load attendance report.');
      }
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

      await axios.delete(`http://127.0.0.1:8000/api/qr-codes/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setQrCodes(prev => prev.filter(qr => qr.id !== id));
    } catch (err) {
      console.error('Failed to delete QR code:', err);
      alert('Failed to delete QR code. Please try again.');
    }
  };

  const handleRefreshQrCodes = async () => {
    await fetchQrCodes();
  };

  const handleLogout = (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  interface AIInsightsResponse {
    answer: string;
  }

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
      
      // Add to chat history
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

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDateFilter('');
    setCourseFilter('');
    setCurrentPage(1);
  };

  // Format date for display
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
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm';
      case 'absent':
        return 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm';
      case 'late':
        return 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200 shadow-sm';
    }
  };


  function handleDownloadQrCode(id?: number): void {
    if (!id) return;
    const token = localStorage.getItem('access_token');
    const url = `http://127.0.0.1:8000/api/qr-codes/${id}/download/`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('target', '_blank');
    if (token) {
      // If you want to send the token, you need to use fetch instead of a direct link
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
      // If no token, just open the link
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-6 sm:p-8 mb-8 border border-white/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Lecturer Dashboard
              </h1>
              <p className="text-slate-600 text-lg font-medium">
                Manage attendance, generate QR codes, and analyze data with AI insights
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 self-start lg:self-auto"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* AI Chat Section */}
        <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-6 sm:p-8 mb-8 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              AI Attendance Insights
            </h2>
          </div>
          
          {/* Suggested Questions */}
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-600 mb-3">Popular questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => setAiQuery(query)}
                  className="text-xs bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 px-4 py-2 rounded-full hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 border border-indigo-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-stretch mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Ask about attendance patterns, trends, or insights..."
                className="w-full border-2 border-slate-200 rounded-xl px-6 py-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/70 backdrop-blur-sm text-slate-900 placeholder-slate-500 font-medium shadow-sm"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={aiLoading}
              />
            </div>
            <button
              onClick={handleAIQuery}
              disabled={aiLoading || !aiQuery.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 min-w-[160px] justify-center"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Ask AI
                </>
              )}
            </button>
          </div>
          
          {aiResponse && (
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-100 rounded-2xl p-6 shadow-inner">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-slate-800 text-lg">AI Insights:</span>
              </div>
              <div className="text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                {aiResponse}
              </div>
            </div>
          )}

          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="mt-8 pt-6 border-t-2 border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Queries
              </h3>
              <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
                {chatHistory.slice().reverse().map((chat, index) => (
                  <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <p className="text-sm font-semibold text-blue-800 mb-2">Q: {chat.query}</p>
                    <p className="text-sm text-blue-700 mb-3 line-clamp-3">A: {chat.response}</p>
                    <p className="text-xs text-blue-500 font-medium">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Total Records</p>
                  <p className="text-3xl font-bold text-purple-700">{stats.total}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-emerald-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Present</p>
                  <p className="text-3xl font-bold text-emerald-700">{stats.present}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-rose-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Absent</p>
                  <p className="text-3xl font-bold text-rose-700">{stats.absent}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl shadow-lg">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Today</p>
                  <p className="text-3xl font-bold text-blue-700">{stats.by_time_period?.today || 0}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-6 sm:p-8 border border-white/20">
          <Tabs defaultValue="actions" className="w-full">
            <TabsList className="grid grid-cols-3 gap-2 bg-slate-100/80 backdrop-blur-sm border-2 border-slate-200 rounded-2xl p-2 mb-8 shadow-inner">
              <TabsTrigger
                value="actions"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg bg-white/70 text-slate-700 hover:bg-white/90 transition-all duration-300 rounded-xl py-4 font-bold text-sm sm:text-base transform hover:scale-105"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Actions
              </TabsTrigger>
              <TabsTrigger
                value="qrcode"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg bg-white/70 text-slate-700 hover:bg-white/90 transition-all duration-300 rounded-xl py-4 font-bold text-sm sm:text-base transform hover:scale-105"
              >
                QR Codes
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg bg-white/70 text-slate-700 hover:bg-white/90 transition-all duration-300 rounded-xl py-4 font-bold text-sm sm:text-base transform hover:scale-105"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Statistics
              </TabsTrigger>
            </TabsList>

            {/* Actions Tab */}
            <TabsContent value="actions">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <div className="group bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Generate Attendance QR</h3>
                  </div>
                  <button
                    onClick={() => navigate('/generate-qr')}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
                  >
                    📷 Generate QR Code
                  </button>
                </div>

                <div className="group bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-teal-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Course Management</h3>
                  </div>
                  <button
                    onClick={() => navigate('/manage-courses')}
                    className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
                  >
                    📚 Manage Courses
                  </button>
                </div>

                <div className="group bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Enrollment Manager</h3>
                  </div>
                  <button
                    onClick={() => navigate('/enroll-students')}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
                  >
                    📝 Enroll Students
                  </button>
                </div>
                
                <div className="group bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Session Management</h3>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/create-session')}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
                    >
                      🔧 Create Session
                    </button>
                    <button
                      onClick={() => navigate('/session-list')}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
                    >
                      📋 View Sessions
                    </button>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Students Management</h3>
                  </div>
                  <button
                    onClick={() => navigate('/student-manager')}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
                  >
                    🎓 Manage Students
                  </button>
                </div>

                <div className="group bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 border-2 border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-slate-600 to-zinc-700 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Download className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Quick Reports</h3>
                  </div>
                  <button
                    onClick={exportCsv}
                    className="w-full bg-gradient-to-r from-slate-600 to-zinc-700 hover:from-slate-700 hover:to-zinc-800 text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
                  >
                    📊 Export Report
                  </button>
                </div>
              </div>
            </TabsContent>

            {/* QR Code Tab */}
<TabsContent value="qrcode">
  {loadingQrCodes ? (
    // 🔹 Loading State
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin"></div>
        <div
          className="w-16 h-16 border-4 border-purple-600 rounded-full animate-spin absolute top-0 left-0"
          style={{ borderTopColor: "transparent" }}
        ></div>
      </div>
      <p className="text-slate-600 mt-6 text-lg font-medium">
        Loading QR codes...
      </p>
    </div>
  ) : qrCodeError ? (
    // 🔹 Error State
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl mb-6">
        <AlertCircle className="h-16 w-16 text-red-600" />
      </div>
      <p className="text-red-600 text-lg font-semibold mb-6">{qrCodeError}</p>
      <button
        onClick={handleRefreshQrCodes}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3"
      >
        <RefreshCw className="w-5 h-5" />
        Retry
      </button>
    </div>
  ) : (
    // 🔹 Success State → Integrating QrCodeSection
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
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-200 shadow-inner">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <Filter className="w-6 h-6 text-indigo-600" />
                  Advanced Filters
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="space-y-3">
                    <label htmlFor="search" className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Search className="w-4 h-4 text-indigo-600" />
                      Search Students
                    </label>
                    <input
                      id="search"
                      type="text"
                      placeholder="Search students or sessions..."
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/70 backdrop-blur-sm font-medium shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="status-filter" className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-indigo-600" />
                      Attendance Status
                    </label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/70 backdrop-blur-sm font-medium shadow-sm"
                    >
                      <option value="">All Statuses</option>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="date-filter" className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      Filter by Date
                    </label>
                    <input
                      id="date-filter"
                      type="date"
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/70 backdrop-blur-sm font-medium shadow-sm"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="course-filter" className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Course Filter
                    </label>
                    <input
                      id="course-filter"
                      type="text"
                      placeholder="Enter course code..."
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/70 backdrop-blur-sm font-medium shadow-sm"
                      value={courseFilter}
                      onChange={(e) => setCourseFilter(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex gap-3">
                    <button
                      onClick={clearFilters}
                      className="bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Clear Filters
                    </button>
                    <button
                      onClick={exportCsv}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Export CSV
                    </button>
                  </div>

                  {totalRecords > 0 && (
                    <div className="bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-sm font-bold text-slate-700">
                        Showing {attendanceReport.length} of {totalRecords} records
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Table */}
              <div className="bg-white/80 backdrop-blur-lg border-2 border-slate-200 rounded-2xl overflow-hidden shadow-xl">
                {loadingReport ? (
                  <div className="p-16 text-center">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin mx-auto"></div>
                      <div className="w-16 h-16 border-4 border-indigo-600 rounded-full animate-spin absolute top-0 left-1/2 transform -translate-x-1/2" style={{ borderTopColor: 'transparent' }}></div>
                    </div>
                    <p className="text-slate-600 text-lg font-medium">Loading attendance records...</p>
                  </div>
                ) : error ? (
                  <div className="p-12 text-center">
                    <div className="p-4 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl inline-block mb-6">
                      <AlertCircle className="h-12 w-12 text-red-600" />
                    </div>
                    <p className="text-red-600 text-lg font-semibold mb-6">{error}</p>
                    <button
                      onClick={fetchAttendanceRecord}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                        <tr>
                          <th className="text-left px-6 py-5 font-bold text-sm uppercase tracking-wider">Student ID</th>
                          <th className="text-left px-6 py-5 font-bold text-sm uppercase tracking-wider">Student Name</th>
                          <th className="text-left px-6 py-5 font-bold text-sm uppercase tracking-wider">Course</th>
                          <th className="text-left px-6 py-5 font-bold text-sm uppercase tracking-wider">Session</th>
                          <th className="text-left px-6 py-5 font-bold text-sm uppercase tracking-wider">Check In</th>
                          <th className="text-left px-6 py-5 font-bold text-sm uppercase tracking-wider">Check Out</th>
                          <th className="text-left px-6 py-5 font-bold text-sm uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-slate-100">
                        {attendanceReport.length > 0 ? (
                          attendanceReport.map((record, index) => (
                            <tr
                              key={`${record.id}-${record.check_in_time}`}
                              className={`hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 ${
                                index % 2 === 0 ? 'bg-white/70' : 'bg-slate-50/70'
                              }`}
                            >
                              <td className="px-6 py-4 text-slate-900 font-bold text-sm">
                                {record.student?.student_id || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-slate-800 font-medium">
                                {record.student?.user?.username || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-slate-800 font-medium">
                                {record.session?.course?.code || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-slate-800 font-medium">
                                {record.session?.class_name || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-slate-700 text-sm">
                                {record.check_in_time ? formatDate(record.check_in_time) : '-'}
                              </td>
                              <td className="px-6 py-4 text-slate-700 text-sm">
                                {record.check_out_time ? formatDate(record.check_out_time) : '-'}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex px-4 py-2 text-sm font-bold rounded-full ${getStatusBadgeClass(record.status)}`}
                                >
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-6 py-16 text-center">
                              <div className="flex flex-col items-center">
                                <div className="p-4 bg-gradient-to-br from-slate-100 to-gray-100 rounded-2xl mb-6">
                                  <Search className="h-16 w-16 text-slate-400" />
                                </div>
                                <p className="text-xl font-bold text-slate-600 mb-2">No attendance records found</p>
                                <p className="text-slate-500 font-medium">Try adjusting your filters or search terms</p>
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pt-6 border-t-2 border-slate-100">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 justify-center"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                  </button>

                  <div className="flex items-center gap-4 bg-white/70 backdrop-blur-sm px-6 py-3 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-slate-800 font-bold text-lg">
                      Page {currentPage} of {totalPages}
                    </span>
                    <span className="text-slate-400 text-2xl">•</span>
                    <span className="text-slate-600 font-medium">
                      {totalRecords} total records
                    </span>
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 justify-center"
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { /* For Webkit browsers (Chrome, Safari) */
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #6366f1, #8b5cf6);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #4f46e5, #7c3aed);
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default LecturerView;