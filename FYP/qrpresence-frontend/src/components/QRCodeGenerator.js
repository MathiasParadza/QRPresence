import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
    const canvasRef = useRef(null);
    const navigate = useNavigate();
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
            navigate('/LecturerView', { state: { qrCodeUrl: url } });
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
    return (_jsxs("div", { className: "min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4", children: [_jsxs("button", { type: "button", onClick: () => navigate("/lecturerview"), className: "flex items-center gap-2 px-4 py-2 mb-4 bg-gray-200 text-gray-800 rounded hover:bg-purple-50 hover:text-purple-700 transition-colors", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "Back to Dashboard"] }), _jsx("h1", { className: "text-2xl font-bold mb-4 text-purple-600", children: "Attendance QR Code Generator" }), _jsx("input", { type: "text", value: sessionId, onChange: (e) => setSessionId(e.target.value), placeholder: "Enter Session ID", className: "px-4 py-2 border rounded w-full max-w-md mb-4" }), _jsx("button", { onClick: generateQRCode, className: `${isLoading ? 'bg-purple-300' : 'bg-purple-500 hover:bg-gray-400'} text-white px-6 py-2 rounded mb-4`, disabled: isLoading, children: isLoading ? 'Generating...' : 'Generate QR Code' }), qrCodeUrl && (_jsx(_Fragment, { children: _jsx("canvas", { ref: canvasRef, className: "mb-4", "aria-label": "Generated QR Code" }) })), _jsx(ToastContainer, { position: "top-right", autoClose: 3000 })] }));
};
export default QRCodeGenerator;
