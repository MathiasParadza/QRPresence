import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Users, Search, Download, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Filter, GraduationCap } from 'lucide-react';
import axios from 'axios';
import './StudentManagement.css';
const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        program: '',
        search: '',
        ordering: 'student_id'
    });
    // Pagination state
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const fetchStudents = React.useCallback(async (url) => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('access_token');
            let requestUrl;
            if (url) {
                requestUrl = url; // direct next/previous page URL
            }
            else {
                const params = new URLSearchParams();
                if (filters.program)
                    params.append('program', filters.program);
                if (filters.search)
                    params.append('search', filters.search);
                if (filters.ordering)
                    params.append('ordering', filters.ordering);
                requestUrl = `http://localhost:8000/api/admin/students/?${params}`;
            }
            const response = await axios.get(requestUrl, { headers: { Authorization: `Bearer ${token}` } });
            if (response.data && 'results' in response.data) {
                setStudents(response.data.results);
                setCount(response.data.count);
                setNext(response.data.next);
                setPrevious(response.data.previous);
                // Extract page number from URL (if present)
                const urlParams = new URL(requestUrl, window.location.origin);
                const pageParam = urlParams.searchParams.get("page");
                setCurrentPage(pageParam ? parseInt(pageParam, 10) : 1);
            }
            else {
                setStudents([]);
                setCount(0);
                setNext(null);
                setPrevious(null);
            }
        }
        catch (err) {
            setError('Failed to fetch students');
            console.error('Error fetching students:', err);
        }
        finally {
            setLoading(false);
        }
    }, [filters]);
    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    const handleDeleteStudent = async (studentId) => {
        if (!window.confirm('Are you sure you want to delete this student?'))
            return;
        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`http://localhost:8000/api/admin/students/${studentId}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(students.filter(student => student.id !== studentId));
        }
        catch (err) {
            setError('Failed to delete student');
            console.error('Error deleting student:', err);
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "student-container", children: [_jsx("div", { className: "student-container__background", children: _jsx("div", { className: "student-container__overlay" }) }), _jsxs("div", { className: "student-loading", children: [_jsx("div", { className: "student-loading__spinner" }), _jsx("p", { className: "student-loading__text", children: "Loading students..." })] })] }));
    }
    if (error) {
        return (_jsxs("div", { className: "student-container", children: [_jsx("div", { className: "student-container__background", children: _jsx("div", { className: "student-container__overlay" }) }), _jsx("div", { className: "student-error", children: _jsx("div", { className: "student-error__card", children: _jsxs("div", { className: "student-error__content", children: [_jsx("h3", { className: "student-error__title", children: "Error Loading Students" }), _jsx("p", { className: "student-error__message", children: error }), _jsx("button", { onClick: () => fetchStudents(), className: "student-button student-button--primary", children: "Retry" })] }) }) })] }));
    }
    return (_jsxs("div", { className: "student-container", children: [_jsx("div", { className: "student-container__background", children: _jsx("div", { className: "student-container__overlay" }) }), _jsx("div", { className: "student-content", children: _jsxs("div", { className: "student-management", children: [_jsxs("div", { className: "student-header", children: [_jsxs("div", { className: "student-header__title-section", children: [_jsx("h2", { className: "student-header__title", children: "Student Management" }), _jsx("p", { className: "student-header__subtitle", children: "Manage all student records and information" })] }), _jsx("div", { className: "student-header__actions", children: _jsxs("button", { className: "student-button student-button--secondary", children: [_jsx(Download, { className: "student-icon", size: 20 }), "Export Data"] }) })] }), _jsx("div", { className: "student-filters", children: _jsxs("div", { className: "student-filters__card", children: [_jsxs("div", { className: "student-filters__controls", children: [_jsxs("div", { className: "student-filter-group", children: [_jsx("label", { className: "student-filter-label", htmlFor: "programSelect", children: "Program" }), _jsxs("div", { className: "student-filter-input-wrapper", children: [_jsx(Filter, { className: "student-filter-icon", size: 16 }), _jsxs("select", { id: "programSelect", className: "student-filter-input student-filter-select", value: filters.program, onChange: (e) => handleFilterChange('program', e.target.value), children: [_jsx("option", { value: "", children: "All Programs" }), _jsx("option", { value: "computer_science", children: "Computer Science" }), _jsx("option", { value: "engineering", children: "Engineering" }), _jsx("option", { value: "business", children: "Business" })] })] })] }), _jsxs("div", { className: "student-filter-group", children: [_jsx("label", { className: "student-filter-label", htmlFor: "sortBySelect", children: "Sort By" }), _jsxs("div", { className: "student-filter-input-wrapper", children: [_jsx(Filter, { className: "student-filter-icon", size: 16 }), _jsxs("select", { id: "sortBySelect", className: "student-filter-input student-filter-select", value: filters.ordering, onChange: (e) => handleFilterChange('ordering', e.target.value), children: [_jsx("option", { value: "student_id", children: "Student ID" }), _jsx("option", { value: "-student_id", children: "Student ID (Desc)" }), _jsx("option", { value: "name", children: "Name" }), _jsx("option", { value: "-name", children: "Name (Desc)" })] })] })] })] }), _jsx("div", { className: "student-search", children: _jsxs("div", { className: "student-search-wrapper", children: [_jsx(Search, { className: "student-search-icon", size: 20 }), _jsx("input", { type: "text", className: "student-search-input", placeholder: "Search students...", value: filters.search, onChange: (e) => handleFilterChange('search', e.target.value) })] }) })] }) }), _jsx("div", { className: "student-table-section", children: _jsx("div", { className: "student-table-container", children: _jsx("div", { className: "student-table-wrapper", children: _jsxs("table", { className: "student-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Student ID" }), _jsx("th", { children: "Name" }), _jsx("th", { children: "Program" }), _jsx("th", { children: "Email" }), _jsx("th", { children: "Username" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: students.length > 0 ? (students.map((student) => (_jsxs("tr", { className: "student-table-row", children: [_jsx("td", { children: _jsx("span", { className: "student-table-cell--id", children: student.student_id }) }), _jsx("td", { children: _jsx("span", { className: "student-table-cell--name", children: student.name }) }), _jsx("td", { children: _jsxs("span", { className: "student-program-badge", children: [_jsx(GraduationCap, { className: "student-icon", size: 14 }), student.program.replace('_', ' ')] }) }), _jsx("td", { children: _jsx("span", { className: "student-table-cell--email", children: student.user?.email || 'N/A' }) }), _jsx("td", { children: _jsx("span", { className: "student-table-cell--username", children: student.user?.username || 'N/A' }) }), _jsx("td", { children: _jsxs("div", { className: "student-action-buttons", children: [_jsx("button", { className: "student-action-button student-action-button--view", title: "View", children: _jsx(Eye, { className: "student-icon", size: 16 }) }), _jsx("button", { className: "student-action-button student-action-button--edit", title: "Edit", children: _jsx(Edit, { className: "student-icon", size: 16 }) }), _jsx("button", { className: "student-action-button student-action-button--delete", title: "Delete", onClick: () => handleDeleteStudent(student.id), children: _jsx(Trash2, { className: "student-icon", size: 16 }) })] }) })] }, `${student.id}-${student.student_id}`)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "student-table-empty-cell", children: _jsx("div", { className: "student-table-empty", children: _jsxs("div", { className: "student-table-empty__content", children: [_jsx(Users, { className: "student-table-empty__icon", size: 48 }), _jsx("h3", { className: "student-table-empty__title", children: "No students found" }), _jsx("p", { className: "student-table-empty__message", children: filters.search || filters.program ?
                                                                            'Try adjusting your filters' : 'No students available' })] }) }) }) }, "no-data")) })] }) }) }) }), _jsx("div", { className: "student-pagination", children: _jsx("div", { className: "student-pagination__card", children: _jsxs("div", { className: "student-pagination__content", children: [_jsxs("button", { className: `student-button student-button--secondary student-pagination__button ${!previous ? 'student-button--disabled' : ''}`, disabled: !previous, onClick: () => previous && fetchStudents(previous), children: [_jsx(ChevronLeft, { className: "student-icon", size: 16 }), "Previous"] }), _jsxs("div", { className: "student-pagination__info", children: [_jsxs("span", { className: "student-pagination__page", children: ["Page ", currentPage] }), _jsx("span", { className: "student-pagination__divider" }), _jsxs("span", { className: "student-pagination__total", children: [Math.ceil(count / 10) || 1, " total pages"] }), _jsx("span", { className: "student-pagination__divider" }), _jsxs("span", { className: "student-pagination__count", children: [count, " students"] })] }), _jsxs("button", { className: `student-button student-button--secondary student-pagination__button ${!next ? 'student-button--disabled' : ''}`, disabled: !next, onClick: () => next && fetchStudents(next), children: ["Next", _jsx(ChevronRight, { className: "student-icon", size: 16 })] })] }) }) })] }) })] }));
};
export default StudentManagement;
