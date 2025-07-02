import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { toast } from 'react-toastify';
import defaultAvatar from '../../assets/avatar.png';
const StudentView = () => {
    const [profile, setProfile] = useState(null);
    const [todayStatus, setTodayStatus] = useState(null);
    const [editing, setEditing] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [formData, setFormData] = useState({
        student_id: '',
        course: '',
    });
    const token = localStorage.getItem('access_token');
    const API_BASE_URL = 'http://localhost:8000'; // Your Django server URL
    // Fetch attendance history for the student
    /*const fetchAttendanceHistory = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/student-attendance-history/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `Request failed with status ${response.status}`);
        }
  
        const data = await response.json();
        setAttendanceHistory(data || []);
      } catch (error) {
        console.error('Error fetching attendance history:', error);
        toast.error('Failed to load attendance history');
      }
    };
  
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
  
    const fetchTodayStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/student-today-status/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `Request failed with status ${response.status}`);
        }
  
        const data = await response.json();
        setTodayStatus(data.status || null);
      } catch (error) {
        console.error('Error fetching today\'s status:', error);
        toast.error('Failed to load today\'s attendance status');
      }
    };
     */
    const fetchProfile = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/student-profile/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
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
                course: data.course || '',
                name: data.name || '',
                email: data.email || '',
            });
            setFormData({
                student_id: data.student_id?.toString() || '',
                course: data.course || '',
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
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_id: formData.student_id,
                    course: formData.course,
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
    // Rest of your component (fetchTodayStatus, fetchAttendanceHistory, handleLogout) remains the same
    // ... 
    return (_jsxs("div", { style: { padding: '1.5rem', backgroundColor: '#fff', minHeight: '100vh' }, children: [_jsx("div", { style: { display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }, children: _jsx("img", { src: defaultAvatar, alt: "Avatar", style: { width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer' }, onClick: () => setShowProfile((prev) => !prev) }) }), showProfile && profile && (_jsxs("div", { style: { backgroundColor: '#f9f9f9', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem' }, children: [_jsx("h2", { style: { color: '#6b21a8' }, children: "Profile" }), !editing ? (_jsxs(_Fragment, { children: [_jsxs("p", { children: [_jsx("strong", { children: "Name:" }), " ", profile.name] }), _jsxs("p", { children: [_jsx("strong", { children: "Email:" }), " ", profile.email] }), _jsxs("p", { children: [_jsx("strong", { children: "Student ID:" }), " ", profile.student_id] }), _jsxs("p", { children: [_jsx("strong", { children: "Course:" }), " ", profile.course] }), _jsx("button", { onClick: () => setEditing(true), style: { marginTop: '0.5rem' }, children: "Edit Profile" })] })) : (_jsxs(_Fragment, { children: [_jsx("input", { type: "text", name: "student_id", value: formData.student_id, onChange: handleInputChange, placeholder: "Student ID", style: { display: 'block', marginBottom: '0.5rem' } }), _jsx("input", { type: "text", name: "course", value: formData.course, onChange: handleInputChange, placeholder: "Course", style: { display: 'block', marginBottom: '0.5rem' } }), _jsx("button", { onClick: handleSave, style: { marginRight: '0.5rem' }, children: "Save" }), _jsx("button", { onClick: () => setEditing(false), children: "Cancel" })] }))] }))] }));
};
export default StudentView;
