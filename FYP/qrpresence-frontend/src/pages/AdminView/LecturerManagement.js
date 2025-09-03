import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Search, Download, Edit, Trash2, Plus, Eye } from 'lucide-react';
import axios from 'axios';
const LecturerManagement = () => {
    const [lecturers, setLecturers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        department: '',
        is_admin: '',
        search: '',
        ordering: 'lecturer_id'
    });
    const fetchLecturers = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('access_token');
            const params = new URLSearchParams();
            if (filters.department)
                params.append('department', filters.department);
            if (filters.is_admin)
                params.append('is_admin', filters.is_admin);
            if (filters.search)
                params.append('search', filters.search);
            if (filters.ordering)
                params.append('ordering', filters.ordering);
            const response = await axios.get(`http://localhost:8000/api/admin/lecturers/?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Handle both array and paginated responses
            if (Array.isArray(response.data)) {
                setLecturers(response.data);
            }
            else if (response.data && typeof response.data === 'object' && 'results' in response.data) {
                setLecturers(response.data.results);
            }
            else {
                console.error('Unexpected API response format:', response.data);
                setLecturers([]);
            }
        }
        catch (err) {
            setError('Failed to fetch lecturers');
            console.error('Error fetching lecturers:', err);
        }
        finally {
            setLoading(false);
        }
    }, [filters]);
    useEffect(() => {
        fetchLecturers();
    }, [fetchLecturers]);
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    const handleDeleteLecturer = async (lecturerId) => {
        if (!window.confirm('Are you sure you want to delete this lecturer?'))
            return;
        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`http://localhost:8000/api/admin/lecturers/${lecturerId}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLecturers(lecturers.filter(lecturer => lecturer.id !== lecturerId));
        }
        catch (err) {
            setError('Failed to delete lecturer');
            console.error('Error deleting lecturer:', err);
        }
    };
    if (loading)
        return _jsx("div", { className: "admin-loading", children: "Loading lecturers..." });
    if (error)
        return _jsx("div", { className: "admin-error", children: error });
    return (_jsxs("div", { className: "admin-page", children: [_jsxs("div", { className: "admin-page__header", children: [_jsx("h2", { children: "Lecturer Management" }), _jsx("p", { children: "Manage all lecturer records and permissions" })] }), _jsxs("div", { className: "admin-filters", children: [_jsxs("div", { className: "admin-filters__group", children: [_jsxs("div", { className: "admin-filter", children: [_jsx("label", { children: "Department" }), _jsxs("select", { title: "Department", "aria-label": "Department", value: filters.department, onChange: (e) => handleFilterChange('department', e.target.value), children: [_jsx("option", { value: "", children: "All Departments" }), _jsx("option", { value: "computer_science", children: "Computer Science" }), _jsx("option", { value: "engineering", children: "Engineering" }), _jsx("option", { value: "business", children: "Business" })] })] }), _jsxs("div", { className: "admin-filter", children: [_jsx("label", { children: "Admin Status" }), _jsxs("select", { title: "Admin Status", "aria-label": "Admin Status", value: filters.is_admin, onChange: (e) => handleFilterChange('is_admin', e.target.value), children: [_jsx("option", { value: "", children: "All" }), _jsx("option", { value: "true", children: "Admin Lecturer" }), _jsx("option", { value: "false", children: "Regular Lecturer" })] })] }), _jsxs("div", { className: "admin-filter", children: [_jsx("label", { htmlFor: "sortBySelect", children: "Sort By" }), _jsxs("select", { id: "sortBySelect", "aria-label": "Sort By", title: "Sort By", value: filters.ordering, onChange: (e) => handleFilterChange('ordering', e.target.value), children: [_jsx("option", { value: "lecturer_id", children: "Lecturer ID" }), _jsx("option", { value: "-lecturer_id", children: "Lecturer ID (Desc)" }), _jsx("option", { value: "name", children: "Name" }), _jsx("option", { value: "-name", children: "Name (Desc)" })] })] })] }), _jsxs("div", { className: "admin-search", children: [_jsx(Search, { size: 20 }), _jsx("input", { type: "text", placeholder: "Search lecturers...", value: filters.search, onChange: (e) => handleFilterChange('search', e.target.value) })] })] }), _jsx("div", { className: "admin-table-container", children: _jsxs("table", { className: "admin-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Lecturer ID" }), _jsx("th", { children: "Name" }), _jsx("th", { children: "Department" }), _jsx("th", { children: "Admin Status" }), _jsx("th", { children: "Email" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: lecturers.length > 0 ? (lecturers.map((lecturer) => (_jsxs("tr", { children: [_jsx("td", { children: lecturer.lecturer_id }), _jsx("td", { children: lecturer.name }), _jsx("td", { children: _jsx("span", { className: "department-badge", children: lecturer.department }) }), _jsx("td", { children: _jsx("span", { className: `status-badge status-badge--${lecturer.is_admin ? 'admin' : 'regular'}`, children: lecturer.is_admin ? 'Admin' : 'Regular' }) }), _jsx("td", { children: lecturer.user?.email || 'N/A' }), _jsx("td", { children: _jsxs("div", { className: "admin-actions", children: [_jsx("button", { className: "admin-action-btn admin-action-btn--view", title: "View", children: _jsx(Eye, { size: 16 }) }), _jsx("button", { className: "admin-action-btn admin-action-btn--edit", title: "Edit", children: _jsx(Edit, { size: 16 }) }), _jsx("button", { className: "admin-action-btn admin-action-btn--delete", title: "Delete", onClick: () => handleDeleteLecturer(lecturer.id), children: _jsx(Trash2, { size: 16 }) })] }) })] }, lecturer.id)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "no-data-message", children: "No lecturers found" }) })) })] }) }), _jsxs("div", { className: "admin-page__actions", children: [_jsxs("button", { className: "admin-button admin-button--primary", children: [_jsx(Plus, { size: 20 }), "Add New Lecturer"] }), _jsxs("button", { className: "admin-button admin-button--secondary", children: [_jsx(Download, { size: 20 }), "Export Data"] })] })] }));
};
export default LecturerManagement;
