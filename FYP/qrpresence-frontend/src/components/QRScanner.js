import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import jsQR from 'jsqr';
import { toast, ToastContainer } from 'react-toastify';
import { checkGeoLocation } from '../utils/geo';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import './QRScanner.css';
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
    const toastConfig = useMemo(() => ({
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
    }), []);
    // Token validation helper
    const validateToken = useCallback((token) => {
        if (!token)
            return false;
        return token.split('.').length === 3;
    }, []);
    // Token refresh function
    const attemptTokenRefresh = useCallback(async () => {
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
    }, [navigate, toastConfig]);
    const stopCamera = useCallback(() => {
        const stream = videoRef.current?.srcObject;
        stream?.getTracks().forEach((track) => track.stop());
    }, []);
    const stopScannerAnimation = useCallback(() => {
        if (scannerAnimationRef.current) {
            cancelAnimationFrame(scannerAnimationRef.current);
        }
    }, []);
    const resetScanner = useCallback(() => {
        toast.info('🔄 Resetting scanner...', {
            ...toastConfig,
            autoClose: 1500
        });
        setDecodedText('');
        setScanActive(true);
        setScanning(true);
    }, [toastConfig]);
    const handleAttendanceMarking = useCallback(async (qrData) => {
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
                const errorMessage = error && typeof error === 'object' && 'message' in error
                    ? error.message
                    : 'Failed to mark attendance';
                toast.error(`❌ ${errorMessage}`, toastConfig);
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
    }, [toastConfig, validateToken, attemptTokenRefresh]);
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
    }, [scanActive, handleAttendanceMarking, resetScanner, toastConfig, stopCamera, stopScannerAnimation]);
    const startScannerAnimation = useCallback(() => {
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
    }, []);
    const startCamera = useCallback(async () => {
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
    }, [torchOn, toastConfig, scanQRCode]);
    const toggleTorch = useCallback(() => {
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
    return (_jsxs("div", { className: "qr-container", children: [_jsx(ToastContainer, {}), _jsx("h2", { className: "qr-title", children: "Scan QR to Mark Attendance" }), !scanning && !decodedText && (_jsx("button", { onClick: () => setScanning(true), className: "qr-scan-button", disabled: loading, children: "Start Scanning" })), loading && (_jsxs("div", { className: "qr-loading-indicator", children: [_jsx("div", { className: "qr-spinner" }), _jsx("p", { children: "Marking attendance..." })] })), scanning && (_jsxs("div", { className: "qr-scanner-container", children: [_jsx("video", { ref: videoRef, className: "qr-video", playsInline: true }), _jsx("canvas", { ref: canvasRef, className: "qr-canvas-hidden" }), _jsx("div", { className: "qr-overlay", children: _jsxs("div", { className: "qr-box", children: [_jsx("div", { ref: scannerLineRef, className: "qr-line" }), _jsx("div", { className: "qr-corner top-left" }), _jsx("div", { className: "qr-corner top-right" }), _jsx("div", { className: "qr-corner bottom-left" }), _jsx("div", { className: "qr-corner bottom-right" })] }) }), _jsxs("div", { className: "qr-controls", children: [_jsx("button", { onClick: toggleTorch, className: "qr-control-button", disabled: loading, children: torchOn ? '🔦 Torch Off' : '🔦 Torch On' }), _jsx("button", { onClick: () => {
                                    stopCamera();
                                    stopScannerAnimation();
                                    setScanning(false);
                                }, className: "qr-control-button stop", disabled: loading, children: "Stop Scanner" })] })] })), decodedText && (_jsxs("div", { className: "qr-result-container", children: [_jsxs("p", { className: "qr-result-text", children: ["Scanned: ", decodedText] }), _jsx("button", { onClick: resetScanner, className: "qr-scan-button", disabled: loading, children: "Scan Again" })] }))] }));
};
export default QRScanner;
