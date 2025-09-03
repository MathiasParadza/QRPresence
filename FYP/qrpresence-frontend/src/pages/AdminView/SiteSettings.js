import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/admin/Settings/SiteSettings.tsx
import { useState, useEffect } from 'react';
import { Save, RefreshCw, Upload } from 'lucide-react';
import axios from 'axios';
const SiteSettings = () => {
    const [settings, setSettings] = useState({
        site_title: 'QRPresence',
        site_logo: '',
        academic_year: '2023/2024',
        semester: '1',
        attendance_threshold: 75,
        qr_code_expiry: 15,
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    useEffect(() => {
        fetchSettings();
    }, []);
    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get('http://127.0.0.1:8000/api/admin/settings/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setSettings(response.data);
        }
        catch (err) {
            console.error('Settings fetch error:', err);
        }
    };
    const handleSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            await axios.post('http://127.0.0.1:8000/api/admin/settings/', settings, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
        catch (err) {
            alert('Failed to save settings');
            console.error('Settings save error:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value,
        }));
    };
    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Implement logo upload logic here
            console.log('Uploading logo:', file);
        }
    };
    return (_jsxs("div", { className: "site-settings", children: [_jsxs("div", { className: "site-settings__header", children: [_jsx("h2", { children: "Site Settings" }), _jsxs("button", { className: `admin-button admin-button--primary ${loading ? 'admin-button--loading' : ''}`, onClick: handleSave, disabled: loading, children: [loading ? _jsx(RefreshCw, { size: 16, className: "spinner" }) : _jsx(Save, { size: 16 }), loading ? 'Saving...' : 'Save Settings'] })] }), saved && (_jsx("div", { className: "admin-message admin-message--success", children: "Settings saved successfully!" })), _jsxs("div", { className: "site-settings__form", children: [_jsxs("div", { className: "form-section", children: [_jsx("h3", { children: "General Settings" }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "site_title", children: "Site Title" }), _jsx("input", { type: "text", id: "site_title", name: "site_title", value: settings.site_title, onChange: handleInputChange, className: "form-input" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "site_logo", children: "Site Logo" }), _jsxs("div", { className: "logo-upload", children: [_jsx("input", { type: "file", id: "site_logo", accept: "image/*", onChange: handleLogoUpload, className: "logo-upload__input" }), _jsxs("label", { htmlFor: "site_logo", className: "logo-upload__label", children: [_jsx(Upload, { size: 16 }), "Upload Logo"] }), settings.site_logo && (_jsx("div", { className: "logo-preview", children: _jsx("img", { src: settings.site_logo, alt: "Site logo" }) }))] })] })] }), _jsxs("div", { className: "form-section", children: [_jsx("h3", { children: "Academic Settings" }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "academic_year", children: "Academic Year" }), _jsx("input", { type: "text", id: "academic_year", name: "academic_year", value: settings.academic_year, onChange: handleInputChange, className: "form-input", placeholder: "e.g., 2023/2024" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "semester", children: "Semester" }), _jsxs("select", { id: "semester", name: "semester", value: settings.semester, onChange: handleInputChange, className: "form-input", children: [_jsx("option", { value: "1", children: "Semester 1" }), _jsx("option", { value: "2", children: "Semester 2" }), _jsx("option", { value: "3", children: "Summer Semester" })] })] })] }), _jsxs("div", { className: "form-section", children: [_jsx("h3", { children: "Attendance Settings" }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "attendance_threshold", children: "Attendance Threshold (%)" }), _jsx("input", { type: "number", id: "attendance_threshold", name: "attendance_threshold", value: settings.attendance_threshold, onChange: handleInputChange, min: "0", max: "100", className: "form-input" }), _jsx("p", { className: "form-help", children: "Minimum attendance percentage required" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "qr_code_expiry", children: "QR Code Expiry (minutes)" }), _jsx("input", { type: "number", id: "qr_code_expiry", name: "qr_code_expiry", value: settings.qr_code_expiry, onChange: handleInputChange, min: "1", max: "60", className: "form-input" }), _jsx("p", { className: "form-help", children: "How long QR codes remain valid" })] })] })] })] }));
};
export default SiteSettings;
