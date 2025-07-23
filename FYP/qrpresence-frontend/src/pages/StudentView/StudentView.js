import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import QRScanner from '../../components/QRScanner';
import { toast } from 'react-toastify';
import defaultAvatar from '../../assets/avatar.png';
import './StudentView.css';
const StudentView = () => {
    const [profile, setProfile] = useState(null);
    const [todayStatus, setTodayStatus] = useState(null);
    const [editing, setEditing] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        student_id: '',
        program: '',
    });
    const token = localStorage.getItem('access_token');
    const API_BASE_URL = 'http://localhost:8000';
    useEffect(() => {
        if (!token) {
            toast.error('No access token found. Please login again.');
            window.location.href = '/login';
            return;
        }
        const fetchAll = async () => {
            try {
                await fetchProfile();
                await fetchOverview();
            }
            catch (err) {
                console.error(err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);
    const fetchOverview = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/student/overview/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || `Request failed with status ${response.status}`);
            }
            const data = await response.json();
            setTodayStatus(data.today_status);
            setAttendanceHistory(data.attendance_history);
        }
        catch (error) {
            console.error('Error fetching overview:', error);
            toast.error('Failed to load attendance overview');
        }
    };
    const fetchProfile = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/student-profile/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || `Request failed with status ${response.status}`);
            }
            const data = await response.json();
            setProfile({
                student_id: data.student_id?.toString() || '',
                program: data.program || '',
                name: data.name || '',
                email: data.email || '',
            });
            setFormData({
                student_id: data.student_id?.toString() || '',
                program: data.program || '',
            });
        }
        catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile data');
        }
    };
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleSave = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/student-profile/`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_id: formData.student_id,
                    program: formData.program,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || 'Failed to update profile');
            }
            toast.success('Profile updated successfully');
            setEditing(false);
            fetchProfile();
        }
        catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error instanceof Error ? error.message : 'Update failed');
        }
    };
    function handleLogout() {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
    }
    if (loading) {
        return (_jsx("div", { className: "loading-container", children: _jsx("div", { className: "loading-content", children: _jsx("p", { className: "loading-text", children: "Loading student data..." }) }) }));
    }
    return (_jsxs("div", { className: "student-view-container", children: [_jsxs("div", { className: "header-container", children: [_jsxs("h1", { className: "header-title", children: ["Welcome, ", profile?.name || 'Student', "!"] }), _jsxs("div", { children: [_jsx("img", { src: defaultAvatar, alt: "Avatar", className: "avatar", onClick: () => setShowProfile((prev) => !prev) }), _jsx("button", { onClick: handleLogout, className: "logout-button", children: "Logout" })] })] }), showProfile && profile && (_jsxs("div", { className: "profile-container", children: [_jsx("h2", { className: "profile-title", children: "Profile Information" }), !editing ? (_jsxs("div", { className: "profile-edit-view", children: [_jsxs("div", { className: "profile-grid", children: [_jsxs("div", { className: "profile-field", children: [_jsx("strong", { className: "profile-label", children: "Name:" }), _jsx("p", { className: "profile-value", children: profile.name })] }), _jsxs("div", { className: "profile-field", children: [_jsx("strong", { className: "profile-label", children: "Email:" }), _jsx("p", { className: "profile-value", children: profile.email })] }), _jsxs("div", { className: "profile-field", children: [_jsx("strong", { className: "profile-label", children: "Student ID:" }), _jsx("p", { className: "profile-value", children: profile.student_id })] }), _jsxs("div", { className: "profile-field", children: [_jsx("strong", { className: "profile-label", children: "Program:" }), _jsx("p", { className: "profile-value", children: profile.program })] })] }), _jsx("button", { onClick: () => setEditing(true), className: "edit-button", children: "Edit Profile" })] })) : (_jsxs("div", { className: "profile-edit-form", children: [_jsxs("div", { className: "profile-edit-fields", children: [_jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Student ID:" }), _jsx("input", { type: "text", name: "student_id", value: formData.student_id, onChange: handleInputChange, placeholder: "Enter Student ID", className: "form-input" })] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Program:" }), _jsx("input", { type: "text", name: "program", value: formData.program, onChange: handleInputChange, placeholder: "Program", className: "form-input" })] })] }), _jsxs("div", { className: "form-buttons", children: [_jsx("button", { onClick: handleSave, className: "save-button", children: "Save Changes" }), _jsx("button", { onClick: () => setEditing(false), className: "cancel-button", children: "Cancel" })] })] }))] })), _jsx("div", { className: "instructions-container", children: _jsx("p", { className: "instructions-text", children: "Your attendance is being tracked. Scan the QR code below to mark your attendance." }) }), _jsxs("div", { className: "qr-scanner-container", children: [_jsx("h2", { className: "qr-scanner-title", children: "QR Code Scanner" }), _jsx(QRScanner, {})] }), _jsxs("div", { className: "attendance-status-container", children: [_jsx("h2", { className: "attendance-status-title", children: "Today's Attendance Status" }), _jsx("div", { className: "attendance-status-content", children: _jsx("p", { className: `attendance-status-text ${todayStatus ?
                                (todayStatus.toLowerCase() === 'present' ? 'status-present' : 'status-absent') :
                                'status-default'}`, children: todayStatus || 'No attendance recorded for today' }) })] }), _jsxs("div", { className: "attendance-history-container", children: [_jsx("h2", { className: "attendance-history-title", children: "Attendance History" }), attendanceHistory.length > 0 ? (_jsx("div", { className: "attendance-history-grid", children: attendanceHistory.map((record) => (_jsxs("div", { className: "attendance-record", children: [_jsxs("div", { children: [_jsx("strong", { className: "record-label", children: "Date:" }), _jsx("p", { className: "record-value", children: new Date(record.session_date).toLocaleDateString() })] }), _jsxs("div", { children: [_jsx("strong", { className: "record-label", children: "Time:" }), _jsx("p", { className: "record-value", children: record.session_time })] }), _jsxs("div", { children: [_jsx("strong", { className: "record-label", children: "Status:" }), _jsx("p", { className: `record-value ${record.status.toLowerCase() === 'present' ? 'status-present' : 'status-absent'}`, children: record.status })] }), _jsxs("div", { children: [_jsx("strong", { className: "record-label", children: "Class:" }), _jsx("p", { className: "record-value", children: record.class_name })] })] }, record.id))) })) : (_jsx("div", { className: "no-records", children: _jsx("p", { className: "no-records-text", children: "No attendance records found yet." }) }))] })] }));
};
export default StudentView;
