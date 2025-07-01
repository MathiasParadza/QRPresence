import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    return (_jsx("div", { className: "min-h-screen bg-white flex items-center justify-center px-4 py-10", children: _jsxs("div", { className: "w-full max-w-5xl bg-purple-50 shadow-xl rounded-2xl p-8", children: [_jsx("h1", { className: "text-4xl font-bold text-purple-700 text-center mb-3", children: "Lecturer Dashboard" }), _jsx("p", { className: "text-center text-gray-700 mb-8", children: "Manage your sessions and track attendance." }), _jsxs(Tabs, { defaultValue: "actions", className: "w-full", children: [_jsxs(TabsList, { className: "grid grid-cols-3 gap-2 bg-white border border-purple-200 rounded-xl p-2 mb-6 shadow-sm", children: [_jsx(TabsTrigger, { value: "actions", className: "data-[state=active]:bg-purple-600 data-[state=active]:text-white transition rounded-lg py-2", children: "Actions" }), _jsx(TabsTrigger, { value: "qrcode", className: "data-[state=active]:bg-purple-600 data-[state=active]:text-white transition rounded-lg py-2", children: "Latest QR" }), _jsx(TabsTrigger, { value: "stats", className: "data-[state=active]:bg-purple-600 data-[state=active]:text-white transition rounded-lg py-2", children: "Statistics" })] }), _jsx(TabsContent, { value: "actions", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-purple-100 p-4 rounded-xl shadow-sm", children: [_jsx("h2", { className: "text-lg font-semibold text-purple-800 mb-2", children: "Generate Attendance QR" }), _jsx("button", { onClick: () => navigate('/generate-qr'), className: "w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium", children: "\uD83D\uDCF7 Generate QR" })] }), _jsxs("div", { className: "bg-green-100 p-4 rounded-xl shadow-sm", children: [_jsx("h2", { className: "text-lg font-semibold text-green-800 mb-2", children: "Sessions" }), _jsx("button", { onClick: () => navigate('/create-session'), className: "w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium", children: "\uD83D\uDCDA Session Management" })] }), _jsxs("div", { className: "bg-gray-100 p-4 rounded-xl shadow-sm", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-800 mb-2", children: "More Tools" }), _jsx("button", { onClick: () => navigate('/more-placeholder'), className: "w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-medium", children: "\uD83D\uDD27 Coming Soon" })] })] }) }), _jsx(TabsContent, { value: "qrcode", children: qrCodeUrl ? (_jsxs("div", { className: "text-center mt-4", children: [_jsx("h2", { className: "text-xl font-semibold text-purple-700 mb-4", children: "Latest Attendance QR Code" }), _jsx("img", { src: qrCodeUrl, alt: "Latest QR Code", className: "w-64 h-64 mx-auto border-4 border-green-400 rounded-xl" }), _jsx("button", { onClick: downloadQRCode, className: "mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold", children: "\u2B07\uFE0F Download QR Code" })] })) : (_jsx("p", { className: "text-center text-gray-600 mt-4", children: "No QR Code available yet." })) }), _jsx(TabsContent, { value: "stats", children: _jsx("div", { className: "text-center text-gray-600 py-6", children: "\uD83D\uDCCA Attendance statistics and session reports will appear here." }) })] })] }) }));
};
export default LecturerView;
