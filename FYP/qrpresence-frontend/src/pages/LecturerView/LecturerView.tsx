import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

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
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">Welcome Lecturer!</h1>
      <p className="mb-6">You can manage your sessions here.</p>

      <div className="mb-6">
        <button
          onClick={() => navigate('/generate-qr')}
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
        >
          Generate Attendance QR
        </button>
      </div>

      <div className="mb-6">
        <button
          onClick={() => navigate('/create-session')}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Create Session
        </button>
      </div>

      <div className="mb-6">
        <button
          onClick={() => navigate('/sessions')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          View All Sessions
        </button>
      </div>

      <div className="mb-6">
        <button
          onClick={() => navigate('/more-placeholder')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          More Placeholder
        </button>
      </div>

      {qrCodeUrl && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Latest Attendance QR Code:</h2>
          <img
            src={qrCodeUrl}
            alt="Latest QR Code"
            className="w-64 h-64 object-contain border border-gray-300 rounded"
          />

          <button
            onClick={downloadQRCode}
            className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Download QR Code
          </button>
        </div>
      )}
    </div>
  );
};

export default LecturerView;
