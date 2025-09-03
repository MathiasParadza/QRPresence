import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Users, Search, Download, Edit, Trash2, Plus, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
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
    if (loading)
        return _jsx("div", { className: "admin-loading", children: "Loading students..." });
    if (error)
        return _jsx("div", { className: "admin-error", children: error });
    return (_jsxs("div", { className: "admin-page", children: [_jsxs("div", { className: "admin-page__header", children: [_jsx("h2", { children: "Student Management" }), _jsx("p", { children: "Manage all student records and information" })] }), _jsxs("div", { className: "admin-filters", children: [_jsxs("div", { className: "admin-filters__group", children: [_jsxs("div", { className: "admin-filter", children: [_jsx("label", { htmlFor: "programSelect", children: "Program" }), _jsxs("select", { id: "programSelect", value: filters.program, onChange: (e) => handleFilterChange('program', e.target.value), children: [_jsx("option", { value: "", children: "All Programs" }), _jsx("option", { value: "computer_science", children: "Computer Science" }), _jsx("option", { value: "engineering", children: "Engineering" }), _jsx("option", { value: "business", children: "Business" })] })] }), _jsxs("div", { className: "admin-filter", children: [_jsx("label", { htmlFor: "sortBySelect", children: "Sort By" }), _jsxs("select", { id: "sortBySelect", value: filters.ordering, onChange: (e) => handleFilterChange('ordering', e.target.value), children: [_jsx("option", { value: "student_id", children: "Student ID" }), _jsx("option", { value: "-student_id", children: "Student ID (Desc)" }), _jsx("option", { value: "name", children: "Name" }), _jsx("option", { value: "-name", children: "Name (Desc)" })] })] })] }), _jsxs("div", { className: "admin-search", children: [_jsx(Search, { size: 20 }), _jsx("input", { type: "text", placeholder: "Search students...", value: filters.search, onChange: (e) => handleFilterChange('search', e.target.value) })] })] }), _jsx("div", { className: "admin-table-container", children: _jsxs("table", { className: "admin-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Student ID" }), _jsx("th", { children: "Name" }), _jsx("th", { children: "Program" }), _jsx("th", { children: "Email" }), _jsx("th", { children: "Username" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: students.length > 0 ? (students.map((student) => (_jsxs("tr", { children: [_jsx("td", { children: student.student_id }), _jsx("td", { children: student.name }), _jsx("td", { children: _jsx("span", { className: "program-badge", children: student.program }) }), _jsx("td", { children: student.user?.email || 'N/A' }), _jsx("td", { children: student.user?.username || 'N/A' }), _jsx("td", { children: _jsxs("div", { className: "admin-actions", children: [_jsx("button", { className: "admin-action-btn admin-action-btn--view", title: "View", children: _jsx(Eye, { size: 16 }) }), _jsx("button", { className: "admin-action-btn admin-action-btn--edit", title: "Edit", children: _jsx(Edit, { size: 16 }) }), _jsx("button", { className: "admin-action-btn admin-action-btn--delete", title: "Delete", onClick: () => handleDeleteStudent(student.id), children: _jsx(Trash2, { size: 16 }) })] }) })] }, `${student.id}-${student.student_id}`)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "no-data-message", children: _jsxs("div", { className: "admin-empty-state", children: [_jsx(Users, { size: 48 }), _jsx("p", { children: "No students found" })] }) }) }, "no-data")) })] }) }), _jsxs("div", { className: "admin-pagination", children: [_jsxs("button", { className: "admin-button admin-button--secondary", disabled: !previous, onClick: () => previous && fetchStudents(previous), children: [_jsx(ChevronLeft, { size: 16 }), " Previous"] }), _jsxs("span", { className: "admin-pagination__info", children: ["Page ", currentPage, " of ", Math.ceil(count / 10) || 1] }), _jsxs("button", { className: "admin-button admin-button--secondary", disabled: !next, onClick: () => next && fetchStudents(next), children: ["Next ", _jsx(ChevronRight, { size: 16 })] })] }), _jsxs("div", { className: "admin-page__actions", children: [_jsxs("button", { className: "admin-button admin-button--primary", children: [_jsx(Plus, { size: 20 }), "Add New Student"] }), _jsxs("button", { className: "admin-button admin-button--secondary", children: [_jsx(Download, { size: 20 }), "Export Data"] })] })] }));
};
export default StudentManagement;
