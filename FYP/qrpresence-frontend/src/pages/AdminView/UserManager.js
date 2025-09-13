import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Shield, UserCog, User, X } from 'lucide-react';
import axios from 'axios';
import './UserManager.css';
const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
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
    const [formErrors, setFormErrors] = useState({});
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
    const handleInputChange = (e) => {
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
    const handleSubmit = async (e) => {
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
            const submitData = {
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
            }
            else if (formData.role === 'lecturer') {
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
            setUsers(prev => [...prev, response.data]);
            setShowAddModal(false);
            alert('User created successfully!');
        }
        catch (err) {
            if (typeof err === 'object' &&
                err !== null &&
                'response' in err &&
                typeof err.response === 'object' &&
                err.response?.data) {
                setFormErrors(err.response.data);
            }
            else {
                alert('Failed to create user. Please try again.');
                console.error('User creation error:', err);
            }
        }
        finally {
            setIsSubmitting(false);
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
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesRole = roleFilter ? user.role === roleFilter : true;
        return matchesSearch && matchesRole;
    });
    if (loading) {
        return (_jsxs("div", { className: "user-container", children: [_jsx("div", { className: "user-container__background", children: _jsx("div", { className: "user-container__overlay" }) }), _jsxs("div", { className: "user-loading", children: [_jsx("div", { className: "user-loading__spinner" }), _jsx("p", { className: "user-loading__text", children: "Loading users..." })] })] }));
    }
    return (_jsxs("div", { className: "user-container", children: [_jsx("div", { className: "user-container__background", children: _jsx("div", { className: "user-container__overlay" }) }), _jsx("div", { className: "user-content", children: _jsxs("div", { className: "user-manager", children: [_jsxs("div", { className: "user-header", children: [_jsxs("div", { className: "user-header__title-section", children: [_jsx("h2", { className: "user-header__title", children: "User Management" }), _jsx("p", { className: "user-header__subtitle", children: "Manage system users and their permissions" })] }), _jsxs("button", { className: "user-button user-button--primary", onClick: handleAddUser, children: [_jsx(Plus, { className: "user-icon", size: 16 }), "Add User"] })] }), _jsx("div", { className: "user-filters", children: _jsxs("div", { className: "user-filters__card", children: [_jsx("div", { className: "user-filter-group", children: _jsxs("div", { className: "user-filter-input-wrapper", children: [_jsx(Search, { className: "user-filter-icon", size: 18 }), _jsx("input", { type: "text", placeholder: "Search users...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "user-filter-input" })] }) }), _jsx("div", { className: "user-filter-group", children: _jsxs("div", { className: "user-filter-input-wrapper", children: [_jsx(Filter, { className: "user-filter-icon", size: 18 }), _jsxs("select", { value: roleFilter, onChange: (e) => setRoleFilter(e.target.value), className: "user-filter-input user-filter-select", "aria-label": "Filter users by role", title: "Filter users by role", children: [_jsx("option", { value: "", children: "All Roles" }), _jsx("option", { value: "student", children: "Students" }), _jsx("option", { value: "lecturer", children: "Lecturers" }), _jsx("option", { value: "admin", children: "Admins" })] })] }) })] }) }), error && (_jsx("div", { className: "user-error", children: _jsx("div", { className: "user-error__card", children: _jsxs("div", { className: "user-error__content", children: [_jsx("h3", { className: "user-error__title", children: "Error Loading Users" }), _jsx("p", { className: "user-error__message", children: error }), _jsx("button", { onClick: fetchUsers, className: "user-button user-button--primary", children: "Retry" })] }) }) })), _jsx("div", { className: "user-table-section", children: _jsx("div", { className: "user-table-container", children: _jsxs("div", { className: "user-table-wrapper", children: [_jsxs("table", { className: "user-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Username" }), _jsx("th", { children: "Email" }), _jsx("th", { children: "Role" }), _jsx("th", { children: "Name" }), _jsx("th", { children: "ID" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Joined" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: filteredUsers.map((user) => (_jsxs("tr", { className: "user-table-row", children: [_jsx("td", { children: _jsx("span", { className: "user-table-cell--username", children: user.username }) }), _jsx("td", { children: _jsx("span", { className: "user-table-cell--email", children: user.email }) }), _jsx("td", { children: _jsxs("span", { className: `user-role-badge user-role-badge--${user.role}`, children: [getRoleIcon(user.role), user.role] }) }), _jsx("td", { children: _jsx("span", { className: "user-table-cell--name", children: user.name || '-' }) }), _jsx("td", { children: _jsx("span", { className: "user-table-cell--id", children: user.student_id || user.lecturer_id || '-' }) }), _jsx("td", { children: _jsx("span", { className: `user-status-badge ${user.is_active ? 'user-status-badge--active' : 'user-status-badge--inactive'}`, children: user.is_active ? 'Active' : 'Inactive' }) }), _jsx("td", { children: _jsx("span", { className: "user-table-cell--date", children: new Date(user.date_joined).toLocaleDateString() }) }), _jsx("td", { children: _jsxs("div", { className: "user-action-buttons", children: [_jsx("button", { className: "user-action-button user-action-button--edit", title: "Edit User", children: _jsx(Edit, { className: "user-icon", size: 16 }) }), _jsx("button", { className: "user-action-button user-action-button--delete", onClick: () => handleDeleteUser(user.id), title: "Delete User", children: _jsx(Trash2, { className: "user-icon", size: 16 }) })] }) })] }, user.id))) })] }), filteredUsers.length === 0 && !loading && (_jsx("div", { className: "user-table-empty", children: _jsxs("div", { className: "user-table-empty__content", children: [_jsx(User, { className: "user-table-empty__icon", size: 48 }), _jsx("h3", { className: "user-table-empty__title", children: "No users found" }), _jsx("p", { className: "user-table-empty__message", children: searchTerm || roleFilter ? 'Try adjusting your filters' : 'No users available' })] }) }))] }) }) })] }) }), showAddModal && (_jsx("div", { className: "user-modal-overlay", children: _jsxs("div", { className: "user-modal", children: [_jsxs("div", { className: "user-modal__header", children: [_jsx("h3", { className: "user-modal__title", children: "Add New User" }), _jsx("button", { className: "user-modal__close", onClick: () => setShowAddModal(false), title: "Close", "aria-label": "Close", children: _jsx(X, { size: 20 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "user-modal__form", children: [_jsxs("div", { className: "user-form-grid", children: [_jsxs("div", { className: "user-form-group", children: [_jsx("label", { className: "user-form-label", children: "Username *" }), _jsx("input", { type: "text", title: "Username", placeholder: 'Enter username', name: "username", value: formData.username, onChange: handleInputChange, className: `user-form-input ${formErrors.username ? 'user-form-input--error' : ''}`, required: true }), formErrors.username && (_jsx("span", { className: "user-form-error", children: formErrors.username[0] }))] }), _jsxs("div", { className: "user-form-group", children: [_jsx("label", { className: "user-form-label", children: "Email *" }), _jsx("input", { type: "email", title: "Email", placeholder: 'Enter email', name: "email", value: formData.email, onChange: handleInputChange, className: `user-form-input ${formErrors.email ? 'user-form-input--error' : ''}`, required: true }), formErrors.email && (_jsx("span", { className: "user-form-error", children: formErrors.email[0] }))] }), _jsxs("div", { className: "user-form-group", children: [_jsx("label", { className: "user-form-label", children: "Password *" }), _jsx("input", { type: "password", title: "Password", placeholder: "Enter password", name: "password", value: formData.password, onChange: handleInputChange, className: `user-form-input ${formErrors.password ? 'user-form-input--error' : ''}`, required: true }), formErrors.password && (_jsx("span", { className: "user-form-error", children: formErrors.password[0] }))] }), _jsxs("div", { className: "user-form-group", children: [_jsx("label", { className: "user-form-label", children: "Confirm Password *" }), _jsx("input", { type: "password", name: "password_confirmation", value: formData.password_confirmation, onChange: handleInputChange, className: "user-form-input", required: true, placeholder: "Confirm password", title: "Confirm Password" })] }), _jsxs("div", { className: "user-form-group", children: [_jsx("label", { className: "user-form-label", children: "Role *" }), _jsxs("select", { name: "role", value: formData.role, onChange: handleInputChange, className: "user-form-input", required: true, title: "Select user role", children: [_jsx("option", { value: "student", children: "Student" }), _jsx("option", { value: "lecturer", children: "Lecturer" }), _jsx("option", { value: "admin", children: "Admin" })] })] }), formData.role === 'student' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "user-form-group", children: [_jsx("label", { className: "user-form-label", children: "Student ID *" }), _jsx("input", { type: "text", name: "student_id", value: formData.student_id, onChange: handleInputChange, className: `user-form-input ${formErrors.student_id ? 'user-form-input--error' : ''}`, required: true, title: "Student ID", placeholder: "Enter student ID" }), formErrors.student_id && (_jsx("span", { className: "user-form-error", children: formErrors.student_id[0] }))] }), _jsxs("div", { className: "user-form-group", children: [_jsx("label", { className: "user-form-label", children: "Full Name *" }), _jsx("input", { type: "text", name: "name", value: formData.name, title: "Full Name", placeholder: "Enter full name", onChange: handleInputChange, className: `user-form-input ${formErrors.name ? 'user-form-input--error' : ''}`, required: true }), formErrors.name && (_jsx("span", { className: "user-form-error", children: formErrors.name[0] }))] }), _jsxs("div", { className: "user-form-group", children: [_jsx("label", { className: "user-form-label", children: "Program *" }), _jsx("input", { type: "text", title: "Program", placeholder: "Enter program", name: "program", value: formData.program, onChange: handleInputChange, className: `user-form-input ${formErrors.program ? 'user-form-input--error' : ''}`, required: true }), formErrors.program && (_jsx("span", { className: "user-form-error", children: formErrors.program[0] }))] })] })), formData.role === 'lecturer' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "user-form-group", children: [_jsx("label", { className: "user-form-label", children: "Lecturer ID *" }), _jsx("input", { type: "text", name: "lecturer_id", value: formData.lecturer_id, onChange: handleInputChange, className: `user-form-input ${formErrors.lecturer_id ? 'user-form-input--error' : ''}`, required: true, title: "Lecturer ID", placeholder: "Enter lecturer ID" }), formErrors.lecturer_id && (_jsx("span", { className: "user-form-error", children: formErrors.lecturer_id[0] }))] }), _jsxs("div", { className: "user-form-group", children: [_jsx("label", { className: "user-form-label", children: "Full Name *" }), _jsx("input", { type: "text", name: "name", value: formData.name, title: "Full Name", placeholder: "Enter full name", onChange: handleInputChange, className: `user-form-input ${formErrors.name ? 'user-form-input--error' : ''}`, required: true }), formErrors.name && (_jsx("span", { className: "user-form-error", children: formErrors.name[0] }))] }), _jsxs("div", { className: "user-form-group", children: [_jsx("label", { className: "user-form-label", children: "Department *" }), _jsx("input", { type: "text", name: "department", value: formData.department, onChange: handleInputChange, title: "Department", className: `user-form-input ${formErrors.department ? 'user-form-input--error' : ''}`, required: true }), formErrors.department && (_jsx("span", { className: "user-form-error", children: formErrors.department[0] }))] })] })), formData.role === 'admin' && (_jsxs("div", { className: "user-form-group", children: [_jsx("label", { className: "user-form-label", children: "Full Name (Optional)" }), _jsx("input", { type: "text", name: "name", value: formData.name, onChange: handleInputChange, className: "user-form-input", placeholder: "Optional admin name", title: "Full Name (Optional)" })] }))] }), _jsxs("div", { className: "user-modal__actions", children: [_jsx("button", { type: "button", className: "user-button user-button--secondary", onClick: () => setShowAddModal(false), children: "Cancel" }), _jsx("button", { type: "submit", className: "user-button user-button--primary", disabled: isSubmitting, children: isSubmitting ? 'Creating...' : 'Create User' })] })] })] }) }))] }));
};
export default UserManager;
