import { useEffect, useState, ChangeEvent } from 'react';
import QRScanner from '../../components/QRScanner';
import { toast } from 'react-toastify';
import defaultAvatar from '../../assets/avatar.png';

interface Profile {
  student_id: string;
  program: string;
  name: string;
  email: string;
}

type AttendanceRecord = {
  id: number;
  session_date: string;
  session_time: string;
  status: string;
  class_name: string;
};


type AttendanceOverview = {
  today_status: string;
  attendance_history: AttendanceRecord[];
};

const StudentView = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayStatus, setTodayStatus] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

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

      const data: AttendanceOverview = await response.json();
      setTodayStatus(data.today_status);
      setAttendanceHistory(data.attendance_history);
    } catch (error) {
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
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
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
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          padding: '2rem',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          color: '#6b21a8'
        }}>
          <p style={{ fontSize: '1.125rem', margin: 0 }}>Loading student data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '1.5rem', 
      backgroundColor: '#f8fafc', 
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header with Avatar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        backgroundColor: '#ffffff',
        padding: '1rem 1.5rem',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ 
          color: '#6b21a8', 
          margin: 0,
          fontSize: '1.875rem',
          fontWeight: '700'
        }}>
          Welcome, {profile?.name || 'Student'}!
        </h1>
        <img
          src={defaultAvatar}
          alt="Avatar"
          style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            cursor: 'pointer',
            border: '3px solid #6b21a8',
            transition: 'transform 0.2s ease'
          }}
          onClick={() => setShowProfile((prev) => !prev)}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
      </div>

      {/* Profile Section */}
      {showProfile && profile && (
        <div style={{ 
          backgroundColor: '#ffffff', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ 
            color: '#6b21a8', 
            marginTop: 0,
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            Profile Information
          </h2>
          
          {!editing ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem'
              }}>
                <div style={{ 
                  backgroundColor: '#f1f5f9', 
                  padding: '1rem', 
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5e1'
                }}>
                  <strong style={{ color: '#475569' }}>Name:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#1e293b' }}>{profile.name}</p>
                </div>
                <div style={{ 
                  backgroundColor: '#f1f5f9', 
                  padding: '1rem', 
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5e1'
                }}>
                  <strong style={{ color: '#475569' }}>Email:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#1e293b' }}>{profile.email}</p>
                </div>
                <div style={{ 
                  backgroundColor: '#f1f5f9', 
                  padding: '1rem', 
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5e1'
                }}>
                  <strong style={{ color: '#475569' }}>Student ID:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#1e293b' }}>{profile.student_id}</p>
                </div>
                <div style={{ 
                  backgroundColor: '#f1f5f9', 
                  padding: '1rem', 
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5e1'
                }}>
                  <strong style={{ color: '#475569' }}>program:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#1e293b' }}>{profile.program}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditing(true)} 
                style={{ 
                  backgroundColor: '#6b21a8',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease',
                  alignSelf: 'flex-start'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#581c87'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6b21a8'}
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem',
                    color: '#475569',
                    fontWeight: '500'
                  }}>
                    Student ID:
                  </label>
                  <input
                    type="text"
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleInputChange}
                    placeholder="Enter Student ID"
                    style={{ 
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem',
                    color: '#475569',
                    fontWeight: '500'
                  }}>
                    program:
                  </label>
                  <input
                    type="text"
                    name="program"
                    value={formData.program}
                    onChange={handleInputChange}
                    placeholder="program"
                    style={{ 
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={handleSave}
                  style={{ 
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => setEditing(false)}
                  style={{ 
                    backgroundColor: '#64748b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#475569'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#64748b'}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <p style={{ 
          margin: 0,
          color: '#475569',
          fontSize: '1.125rem',
          textAlign: 'center'
        }}>
          Your attendance is being tracked. Scan the QR code below to mark your attendance.
        </p>
      </div>

      {/* QR Scanner */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '2rem',
        borderRadius: '0.75rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          color: '#6b21a8', 
          marginTop: 0,
          marginBottom: '1.5rem',
          fontSize: '1.5rem',
          fontWeight: '600'
        }}>
          QR Code Scanner
        </h2>
        <QRScanner />
      </div>

      {/* Today's Attendance */}
      <div style={{ 
        backgroundColor: '#f0fdf4', 
        padding: '1.5rem', 
        borderRadius: '0.75rem',
        marginBottom: '2rem',
        border: '1px solid #bbf7d0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ 
          color: '#16a34a', 
          marginTop: 0,
          marginBottom: '1rem',
          fontSize: '1.5rem',
          fontWeight: '600'
        }}>
          Today's Attendance Status
        </h2>
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid #bbf7d0'
        }}>
          <p style={{ 
            margin: 0,
            fontSize: '1.125rem',
            color: todayStatus ? '#16a34a' : '#64748b',
            fontWeight: '500'
          }}>
            {todayStatus || 'No attendance recorded for today'}
          </p>
        </div>
      </div>

      {/* Attendance History */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ 
          color: '#6b21a8', 
          marginTop: 0,
          marginBottom: '1.5rem',
          fontSize: '1.5rem',
          fontWeight: '600'
        }}>
          Attendance History
        </h2>
        
        {attendanceHistory.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {attendanceHistory.map((record) => (
  <div
    key={record.id}
    style={{
      backgroundColor: '#faf5ff',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid #e9d5ff',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem'
    }}
  >
    <div>
      <strong style={{ color: '#6b21a8' }}>Date:</strong>
      <p style={{ margin: '0.25rem 0 0 0', color: '#1e293b' }}>
        {new Date(record.session_date).toLocaleDateString()}
      </p>
    </div>
    <div>
      <strong style={{ color: '#6b21a8' }}>Time:</strong>
      <p style={{ margin: '0.25rem 0 0 0', color: '#1e293b' }}>
        {record.session_time}
      </p>
    </div>
    <div>
      <strong style={{ color: '#6b21a8' }}>Status:</strong>
      <p style={{ 
        margin: '0.25rem 0 0 0',
        color: record.status.toLowerCase() === 'present' ? '#16a34a' : '#dc2626',
        fontWeight: '500'
      }}>
        {record.status}
      </p>
    </div>
    <div>
      <strong style={{ color: '#6b21a8' }}>Class:</strong>
      <p style={{ margin: '0.25rem 0 0 0', color: '#1e293b' }}>
        {record.class_name}
      </p>
    </div>
  </div>
))}

          </div>
        ) : (
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '2rem',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <p style={{ 
              margin: 0,
              color: '#64748b',
              fontSize: '1.125rem',
              fontStyle: 'italic'
            }}>
              No attendance records found yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentView;