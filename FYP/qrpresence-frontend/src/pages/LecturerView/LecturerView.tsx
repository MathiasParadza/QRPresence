import React, { useEffect, useState } from 'react'; 
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';

interface AttendanceRecord {
  student_id: string;
  session_name: string; // changed from session_id to session_name for clarity
  status: string;
  check_in_time: string;
  check_out_time: string | null;
}

interface AttendanceResponse {
  attendance_record: AttendanceRecord[];
}

const LecturerView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  // Attendance report state
  const [attendanceReport, setAttendanceReport] = useState<AttendanceRecord[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location.state && location.state.qrCodeUrl) {
      setQrCodeUrl(location.state.qrCodeUrl);
    }
  }, [location.state]);

  // Fetch attendance records for stats tab
  useEffect(() => {
    const fetchAttendanceRecord = async () => {
      setLoadingReport(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No access token found');
        setLoadingReport(false);
        return;
      }

      try {
        const response = await axios.get<AttendanceResponse>('http://127.0.0.1:8000/api/report/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAttendanceReport(response.data.attendance_record);
      } catch (err: unknown) {
        console.error("Failed to load attendance report:", err);
        setError('Failed to load attendance report.');
      } finally {
        setLoadingReport(false);
      }
    };

    fetchAttendanceRecord();
  }, []);

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'attendance_qr.png';
    link.click();
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const exportCsv = () => {
  const token = localStorage.getItem('access_token');
  fetch('http://127.0.0.1:8000/api/attendance/export-csv/', { // use your full backend URL
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attendance_report.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    })
    .catch(error => {
      console.error('Export CSV failed:', error);
      alert('Failed to export CSV.');
    });
};


  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl bg-purple-50 shadow-xl rounded-2xl p-8">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-4xl font-bold text-purple-700 text-center flex-1">Lecturer Dashboard</h1>
          <button
            onClick={handleLogout}
            className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
          >
            Logout
          </button>
        </div>
        <p className="text-center text-gray-700 mb-8">Manage your sessions and track attendance.</p>

        <Tabs defaultValue="actions" className="w-full">
          <TabsList className="grid grid-cols-3 gap-2 bg-white border border-purple-200 rounded-xl p-2 mb-6 shadow-sm">
            <TabsTrigger
              value="actions"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white transition rounded-lg py-2"
            >
              Actions
            </TabsTrigger>
            <TabsTrigger
              value="qrcode"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white transition rounded-lg py-2"
            >
              Latest QR
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white transition rounded-lg py-2"
            >
              Statistics
            </TabsTrigger>
            <button onClick={exportCsv} className="bg-blue-600 text-white px-4 py-2 rounded">
             Export Attendance CSV
            </button>

          </TabsList>

          {/* Actions Tab */}
          <TabsContent value="actions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-purple-100 p-4 rounded-xl shadow-sm">
                <h2 className="text-lg font-semibold text-purple-800 mb-2">Generate Attendance QR</h2>
                <button
                  onClick={() => navigate('/generate-qr')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium"
                >
                  📷 Generate QR
                </button>
              </div>

              <div className="bg-green-100 p-4 rounded-xl shadow-sm">
                <h2 className="text-lg font-semibold text-green-800 mb-2">Sessions</h2>
                <button
                  onClick={() => navigate('/create-session')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
                >
                  📚 Session Management
                </button>
              </div>

              <div className="bg-gray-100 p-4 rounded-xl shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">More Tools</h2>
                <button
                  onClick={() => navigate('/more-placeholder')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-medium"
                >
                  🔧 Coming Soon
                </button>
              </div>
            </div>
          </TabsContent>

          {/* QR Code Tab */}
          <TabsContent value="qrcode">
            {qrCodeUrl ? (
              <div className="text-center mt-4">
                <h2 className="text-xl font-semibold text-purple-700 mb-4">Latest Attendance QR Code</h2>
                <img
                  src={qrCodeUrl}
                  alt="Latest QR Code"
                  className="w-64 h-64 mx-auto border-4 border-green-400 rounded-xl"
                />
                <button
                  onClick={downloadQRCode}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  ⬇️ Download QR Code
                </button>
              </div>
            ) : (
              <p className="text-center text-gray-600 mt-4">No QR Code available yet.</p>
            )}
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats">
            <div className="text-gray-700">
              <h2 className="text-2xl font-semibold mb-4">Attendance Records</h2>
              {loadingReport && <p>Loading attendance records...</p>}
              {error && <p className="text-red-600">{error}</p>}
              {!loadingReport && !error && (
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
                    <thead className="bg-purple-200 sticky top-0">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">Student ID</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Session</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Check In</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Check Out</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceReport.length > 0 ? (
                        attendanceReport.map((record, idx) => (
                          <tr
                            key={idx}
                            className={idx % 2 === 0 ? 'bg-white' : 'bg-purple-50'}
                          >
                            <td className="border border-gray-300 px-4 py-2">{record.student_id}</td>
                            <td className="border border-gray-300 px-4 py-2">{record.session_name}</td>
                            <td className="border border-gray-300 px-4 py-2">{new Date(record.check_in_time).toLocaleString()}</td>
                            <td className="border border-gray-300 px-4 py-2">{record.check_out_time ? new Date(record.check_out_time).toLocaleString() : '-'}</td>
                            <td className="border border-gray-300 px-4 py-2">{record.status}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center p-4 text-gray-500"
                          >
                            No attendance records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LecturerView;
