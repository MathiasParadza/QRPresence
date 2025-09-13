import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, BookOpen, Calendar, TrendingUp, Download, 
  BarChart3, Activity, Clock, UserCheck,
  MapPin, Bookmark, Shield, GraduationCap
} from 'lucide-react';
import './Dashboard.css';

interface DashboardStats {
  total_students: number;
  total_lecturers: number;
  total_courses: number;
  active_sessions_today: number;
  attendance_rate: number;
  user_stats: {
    total_users: number;
    total_students: number;
    total_lecturers: number;
    total_admins: number;
    recent_users: number;
    today_users: number;
  };
  object_stats: {
    total_student_objects: number;
    total_lecturer_objects: number;
    admin_lecturers: number;
    total_enrollments: number;
    total_sessions: number;
  };
  attendance_stats: {
    total_attendance: number;
    present_count: number;
    absent_count: number;
    recent_attendance: number;
    today_attendance: number;
  };
  activity_stats: {
    recent_sessions: number;
    today_sessions: number;
  };
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [redirectToLogin, setRedirectToLogin] = useState(false);
  const navigate = useNavigate();

  // Navigate to login safely after render
  useEffect(() => {
    if (redirectToLogin) {
      navigate('/login');
    }
  }, [redirectToLogin, navigate]);

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setRedirectToLogin(true);
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/api/admin/stats/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        setRedirectToLogin(true);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DashboardStats = await response.json();
      setStats(data);
      generateChartData(data);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateChartData = (data: DashboardStats) => {
    const attendanceChartData: ChartData = {
      labels: ['Present', 'Absent'],
      datasets: [
        {
          label: 'Attendance Distribution',
          data: [data.attendance_stats.present_count, data.attendance_stats.absent_count],
          backgroundColor: ['#10b981', '#ef4444'],
          borderColor: ['#059669', '#dc2626'],
          borderWidth: 2,
        },
      ],
    };
    setChartData(attendanceChartData);
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const exportData = async (type: string) => {
    setExportError(null);
    setExportLoading(type);

    const token = localStorage.getItem('access_token');
    if (!token) {
      setExportError('No access token found');
      setExportLoading(null);
      setRedirectToLogin(true);
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/admin/stats/${type}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        setRedirectToLogin(true);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to export ${type} data. Status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setExportError(`Failed to export ${type} data.`);
    } finally {
      setExportLoading(null);
    }
  };

  const renderSimpleChart = (data: ChartData) => {
    const total = data.datasets[0].data.reduce((sum, value) => sum + value, 0);

    return (
      <div className="simple-chart">
        <div className="simple-chart__bars">
          {data.datasets[0].data.map((value, index) => {
            const percentage = total > 0 ? (value / total) * 100 : 0;
            return (
              <div key={index} className="simple-chart__bar-container">
                <div className="simple-chart__bar-label">
                  <span>{data.labels[index]}</span>
                  <span>{value} ({Math.round(percentage)}%)</span>
                </div>
                <div className="simple-chart__bar">
                  <div
                    className={`simple-chart__bar-fill simple-chart__bar-fill--${index}`}
                    data-bar-percentage={percentage}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading__spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <div className="admin-error__content">
          <p>{error}</p>
          <button
            onClick={fetchDashboardStats}
            className="admin-button admin-button--primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h2>Dashboard Overview</h2>
        <p>Welcome to the QRPresence Admin Dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats">
        <div className="dashboard-stat">
          <div className="dashboard-stat__icon dashboard-stat__icon--blue">
            <Users size={24} />
          </div>
          <div className="dashboard-stat__content">
            <h3>{stats?.total_students ?? 0}</h3>
            <p>Total Students</p>
          </div>
        </div>

        <div className="dashboard-stat">
          <div className="dashboard-stat__icon dashboard-stat__icon--purple">
            <GraduationCap size={24} />
          </div>
          <div className="dashboard-stat__content">
            <h3>{stats?.total_lecturers ?? 0}</h3>
            <p>Total Lecturers</p>
          </div>
        </div>

        <div className="dashboard-stat">
          <div className="dashboard-stat__icon dashboard-stat__icon--green">
            <BookOpen size={24} />
          </div>
          <div className="dashboard-stat__content">
            <h3>{stats?.total_courses ?? 0}</h3>
            <p>Active Courses</p>
          </div>
        </div>

        <div className="dashboard-stat">
          <div className="dashboard-stat__icon dashboard-stat__icon--orange">
            <Calendar size={24} />
          </div>
          <div className="dashboard-stat__content">
            <h3>{stats?.active_sessions_today ?? 0}</h3>
            <p>Sessions Today</p>
          </div>
        </div>

        <div className="dashboard-stat">
          <div className="dashboard-stat__icon dashboard-stat__icon--red">
            <TrendingUp size={24} />
          </div>
          <div className="dashboard-stat__content">
            <h3>
              {stats?.attendance_rate !== undefined
                ? `${stats.attendance_rate}%`
                : 'N/A'}
            </h3>
            <p>Attendance Rate</p>
          </div>
        </div>

        <div className="dashboard-stat">
          <div className="dashboard-stat__icon dashboard-stat__icon--indigo">
            <UserCheck size={24} />
          </div>
          <div className="dashboard-stat__content">
            <h3>{stats?.attendance_stats?.total_attendance ?? 0}</h3>
            <p>Total Attendance</p>
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="dashboard-analytics">
        {/* User Analytics */}
        <div className="analytics-card">
          <div className="analytics-card__header">
            <Users size={20} />
            <h3>User Analytics</h3>
          </div>
          <div className="analytics-card__content">
            <div className="analytics-grid">
              <div className="analytics-item">
                <Shield size={16} />
                <span>Admin Users</span>
                <strong>{stats?.user_stats?.total_admins ?? 0}</strong>
              </div>
              <div className="analytics-item">
                <Clock size={16} />
                <span>Recent Registrations</span>
                <strong>{stats?.user_stats?.recent_users ?? 0}</strong>
              </div>
              <div className="analytics-item">
                <Activity size={16} />
                <span>Today's Registrations</span>
                <strong>{stats?.user_stats?.today_users ?? 0}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Analytics */}
        <div className="analytics-card">
          <div className="analytics-card__header">
            <BarChart3 size={20} />
            <h3>Attendance Analytics</h3>
          </div>
          <div className="analytics-card__content">
            {chartData && renderSimpleChart(chartData)}
            <div className="attendance-details">
              <div className="attendance-detail">
                <span className="present-dot"></span>
                <span>Present: {stats?.attendance_stats?.present_count ?? 0}</span>
              </div>
              <div className="attendance-detail">
                <span className="absent-dot"></span>
                <span>Absent: {stats?.attendance_stats?.absent_count ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Session Analytics */}
        <div className="analytics-card">
          <div className="analytics-card__header">
            <Calendar size={20} />
            <h3>Session Analytics</h3>
          </div>
          <div className="analytics-card__content">
            <div className="session-stats">
              <div className="session-stat">
                <div className="session-stat__icon">
                  <Clock size={16} />
                </div>
                <div className="session-stat__info">
                  <span>Total Sessions</span>
                  <strong>{stats?.object_stats?.total_sessions ?? 0}</strong>
                </div>
              </div>
              <div className="session-stat">
                <div className="session-stat__icon">
                  <Activity size={16} />
                </div>
                <div className="session-stat__info">
                  <span>Recent Sessions (7d)</span>
                  <strong>{stats?.activity_stats?.recent_sessions ?? 0}</strong>
                </div>
              </div>
              <div className="session-stat">
                <div className="session-stat__icon">
                  <MapPin size={16} />
                </div>
                <div className="session-stat__info">
                  <span>Active Today</span>
                  <strong>{stats?.active_sessions_today ?? 0}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enrollment Analytics */}
        <div className="analytics-card">
          <div className="analytics-card__header">
            <Bookmark size={20} />
            <h3>Enrollment Analytics</h3>
          </div>
          <div className="analytics-card__content">
            <div className="enrollment-stats">
              <div className="enrollment-stat">
                <div className="enrollment-stat__value">
                  {stats?.object_stats?.total_enrollments ?? 0}
                </div>
                <div className="enrollment-stat__label">
                  Total Enrollments
                </div>
              </div>
              <div className="enrollment-details">
                <div className="enrollment-detail">
                  <span>Average per Course</span>
                  <strong>
                    {stats?.total_courses && stats.object_stats?.total_enrollments
                      ? Math.round(stats.object_stats.total_enrollments / stats.total_courses)
                      : 0}
                  </strong>
                </div>
                <div className="enrollment-detail">
                  <span>Average per Student</span>
                  <strong>
                    {stats?.total_students && stats.object_stats?.total_enrollments
                      ? Math.round(stats.object_stats.total_enrollments / stats.total_students)
                      : 0}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-actions">
        <h3>Quick Actions</h3>
        <div className="dashboard-actions__grid">
          {['attendance', 'users', 'courses', 'sessions'].map((type) => (
            <button
              key={type}
              className="dashboard-action"
              onClick={() => exportData(type)}
              disabled={exportLoading !== null}
            >
              {exportLoading === type ? (
                <div className="dashboard-action__spinner" />
              ) : (
                <Download size={20} />
              )}
              <span>
                {type === 'attendance'
                  ? 'Export Attendance'
                  : type === 'users'
                  ? 'Export Users'
                  : type === 'courses'
                  ? 'Export Courses'
                  : 'Export Sessions'}
              </span>
            </button>
          ))}
        </div>
        {exportError && (
          <p className="dashboard-export-error">{exportError}</p>
        )}
      </div>

      {/* System Status */}
      <div className="dashboard-status">
        <h3>System Status</h3>
        <div className="status-grid">
          <div className="status-item status-item--online">
            <div className="status-indicator"></div>
            <span>API Server</span>
            <strong>Online</strong>
          </div>
          <div className="status-item status-item--online">
            <div className="status-indicator"></div>
            <span>Database</span>
            <strong>Connected</strong>
          </div>
          <div className="status-item status-item--online">
            <div className="status-indicator"></div>
            <span>QR Generation</span>
            <strong>Active</strong>
          </div>
          <div className="status-item status-item--online">
            <div className="status-indicator"></div>
            <span>Geolocation</span>
            <strong>Enabled</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;