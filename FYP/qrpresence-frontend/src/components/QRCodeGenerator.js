import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import QRCode from 'qrcode';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ArrowLeft } from 'lucide-react';
import './QRCodeGenerator.css';
const QRCodeGenerator = () => {
    const [sessionId, setSessionId] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const canvasRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    // Get the return tab from navigation state (instead of callback function)
    const returnToTab = location.state?.returnToTab || 'qrcode';
    const saveQRCodeToServer = async (imageData, sessionId) => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            toast.error('User not authenticated.');
            return;
        }
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/generate-and-save-qr/', {
                session_id: sessionId.trim(),
                qr_image: imageData,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.data.success) {
                throw new Error('Failed to save QR code');
            }
        }
        catch {
            toast.error('Could not save QR code to server.');
        }
    };
    const generateQRCode = async () => {
        if (isLoading)
            return;
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
        }
        catch (error) {
            let message = 'Something went wrong. Please try again.';
            if (error instanceof Error) {
                message = error.message;
            }
            toast.error(message);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("div", { className: "qr-generator-container", children: [_jsxs("button", { type: "button", onClick: () => navigate("/lecturerview"), className: "back-button", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "Back to Dashboard"] }), _jsxs("div", { className: "generator-card", children: [_jsxs("div", { className: "generator-header", children: [_jsx("h1", { className: "generator-title", children: "QR Code Generator" }), _jsx("p", { className: "generator-subtitle", children: "Generate attendance QR codes for your sessions" })] }), _jsxs("div", { className: "input-group", children: [_jsx("label", { className: "input-label", children: "Session ID" }), _jsx("input", { type: "text", value: sessionId, onChange: (e) => setSessionId(e.target.value), placeholder: "Enter Session ID (e.g., CS101-2024-01)", className: "session-input" })] }), _jsx("button", { onClick: generateQRCode, className: "generate-button", disabled: isLoading, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "loading-spinner" }), "Generating QR Code..."] })) : ('Generate QR Code') }), qrCodeUrl && (_jsx("div", { className: "qr-display-container", children: _jsx("canvas", { ref: canvasRef, className: "qr-canvas", "aria-label": "Generated QR Code" }) }))] }), _jsx(ToastContainer, { position: "top-right", autoClose: 3000, toastStyle: {
                    background: 'rgba(207, 8, 233, 0.57)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(7, 148, 241, 0.2)'
                } })] }));
};
export default QRCodeGenerator;
