import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Users, BookOpen, Calendar, Settings, LogOut, Menu, X, UserCog, Shield, } from 'lucide-react';
import './AdminLayout.css';
const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const menuItems = [
        { path: '/admin', label: 'Dashboard', icon: BarChart3 },
        { path: '/admin/users', label: 'User Management', icon: Users },
        { path: '/admin/lecturers', label: 'Lecturers', icon: UserCog },
        { path: '/admin/students', label: 'Students', icon: Users },
        { path: '/admin/courses', label: 'Courses', icon: BookOpen },
        // { path: '/admin/enrollments', label: 'Enrollments', icon: FileText },
        { path: '/admin/attendance', label: 'Attendance', icon: Calendar },
        //{ path: '/admin/QrCodes', label: 'QrCodes', icon: QrCode },
        { path: '/admin/settings', label: 'Settings', icon: Settings },
    ];
    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        navigate('/login');
    };
    const isActive = (path) => {
        return location.pathname === path;
    };
    return (_jsxs("div", { className: "admin-container", children: [sidebarOpen && (_jsx("div", { className: "admin-sidebar-backdrop", onClick: () => setSidebarOpen(false) })), _jsxs("aside", { className: `admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`, children: [_jsxs("div", { className: "admin-sidebar__header", children: [_jsx("h2", { children: "QRPresence Admin" }), _jsx("button", { className: "admin-sidebar__close", onClick: () => setSidebarOpen(false), title: "Close sidebar", children: _jsx(X, { size: 24 }) })] }), _jsx("nav", { className: "admin-sidebar__nav", children: menuItems.map((item) => {
                            const Icon = item.icon;
                            return (_jsxs("button", { className: `admin-sidebar__nav-item ${isActive(item.path) ? 'admin-sidebar__nav-item--active' : ''}`, onClick: () => {
                                    navigate(item.path);
                                    setSidebarOpen(false);
                                }, children: [_jsx(Icon, { size: 20 }), _jsx("span", { children: item.label })] }, item.path));
                        }) }), _jsx("div", { className: "admin-sidebar__footer", children: _jsxs("button", { className: "admin-sidebar__logout", onClick: handleLogout, children: [_jsx(LogOut, { size: 20 }), _jsx("span", { children: "Logout" })] }) })] }), _jsxs("main", { className: "admin-main", children: [_jsxs("header", { className: "admin-header", children: [_jsx("button", { className: "admin-header__menu-toggle", onClick: () => setSidebarOpen(true), title: "Open sidebar menu", children: _jsx(Menu, { size: 24 }) }), _jsx("div", { className: "admin-header__title", children: _jsx("h1", { children: menuItems.find(item => item.path === location.pathname)?.label || 'Admin Dashboard' }) }), _jsx("div", { className: "admin-header__actions", children: _jsxs("div", { className: "admin-header__user", children: [_jsx(Shield, { size: 20 }), _jsx("span", { children: "Administrator" })] }) })] }), _jsx("div", { className: "admin-content", children: _jsx(Outlet, {}) })] })] }));
};
export default AdminLayout;
