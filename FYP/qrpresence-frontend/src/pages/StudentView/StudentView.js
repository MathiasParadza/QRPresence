import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import axios from 'axios';
import QRScanner from '../../components/QRScanner';
import { toast } from 'react-toastify';
const StudentView = () => {
    const [profile, setProfile] = useState(null);
    const [todayStatus, setTodayStatus] = useState(null);
    const [editing, setEditing] = useState(false);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [formData, setFormData] = useState({
        student_id: '',
        department: '',
        level: '',
    });
    const token = localStorage.getItem('access_token');
    useEffect(() => {
        if (!token) {
            toast.error('No access token found. Please login again.');
            window.location.href = '/login';
            return;
        }
        fetchProfile();
        fetchTodayStatus();
        fetchAttendanceHistory();
    }, []);
    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/student-profile/', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }
            const data = await response.json();
            setProfile({
                student_id: data.student_id?.toString() ?? '',
                department: data.course ?? '',
                level: '', // Not provided in API
                user: { username: data.name ?? '' },
            });
            setFormData({
                student_id: data.student_id?.toString() ?? '',
                department: data.course ?? '',
                level: '',
            });
        }
        catch (error) {
            console.error('Error fetching student profile:', error);
            toast.error('Failed to fetch profile.');
        }
    };
    const fetchTodayStatus = async () => {
        try {
            const res = await axios.get('/api/student/today-status/', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTodayStatus(res.data.status);
        }
        catch (err) {
            console.error("Error fetching today's attendance status", err);
        }
    };
    const fetchAttendanceHistory = async () => {
        try {
            const res = await axios.get('/api/student/attendance-history/', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const history = Array.isArray(res.data) ? res.data : [];
            setAttendanceHistory(history);
        }
        catch (err) {
            console.error('Failed to fetch attendance history', err);
        }
    };
    const handleInputChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };
    const handleSave = async () => {
        try {
            await axios.put('/api/student-profile/', {
                student_id: formData.student_id,
                course: formData.department,
                // level is not used in backend per API structure
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Profile updated successfully');
            setEditing(false);
            fetchProfile();
        }
        catch (error) {
            toast.error('Error updating profile');
        }
    };
    const handleLogout = () => {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
    };
    if (!profile)
        return _jsx("p", { style: { padding: '1rem' }, children: "Loading student data..." });
    return (_jsxs("div", { style: { padding: '1.5rem', backgroundColor: '#ffffff', minHeight: '100vh' }, children: [_jsxs("h1", { style: { color: '#6b21a8' }, children: ["Welcome, ", profile.user?.username || 'Student', "!"] }), _jsx("p", { style: { marginBottom: '1rem' }, children: "Your attendance is being tracked. Scan the QR code to mark your attendance." }), _jsx(QRScanner, {}), _jsxs("div", { style: { marginTop: '2rem', backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem' }, children: [_jsx("h2", { style: { color: '#16a34a' }, children: "Today's Attendance" }), _jsx("p", { children: todayStatus ?? 'Checking...' })] }), _jsxs("div", { style: { marginTop: '2rem' }, children: [_jsx("h2", { style: { color: '#6b21a8' }, children: "Profile" }), !editing ? (_jsxs("div", { children: [_jsxs("p", { children: [_jsx("strong", { children: "Student ID:" }), " ", profile.student_id] }), _jsxs("p", { children: [_jsx("strong", { children: "Department:" }), " ", profile.department] }), _jsxs("p", { children: [_jsx("strong", { children: "Level:" }), " ", profile.level] }), _jsx("button", { onClick: () => setEditing(true), style: {
                                    marginTop: '0.5rem',
                                    backgroundColor: '#6b21a8',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer'
                                }, children: "Edit Profile" })] })) : (_jsxs("div", { children: [_jsx("input", { type: "text", name: "student_id", value: formData.student_id, onChange: handleInputChange, placeholder: "Student ID", style: { display: 'block', marginBottom: '0.5rem' } }), _jsx("input", { type: "text", name: "department", value: formData.department, onChange: handleInputChange, placeholder: "Department", style: { display: 'block', marginBottom: '0.5rem' } }), _jsx("input", { type: "text", name: "level", value: formData.level, onChange: handleInputChange, placeholder: "Level", style: { display: 'block', marginBottom: '0.5rem' } }), _jsxs("div", { children: [_jsx("button", { onClick: handleSave, style: { marginRight: '0.5rem' }, children: "Save" }), _jsx("button", { onClick: () => setEditing(false), children: "Cancel" })] })] }))] }), _jsxs("div", { style: { marginTop: '2rem' }, children: [_jsx("h2", { style: { color: '#6b21a8' }, children: "Attendance History" }), attendanceHistory.length > 0 ? (attendanceHistory.map((record) => (_jsxs("div", { style: {
                            backgroundColor: '#f3e8ff',
                            padding: '0.5rem 1rem',
                            marginBottom: '0.5rem',
                            borderRadius: '0.375rem'
                        }, children: [_jsxs("p", { children: [_jsx("strong", { children: "Date:" }), " ", record.date] }), _jsxs("p", { children: [_jsx("strong", { children: "Status:" }), " ", record.status] })] }, record.id)))) : (_jsx("p", { children: "No attendance records found." }))] }), _jsx("div", { style: { marginTop: '2rem' }, children: _jsx("button", { onClick: handleLogout, style: {
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                    }, children: "Logout" }) })] }));
};
export default StudentView;
