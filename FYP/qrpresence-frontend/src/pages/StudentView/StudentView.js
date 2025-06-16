import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import axios from 'axios';
import QRScanner from '../../components/QRScanner';
import { toast } from 'react-toastify';
const StudentView = () => {
    const [profile, setProfile] = useState(null);
    const [todayStatus, setTodayStatus] = useState(null);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        student_id: '',
        department: '',
        level: '',
    });
    const token = localStorage.getItem('access_token');
    const fetchProfile = async () => {
        try {
            const response = await axios.get('/api/student-profile/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = response.data;
            setProfile(data);
            setFormData({
                student_id: data.student_id ?? '',
                department: data.department ?? '',
                level: data.level ?? '',
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
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setTodayStatus(res.data.status);
        }
        catch (err) {
            console.error("Error fetching today's attendance status", err);
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
            await axios.put('/api/student-profile/', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
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
    useEffect(() => {
        if (!token) {
            toast.error('No access token found. Please login again.');
            window.location.href = '/login';
            return;
        }
        fetchProfile();
        fetchTodayStatus();
    }, []);
    if (!profile)
        return _jsx("p", { children: "Loading student data..." });
    return (_jsxs("div", { children: [_jsxs("h1", { children: ["Welcome, ", profile.user?.username || 'Student', "!"] }), _jsx("p", { children: "Your attendance is being tracked. Scan the QR code to mark your attendance." }), _jsx(QRScanner, {}), _jsxs("div", { style: { marginTop: '1rem' }, children: [_jsx("strong", { children: "Today's Attendance:" }), " ", todayStatus ?? 'Checking...'] }), _jsxs("div", { style: { marginTop: '2rem' }, children: [_jsx("h2", { children: "Profile" }), !editing ? (_jsxs("div", { children: [_jsxs("p", { children: [_jsx("strong", { children: "Student ID:" }), " ", profile.student_id] }), _jsxs("p", { children: [_jsx("strong", { children: "Department:" }), " ", profile.department] }), _jsxs("p", { children: [_jsx("strong", { children: "Level:" }), " ", profile.level] }), _jsx("button", { onClick: () => setEditing(true), children: "Edit Profile" })] })) : (_jsxs("div", { children: [_jsx("input", { type: "text", name: "student_id", value: formData.student_id, onChange: handleInputChange, placeholder: "Student ID" }), _jsx("input", { type: "text", name: "department", value: formData.department, onChange: handleInputChange, placeholder: "Department" }), _jsx("input", { type: "text", name: "level", value: formData.level, onChange: handleInputChange, placeholder: "Level" }), _jsxs("div", { children: [_jsx("button", { onClick: handleSave, children: "Save" }), _jsx("button", { onClick: () => setEditing(false), children: "Cancel" })] })] }))] }), _jsx("div", { style: { marginTop: '2rem' }, children: _jsx("button", { onClick: handleLogout, style: { color: 'red' }, children: "Logout" }) })] }));
};
export default StudentView;
