import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { QrCode, Download, Trash2, Eye, Clock, Calendar, RefreshCw } from 'lucide-react';
import axios from 'axios';
const QRCodeManagement = () => {
    const [qrCodes, setQrCodes] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        session: '',
        ordering: 'created_at'
    });
    const fetchQRCodes = React.useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const params = new URLSearchParams();
            if (filters.session)
                params.append('session', filters.session);
            if (filters.ordering)
                params.append('ordering', filters.ordering);
            const response = await axios.get(`http://localhost:8000/api/admin/qrcodes/?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQrCodes(response.data);
        }
        catch (err) {
            setError('Failed to fetch QR codes');
            console.error('Error fetching QR codes:', err);
        }
        finally {
            setLoading(false);
        }
    }, [filters]);
    useEffect(() => {
        fetchQRCodes();
        fetchSessions();
    }, [filters, fetchQRCodes]);
    const fetchSessions = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get('http://localhost:8000/api/admin/sessions/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSessions(response.data);
        }
        catch (err) {
            console.error('Error fetching sessions:', err);
        }
    };
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    const handleDeleteQRCode = async ({ qrCodeId }) => {
        if (!window.confirm('Are you sure you want to delete this QR code?'))
            return;
        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`http://localhost:8000/api/admin/qrcodes/${qrCodeId}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQrCodes(qrCodes.filter((qrCode) => qrCode.id !== qrCodeId));
        }
        catch (err) {
            setError('Failed to delete QR code');
            console.error('Error deleting QR code:', err);
        }
    };
    const handleRegenerateQRCode = async (qrCodeId) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.post(`http://localhost:8000/api/admin/qrcodes/${qrCodeId}/regenerate/`, {}, { headers: { Authorization: `Bearer ${token}` } });
            // Update the QR code in the list
            setQrCodes(qrCodes.map((qrCode) => qrCode.id === qrCodeId ? response.data : qrCode));
            alert('QR code regenerated successfully!');
        }
        catch (err) {
            setError('Failed to regenerate QR code');
            console.error('Error regenerating QR code:', err);
        }
    };
    const isQRCodeExpired = (expiresAt) => {
        if (!expiresAt)
            return true;
        return new Date(expiresAt) < new Date();
    };
    const getQRCodeStatus = (qrCode) => {
        if (isQRCodeExpired(qrCode.expires_at)) {
            return 'expired';
        }
        const now = new Date();
        const expiresAt = new Date(qrCode.expires_at);
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        const minutesUntilExpiry = timeUntilExpiry / (1000 * 60);
        if (minutesUntilExpiry < 5) {
            return 'expiring-soon';
        }
        return 'active';
    };
    if (loading)
        return _jsx("div", { className: "admin-loading", children: "Loading QR codes..." });
    if (error)
        return _jsx("div", { className: "admin-error", children: error });
    return (_jsxs("div", { className: "admin-page", children: [_jsxs("div", { className: "admin-page__header", children: [_jsx("h2", { children: "QR Code Management" }), _jsx("p", { children: "Manage all QR codes for attendance tracking" })] }), _jsx("div", { className: "admin-filters", children: _jsxs("div", { className: "admin-filters__group", children: [_jsxs("div", { className: "admin-filter", children: [_jsx("label", { htmlFor: "sessionSelect", children: "Session" }), _jsxs("select", { id: "sessionSelect", value: filters.session, onChange: (e) => handleFilterChange('session', e.target.value), children: [_jsx("option", { value: "", children: "All Sessions" }), sessions.map(session => (_jsxs("option", { value: session.id, children: [session.class_name, " (", session.session_id, ")"] }, session.id)))] })] }), _jsxs("div", { className: "admin-filter", children: [_jsx("label", { htmlFor: "sortBySelect", children: "Sort By" }), _jsxs("select", { id: "sortBySelect", value: filters.ordering, onChange: (e) => handleFilterChange('ordering', e.target.value), children: [_jsx("option", { value: "created_at", children: "Created Date" }), _jsx("option", { value: "-created_at", children: "Created Date (Desc)" }), _jsx("option", { value: "expires_at", children: "Expiry Date" }), _jsx("option", { value: "-expires_at", children: "Expiry Date (Desc)" })] })] })] }) }), _jsxs("div", { className: "admin-table-container", children: [_jsxs("table", { className: "admin-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "QR Code ID" }), _jsx("th", { children: "Session" }), _jsx("th", { children: "Course" }), _jsx("th", { children: "Created At" }), _jsx("th", { children: "Expires At" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: qrCodes.map((qrCode) => {
                                    const status = getQRCodeStatus(qrCode);
                                    return (_jsxs("tr", { children: [_jsx("td", { children: _jsxs("span", { className: "qr-code-id", children: [qrCode.id.slice(0, 8), "..."] }) }), _jsx("td", { children: qrCode.session && (_jsxs("span", { className: "session-info", children: [qrCode.session.class_name, _jsx("br", {}), _jsxs("small", { className: "text-muted", children: ["ID: ", qrCode.session.session_id] })] })) }), _jsx("td", { children: qrCode.session?.course && (_jsx("span", { className: "course-info", children: qrCode.session.course.code })) }), _jsx("td", { children: qrCode.created_at && (_jsxs("span", { className: "created-date", children: [_jsx(Calendar, { size: 14 }), new Date(qrCode.created_at).toLocaleDateString(), _jsx("br", {}), _jsx("small", { className: "text-muted", children: new Date(qrCode.created_at).toLocaleTimeString() })] })) }), _jsx("td", { children: qrCode.expires_at && (_jsxs("span", { className: `expiry-date ${status}`, children: [_jsx(Clock, { size: 14 }), new Date(qrCode.expires_at).toLocaleDateString(), _jsx("br", {}), _jsx("small", { className: "text-muted", children: new Date(qrCode.expires_at).toLocaleTimeString() })] })) }), _jsx("td", { children: _jsxs("span", { className: `qr-status qr-status--${status}`, children: [status === 'active' && 'Active', status === 'expiring-soon' && 'Expiring Soon', status === 'expired' && 'Expired'] }) }), _jsx("td", { children: _jsxs("div", { className: "admin-actions", children: [_jsx("button", { className: "admin-action-btn admin-action-btn--view", title: "View QR Code", children: _jsx(Eye, { size: 16 }) }), _jsx("button", { className: "admin-action-btn admin-action-btn--refresh", title: "Regenerate QR Code", onClick: () => handleRegenerateQRCode(qrCode.id), children: _jsx(RefreshCw, { size: 16 }) }), _jsx("button", { className: "admin-action-btn admin-action-btn--delete", title: "Delete", onClick: () => handleDeleteQRCode({ qrCodeId: qrCode.id }), children: _jsx(Trash2, { size: 16 }) })] }) })] }, qrCode.id));
                                }) })] }), qrCodes.length === 0 && (_jsxs("div", { className: "admin-empty-state", children: [_jsx(QrCode, { size: 48 }), _jsx("p", { children: "No QR codes found" })] }))] }), _jsx("div", { className: "admin-page__actions", children: _jsxs("button", { className: "admin-button admin-button--secondary", children: [_jsx(Download, { size: 20 }), "Export Data"] }) })] }));
};
export default QRCodeManagement;
