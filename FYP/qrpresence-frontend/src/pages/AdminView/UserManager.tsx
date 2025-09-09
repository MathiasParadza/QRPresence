import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Shield, UserCog, User } from 'lucide-react';
import axios from 'axios';
import './UserManager.css';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'lecturer' | 'admin';
  is_active: boolean;
  date_joined: string;
}

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://127.0.0.1:8000/api/admin/users/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = response.data as { results?: User[] } | User[];
      setUsers(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError('Failed to load users');
      console.error('Users fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://127.0.0.1:8000/api/admin/users/${userId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      alert('Failed to delete user');
      console.error('User delete error:', err);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="user-icon" size={16} />;
      case 'lecturer': return <UserCog className="user-icon" size={16} />;
      default: return <User className="user-icon" size={16} />;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="user-container">
        <div className="user-container__background">
          <div className="user-container__overlay"></div>
        </div>
        <div className="user-loading">
          <div className="user-loading__spinner"></div>
          <p className="user-loading__text">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-container">
      <div className="user-container__background">
        <div className="user-container__overlay"></div>
      </div>
      
      <div className="user-content">
        <div className="user-manager">
          {/* Header */}
          <div className="user-header">
            <div className="user-header__title-section">
              <h2 className="user-header__title">User Management</h2>
              <p className="user-header__subtitle">Manage system users and their permissions</p>
            </div>
            <button className="user-button user-button--primary">
              <Plus className="user-icon" size={16} />
              Add User
            </button>
          </div>

          {/* Filters */}
          <div className="user-filters">
            <div className="user-filters__card">
              <div className="user-filter-group">
                <div className="user-filter-input-wrapper">
                  <Search className="user-filter-icon" size={18} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="user-filter-input"
                  />
                </div>
              </div>

              <div className="user-filter-group">
                <div className="user-filter-input-wrapper">
                  <Filter className="user-filter-icon" size={18} />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="user-filter-input user-filter-select"
                    aria-label="Filter users by role"
                  >
                    <option value="">All Roles</option>
                    <option value="student">Students</option>
                    <option value="lecturer">Lecturers</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="user-error">
              <div className="user-error__card">
                <div className="user-error__content">
                  <h3 className="user-error__title">Error Loading Users</h3>
                  <p className="user-error__message">{error}</p>
                  <button onClick={fetchUsers} className="user-button user-button--primary">
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="user-table-section">
            <div className="user-table-container">
              <div className="user-table-wrapper">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="user-table-row">
                        <td>
                          <span className="user-table-cell--username">{user.username}</span>
                        </td>
                        <td>
                          <span className="user-table-cell--email">{user.email}</span>
                        </td>
                        <td>
                          <span className={`user-role-badge user-role-badge--${user.role}`}>
                            {getRoleIcon(user.role)}
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`user-status-badge ${user.is_active ? 'user-status-badge--active' : 'user-status-badge--inactive'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <span className="user-table-cell--date">
                            {new Date(user.date_joined).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <div className="user-action-buttons">
                            <button className="user-action-button user-action-button--edit" title="Edit User">
                              <Edit className="user-icon" size={16} />
                            </button>
                            <button 
                              className="user-action-button user-action-button--delete"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Delete User"
                            >
                              <Trash2 className="user-icon" size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && !loading && (
                  <div className="user-table-empty">
                    <div className="user-table-empty__content">
                      <User className="user-table-empty__icon" size={48} />
                      <h3 className="user-table-empty__title">No users found</h3>
                      <p className="user-table-empty__message">
                        {searchTerm || roleFilter ? 'Try adjusting your filters' : 'No users available'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManager;