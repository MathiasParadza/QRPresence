import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Shield, UserCog, User, X } from 'lucide-react';
import axios from 'axios';
import './UserManager.css';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'lecturer' | 'admin';
  is_active: boolean;
  date_joined: string;
  student_id?: string;
  lecturer_id?: string;
  department?: string;
  name?: string;
  program?: string;
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: 'student' | 'lecturer' | 'admin';
  student_id?: string;
  lecturer_id?: string;
  department?: string;
  name?: string;
  program?: string;
}

interface ValidationErrors {
  [key: string]: string[];
}

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'student',
    student_id: '',
    lecturer_id: '',
    department: '',
    name: '',
    program: ''
  });
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddUser = () => {
    setShowAddModal(true);
    setFormErrors({});
    setFormData({
      username: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: 'student',
      student_id: '',
      lecturer_id: '',
      department: '',
      name: '',
      program: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    // Frontend validation for password match
    if (formData.password !== formData.password_confirmation) {
      setFormErrors({ password: ['Passwords do not match'] });
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      // Prepare the data to send based on role
      const submitData: Partial<UserFormData> = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        role: formData.role,
      };

      // Add role-specific fields
      if (formData.role === 'student') {
        submitData.student_id = formData.student_id;
        submitData.name = formData.name;
        submitData.program = formData.program;
      } else if (formData.role === 'lecturer') {
        submitData.lecturer_id = formData.lecturer_id;
        submitData.name = formData.name;
        submitData.department = formData.department;
      }

      const response = await axios.post('http://127.0.0.1:8000/api/admin/users/', submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Add the new user to the list
      setUsers(prev => [...prev, response.data as User]);
      setShowAddModal(false);
      alert('User created successfully!');

    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: unknown } }).response === 'object' &&
        (err as { response?: { data?: unknown } }).response?.data
      ) {
        setFormErrors((err as { response: { data: ValidationErrors } }).response.data);
      } else {
        alert('Failed to create user. Please try again.');
        console.error('User creation error:', err);
      }
    } finally {
      setIsSubmitting(false);
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
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()));
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
            <button 
              className="user-button user-button--primary"
              onClick={handleAddUser}
            >
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
                    title="Filter users by role"
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
                      <th>Name</th>
                      <th>ID</th>
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
                          <span className="user-table-cell--name">{user.name || '-'}</span>
                        </td>
                        <td>
                          <span className="user-table-cell--id">
                            {user.student_id || user.lecturer_id || '-'}
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="user-modal-overlay">
          <div className="user-modal">
            <div className="user-modal__header">
              <h3 className="user-modal__title">Add New User</h3>
              <button 
                className="user-modal__close"
                onClick={() => setShowAddModal(false)}
                title="Close"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="user-modal__form">
              <div className="user-form-grid">
                {/* Common Fields */}
                <div className="user-form-group">
                  <label className="user-form-label">Username *</label>
                  <input
                    type="text"
                    title="Username"
                    placeholder='Enter username'
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`user-form-input ${formErrors.username ? 'user-form-input--error' : ''}`}
                    required
                  />
                  {formErrors.username && (
                    <span className="user-form-error">{formErrors.username[0]}</span>
                  )}
                </div>

                <div className="user-form-group">
                  <label className="user-form-label">Email *</label>
                  <input
                    type="email"
                    title="Email"
                    placeholder='Enter email'
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`user-form-input ${formErrors.email ? 'user-form-input--error' : ''}`}
                    required
                  />
                  {formErrors.email && (
                    <span className="user-form-error">{formErrors.email[0]}</span>
                  )}
                </div>

                <div className="user-form-group">
                  <label className="user-form-label">Password *</label>
                  <input
                    type="password"
                    title="Password"
                    placeholder="Enter password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`user-form-input ${formErrors.password ? 'user-form-input--error' : ''}`}
                    required
                  />
                  {formErrors.password && (
                    <span className="user-form-error">{formErrors.password[0]}</span>
                  )}
                </div>

                <div className="user-form-group">
                  <label className="user-form-label">Confirm Password *</label>
                  <input
                    type="password"
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleInputChange}
                    className="user-form-input"
                    required
                    placeholder="Confirm password"
                    title="Confirm Password"
                  />
                </div>

                <div className="user-form-group">
                  <label className="user-form-label">Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="user-form-input"
                    required
                    title="Select user role"
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Role-specific Fields */}
                {formData.role === 'student' && (
                  <>
                    <div className="user-form-group">
                      <label className="user-form-label">Student ID *</label>
                      <input
                        type="text"
                        name="student_id"
                        value={formData.student_id}
                        onChange={handleInputChange}
                        className={`user-form-input ${formErrors.student_id ? 'user-form-input--error' : ''}`}
                        required
                        title="Student ID"
                        placeholder="Enter student ID"
                      />
                      {formErrors.student_id && (
                        <span className="user-form-error">{formErrors.student_id[0]}</span>
                      )}
                    </div>

                    <div className="user-form-group">
                      <label className="user-form-label">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        title="Full Name"
                        placeholder="Enter full name"
                        onChange={handleInputChange}
                        className={`user-form-input ${formErrors.name ? 'user-form-input--error' : ''}`}
                        required
                      />
                      {formErrors.name && (
                        <span className="user-form-error">{formErrors.name[0]}</span>
                      )}
                    </div>

                    <div className="user-form-group">
                      <label className="user-form-label">Program *</label>
                      <input
                        type="text"
                        title="Program"
                        placeholder="Enter program"
                        name="program"
                        value={formData.program}
                        onChange={handleInputChange}
                        className={`user-form-input ${formErrors.program ? 'user-form-input--error' : ''}`}
                        required
                      />
                      {formErrors.program && (
                        <span className="user-form-error">{formErrors.program[0]}</span>
                      )}
                    </div>
                  </>
                )}

                {formData.role === 'lecturer' && (
                  <>
                    <div className="user-form-group">
                      <label className="user-form-label">Lecturer ID *</label>
                      <input
                        type="text"
                        name="lecturer_id"
                        value={formData.lecturer_id}
                        onChange={handleInputChange}
                        className={`user-form-input ${formErrors.lecturer_id ? 'user-form-input--error' : ''}`}
                        required
                        title="Lecturer ID"
                        placeholder="Enter lecturer ID"
                      />
                      {formErrors.lecturer_id && (
                        <span className="user-form-error">{formErrors.lecturer_id[0]}</span>
                      )}
                    </div>

                    <div className="user-form-group">
                      <label className="user-form-label">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        title="Full Name"
                        placeholder="Enter full name"
                        onChange={handleInputChange}
                        className={`user-form-input ${formErrors.name ? 'user-form-input--error' : ''}`}
                        required
                      />
                      {formErrors.name && (
                        <span className="user-form-error">{formErrors.name[0]}</span>
                      )}
                    </div>

                    <div className="user-form-group">
                      <label className="user-form-label">Department *</label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        title="Department"
                        className={`user-form-input ${formErrors.department ? 'user-form-input--error' : ''}`}
                        required
                      />
                      {formErrors.department && (
                        <span className="user-form-error">{formErrors.department[0]}</span>
                      )}
                    </div>
                  </>
                )}

                {formData.role === 'admin' && (
                  <div className="user-form-group">
                    <label className="user-form-label">Full Name (Optional)</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="user-form-input"
                      placeholder="Optional admin name"
                      title="Full Name (Optional)"
                    />
                  </div>
                )}
              </div>

              <div className="user-modal__actions">
                <button
                  type="button"
                  className="user-button user-button--secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="user-button user-button--primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;