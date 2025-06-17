import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { toast, ToastContainer } from 'react-toastify';
import { checkGeoLocation } from '../utils/geo';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
const QRScanner = () => {
    const navigate = useNavigate();
    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const scannerLineRef = useRef(null);
    // State
    const [scanning, setScanning] = useState(false);
    const [decodedText, setDecodedText] = useState('');
    const [loading, setLoading] = useState(false);
    const [scanActive, setScanActive] = useState(true);
    const [torchOn, setTorchOn] = useState(false);
    // Animation refs
    const animationRef = useRef(0);
    const scannerAnimationRef = useRef(0);
    const scanIntervalRef = useRef(null);
    // Toast configuration
    const toastConfig = {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
    };
    // Token validation helper
    const validateToken = (token) => {
        if (!token)
            return false;
        return token.split('.').length === 3;
    };
    // Token refresh function
    const attemptTokenRefresh = async () => {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                toast.info('Session expired. Please login again.', toastConfig);
                navigate('/login');
                return false;
            }
            const response = await fetch('http://127.0.0.1:8000/api/token/refresh/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        }
        catch (error) {
            console.error('Token refresh failed:', error);
            toast.error('❌ Failed to refresh session', toastConfig);
            return false;
        }
    };
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
    }, [scanning, torchOn]);
    const startCamera = async () => {
        try {
            toast.info('🔄 Starting camera...', toastConfig);
            const constraints = {
                video: {
                    facingMode: 'environment',
                    ...(torchOn ? {
                        advanced: [{ torch: true }]
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
        }
        catch (err) {
            toast.error('❌ Camera access denied or not available', toastConfig);
            console.error('Camera error:', err);
        }
    };
    const stopCamera = () => {
        const stream = videoRef.current?.srcObject;
        stream?.getTracks().forEach((track) => track.stop());
    };
    const startScannerAnimation = () => {
        let direction = 1;
        let position = 0;
        const animate = () => {
            if (!scannerLineRef.current)
                return;
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
    const scanQRCode = useCallback(() => {
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
                toast.error(`❌ ${error.message}`, toastConfig);
                resetScanner();
            });
        }
        else {
            scanIntervalRef.current = setTimeout(() => {
                animationRef.current = requestAnimationFrame(scanQRCode);
            }, 100);
        }
    }, [scanActive]);
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
    const resetScanner = () => {
        toast.info('🔄 Resetting scanner...', {
            ...toastConfig,
            autoClose: 1500
        });
        setDecodedText('');
        setScanActive(true);
        setScanning(true);
    };
    const handleAttendanceMarking = async (qrData) => {
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
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, (error) => reject(new Error(`Geolocation error: ${error.message}`)), { enableHighAccuracy: true, timeout: 10000 });
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
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        session_id: sessionId,
                        latitude: latitude,
                        longitude: longitude
                    }),
                });
                if (!response.ok) {
                    if (response.status === 401) {
                        toast.info('🔄 Session expired. Attempting to refresh...', toastConfig);
                        const refreshed = await attemptTokenRefresh();
                        if (refreshed) {
                            return handleAttendanceMarking(qrData);
                        }
                        throw new Error('Session expired. Please login again.');
                    }
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || errorData.message || 'Failed to mark attendance');
                }
                const result = await response.json();
                toast.success('✅ Attendance marked successfully!', {
                    ...toastConfig,
                    autoClose: 3000
                });
                console.log('Attendance result:', result);
            }
            catch (error) {
                console.error('Attendance Error:', error);
                toast.error(`❌ ${error.message || 'Failed to mark attendance'}`, toastConfig);
                throw error;
            }
            finally {
                setLoading(false);
            }
        }
        else {
            const error = new Error('Invalid QR Code format. Expected "attendance:session_id"');
            toast.error(`⚠️ ${error.message}`, toastConfig);
            throw error;
        }
    };
    // Styles
    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
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
            flexDirection: 'column',
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
            position: 'relative',
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
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
        },
        scannerBox: {
            border: '2px solid rgba(74, 222, 128, 0.8)',
            borderRadius: '0.5rem',
            width: '256px',
            height: '256px',
            position: 'relative',
            overflow: 'hidden'
        },
        scannerLine: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: 'rgba(74, 222, 128, 0.8)',
            transform: 'translateY(0)'
        },
        corner: {
            position: 'absolute',
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
            textAlign: 'center',
            marginTop: '1rem'
        },
        resultText: {
            color: '#16a34a',
            fontWeight: '500',
            marginBottom: '1rem'
        }
    };
    return (_jsxs("div", { style: styles.container, children: [_jsx(ToastContainer, { position: "top-center", autoClose: 5000, hideProgressBar: false, newestOnTop: false, closeOnClick: true, rtl: false, pauseOnFocusLoss: true, draggable: true, pauseOnHover: true }), _jsx("h2", { style: styles.title, children: "Scan QR to Mark Attendance" }), !scanning && !decodedText && (_jsx("button", { onClick: () => setScanning(true), style: styles.scanButton, onMouseOver: (e) => (e.currentTarget.style.backgroundColor = '#6d28d9'), onMouseOut: (e) => (e.currentTarget.style.backgroundColor = '#7c3aed'), disabled: loading, children: "Start Scanning" })), loading && (_jsxs("div", { style: styles.loadingIndicator, children: [_jsx("div", { style: styles.spinner }), _jsx("p", { children: "Marking attendance..." })] })), scanning && (_jsxs("div", { style: styles.scannerContainer, children: [_jsx("video", { ref: videoRef, style: styles.video, playsInline: true }), _jsx("canvas", { ref: canvasRef, style: { display: 'none' } }), _jsx("div", { style: styles.scannerOverlay, children: _jsxs("div", { style: styles.scannerBox, children: [_jsx("div", { ref: scannerLineRef, style: styles.scannerLine }), _jsx("div", { style: { ...styles.corner, top: 0, left: 0, borderTop: '3px solid #4ade80', borderLeft: '3px solid #4ade80' } }), _jsx("div", { style: { ...styles.corner, top: 0, right: 0, borderTop: '3px solid #4ade80', borderRight: '3px solid #4ade80' } }), _jsx("div", { style: { ...styles.corner, bottom: 0, left: 0, borderBottom: '3px solid #4ade80', borderLeft: '3px solid #4ade80' } }), _jsx("div", { style: { ...styles.corner, bottom: 0, right: 0, borderBottom: '3px solid #4ade80', borderRight: '3px solid #4ade80' } })] }) }), _jsxs("div", { style: styles.controls, children: [_jsx("button", { onClick: toggleTorch, style: styles.controlButton, disabled: loading, children: torchOn ? '🔦 Torch Off' : '🔦 Torch On' }), _jsx("button", { onClick: () => {
                                    stopCamera();
                                    stopScannerAnimation();
                                    setScanning(false);
                                }, style: { ...styles.controlButton, backgroundColor: '#dc2626' }, disabled: loading, children: "Stop Scanner" })] })] })), decodedText && (_jsxs("div", { style: styles.resultContainer, children: [_jsxs("p", { style: styles.resultText, children: ["Scanned: ", decodedText] }), _jsx("button", { onClick: resetScanner, style: styles.scanButton, disabled: loading, children: "Scan Again" })] }))] }));
};
export default QRScanner;
