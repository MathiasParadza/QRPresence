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

type AttendanceRecord = {
  id: number;
  date: string;
  status: string;
};

const StudentView = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayStatus, setTodayStatus] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [formData, setFormData] = useState<Omit<Profile, 'user'>>({
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
      const response = await axios.get<Profile>('/api/student-profile/', {
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodayStatus(res.data.status);
    } catch (err) {
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
    } catch (err) {
      console.error('Failed to fetch attendance history', err);
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
        headers: { Authorization: `Bearer ${token}` },
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

  if (!profile) return <p style={{ padding: '1rem' }}>Loading student data...</p>;

  
  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <h1 style={{ color: '#6b21a8' }}>
        Welcome, {profile.user?.username || 'Student'}!
      </h1>
      <p style={{ marginBottom: '1rem' }}>
        Your attendance is being tracked. Scan the QR code to mark your attendance.
      </p>

      <QRScanner />

      <div style={{ marginTop: '2rem', backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem' }}>
        <h2 style={{ color: '#16a34a' }}>Today's Attendance</h2>
        <p>{todayStatus ?? 'Checking...'}</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ color: '#6b21a8' }}>Profile</h2>
        {!editing ? (
          <div>
            <p><strong>Student ID:</strong> {profile.student_id}</p>
            <p><strong>Department:</strong> {profile.department}</p>
            <p><strong>Level:</strong> {profile.level}</p>
            <button
              onClick={() => setEditing(true)}
              style={{
                marginTop: '0.5rem',
                backgroundColor: '#6b21a8',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <div>
            <input
              type="text"
              name="student_id"
              value={formData.student_id}
              onChange={handleInputChange}
              placeholder="Student ID"
              style={{ display: 'block', marginBottom: '0.5rem' }}
            />
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              placeholder="Department"
              style={{ display: 'block', marginBottom: '0.5rem' }}
            />
            <input
              type="text"
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              placeholder="Level"
              style={{ display: 'block', marginBottom: '0.5rem' }}
            />
            <div>
              <button onClick={handleSave} style={{ marginRight: '0.5rem' }}>
                Save
              </button>
              <button onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ color: '#6b21a8' }}>Attendance History</h2>
        {attendanceHistory.length > 0 ? (
          attendanceHistory.map((record) => (
            <div
              key={record.id}
              style={{
                backgroundColor: '#f3e8ff',
                padding: '0.5rem 1rem',
                marginBottom: '0.5rem',
                borderRadius: '0.375rem'
              }}
            >
              <p><strong>Date:</strong> {record.date}</p>
              <p><strong>Status:</strong> {record.status}</p>
            </div>
          ))
        ) : (
          <p>No attendance records found.</p>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default StudentView;
