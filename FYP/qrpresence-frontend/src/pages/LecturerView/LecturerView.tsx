import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';

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
  };
  status: string;
  check_in_time: string;
  check_out_time: string | null;
}

interface PaginatedResponse {
  results: AttendanceRecord[];
  count: number;
  next: string | null;
  previous: string | null;
}

const LecturerView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [attendanceReport, setAttendanceReport] = useState<AttendanceRecord[]>([]);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [ordering, setOrdering] = useState<string>('check_in_time');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    if (location.state && location.state.qrCodeUrl) {
      setQrCodeUrl(location.state.qrCodeUrl);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchAttendanceRecord = async (): Promise<void> => {
      setLoadingReport(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No access token found');
        setLoadingReport(false);
        return;
      }

      try {
        const response = await axios.get<PaginatedResponse>('http://127.0.0.1:8000/api/lecturer/lecturer-attendance/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: currentPage,
            search: searchTerm || undefined,
            status: statusFilter || undefined,
            ordering: ordering || undefined,
          },
        });
        setAttendanceReport(response.data.results);
        setTotalPages(Math.ceil(response.data.count / 10));
      } catch (err) {
        console.error('Failed to load attendance report:', err);
        setError('Failed to load attendance report.');
      } finally {
        setLoadingReport(false);
      }
    };

    fetchAttendanceRecord();
  }, [searchTerm, statusFilter, ordering, currentPage]);

  const exportCsv = (): void => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('No access token found');
      return;
    }

    const query = new URLSearchParams();
    if (searchTerm) query.append('search', searchTerm);
    if (statusFilter) query.append('status', statusFilter);
    if (ordering) query.append('ordering', ordering);

    const url = `http://127.0.0.1:8000/api/lecturer/lecturer-attendance/export-csv/?${query.toString()}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('target', '_blank');
    link.click();
  };

  const downloadQRCode = (): void => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'attendance_qr.png';
    link.click();
  };

  const handleLogout = (): void => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const toggleOrdering = (field: string): void => {
    setOrdering((prev) => (prev === field ? `-${field}` : field));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl font-bold text-purple-700">Lecturer Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200 self-start sm:self-auto"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <Tabs defaultValue="actions" className="w-full">
            <TabsList className="grid grid-cols-3 gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 mb-8">
              <TabsTrigger 
                value="actions" 
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white bg-white text-gray-700 hover:bg-gray-100 transition-all duration-200 rounded-lg py-3 font-medium"
              >
                Actions
              </TabsTrigger>
              <TabsTrigger 
                value="qrcode" 
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white bg-white text-gray-700 hover:bg-gray-100 transition-all duration-200 rounded-lg py-3 font-medium"
              >
                Latest QR
              </TabsTrigger>
              <TabsTrigger 
                value="stats" 
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white bg-white text-gray-700 hover:bg-gray-100 transition-all duration-200 rounded-lg py-3 font-medium"
              >
                Statistics
              </TabsTrigger>
            </TabsList>

            {/* Actions Tab */}
            <TabsContent value="actions">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-purple-800 mb-4">Generate Attendance QR</h2>
                  <button
                    onClick={() => navigate('/generate-qr')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    📷 Generate QR
                  </button>
                </div>
                
               <div className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-green-800">Session Management</h2>
                <button
                  onClick={() => navigate('/create-session')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  🔧 Create Session
                 </button>
                 <button
                   onClick={() => navigate('/sessions')}
                   className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors duration-200"
               >
                    📋 View Sessions
                  </button>
                </div>

                
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">More Tools</h2>
                  <button
                    onClick={() => navigate('/more-placeholder')}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    🔧 Coming Soon
                  </button>
                </div>
              </div>
            </TabsContent>

            {/* QR Code Tab */}
            <TabsContent value="qrcode">
              <div className="text-center">
                {qrCodeUrl ? (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-purple-700">Latest Attendance QR Code</h2>
                    <div className="flex justify-center">
                      <img 
                        src={qrCodeUrl} 
                        alt="Latest QR Code" 
                        className="w-64 h-64 border-4 border-green-400 rounded-xl shadow-lg"
                      />
                    </div>
                    <button 
                      onClick={downloadQRCode} 
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
                    >
                      ⬇️ Download QR Code
                    </button>
                  </div>
                ) : (
                  <div className="py-16">
                    <p className="text-gray-600 text-lg">No QR Code available yet.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="stats">
              {/* Filters */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                      Search
                    </label>
                    <input
                      id="search"
                      type="text"
                      placeholder="Search by student or session..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                      Status Filter
                    </label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    >
                      <option value="">All Statuses</option>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Export
                    </label>
                    <button
                      onClick={exportCsv}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
                    >
                      ⬇️ Export CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {loadingReport ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-600">Loading attendance records...</p>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center">
                    <p className="text-red-600">{error}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-purple-100 border-b border-purple-200">
                        <tr>
                          <th className="text-left px-6 py-4 font-semibold text-purple-800">Student</th>
                          <th className="text-left px-6 py-4 font-semibold text-purple-800">Student ID</th>
                          <th className="text-left px-6 py-4 font-semibold text-purple-800">Session</th>
                          <th 
                            className="text-left px-6 py-4 font-semibold text-purple-800 cursor-pointer hover:bg-purple-200 transition-colors"
                            onClick={() => toggleOrdering('check_in_time')}
                          >
                            Check In {ordering === 'check_in_time' ? '↑' : ordering === '-check_in_time' ? '↓' : ''}
                          </th>
                          <th 
                            className="text-left px-6 py-4 font-semibold text-purple-800 cursor-pointer hover:bg-purple-200 transition-colors"
                            onClick={() => toggleOrdering('check_out_time')}
                          >
                            Check Out {ordering === 'check_out_time' ? '↑' : ordering === '-check_out_time' ? '↓' : ''}
                          </th>
                          <th 
                            className="text-left px-6 py-4 font-semibold text-purple-800 cursor-pointer hover:bg-purple-200 transition-colors"
                            onClick={() => toggleOrdering('status')}
                          >
                            Status {ordering === 'status' ? '↑' : ordering === '-status' ? '↓' : ''}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {attendanceReport.length > 0 ? (
                          attendanceReport.map((record, idx) => (
                            <tr 
                              key={`${record.id}-${record.check_in_time}`} 
                              className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                            >
                              <td className="px-6 py-4 text-gray-900">{record.student?.user?.username || 'N/A'}</td>
                              <td className="px-6 py-4 text-gray-900">{record.student?.student_id || 'N/A'}</td>
                              <td className="px-6 py-4 text-gray-900">{record.session?.class_name || 'N/A'}</td>
                              <td className="px-6 py-4 text-gray-900">
                                {record.check_in_time ? new Date(record.check_in_time).toLocaleString() : '-'}
                              </td>
                              <td className="px-6 py-4 text-gray-900">
                                {record.check_out_time ? new Date(record.check_out_time).toLocaleString() : '-'}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                                  record.status === 'present' ? 'bg-green-100 text-green-800' :
                                  record.status === 'absent' ? 'bg-red-100 text-red-800' :
                                  record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                              No attendance records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    Previous
                  </button>
                  
                  <span className="text-gray-600 font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    Next
                  </button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LecturerView;