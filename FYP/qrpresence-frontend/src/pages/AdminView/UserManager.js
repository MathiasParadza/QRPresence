import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Shield, UserCog, User } from 'lucide-react';
import axios from 'axios';
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
            case 'admin': return _jsx(Shield, { size: 16 });
            case 'lecturer': return _jsx(UserCog, { size: 16 });
            default: return _jsx(User, { size: 16 });
        }
    };
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter ? user.role === roleFilter : true;
        return matchesSearch && matchesRole;
    });
    if (loading) {
        return (_jsxs("div", { className: "admin-loading", children: [_jsx("div", { className: "admin-loading__spinner" }), _jsx("p", { children: "Loading users..." })] }));
    }
    return (_jsxs("div", { className: "user-manager", children: [_jsxs("div", { className: "user-manager__header", children: [_jsx("h2", { children: "User Management" }), _jsxs("button", { className: "admin-button admin-button--primary", children: [_jsx(Plus, { size: 16 }), "Add User"] })] }), _jsxs("div", { className: "user-manager__filters", children: [_jsxs("div", { className: "filter-group", children: [_jsx(Search, { size: 18 }), _jsx("input", { type: "text", placeholder: "Search users...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "filter-input" })] }), _jsxs("div", { className: "filter-group", children: [_jsx(Filter, { size: 18 }), _jsxs("select", { value: roleFilter, onChange: (e) => setRoleFilter(e.target.value), className: "filter-input", "aria-label": "Filter users by role", children: [_jsx("option", { value: "", children: "All Roles" }), _jsx("option", { value: "student", children: "Students" }), _jsx("option", { value: "lecturer", children: "Lecturers" }), _jsx("option", { value: "admin", children: "Admins" })] })] })] }), error && (_jsxs("div", { className: "admin-error", children: [_jsx("p", { children: error }), _jsx("button", { onClick: fetchUsers, className: "admin-button admin-button--primary", children: "Retry" })] })), _jsxs("div", { className: "admin-table-container", children: [_jsxs("table", { className: "admin-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Username" }), _jsx("th", { children: "Email" }), _jsx("th", { children: "Role" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Joined" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: filteredUsers.map((user) => (_jsxs("tr", { children: [_jsx("td", { children: user.username }), _jsx("td", { children: user.email }), _jsx("td", { children: _jsxs("span", { className: "role-badge", children: [getRoleIcon(user.role), user.role] }) }), _jsx("td", { children: _jsx("span", { className: `status-badge ${user.is_active ? 'status-badge--active' : 'status-badge--inactive'}`, children: user.is_active ? 'Active' : 'Inactive' }) }), _jsx("td", { children: new Date(user.date_joined).toLocaleDateString() }), _jsx("td", { children: _jsxs("div", { className: "action-buttons", children: [_jsx("button", { className: "action-button action-button--edit", title: "Edit User", children: _jsx(Edit, { size: 16 }) }), _jsx("button", { className: "action-button action-button--delete", onClick: () => handleDeleteUser(user.id), title: "Delete User", children: _jsx(Trash2, { size: 16 }) })] }) })] }, user.id))) })] }), filteredUsers.length === 0 && !loading && (_jsx("div", { className: "admin-table-empty", children: _jsx("p", { children: "No users found" }) }))] })] }));
};
export default UserManager;
