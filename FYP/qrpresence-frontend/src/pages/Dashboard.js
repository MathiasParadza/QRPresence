import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    useEffect(() => {
        const fetchUserData = async () => {
            const token = getAccessToken();
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/user/', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(response.data);
                setError(null);
            }
            catch (err) {
                console.error('Failed to fetch user data:', err);
                localStorage.removeItem('access_token');
                navigate('/login');
                setError('Failed to load user data');
            }
            finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [navigate]);
    const handleRetry = () => {
        setLoading(true);
        setError(null);
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
            setError(null);
        })
            .catch((err) => {
            console.error('Retry failed:', err);
            setError('Failed to load user data');
        })
            .then(() => {
            setLoading(false);
        });
    };
    const handleLogout = () => {
        localStorage.removeItem('access_token');
        navigate('/login');
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-100 flex items-center justify-center", children: _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-8 text-center", children: [_jsx(LoadingSpinner, {}), _jsx("p", { className: "mt-4 text-gray-600 font-medium", children: "Loading dashboard..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "min-h-screen bg-gray-100 flex items-center justify-center px-4", children: _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full", children: [_jsxs("div", { className: "mb-6", children: [_jsx("div", { className: "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx("svg", { className: "w-8 h-8 text-red-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" }) }) }), _jsx("h2", { className: "text-xl font-bold text-gray-900 mb-2", children: "Error Loading Dashboard" }), _jsx("p", { className: "text-gray-600 mb-6", children: error })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("button", { onClick: handleRetry, className: "w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200", children: "Try Again" }), _jsx("button", { onClick: handleLogout, className: "w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200", children: "Back to Login" })] })] }) }));
    }
    if (!user) {
        return (_jsx("div", { className: "min-h-screen bg-gray-100 flex items-center justify-center px-4", children: _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full", children: [_jsxs("div", { className: "mb-6", children: [_jsx("div", { className: "w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx("svg", { className: "w-8 h-8 text-yellow-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" }) }) }), _jsx("h2", { className: "text-xl font-bold text-gray-900 mb-2", children: "No User Data" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Unable to retrieve user information" })] }), _jsx("button", { onClick: handleLogout, className: "w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200", children: "Back to Login" })] }) }));
    }
    // Role-based rendering
    const renderRoleBasedView = () => {
        switch (user.role) {
            case 'lecturer':
                return _jsx(LecturerView, {});
            case 'admin':
                return _jsx(AdminView, {});
            case 'student':
                return _jsx(StudentView, {});
            default:
                return (_jsx("div", { className: "min-h-screen bg-gray-100 flex items-center justify-center px-4", children: _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full", children: [_jsxs("div", { className: "mb-6", children: [_jsx("div", { className: "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx("svg", { className: "w-8 h-8 text-red-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" }) }) }), _jsx("h2", { className: "text-xl font-bold text-gray-900 mb-2", children: "Unauthorized Access" }), _jsxs("p", { className: "text-gray-600 mb-2", children: ["Your role \"", user.role, "\" is not recognized"] }), _jsx("p", { className: "text-sm text-gray-500 mb-6", children: "Please contact your administrator" })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("button", { onClick: handleRetry, className: "w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200", children: "Refresh" }), _jsx("button", { onClick: handleLogout, className: "w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200", children: "Logout" })] })] }) }));
        }
    };
    return renderRoleBasedView();
};
export default Dashboard;
