import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import LecturerView from '@/pages/LecturerView/LecturerView';
import AdminView from '@/pages/AdminView/AdminView';
import StudentView from '@/pages/StudentView/StudentView';
const getAccessToken = () => localStorage.getItem('access_token');
const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    useEffect(() => {
        const token = getAccessToken();
        if (!token) {
            navigate('/login');
            return;
        }
        axios
            .get('http://127.0.0.1:8000/api/user/', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
            setUser(res.data);
            setLoading(false);
        })
            .catch(() => {
            localStorage.removeItem('access_token');
            navigate('/login');
            setLoading(false);
        });
    }, [navigate]);
    if (loading) {
        return _jsx(LoadingSpinner, {});
    }
    if (!user) {
        return null; // or some fallback UI
    }
    switch (user.role) {
        case 'lecturer':
            return _jsx(LecturerView, {});
        case 'admin':
            return _jsx(AdminView, {});
        case 'student':
            return _jsx(StudentView, {});
        default:
            return _jsx("div", { children: "Unauthorized role" });
    }
};
export default Dashboard;
