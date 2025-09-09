import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Shield, UserCog, User } from 'lucide-react';
import axios from 'axios';
import './UserManager.css';
const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
            const data = response.data;
            setUsers(Array.isArray(data) ? data : data.results || []);
        }
        catch (err) {
            setError('Failed to load users');
            console.error('Users fetch error:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?'))
            return;
        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`http://127.0.0.1:8000/api/admin/users/${userId}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUsers(users.filter(user => user.id !== userId));
        }
        catch (err) {
            alert('Failed to delete user');
            console.error('User delete error:', err);
        }
    };
    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return _jsx(Shield, { className: "user-icon", size: 16 });
            case 'lecturer': return _jsx(UserCog, { className: "user-icon", size: 16 });
            default: return _jsx(User, { className: "user-icon", size: 16 });
        }
    };
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter ? user.role === roleFilter : true;
        return matchesSearch && matchesRole;
    });
    if (loading) {
        return (_jsxs("div", { className: "user-container", children: [_jsx("div", { className: "user-container__background", children: _jsx("div", { className: "user-container__overlay" }) }), _jsxs("div", { className: "user-loading", children: [_jsx("div", { className: "user-loading__spinner" }), _jsx("p", { className: "user-loading__text", children: "Loading users..." })] })] }));
    }
    return (_jsxs("div", { className: "user-container", children: [_jsx("div", { className: "user-container__background", children: _jsx("div", { className: "user-container__overlay" }) }), _jsx("div", { className: "user-content", children: _jsxs("div", { className: "user-manager", children: [_jsxs("div", { className: "user-header", children: [_jsxs("div", { className: "user-header__title-section", children: [_jsx("h2", { className: "user-header__title", children: "User Management" }), _jsx("p", { className: "user-header__subtitle", children: "Manage system users and their permissions" })] }), _jsxs("button", { className: "user-button user-button--primary", children: [_jsx(Plus, { className: "user-icon", size: 16 }), "Add User"] })] }), _jsx("div", { className: "user-filters", children: _jsxs("div", { className: "user-filters__card", children: [_jsx("div", { className: "user-filter-group", children: _jsxs("div", { className: "user-filter-input-wrapper", children: [_jsx(Search, { className: "user-filter-icon", size: 18 }), _jsx("input", { type: "text", placeholder: "Search users...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "user-filter-input" })] }) }), _jsx("div", { className: "user-filter-group", children: _jsxs("div", { className: "user-filter-input-wrapper", children: [_jsx(Filter, { className: "user-filter-icon", size: 18 }), _jsxs("select", { value: roleFilter, onChange: (e) => setRoleFilter(e.target.value), className: "user-filter-input user-filter-select", "aria-label": "Filter users by role", children: [_jsx("option", { value: "", children: "All Roles" }), _jsx("option", { value: "student", children: "Students" }), _jsx("option", { value: "lecturer", children: "Lecturers" }), _jsx("option", { value: "admin", children: "Admins" })] })] }) })] }) }), error && (_jsx("div", { className: "user-error", children: _jsx("div", { className: "user-error__card", children: _jsxs("div", { className: "user-error__content", children: [_jsx("h3", { className: "user-error__title", children: "Error Loading Users" }), _jsx("p", { className: "user-error__message", children: error }), _jsx("button", { onClick: fetchUsers, className: "user-button user-button--primary", children: "Retry" })] }) }) })), _jsx("div", { className: "user-table-section", children: _jsx("div", { className: "user-table-container", children: _jsxs("div", { className: "user-table-wrapper", children: [_jsxs("table", { className: "user-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Username" }), _jsx("th", { children: "Email" }), _jsx("th", { children: "Role" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Joined" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: filteredUsers.map((user) => (_jsxs("tr", { className: "user-table-row", children: [_jsx("td", { children: _jsx("span", { className: "user-table-cell--username", children: user.username }) }), _jsx("td", { children: _jsx("span", { className: "user-table-cell--email", children: user.email }) }), _jsx("td", { children: _jsxs("span", { className: `user-role-badge user-role-badge--${user.role}`, children: [getRoleIcon(user.role), user.role] }) }), _jsx("td", { children: _jsx("span", { className: `user-status-badge ${user.is_active ? 'user-status-badge--active' : 'user-status-badge--inactive'}`, children: user.is_active ? 'Active' : 'Inactive' }) }), _jsx("td", { children: _jsx("span", { className: "user-table-cell--date", children: new Date(user.date_joined).toLocaleDateString() }) }), _jsx("td", { children: _jsxs("div", { className: "user-action-buttons", children: [_jsx("button", { className: "user-action-button user-action-button--edit", title: "Edit User", children: _jsx(Edit, { className: "user-icon", size: 16 }) }), _jsx("button", { className: "user-action-button user-action-button--delete", onClick: () => handleDeleteUser(user.id), title: "Delete User", children: _jsx(Trash2, { className: "user-icon", size: 16 }) })] }) })] }, user.id))) })] }), filteredUsers.length === 0 && !loading && (_jsx("div", { className: "user-table-empty", children: _jsxs("div", { className: "user-table-empty__content", children: [_jsx(User, { className: "user-table-empty__icon", size: 48 }), _jsx("h3", { className: "user-table-empty__title", children: "No users found" }), _jsx("p", { className: "user-table-empty__message", children: searchTerm || roleFilter ? 'Try adjusting your filters' : 'No users available' })] }) }))] }) }) })] }) })] }));
};
export default UserManager;
