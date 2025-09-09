import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Search, Download, Edit, Trash2, Plus, Eye, Filter, Users, RefreshCw } from 'lucide-react';
import axios from 'axios';
import './LecturerManagement.css';
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
    const [deletingId, setDeletingId] = useState(null);
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
            let errorMessage = 'Failed to fetch lecturers';
            if (err &&
                typeof err === 'object' &&
                'response' in err &&
                err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            setError(errorMessage);
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
            setDeletingId(lecturerId);
            const token = localStorage.getItem('access_token');
            await axios.delete(`http://localhost:8000/api/admin/lecturers/${lecturerId}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLecturers(prev => prev.filter(lecturer => lecturer.id !== lecturerId));
        }
        catch (err) {
            let errorMessage = 'Failed to delete lecturer';
            if (err &&
                typeof err === 'object' &&
                'response' in err &&
                err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            setError(errorMessage);
            console.error('Error deleting lecturer:', err);
        }
        finally {
            setDeletingId(null);
        }
    };
    // Safe department formatting function
    const formatDepartment = (department) => {
        if (!department)
            return 'N/A';
        return department.replace(/_/g, ' ');
    };
    // Safe name formatting
    const formatName = (name) => {
        return name || 'Unnamed Lecturer';
    };
    if (loading) {
        return (_jsxs("div", { className: "lecturer-container", children: [_jsx("div", { className: "lecturer-container__background", children: _jsx("div", { className: "lecturer-container__overlay" }) }), _jsxs("div", { className: "lecturer-loading", children: [_jsx("div", { className: "lecturer-loading__spinner" }), _jsx("p", { className: "lecturer-loading__text", children: "Loading lecturers..." })] })] }));
    }
    if (error) {
        return (_jsxs("div", { className: "lecturer-container", children: [_jsx("div", { className: "lecturer-container__background", children: _jsx("div", { className: "lecturer-container__overlay" }) }), _jsx("div", { className: "lecturer-error", children: _jsx("div", { className: "lecturer-error__card", children: _jsxs("div", { className: "lecturer-error__content", children: [_jsx("h3", { className: "lecturer-error__title", children: "Error Loading Lecturers" }), _jsx("p", { className: "lecturer-error__message", children: error }), _jsxs("button", { onClick: fetchLecturers, className: "lecturer-button lecturer-button--primary", children: [_jsx(RefreshCw, { size: 16 }), "Retry"] })] }) }) })] }));
    }
    return (_jsxs("div", { className: "lecturer-container", children: [_jsx("div", { className: "lecturer-container__background", children: _jsx("div", { className: "lecturer-container__overlay" }) }), _jsx("div", { className: "lecturer-content", children: _jsxs("div", { className: "lecturer-management", children: [_jsxs("div", { className: "lecturer-header", children: [_jsxs("div", { className: "lecturer-header__title-section", children: [_jsx("h2", { className: "lecturer-header__title", children: "Lecturer Management" }), _jsx("p", { className: "lecturer-header__subtitle", children: "Manage all lecturer records and permissions" })] }), _jsxs("div", { className: "lecturer-header__actions", children: [_jsxs("button", { className: "lecturer-button lecturer-button--primary", children: [_jsx(Plus, { className: "lecturer-icon", size: 20 }), "Add New Lecturer"] }), _jsxs("button", { className: "lecturer-button lecturer-button--secondary", children: [_jsx(Download, { className: "lecturer-icon", size: 20 }), "Export Data"] })] })] }), _jsx("div", { className: "lecturer-filters", children: _jsxs("div", { className: "lecturer-filters__card", children: [_jsxs("div", { className: "lecturer-filters__controls", children: [_jsxs("div", { className: "lecturer-filter-group", children: [_jsx("label", { className: "lecturer-filter-label", children: "Department" }), _jsxs("div", { className: "lecturer-filter-input-wrapper", children: [_jsx(Filter, { className: "lecturer-filter-icon", size: 16 }), _jsxs("select", { className: "lecturer-filter-input lecturer-filter-select", title: "Department", "aria-label": "Department", value: filters.department, onChange: (e) => handleFilterChange('department', e.target.value), children: [_jsx("option", { value: "", children: "All Departments" }), _jsx("option", { value: "computer_science", children: "Computer Science" }), _jsx("option", { value: "engineering", children: "Engineering" }), _jsx("option", { value: "business", children: "Business" })] })] })] }), _jsxs("div", { className: "lecturer-filter-group", children: [_jsx("label", { className: "lecturer-filter-label", children: "Admin Status" }), _jsxs("div", { className: "lecturer-filter-input-wrapper", children: [_jsx(Filter, { className: "lecturer-filter-icon", size: 16 }), _jsxs("select", { className: "lecturer-filter-input lecturer-filter-select", title: "Admin Status", "aria-label": "Admin Status", value: filters.is_admin, onChange: (e) => handleFilterChange('is_admin', e.target.value), children: [_jsx("option", { value: "", children: "All" }), _jsx("option", { value: "true", children: "Admin Lecturer" }), _jsx("option", { value: "false", children: "Regular Lecturer" })] })] })] }), _jsxs("div", { className: "lecturer-filter-group", children: [_jsx("label", { className: "lecturer-filter-label", htmlFor: "sortBySelect", children: "Sort By" }), _jsxs("div", { className: "lecturer-filter-input-wrapper", children: [_jsx(Filter, { className: "lecturer-filter-icon", size: 16 }), _jsxs("select", { className: "lecturer-filter-input lecturer-filter-select", id: "sortBySelect", "aria-label": "Sort By", title: "Sort By", value: filters.ordering, onChange: (e) => handleFilterChange('ordering', e.target.value), children: [_jsx("option", { value: "lecturer_id", children: "Lecturer ID" }), _jsx("option", { value: "-lecturer_id", children: "Lecturer ID (Desc)" }), _jsx("option", { value: "name", children: "Name" }), _jsx("option", { value: "-name", children: "Name (Desc)" })] })] })] })] }), _jsx("div", { className: "lecturer-search", children: _jsxs("div", { className: "lecturer-search-wrapper", children: [_jsx(Search, { className: "lecturer-search-icon", size: 20 }), _jsx("input", { type: "text", className: "lecturer-search-input", placeholder: "Search lecturers...", value: filters.search, onChange: (e) => handleFilterChange('search', e.target.value) })] }) })] }) }), _jsx("div", { className: "lecturer-table-section", children: _jsx("div", { className: "lecturer-table-container", children: _jsx("div", { className: "lecturer-table-wrapper", children: _jsxs("table", { className: "lecturer-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Lecturer ID" }), _jsx("th", { children: "Name" }), _jsx("th", { children: "Department" }), _jsx("th", { children: "Admin Status" }), _jsx("th", { children: "Email" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: lecturers.length > 0 ? (lecturers.map((lecturer) => (_jsxs("tr", { className: "lecturer-table-row", children: [_jsx("td", { children: _jsx("span", { className: "lecturer-table-cell--id", children: lecturer.lecturer_id || 'N/A' }) }), _jsx("td", { children: _jsx("span", { className: "lecturer-table-cell--name", children: formatName(lecturer.name) }) }), _jsx("td", { children: _jsx("span", { className: "lecturer-department-badge", children: formatDepartment(lecturer.department) }) }), _jsx("td", { children: _jsx("span", { className: `lecturer-status-badge ${lecturer.is_admin ? 'lecturer-status-badge--admin' : 'lecturer-status-badge--regular'}`, children: lecturer.is_admin ? 'Admin' : 'Regular' }) }), _jsx("td", { children: _jsx("span", { className: "lecturer-table-cell--email", children: lecturer.user?.email || 'N/A' }) }), _jsx("td", { children: _jsxs("div", { className: "lecturer-action-buttons", children: [_jsx("button", { className: "lecturer-action-button lecturer-action-button--view", title: "View", children: _jsx(Eye, { className: "lecturer-icon", size: 16 }) }, `view-${lecturer.id}`), _jsx("button", { className: "lecturer-action-button lecturer-action-button--edit", title: "Edit", children: _jsx(Edit, { className: "lecturer-icon", size: 16 }) }, `edit-${lecturer.id}`), _jsx("button", { className: "lecturer-action-button lecturer-action-button--delete", title: "Delete", onClick: () => handleDeleteLecturer(lecturer.id), disabled: deletingId === lecturer.id, children: deletingId === lecturer.id ? (_jsx(RefreshCw, { className: "lecturer-icon spinner", size: 16 })) : (_jsx(Trash2, { className: "lecturer-icon", size: 16 })) }, `delete-${lecturer.id}`)] }) })] }, lecturer.id)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "lecturer-table-empty-cell", children: _jsx("div", { className: "lecturer-table-empty", children: _jsxs("div", { className: "lecturer-table-empty__content", children: [_jsx(Users, { className: "lecturer-table-empty__icon", size: 48 }), _jsx("h3", { className: "lecturer-table-empty__title", children: "No lecturers found" }), _jsx("p", { className: "lecturer-table-empty__message", children: filters.search || filters.department || filters.is_admin ?
                                                                            'Try adjusting your filters' : 'No lecturers available' }), _jsx("button", { onClick: () => setFilters({
                                                                            department: '',
                                                                            is_admin: '',
                                                                            search: '',
                                                                            ordering: 'lecturer_id'
                                                                        }), className: "lecturer-button lecturer-button--secondary", children: "Clear Filters" })] }) }) }) }, "no-lecturers")) })] }) }) }) })] }) })] }));
};
export default LecturerManagement;
