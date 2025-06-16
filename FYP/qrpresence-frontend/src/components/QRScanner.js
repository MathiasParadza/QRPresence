import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useQRScanner } from '../hooks/useQRScanner';
import { useAttendanceMarker } from '../hooks/useAttendanceMarker';
import { ScannerVisual } from '../components/ScannerVisual';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
const QRScanner = () => {
    const navigate = useNavigate();
    const { videoRef, canvasRef, decodedText, scanActive, setDecodedText, setScanActive, startCamera, stopCamera, scanQRCode, resetScanner } = useQRScanner();
    const { markAttendance, loading, error, attemptTokenRefresh } = useAttendanceMarker();
    const [scanning, setScanning] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const toastConfig = {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
    };
    const validateToken = (token) => {
        return !!token && token.split('.').length === 3;
    };
    const handleDetectedCode = async (text) => {
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
            await markAttendance(text, token ?? undefined);
            toast.success('✅ Attendance marked successfully!', {
                ...toastConfig,
                autoClose: 3000
            });
        }
        catch (err) {
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
    return (_jsxs("div", { style: styles.container, children: [_jsx(ToastContainer, { ...toastConfig }), _jsx("h2", { style: styles.title, children: "Scan QR to Mark Attendance" }), !scanning && !decodedText && (_jsx("button", { onClick: handleStartScanning, style: styles.scanButton, disabled: loading, children: "Start Scanning" })), loading && (_jsxs("div", { style: styles.loadingIndicator, children: [_jsx("div", { style: styles.spinner }), _jsx("p", { children: "Marking attendance..." })] })), scanning && (_jsxs(_Fragment, { children: [_jsx(ScannerVisual, { videoRef: videoRef, scanning: scanning, torchOn: torchOn }), _jsx("canvas", { ref: canvasRef, style: { display: 'none' } }), _jsxs("div", { style: styles.controls, children: [_jsx("button", { onClick: toggleTorch, style: styles.controlButton, disabled: loading, children: torchOn ? '🔦 Torch Off' : '🔦 Torch On' }), _jsx("button", { onClick: handleStopScanning, style: { ...styles.controlButton, backgroundColor: '#dc2626' }, disabled: loading, children: "Stop Scanner" })] })] })), decodedText && !scanning && (_jsxs("div", { style: styles.resultContainer, children: [_jsxs("p", { style: styles.resultText, children: ["Scanned: ", decodedText] }), _jsx("button", { onClick: handleStartScanning, style: styles.scanButton, disabled: loading, children: "Scan Again" })] }))] }));
};
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
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#6d28d9'
        }
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
export default QRScanner;
