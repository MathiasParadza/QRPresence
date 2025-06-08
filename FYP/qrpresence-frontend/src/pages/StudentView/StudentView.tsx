import { useEffect, useState, ChangeEvent } from 'react';
import axios from 'axios';
import QRScanner from '../../components/QRScanner';
import { toast } from 'react-toastify';

type Profile = {
  student_id: string;
  department: string;
  level: string;
  user?: {
    username?: string;
  };
};

const StudentView = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayStatus, setTodayStatus] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Omit<Profile, 'user'>>({
    student_id: '',
    department: '',
    level: '',
  });

  const token = localStorage.getItem('access_token');

  const fetchProfile = async () => {
    try {
      const response = await axios.get<Profile>('/api/student-profile/', {
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
    } catch (error) {
      console.error('Error fetching student profile:', error);
      toast.error('Failed to fetch profile.');
    }
  };

  const fetchTodayStatus = async () => {
    try {
      const res = await axios.get<{ status: string }>('/api/student/today-status/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTodayStatus(res.data.status);
    } catch (err) {
      console.error("Error fetching today's attendance status", err);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
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
    } catch (error) {
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

  if (!profile) return <p>Loading student data...</p>;

  return (
    <div>
      <h1>Welcome, {profile.user?.username || 'Student'}!</h1>
      <p>Your attendance is being tracked. Scan the QR code to mark your attendance.</p>

      <QRScanner />

      <div style={{ marginTop: '1rem' }}>
        <strong>Today's Attendance:</strong> {todayStatus ?? 'Checking...'}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Profile</h2>
        {!editing ? (
          <div>
            <p><strong>Student ID:</strong> {profile.student_id}</p>
            <p><strong>Department:</strong> {profile.department}</p>
            <p><strong>Level:</strong> {profile.level}</p>
            <button onClick={() => setEditing(true)}>Edit Profile</button>
          </div>
        ) : (
          <div>
            <input
              type="text"
              name="student_id"
              value={formData.student_id}
              onChange={handleInputChange}
              placeholder="Student ID"
            />
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              placeholder="Department"
            />
            <input
              type="text"
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              placeholder="Level"
            />
            <div>
              <button onClick={handleSave}>Save</button>
              <button onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button onClick={handleLogout} style={{ color: 'red' }}>Logout</button>
      </div>
    </div>
  );
};

export default StudentView;
