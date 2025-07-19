import { useState, useRef } from 'react';
import QRCode from 'qrcode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ArrowLeft } from 'lucide-react';

const QRCodeGenerator = () => {
  const [sessionId, setSessionId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  const generateQRCode = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (!sessionId) {
        toast.error('Session ID is required.');
        return;
      }

      const token = sessionId.trim();
      const url = await QRCode.toDataURL(token);
      setQrCodeUrl(url);

      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, token);
      }

      await saveQRCodeToServer(url, sessionId.trim());

      toast.success('QR Code generated and saved successfully!');
      navigate('/LecturerView', { state: { qrCodeUrl: url } });

    } catch (error: unknown) {
      let message = 'Something went wrong. Please try again.';
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveQRCodeToServer = async (imageData: string, sessionId: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('User not authenticated.');
      return;
    }

    try {
      interface ApiResponse {
        success: boolean;
      }

      const response = await axios.post<ApiResponse>(
        'http://127.0.0.1:8000/api/generate-and-save-qr/',
        {
          session_id: sessionId.trim(),
          qr_image: imageData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error('Failed to save QR code');
      }
    } catch {
      toast.error('Could not save QR code to server.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <button
        type="button"
        onClick={() => navigate("/lecturerview")}
        className="flex items-center gap-2 px-4 py-2 mb-4 bg-gray-200 text-gray-800 rounded hover:bg-blue-50 hover:text-blue-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>
      <h1 className="text-2xl font-bold mb-4">Attendance QR Code Generator</h1>

      <input
        type="text"
        value={sessionId}
        onChange={(e) => setSessionId(e.target.value)}
        placeholder="Enter Session ID"
        className="px-4 py-2 border rounded w-full max-w-md mb-4"
      />

      <button
        onClick={generateQRCode}
        className={`${isLoading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'} text-white px-6 py-2 rounded mb-4`}
        disabled={isLoading}
      >
        {isLoading ? 'Generating...' : 'Generate QR Code'}
      </button>

      {qrCodeUrl && (
        <>
          <canvas ref={canvasRef} className="mb-4" aria-label="Generated QR Code" />
        </>
      )}

      {/* Toast Notification Container */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default QRCodeGenerator;
