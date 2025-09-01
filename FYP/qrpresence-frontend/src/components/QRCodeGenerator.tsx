import { useState, useRef } from 'react';
import QRCode from 'qrcode';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ArrowLeft } from 'lucide-react';
import './QRCodeGenerator.css';

interface LocationState {
  returnToTab?: string;
  qrCodeUrl?: string;
}

const QRCodeGenerator = () => {
  const [sessionId, setSessionId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the return tab from navigation state (instead of callback function)
  const returnToTab = (location.state as LocationState)?.returnToTab || 'qrcode';

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

  const generateQRCode = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (!sessionId) {
        toast.error('Session ID is required.');
        return;
      }

      const token = `attendance:${sessionId.trim()}`;
      const url = await QRCode.toDataURL(token);
      setQrCodeUrl(url);

      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, token);
      }

      await saveQRCodeToServer(url, sessionId.trim());

      toast.success('QR Code generated and saved successfully!');
      
      // Navigate back to LecturerView with the tab to activate
      navigate('/lecturerview', { 
        state: { 
          qrCodeUrl: url,
          activeTab: returnToTab
        } 
      });

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

  return (
    <div className="qr-generator-container">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate("/lecturerview")}
        className="back-button"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Main Generator Card */}
      <div className="generator-card">
        <div className="generator-header">
          <h1 className="generator-title">QR Code Generator</h1>
          <p className="generator-subtitle">Generate attendance QR codes for your sessions</p>
        </div>

        <div className="input-group">
          <label className="input-label">Session ID</label>
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Enter Session ID (e.g., CS101-2024-01)"
            className="session-input"
          />
        </div>

        <button
          onClick={generateQRCode}
          className="generate-button"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="loading-spinner"></div>
              Generating QR Code...
            </>
          ) : (
            'Generate QR Code'
          )}
        </button>

        {qrCodeUrl && (
          <div className="qr-display-container">
            <canvas 
              ref={canvasRef} 
              className="qr-canvas" 
              aria-label="Generated QR Code" 
            />
          </div>
        )}
      </div>

      {/* Toast Notification Container */}
      <ToastContainer 
        position="top-right" 
        autoClose={3000}
        toastStyle={{
          background: 'rgba(207, 8, 233, 0.57)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(7, 148, 241, 0.2)'
        }}
      />
    </div>
  );
};

export default QRCodeGenerator;