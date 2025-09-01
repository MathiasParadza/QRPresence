import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import jsQR from 'jsqr';
import { toast, ToastContainer } from 'react-toastify';
import { checkGeoLocation } from '../utils/geo';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import './QRScanner.css';

const QRScanner: React.FC = () => {
  const navigate = useNavigate();
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scannerLineRef = useRef<HTMLDivElement>(null);
  
  // State
  const [scanning, setScanning] = useState<boolean>(false);
  const [decodedText, setDecodedText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [scanActive, setScanActive] = useState<boolean>(true);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  
  // Animation refs
  const animationRef = useRef<number>(0);
  const scannerAnimationRef = useRef<number>(0);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Toast configuration
  const toastConfig = useMemo(() => ({
    position: 'top-center' as const,
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  }), []);

  // CSRF Token helper
  const getCSRFToken = useCallback((): string => {
    const name = 'csrftoken';
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`))
      ?.split('=')[1];
    return cookieValue || '';
  }, []);

  // Token validation helper
  const validateToken = useCallback((token: string | null): boolean => {
    if (!token) return false;
    
    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      return Date.now() < expirationTime;
    } catch {
      return false;
    }
  }, []);

  // Token refresh function
  const attemptTokenRefresh = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        toast.info('Session expired. Please login again.', toastConfig);
        navigate('/login');
        return false;
      }
      
      const response = await fetch('http://127.0.0.1:8000/api/token/refresh/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify({ refresh: refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        toast.success('🔑 Session refreshed!', {
          ...toastConfig,
          autoClose: 2000
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      toast.error('❌ Failed to refresh session', toastConfig);
      return false;
    }
  }, [navigate, toastConfig, getCSRFToken]);

  const stopCamera = useCallback((): void => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
  }, []);

  const stopScannerAnimation = useCallback((): void => {
    if (scannerAnimationRef.current) {
      cancelAnimationFrame(scannerAnimationRef.current);
    }
  }, []);

  const resetScanner = useCallback((): void => {
    toast.info('🔄 Resetting scanner...', {
      ...toastConfig,
      autoClose: 1500
    });
    setDecodedText('');
    setScanActive(true);
    setScanning(true);
  }, [toastConfig]);

  const handleAttendanceMarking = useCallback(async (qrData: string): Promise<void> => {
    const parts = qrData.split(':');
    if (parts.length === 2 && parts[0] === 'attendance') {
      const sessionId = parts[1];
      setLoading(true);
      
      toast.info('📍 Getting your location...', {
        ...toastConfig,
        autoClose: 2000
      });

      try {
        if (!/^[a-zA-Z0-9-_]+$/.test(sessionId)) {
          throw new Error('Invalid session ID format');
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            (error) => reject(new Error(`Geolocation error: ${error.message}`)),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });

        const latitude = parseFloat(position.coords.latitude.toString());
        const longitude = parseFloat(position.coords.longitude.toString());
        
        if (isNaN(latitude) || isNaN(longitude)) {
          throw new Error('Invalid geolocation coordinates');
        }

        toast.info('🔍 Verifying location...', {
          ...toastConfig,
          autoClose: 2000
        });

        const isLocationValid = await checkGeoLocation();
        if (!isLocationValid) {
          throw new Error('You must be in the classroom to mark attendance');
        }
  
        let token = localStorage.getItem('access_token');
        if (!validateToken(token)) {
          toast.info('🔄 Session expired. Attempting to refresh...', toastConfig);
          const refreshed = await attemptTokenRefresh();
          if (!refreshed) {
            throw new Error('Session expired. Please login again.');
          }
          token = localStorage.getItem('access_token');
        }
  
        toast.info('📡 Marking attendance...', toastConfig);
        
        const response = await fetch('http://127.0.0.1:8000/api/mark/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-CSRFToken': getCSRFToken(),
          },
          credentials: 'include',
          body: JSON.stringify({
            session_id: sessionId,
            latitude: latitude,
            longitude: longitude
          }),
        });

        // Enhanced error handling with detailed server response
        if (!response.ok) {
          let errorDetail = 'Failed to mark attendance';
          
          try {
            const errorData = await response.json();
            errorDetail = errorData.error || errorData.detail || errorData.message || JSON.stringify(errorData);
            console.error('Server error details:', errorData);
          } catch {
            const errorText = await response.text();
            console.error('Server response text:', errorText);
            errorDetail = errorText || `Server error: ${response.status}`;
          }
          
          console.error(`Server error ${response.status}:`, errorDetail);
          
          if (response.status === 401) {
            toast.info('🔄 Session expired. Attempting to refresh...', toastConfig);
            const refreshed = await attemptTokenRefresh();
            if (refreshed) {
              return handleAttendanceMarking(qrData);
            }
            throw new Error('Session expired. Please login again.');
          }
          
          throw new Error(errorDetail);
        }

        const result = await response.json();
        toast.success('✅ Attendance marked successfully!', {
          ...toastConfig,
          autoClose: 3000
        });
        console.log('Attendance result:', result);
        
      } catch (error: unknown) {
        console.error('Attendance Error:', error);
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? (error as { message: string }).message
            : 'Failed to mark attendance';
        
        // Show specific error messages for common issues
        if (errorMessage.includes('not enrolled')) {
          toast.error('❌ You are not enrolled in this course', toastConfig);
        } else if (errorMessage.includes('too far')) {
          toast.error('❌ You are too far from the classroom', toastConfig);
        } else if (errorMessage.includes('expired') || errorMessage.includes('window closed')) {
          toast.error('❌ Attendance window has closed', toastConfig);
        } else if (errorMessage.includes('Session not found')) {
          toast.error('❌ Invalid session QR code', toastConfig);
        } else {
          toast.error(`❌ ${errorMessage}`, toastConfig);
        }
        
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      const error = new Error('Invalid QR Code format. Expected "attendance:session_id"');
      toast.error(`⚠️ ${error.message}`, toastConfig);
      throw error;
    }
  }, [toastConfig, validateToken, attemptTokenRefresh, getCSRFToken]);

  const scanQRCode = useCallback((): void => {
    if (!canvasRef.current || !videoRef.current || !scanActive) {
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx || !video.videoWidth || !video.videoHeight) {
      scanIntervalRef.current = setTimeout(() => {
        animationRef.current = requestAnimationFrame(scanQRCode);
      }, 100);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code) {
      const text = code.data;
      console.log('QR Code detected:', text);
      toast.success(`🔍 QR Code detected!`, {
        ...toastConfig,
        autoClose: 2000
      });
      
      setDecodedText(text);
      setScanActive(false);
      stopCamera();
      stopScannerAnimation();
      
      handleAttendanceMarking(text)
        .catch((error) => {
          console.error('Error marking attendance:', error);
          // Error message already shown in handleAttendanceMarking, just reset
          resetScanner();
        });
    } else {
      scanIntervalRef.current = setTimeout(() => {
        animationRef.current = requestAnimationFrame(scanQRCode);
      }, 100);
    }
  }, [scanActive, handleAttendanceMarking, resetScanner, toastConfig, stopCamera, stopScannerAnimation]);

  const startScannerAnimation = useCallback((): void => {
    let direction = 1;
    let position = 0;
    
    const animate = (): void => {
      if (!scannerLineRef.current) return;
      
      position += direction * 2;
      if (position >= 256 || position <= 0) {
        direction *= -1;
      }
      
      scannerLineRef.current.style.transform = `translateY(${position}px)`;
      scannerAnimationRef.current = requestAnimationFrame(animate);
    };
    
    scannerAnimationRef.current = requestAnimationFrame(animate);
  }, []);

  const startCamera = useCallback(async (): Promise<void> => {
    try {
      toast.info('🔄 Starting camera...', toastConfig);
      
      const constraints: MediaStreamConstraints = {
        video: { 
          facingMode: 'environment',
          ...(torchOn ? { 
            advanced: [{ torch: true } as unknown as MediaTrackConstraintSet] 
          } : {})
        },
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        toast.success('📷 Camera ready!', toastConfig);
        scanQRCode();
      }
    } catch (err) {
      toast.error('❌ Camera access denied or not available', toastConfig);
      console.error('Camera error:', err);
    }
  }, [torchOn, toastConfig, scanQRCode]);

  const toggleTorch = useCallback((): void => {
    setTorchOn(prev => {
      const newState = !prev;
      toast.info(newState ? '🔦 Torch activated' : '🔦 Torch deactivated', {
        ...toastConfig,
        autoClose: 1500
      });
      return newState;
    });
  }, [toastConfig]);

  useEffect(() => {
    if (scanning) {
      startCamera();
      startScannerAnimation();
    }
    return () => {
      stopCamera();
      stopScannerAnimation();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (scanIntervalRef.current) {
        clearTimeout(scanIntervalRef.current);
      }
    };
  }, [scanning, startCamera, startScannerAnimation, stopCamera, stopScannerAnimation]);

  return (
    <div className="qr-container">
      <ToastContainer />

      <h2 className="qr-title">Scan QR to Mark Attendance</h2>

      {!scanning && !decodedText && (
        <button
          onClick={() => setScanning(true)}
          className="qr-scan-button"
          disabled={loading}
        >
          Start Scanning
        </button>
      )}

      {loading && (
        <div className="qr-loading-indicator">
          <div className="qr-spinner" />
          <p>Marking attendance...</p>
        </div>
      )}

      {scanning && (
        <div className="qr-scanner-container">
          <video ref={videoRef} className="qr-video" playsInline />
          <canvas ref={canvasRef} className="qr-canvas-hidden" />
          <div className="qr-overlay">
            <div className="qr-box">
              <div ref={scannerLineRef} className="qr-line" />
              <div className="qr-corner top-left" />
              <div className="qr-corner top-right" />
              <div className="qr-corner bottom-left" />
              <div className="qr-corner bottom-right" />
            </div>
          </div>
          <div className="qr-controls">
            <button
              onClick={toggleTorch}
              className="qr-control-button"
              disabled={loading}
            >
              {torchOn ? '🔦 Torch Off' : '🔦 Torch On'}
            </button>
            <button
              onClick={() => {
                stopCamera();
                stopScannerAnimation();
                setScanning(false);
              }}
              className="qr-control-button stop"
              disabled={loading}
            >
              Stop Scanner
            </button>
          </div>
        </div>
      )}

      {decodedText && (
        <div className="qr-result-container">
          <p className="qr-result-text">Scanned: {decodedText}</p>
          <button
            onClick={resetScanner}
            className="qr-scan-button"
            disabled={loading}
          >
            Scan Again
          </button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;