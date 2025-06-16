import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import QRCode from 'qrcode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
const QRCodeGenerator = () => {
    const [sessionId, setSessionId] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('info');
    const canvasRef = useRef(null);
    const navigate = useNavigate();
    const generateQRCode = async () => {
        if (isLoading)
            return;
        setIsLoading(true);
        try {
            if (!sessionId) {
                setToastMessage('Session ID is required.');
                setToastType('error');
                return;
            }
            const token = `attendance:${sessionId.trim()}`;
            const url = await QRCode.toDataURL(token);
            setQrCodeUrl(url);
            if (canvasRef.current) {
                await QRCode.toCanvas(canvasRef.current, token);
            }
            await saveQRCodeToServer(url, sessionId.trim());
            setToastMessage('QR Code generated and saved successfully!');
            setToastType('success');
            // Navigate to LecturerView with QR code URL
            navigate('/LecturerView', { state: { qrCodeUrl: url } });
        }
        catch (error) {
            setToastMessage(error.message || 'Something went wrong. Please try again.');
            setToastType('error');
        }
        finally {
            setIsLoading(false);
        }
    };
    const saveQRCodeToServer = async (imageData, sessionId) => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setToastMessage('User not authenticated.');
            setToastType('error');
            return;
        }
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/generate-and-save-qr/', { session_name: `Session ${sessionId}`, qr_image: imageData }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.data.success) {
                throw new Error('Failed to save QR code');
            }
        }
        catch (error) {
            setToastMessage('Could not save QR code to server.');
            setToastType('error');
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Attendance QR Code Generator" }), _jsx("input", { type: "text", value: sessionId, onChange: (e) => setSessionId(e.target.value), placeholder: "Enter Session ID", className: "px-4 py-2 border rounded w-full max-w-md mb-4" }), _jsx("button", { onClick: generateQRCode, className: `${isLoading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'} text-white px-6 py-2 rounded mb-4`, disabled: isLoading, children: isLoading ? 'Generating...' : 'Generate QR Code' }), qrCodeUrl && (_jsx(_Fragment, { children: _jsx("canvas", { ref: canvasRef, className: "mb-4", "aria-label": "Generated QR Code" }) })), toastMessage && (_jsx("div", { className: `mt-4 p-4 rounded ${toastType === 'success'
                    ? 'bg-green-100 text-green-800'
                    : toastType === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'}`, children: toastMessage }))] }));
};
export default QRCodeGenerator;
