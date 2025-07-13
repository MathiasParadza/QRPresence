import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import LecturerView from '@/pages/LecturerView/LecturerView';
import AdminView from '@/pages/AdminView/AdminView';
import StudentView from '@/pages/StudentView/StudentView';

interface User {
  name: string;
  role: 'student' | 'lecturer' | 'admin';
}

const getAccessToken = () => localStorage.getItem('access_token');

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate('/login');
      return;
    }

    axios
      .get<User>('http://127.0.0.1:8000/api/user/', {
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
    return <LoadingSpinner />;
  }

  if (!user) {
    return null; // or some fallback UI
  }

  switch (user.role) {
    case 'lecturer':
      return <LecturerView />;
    case 'admin':
      return <AdminView />;
    case 'student':
      return <StudentView />;
    default:
      return <div>Unauthorized role</div>;
  }
};

export default Dashboard;
