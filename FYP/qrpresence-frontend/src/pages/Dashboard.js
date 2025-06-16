import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner'; // Import the LoadingSpinner component
const getAccessToken = () => localStorage.getItem('access_token');
const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // State to track loading
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
            const fetchedUser = res.data;
            setUser(fetchedUser);
            setLoading(false); // Set loading to false after fetching data
            // Redirect immediately based on role
            if (fetchedUser.role === 'lecturer') {
                navigate('/LecturerView');
            }
            else if (fetchedUser.role === 'student') {
                navigate('/StudentView');
            }
            else if (fetchedUser.role === 'admin') {
                navigate('/AdminView');
            }
        })
            .catch(() => {
            localStorage.removeItem('access_token');
            navigate('/login');
        });
    }, [navigate]);
    return (_jsx("div", { className: "p-4", children: loading ? (_jsx(LoadingSpinner, {}) // Display the loading spinner while loading
        ) : (_jsx("div", { children: _jsxs("h1", { className: "text-2xl font-bold", children: ["Welcome, ", user?.name] }) })) }));
};
export default Dashboard;
