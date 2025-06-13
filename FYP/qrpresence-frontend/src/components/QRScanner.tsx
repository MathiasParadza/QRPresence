import React, { useState, useEffect } from 'react';
import { useQRScanner } from '../hooks/useQRScanner';
import { useAttendanceMarker } from '../hooks/useAttendanceMarker';
import { ScannerVisual } from '../components/ScannerVisual';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';

const QRScanner: React.FC = () => {
  const navigate = useNavigate();

  const {
    videoRef,
    canvasRef,
    decodedText,
    scanActive,
    setDecodedText,
    setScanActive,
    startCamera,
    stopCamera,
    scanQRCode,
    resetScanner
  } = useQRScanner();

  const {
    markAttendance,
    loading,
    error,
    attemptTokenRefresh
  } = useAttendanceMarker();

  const [scanning, setScanning] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);

  const toastConfig = {
    position: "top-center" as const,
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  };

  const validateToken = (token: string | null): boolean => {
    return !!token && token.split('.').length === 3;
  };

  const handleDetectedCode = async (text: string) => {
    setDecodedText(text);
    setScanActive(false);
    stopCamera();

    toast.success(`🔍 QR Code detected!`, {
      ...toastConfig,
      autoClose: 2000
    });

    const parts = text.split(':');
    if (!(parts.length === 2 && parts[0] === 'attendance')) {
      toast.error('⚠️ Invalid QR Code format. Expected "attendance:session_id"', toastConfig);
      resetScanner();
      setScanning(true);
      return;
    }

    try {
      let token = localStorage.getItem('access_token');
      if (!validateToken(token)) {
        toast.info('🔄 Session expired. Attempting to refresh...', toastConfig);
        const refreshed = await attemptTokenRefresh();
        if (!refreshed) {
          throw new Error('Session expired. Please login again.');
        }
        token = localStorage.getItem('access_token');
      }

      await markAttendance(text, token);
      toast.success('✅ Attendance marked successfully!', {
        ...toastConfig,
        autoClose: 3000
      });

    } catch (err: any) {
      toast.error(`❌ ${err.message || 'Failed to mark attendance'}`, toastConfig);
      resetScanner();
      setScanning(true);
    }
  };

  useEffect(() => {
    if (scanning) {
      startCamera(torchOn)
        .then(() => scanQRCode(handleDetectedCode))
        .catch(err => {
          toast.error(err.message, toastConfig);
          setScanning(false);
        });
    }
    return () => stopCamera();
  }, [scanning, torchOn, scanQRCode, startCamera, stopCamera]);

  useEffect(() => {
    if (error) {
      toast.error(error, toastConfig);
    }
  }, [error]);

  const toggleTorch = () => {
    setTorchOn(prev => {
      const newState = !prev;
      toast.info(newState ? '🔦 Torch activated' : '🔦 Torch deactivated', {
        ...toastConfig,
        autoClose: 1500
      });
      return newState;
    });
  };

  const handleStartScanning = () => {
    setScanning(true);
    setDecodedText('');
    setScanActive(true);
  };

  const handleStopScanning = () => {
    setScanning(false);
    stopCamera();
  };

  return (
    <div style={styles.container}>
      <ToastContainer {...toastConfig} />
      <h2 style={styles.title}>Scan QR to Mark Attendance</h2>

      {!scanning && !decodedText && (
        <button
          onClick={handleStartScanning}
          style={styles.scanButton}
          disabled={loading}
        >
          Start Scanning
        </button>
      )}

      {loading && (
        <div style={styles.loadingIndicator}>
          <div style={styles.spinner} />
          <p>Marking attendance...</p>
        </div>
      )}

      {scanning && (
        <>
          <ScannerVisual videoRef={videoRef} scanning={scanning} torchOn={torchOn} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div style={styles.controls}>
            <button onClick={toggleTorch} style={styles.controlButton} disabled={loading}>
              {torchOn ? '🔦 Torch Off' : '🔦 Torch On'}
            </button>
            <button
              onClick={handleStopScanning}
              style={{ ...styles.controlButton, backgroundColor: '#dc2626' }}
              disabled={loading}
            >
              Stop Scanner
            </button>
          </div>
        </>
      )}

      {decodedText && !scanning && (
        <div style={styles.resultContainer}>
          <p style={styles.resultText}>Scanned: {decodedText}</p>
          <button
            onClick={handleStartScanning}
            style={styles.scanButton}
            disabled={loading}
          >
            Scan Again
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: '#f3f4f6',
    minHeight: '100vh'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 'bold' as const,
    marginBottom: '1rem',
    color: '#1f2937'
  },
  scanButton: {
    backgroundColor: '#7c3aed',
    color: 'white',
    padding: '0.5rem 1.5rem',
    borderRadius: '0.25rem',
    marginBottom: '1rem',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500' as const,
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#6d28d9'
    }
  },
  loadingIndicator: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem'
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '3px solid rgba(0,0,0,0.1)',
    borderLeftColor: '#7c3aed',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginTop: '0.5rem'
  },
  controlButton: {
    backgroundColor: '#1f2937',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  resultContainer: {
    textAlign: 'center' as const,
    marginTop: '1rem'
  },
  resultText: {
    color: '#16a34a',
    fontWeight: '500' as const,
    marginBottom: '1rem'
  }
};

export default QRScanner;
