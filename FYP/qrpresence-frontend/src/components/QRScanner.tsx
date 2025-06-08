import { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';
import { toast } from 'react-toastify';
import { checkGeoLocation } from '../utils/geo';

const QRScanner: React.FC = () => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scannerLineRef = useRef<HTMLDivElement>(null);
  
  // State
  const [scanning, setScanning] = useState(false);
  const [decodedText, setDecodedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanActive, setScanActive] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  
  // Animation refs
  const animationRef = useRef<number>(0);
  const scannerAnimationRef = useRef<number>(0);

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
    };
  }, [scanning, torchOn]);

  const startCamera = async () => {
    try {
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
        scanQRCode();
      }
    } catch (err) {
      toast.error('Camera access denied');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
  };

  const startScannerAnimation = () => {
    let direction = 1;
    let position = 0;
    
    const animate = () => {
      if (!scannerLineRef.current) return;
      
      position += direction * 2;
      if (position >= 256 || position <= 0) {
        direction *= -1;
      }
      
      scannerLineRef.current.style.transform = `translateY(${position}px)`;
      scannerAnimationRef.current = requestAnimationFrame(animate);
    };
    
    scannerAnimationRef.current = requestAnimationFrame(animate);
  };

  const stopScannerAnimation = () => {
    if (scannerAnimationRef.current) {
      cancelAnimationFrame(scannerAnimationRef.current);
    }
  };

  const scanQRCode = () => {
    if (!canvasRef.current || !videoRef.current || !scanActive) {
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data and scan for QR code
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code) {
      const text = code.data;
      console.log('QR Code detected:', text);
      
      setDecodedText(text);
      setScanActive(false);
      stopCamera();
      stopScannerAnimation();
      
      // Handle attendance marking with error catching
      handleAttendanceMarking(text)
        .catch((error) => {
          console.error('Error marking attendance:', error);
          toast.error(`Failed to mark attendance: ${error.message}`);
        });
    } else {
      // Continue scanning if no QR code found
      animationRef.current = requestAnimationFrame(scanQRCode);
    }
  };

  const toggleTorch = () => {
    setTorchOn(!torchOn);
  };

  const resetScanner = () => {
    setDecodedText('');
    setScanActive(true);
    setScanning(true);
  };

  const handleAttendanceMarking = async (token: string) => {
    const parts = token.split(':');
    if (parts.length === 2 && parts[0] === 'attendance') {
      const sessionId = parts[1];
      setLoading(true);
  
      try {
        // First validate session ID format before making API calls
        if (!/^[a-zA-Z0-9-_]+$/.test(sessionId)) {
          throw new Error('Invalid session ID format');
        }

        // Get geolocation
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            (error) => reject(new Error(`Geolocation error: ${error.message}`)),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });

        // Validate coordinates
        const latitude = parseFloat(position.coords.latitude.toString());
        const longitude = parseFloat(position.coords.longitude.toString());
        
        if (isNaN(latitude) || isNaN(longitude)) {
          throw new Error('Invalid geolocation coordinates');
        }

        // Check location validity
        const isLocationValid = await checkGeoLocation();
        if (!isLocationValid) {
          throw new Error('You must be in the classroom to mark attendance');
        }
  
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('User not authenticated');
        }
  
        const response = await fetch('http://127.0.0.1:8000/api/mark/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
            latitude: latitude,
            longitude: longitude
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error Response:', errorData);
          throw new Error(errorData.error || errorData.detail || 'Failed to mark attendance');
        }

        const result = await response.json();
        toast.success('✅ Attendance marked successfully!');
        console.log('Attendance result:', result);
      } catch (error: any) {
        console.error('Attendance Error:', error);
        toast.error(`❌ ${error.message || 'Failed to mark attendance'}`);
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      const error = new Error('Invalid QR Code format. Expected "attendance:session_id"');
      toast.error(`⚠️ ${error.message}`);
      throw error;
    }
  };
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Scan QR to Mark Attendance</h2>

      {!scanning && !decodedText && (
        <button
          onClick={() => setScanning(true)}
          style={styles.scanButton}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
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
        <div style={styles.scannerContainer}>
          <video
            ref={videoRef}
            style={styles.video}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {/* Scanner overlay */}
          <div style={styles.scannerOverlay}>
            <div style={styles.scannerBox}>
              {/* Scanner animation line */}
              <div 
                ref={scannerLineRef}
                style={styles.scannerLine}
              />
              
              {/* Corner borders */}
              <div style={{...styles.corner, top: 0, left: 0, borderTop: '3px solid #4ade80', borderLeft: '3px solid #4ade80'}} />
              <div style={{...styles.corner, top: 0, right: 0, borderTop: '3px solid #4ade80', borderRight: '3px solid #4ade80'}} />
              <div style={{...styles.corner, bottom: 0, left: 0, borderBottom: '3px solid #4ade80', borderLeft: '3px solid #4ade80'}} />
              <div style={{...styles.corner, bottom: 0, right: 0, borderBottom: '3px solid #4ade80', borderRight: '3px solid #4ade80'}} />
            </div>
          </div>
          
          {/* Scanner controls */}
          <div style={styles.controls}>
            <button
              onClick={toggleTorch}
              style={styles.controlButton}
            >
              {torchOn ? '🔦 Torch Off' : '🔦 Torch On'}
            </button>
            <button
              onClick={() => {
                stopCamera();
                stopScannerAnimation();
                setScanning(false);
              }}
              style={{...styles.controlButton, backgroundColor: '#dc2626'}}
            >
              Stop Scanner
            </button>
          </div>
        </div>
      )}

      {decodedText && (
        <div style={styles.resultContainer}>
          <p style={styles.resultText}>Scanned: {decodedText}</p>
          <button
            onClick={resetScanner}
            style={styles.scanButton}
          >
            Scan Again
          </button>
        </div>
      )}
    </div>
  );
};

// Styles
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
    fontWeight: 'bold',
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
    fontWeight: '500',
    transition: 'background-color 0.2s'
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
  scannerContainer: {
    position: 'relative' as const,
    width: '100%',
    maxWidth: '28rem',
    marginBottom: '1rem'
  },
  video: {
    width: '100%',
    height: '300px',
    borderRadius: '0.375rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    backgroundColor: '#000'
  },
  scannerOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none' as const
  },
  scannerBox: {
    border: '2px solid rgba(74, 222, 128, 0.8)',
    borderRadius: '0.5rem',
    width: '256px',
    height: '256px',
    position: 'relative' as const,
    overflow: 'hidden'
  },
  scannerLine: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    backgroundColor: 'rgba(74, 222, 128, 0.8)',
    transform: 'translateY(0)'
  },
  corner: {
    position: 'absolute' as const,
    width: '32px',
    height: '32px'
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
    fontWeight: '500',
    marginBottom: '1rem'
  }
};

export default QRScanner;