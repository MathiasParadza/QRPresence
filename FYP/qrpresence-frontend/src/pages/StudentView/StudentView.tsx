 import React, { useEffect, useState, ChangeEvent } from 'react';
import QRScanner from '../../components/QRScanner';
import { toast } from 'react-toastify';
import defaultAvatar from '../../assets/avatar.png';
import { BarChart3, Users, Calendar, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import './StudentView.css';

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
  course_code?: string;
};

type AttendanceOverview = {
  today_status: string;
  attendance_history: AttendanceRecord[];
  stats?: StudentStats; // Add stats to the overview response
};

type StudentStats = {
  total_classes: number;
  present_count: number;
  absent_count: number;
  attendance_percentage: number;
  this_week_percentage: number;
  by_course: {
    [courseCode: string]: {
      total: number;
      present: number;
      percentage: number;
      title: string;
    };
  };
  recent_trend: {
    last_7_days: number;
    last_30_days: number;
  };
  by_time_period: {
    today: number;
    this_week: number;
    this_month: number;
    this_year: number;
  };
};

const StudentView = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayStatus, setTodayStatus] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
      setStats(data.stats || null);
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

  function handleLogout(): void {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <p className="loading-text">Loading student data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-view-container">
      {/* Header with Avatar */}
      <div className="header-container">
        <h1 className="header-title">Welcome, {profile?.name || 'Student'}!</h1>
        <div>
          <img
            src={defaultAvatar}
            alt="Avatar"
            className="avatar"
            onClick={() => setShowProfile((prev) => !prev)}
          />
          <button 
            onClick={handleLogout}
            className="logout-button"
          >
            Logout
          </button>
        </div>
        
      {/* Instructions */}
      <div className="instructions-container">
        <p className="instructions-text">
          Your attendance is being tracked. Scan the QR code below to mark your attendance.
        </p>
      </div>
      </div>

      {/* Profile Section */}
      {showProfile && profile && (
        <div className="profile-container">
          <h2 className="profile-title">Profile Information</h2>
          
          {!editing ? (
            <div className="profile-edit-view">
              <div className="profile-grid">
                <div className="profile-field">
                  <strong className="profile-label">Name:</strong>
                  <p className="profile-value">{profile.name}</p>
                </div>
                <div className="profile-field">
                  <strong className="profile-label">Email:</strong>
                  <p className="profile-value">{profile.email}</p>
                </div>
                <div className="profile-field">
                  <strong className="profile-label">Student ID:</strong>
                  <p className="profile-value">{profile.student_id}</p>
                </div>
                <div className="profile-field">
                  <strong className="profile-label">Program:</strong>
                  <p className="profile-value">{profile.program}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditing(true)} 
                className="edit-button"
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <div className="profile-edit-form">
              <div className="profile-edit-fields">
                <div>
                  <label className="form-label">
                    Student ID:
                  </label>
                  <input
                    type="text"
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleInputChange}
                    placeholder="Enter Student ID"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Program:
                  </label>
                  <input
                    type="text"
                    name="program"
                    value={formData.program}
                    onChange={handleInputChange}
                    placeholder="Program"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-buttons">
                <button 
                  onClick={handleSave}
                  className="save-button"
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => setEditing(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}



      {/* Student Statistics Overview */}
      {stats && (
        <div className="student-stats-grid">
          <div className="student-stats-card student-stats-card--primary">
            <div className="student-stats-card__content">
              <div className="student-stats-card__info">
                <span className="student-stats-card__label">Overall Attendance</span>
                <span className="student-stats-card__value">
                  {stats.attendance_percentage}%
                </span>
              </div>
              <div className="student-stats-card__icon">
                <BarChart3 className="student-icon" />
              </div>
            </div>
          </div>

          <div className="student-stats-card student-stats-card--success">
            <div className="student-stats-card__content">
              <div className="student-stats-card__info">
                <span className="student-stats-card__label">Present</span>
                <span className="student-stats-card__value">{stats.present_count}</span>
              </div>
              <div className="student-stats-card__icon">
                <CheckCircle className="student-icon" />
              </div>
            </div>
          </div>

          <div className="student-stats-card student-stats-card--danger">
            <div className="student-stats-card__content">
              <div className="student-stats-card__info">
                <span className="student-stats-card__label">Absent</span>
                <span className="student-stats-card__value">{stats.absent_count}</span>
              </div>
              <div className="student-stats-card__icon">
                <XCircle className="student-icon" />
              </div>
            </div>
          </div>

          <div className="student-stats-card student-stats-card--info">
            <div className="student-stats-card__content">
              <div className="student-stats-card__info">
                <span className="student-stats-card__label">Total Classes</span>
                <span className="student-stats-card__value">{stats.total_classes}</span>
              </div>
              <div className="student-stats-card__icon">
                <Calendar className="student-icon" />
              </div>
            </div>
          </div>

          {/* Recent Trend Card */}
          <div className="student-stats-card student-stats-card--warning">
            <div className="student-stats-card__content">
              <div className="student-stats-card__info">
                <span className="student-stats-card__label">Last 7 Days</span>
                <span className="student-stats-card__value">
                  {stats.recent_trend?.last_7_days || 0}%
                </span>
              </div>
              <div className="student-stats-card__icon">
                <TrendingUp className="student-icon" />
              </div>
            </div>
          </div>

          {/* Course Breakdown (if available) */}
          {stats.by_course && Object.keys(stats.by_course).length > 0 && (
            <div className="student-stats-card student-stats-card--course">
              <div className="student-stats-card__content">
                <div className="student-stats-card__info">
                  <span className="student-stats-card__label">Best Course</span>
                  <span className="student-stats-card__value">
                    {Object.entries(stats.by_course)
                      .sort(([, a], [, b]) => b.percentage - a.percentage)[0][0]
                    }
                  </span>
                  <span className="student-stats-card__subtext">
                    {Object.entries(stats.by_course)
                      .sort(([, a], [, b]) => b.percentage - a.percentage)[0][1].percentage}%
                  </span>
                </div>
                <div className="student-stats-card__icon">
                  <Users className="student-icon" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* QR Scanner */}
      <div className="qr-scanner-container">
        <h2 className="qr-scanner-title">QR Code Scanner</h2>
        <QRScanner />
      </div>

      {/* Today's Attendance */}
      <div className="attendance-status-container">
        <h2 className="attendance-status-title">Today's Attendance Status</h2>
        <div className="attendance-status-content">
          <p className={`attendance-status-text ${todayStatus ? 
            (todayStatus.toLowerCase() === 'present' ? 'status-present' : 'status-absent') : 
            'status-default'}`}>
            {todayStatus || 'No attendance recorded for today'}
          </p>
        </div>
      </div>

      {/* Attendance History */}
      <div className="attendance-history-container">
        <h2 className="attendance-history-title">Attendance History</h2>
        
        {attendanceHistory.length > 0 ? (
          <div className="attendance-history-grid">
            {attendanceHistory.map((record) => (
              <div key={record.id} className="attendance-record">
                <div>
                  <strong className="record-label">Date:</strong>
                  <p className="record-value">
                    {new Date(record.session_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <strong className="record-label">Time:</strong>
                  <p className="record-value">
                    {record.session_time}
                  </p>
                </div>
                <div>
                  <strong className="record-label">Status:</strong>
                  <p className={`record-value ${record.status.toLowerCase() === 'present' ? 'status-present' : 'status-absent'}`}>
                    {record.status}
                  </p>
                </div>
                <div>
                  <strong className="record-label">Class:</strong>
                  <p className="record-value">
                    {record.class_name}
                  </p>
                </div>
                {record.course_code && (
                  <div>
                    <strong className="record-label">Course:</strong>
                    <p className="record-value">
                      {record.course_code}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-records">
            <p className="no-records-text">
              No attendance records found yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentView;