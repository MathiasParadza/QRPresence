import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LecturerView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (location.state && location.state.qrCodeUrl) {
      setQrCodeUrl(location.state.qrCodeUrl);
    }
  }, [location.state]);

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'attendance_qr.png';
    link.click();
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl bg-purple-50 shadow-xl rounded-2xl p-8">
        <h1 className="text-4xl font-bold text-purple-700 text-center mb-3">Lecturer Dashboard</h1>
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
          </TabsList>

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
                <h2 className="text-lg font-semibold text-green-800 mb-2">Create New Session</h2>
                <button
                  onClick={() => navigate('/create-session')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
                >
                  📝 Create Session
                </button>
              </div>

              <div className="bg-indigo-100 p-4 rounded-xl shadow-sm">
                <h2 className="text-lg font-semibold text-indigo-800 mb-2">View All Sessions</h2>
                <button
                  onClick={() => navigate('/sessions')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium"
                >
                  📚 View Sessions
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

          <TabsContent value="stats">
            <div className="text-center text-gray-600 py-6">
              📊 Attendance statistics and session reports will appear here.
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LecturerView;
