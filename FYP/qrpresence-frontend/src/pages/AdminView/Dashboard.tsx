import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Calendar, TrendingUp, Download } from 'lucide-react';
import './Dashboard.css';

interface DashboardStats {
  total_students: number;
  total_lecturers: number;
  total_courses: number;
  active_sessions_today: number;
  attendance_rate: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No access token found');

      const response = await fetch('http://127.0.0.1:8000/api/admin/stats/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DashboardStats = await response.json();
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type: string) => {
    setExportError(null);
    setExportLoading(type);

    const token = localStorage.getItem('access_token');
    if (!token) {
      setExportError('No access token found');
      setExportLoading(null);
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/admin/export/${type}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to export ${type} data. Status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}.csv`;
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
            <Users size={24} />
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
      </div>

      {/* Quick Actions */}
      <div className="dashboard-actions">
        <h3>Quick Actions</h3>
        <div className="dashboard-actions__grid">
          {['attendance', 'users', 'courses'].map((type) => (
            <button
              key={type}
              className="dashboard-action"
              onClick={() => exportData(type)}
              disabled={exportLoading !== null}
            >
              {exportLoading === type ? (
                <span className="spinner" /> // Add CSS spinner style
              ) : (
                <Download size={20} />
              )}
              <span>
                {type === 'attendance'
                  ? 'Export Attendance'
                  : type === 'users'
                  ? 'Export User Report'
                  : 'Export Course Data'}
              </span>
            </button>
          ))}
        </div>
        {exportError && (
          <p className="dashboard-export-error">{exportError}</p>
        )}
      </div>

      {/* Recent Activity / Placeholder */}
      <div className="dashboard-content">
        <div className="dashboard-section">
          <h3>System Overview</h3>
          <div className="dashboard-section__content">
            <p>
              More analytics and charts would be displayed here in a full
              implementation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
