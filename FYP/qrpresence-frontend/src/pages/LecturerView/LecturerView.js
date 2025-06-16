import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
const LecturerView = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    useEffect(() => {
        if (location.state && location.state.qrCodeUrl) {
            setQrCodeUrl(location.state.qrCodeUrl);
        }
    }, [location.state]);
    const downloadQRCode = () => {
        if (!qrCodeUrl)
            return;
        const link = document.createElement('a');
        link.href = qrCodeUrl;
        link.download = 'attendance_qr.png';
        link.click();
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-100 p-6", children: [_jsx("h1", { className: "text-3xl font-bold mb-4", children: "Welcome Lecturer!" }), _jsx("p", { className: "mb-6", children: "You can manage your sessions here." }), _jsx("div", { className: "mb-6", children: _jsx("button", { onClick: () => navigate('/generate-qr'), className: "bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600", children: "Generate Attendance QR" }) }), _jsx("div", { className: "mb-6", children: _jsx("button", { onClick: () => navigate('/create-session'), className: "bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600", children: "Create Session" }) }), _jsx("div", { className: "mb-6", children: _jsx("button", { onClick: () => navigate('/sessions'), className: "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600", children: "View All Sessions" }) }), _jsx("div", { className: "mb-6", children: _jsx("button", { onClick: () => navigate('/more-placeholder'), className: "bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600", children: "More Placeholder" }) }), qrCodeUrl && (_jsxs("div", { className: "mt-8", children: [_jsx("h2", { className: "text-xl font-semibold mb-2", children: "Latest Attendance QR Code:" }), _jsx("img", { src: qrCodeUrl, alt: "Latest QR Code", className: "w-64 h-64 object-contain border border-gray-300 rounded" }), _jsx("button", { onClick: downloadQRCode, className: "mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded", children: "Download QR Code" })] }))] }));
};
export default LecturerView;
