import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Pencil, Trash2, ArrowLeft, Plus, Download } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
// Import the CSS file
import './StudentManager.css';
const StudentManager = () => {
    const [students, setStudents] = useState([]);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);
    const [search, setSearch] = useState('');
    const [programFilter, setProgramFilter] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editStudent, setEditStudent] = useState(null);
    const [status, setStatus] = useState('idle');
    const navigate = useNavigate();
    const fetchStudents = useCallback(async (url = '/api/students/') => {
        setStatus('loading');
        try {
            // Build query string
            const params = new URLSearchParams();
            if (search.trim())
                params.append('search', search.trim());
            if (programFilter.trim())
                params.append('program', programFilter.trim());
            const fetchUrl = url.includes('?') ? `${url}&${params.toString()}` : `${url}?${params.toString()}`;
            const { data } = await fetchWithAuth(fetchUrl);
            if (data) {
                setStudents(data.results);
                setNext(data.next);
                setPrevious(data.previous);
                setStatus('success');
            }
            else {
                setStudents([]);
                setNext(null);
                setPrevious(null);
                setStatus('error');
                toast.error('Failed to fetch students: No data returned');
            }
        }
        catch (error) {
            setStatus('error');
            toast.error(error instanceof Error ? error.message : 'Failed to fetch students');
            setStudents([]);
        }
    }, [search, programFilter]);
    useEffect(() => {
        fetchStudents();
    }, [search, programFilter, fetchStudents]);
    const openEditModal = (student = null) => {
        setEditStudent(student || {
            student_id: 0,
            name: '',
            email: '',
            program: '',
            user: {
                id: 0,
                username: '',
                email: '',
                role: 'student'
            }
        });
        setIsDialogOpen(true);
    };
    const handleSubmit = async () => {
        if (!editStudent?.student_id) {
            toast.error('Student ID is required');
            return;
        }
        setStatus('loading');
        try {
            const method = editStudent.student_id ? 'PUT' : 'POST';
            const url = editStudent.student_id
                ? `/api/students/${editStudent.student_id}/`
                : '/api/students/';
            await fetchWithAuth(url, {
                method,
                body: JSON.stringify(editStudent),
            });
            toast.success(`Student ${method === 'POST' ? 'created' : 'updated'} successfully`);
            setIsDialogOpen(false);
            setEditStudent(null);
            fetchStudents();
        }
        catch (error) {
            setStatus('error');
            toast.error(error instanceof Error ? error.message : 'Operation failed');
        }
    };
    const handleDelete = async (studentId) => {
        if (!confirm('Are you sure you want to delete this student?'))
            return;
        setStatus('loading');
        try {
            await fetchWithAuth(`/api/students/${studentId}/`, { method: 'DELETE' });
            toast.success('Student deleted successfully');
            fetchStudents();
        }
        catch (error) {
            setStatus('error');
            toast.error(error instanceof Error ? error.message : 'Deletion failed');
        }
    };
    const exportCsv = async () => {
        setStatus('loading');
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/students/export-csv/', {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (!response.ok)
                throw new Error('Failed to export CSV');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'students.csv');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        }
        catch {
            setStatus('error');
            toast.error('Failed to export CSV');
        }
        finally {
            setStatus('idle');
        }
    };
    const isLoading = status === 'loading';
    const isCreateMode = !editStudent?.student_id;
    return (_jsxs("div", { className: "student-manager-container", children: [_jsx("div", { className: "student-manager-container__background", children: _jsx("div", { className: "student-manager-container__overlay" }) }), _jsxs("div", { className: "student-manager-content", children: [_jsxs("div", { className: "student-manager-header", children: [_jsx("div", { className: "student-manager-header__back-button", children: _jsxs("button", { className: "student-manager-button student-manager-button--secondary", onClick: () => navigate('/lecturerview'), children: [_jsx(ArrowLeft, { className: "student-manager-icon" }), "Back to Dashboard"] }) }), _jsx("h1", { className: "student-manager-header__title", children: "Student Management" }), _jsx("span", { className: "student-manager-header__subtitle", children: "Manage student records and information" })] }), _jsx("div", { className: "student-manager-card", children: _jsx("div", { className: "student-manager-card__content", children: _jsxs("div", { className: "student-manager-controls", children: [_jsxs("div", { className: "student-manager-controls__search student-manager-field", children: [_jsx("label", { className: "student-manager-field__label", children: "Search Students" }), _jsx("input", { type: "text", className: "student-manager-field__input", placeholder: "Search by username or name...", value: search, onChange: (e) => setSearch(e.target.value) })] }), _jsxs("div", { className: "student-manager-controls__filter student-manager-field", children: [_jsx("label", { className: "student-manager-field__label", children: "Filter by Program" }), _jsxs("select", { className: "student-manager-field__select", value: programFilter, onChange: (e) => setProgramFilter(e.target.value), title: "Filter by Program", children: [_jsx("option", { value: "", children: "All Programs" }), _jsx("option", { value: "Computer Science", children: "Computer Science" }), _jsx("option", { value: "Information Tech", children: "Information Tech" }), _jsx("option", { value: "Engineering", children: "Engineering" })] })] }), _jsxs("div", { className: "student-manager-controls__actions", children: [_jsxs("button", { className: "student-manager-button student-manager-button--success", onClick: exportCsv, disabled: isLoading, children: [_jsx(Download, { className: "student-manager-icon" }), "Export CSV"] }), _jsxs("button", { className: "student-manager-button student-manager-button--primary", onClick: () => openEditModal(), disabled: isLoading, children: [_jsx(Plus, { className: "student-manager-icon" }), "Add Student"] })] })] }) }) }), _jsx("div", { className: "student-manager-card student-manager-table-container", children: _jsx("div", { className: "student-manager-card__content", children: _jsx("div", { className: "student-manager-table-wrapper", children: _jsxs("table", { className: "student-manager-table", children: [_jsx("thead", { className: "student-manager-table__header", children: _jsxs("tr", { children: [_jsx("th", { className: "student-manager-table__header-cell", children: "Student ID" }), _jsx("th", { className: "student-manager-table__header-cell", children: "Username" }), _jsx("th", { className: "student-manager-table__header-cell", children: "Name" }), _jsx("th", { className: "student-manager-table__header-cell", children: "Email" }), _jsx("th", { className: "student-manager-table__header-cell", children: "Program" }), _jsx("th", { className: "student-manager-table__header-cell", children: "Actions" })] }) }), _jsx("tbody", { className: "student-manager-table__body", children: isLoading ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "student-manager-loading", children: _jsxs("div", { className: "student-manager-loading__content", children: [_jsx("div", { className: "student-manager-spinner" }), _jsx("span", { children: "Loading students..." })] }) }) })) : students.length === 0 ? (_jsx("tr", { children: _jsxs("td", { colSpan: 6, className: "student-manager-empty", children: [_jsx("div", { className: "student-manager-empty__title", children: "No students found" }), _jsx("div", { className: "student-manager-empty__subtitle", children: "Try adjusting your search criteria" })] }) })) : (students.map((student) => (_jsxs("tr", { className: "student-manager-table__row", children: [_jsx("td", { className: "student-manager-table__cell student-manager-table__cell--id", children: student.student_id }), _jsx("td", { className: "student-manager-table__cell", children: student.user.username }), _jsx("td", { className: "student-manager-table__cell student-manager-table__cell--name", children: student.name }), _jsx("td", { className: "student-manager-table__cell", children: student.email }), _jsx("td", { className: "student-manager-table__cell", children: _jsx("span", { className: "student-manager-program-badge", children: student.program }) }), _jsx("td", { className: "student-manager-table__cell student-manager-table__cell--actions", children: _jsxs("div", { className: "student-manager-actions", children: [_jsx("button", { className: "student-manager-button student-manager-button--ghost", onClick: () => openEditModal(student), "aria-label": "Edit student", children: _jsx(Pencil, { className: "student-manager-icon student-manager-icon--small" }) }), _jsx("button", { className: "student-manager-button student-manager-button--ghost", onClick: () => handleDelete(student.student_id), "aria-label": "Delete student", children: _jsx(Trash2, { className: "student-manager-icon student-manager-icon--small" }) })] }) })] }, student.student_id)))) })] }) }) }) }), (next || previous) && (_jsxs("div", { className: "student-manager-pagination", children: [_jsx("button", { className: "student-manager-button student-manager-button--secondary", onClick: () => previous && fetchStudents(previous), disabled: !previous || isLoading, children: "Previous" }), _jsx("button", { className: "student-manager-button student-manager-button--secondary", onClick: () => next && fetchStudents(next), disabled: !next || isLoading, children: "Next" })] })), isDialogOpen && (_jsxs("div", { className: "student-manager-dialog", children: [_jsx("div", { className: "student-manager-dialog__backdrop", onClick: () => setIsDialogOpen(false) }), _jsxs("div", { className: "student-manager-dialog__content", children: [_jsx("div", { className: "student-manager-dialog__header", children: _jsx("h2", { className: "student-manager-dialog__title", children: isCreateMode ? 'Add New Student' : 'Edit Student' }) }), _jsx("div", { className: "student-manager-dialog__body", children: _jsxs("div", { className: "student-manager-dialog__form", children: [_jsxs("div", { className: "student-manager-field", children: [_jsx("label", { className: "student-manager-field__label", children: "Student ID" }), _jsx("input", { type: "number", className: "student-manager-field__input", value: editStudent?.student_id || '', onChange: (e) => setEditStudent(prev => ({
                                                                ...prev,
                                                                student_id: parseInt(e.target.value) || 0
                                                            })), required: true, title: "Student ID" })] }), _jsxs("div", { className: "student-manager-field", children: [_jsx("label", { className: "student-manager-field__label", children: "Username" }), _jsx("input", { type: "text", className: "student-manager-field__input", value: editStudent?.user.username || '', onChange: (e) => setEditStudent(prev => ({
                                                                ...prev,
                                                                user: {
                                                                    ...prev.user,
                                                                    username: e.target.value
                                                                }
                                                            })), required: true, title: "Username" })] }), _jsxs("div", { className: "student-manager-field", children: [_jsx("label", { className: "student-manager-field__label", children: "Full Name" }), _jsx("input", { type: "text", className: "student-manager-field__input", value: editStudent?.name || '', onChange: (e) => setEditStudent(prev => ({
                                                                ...prev,
                                                                name: e.target.value
                                                            })), title: "Full Name" })] }), _jsxs("div", { className: "student-manager-field", children: [_jsx("label", { className: "student-manager-field__label", children: "Email" }), _jsx("input", { type: "email", className: "student-manager-field__input", value: editStudent?.email || '', onChange: (e) => setEditStudent(prev => ({
                                                                ...prev,
                                                                email: e.target.value
                                                            })), title: "Email" })] }), _jsxs("div", { className: "student-manager-field", children: [_jsx("label", { className: "student-manager-field__label", children: "Program" }), _jsx("input", { type: "text", className: "student-manager-field__input", value: editStudent?.program || '', onChange: (e) => setEditStudent(prev => ({
                                                                ...prev,
                                                                program: e.target.value
                                                            })), title: "Program" })] })] }) }), _jsxs("div", { className: "student-manager-dialog__actions", children: [_jsx("button", { className: "student-manager-button student-manager-button--secondary", onClick: () => setIsDialogOpen(false), children: "Cancel" }), _jsx("button", { className: `student-manager-button ${isCreateMode ? 'student-manager-button--success' : 'student-manager-button--primary'}`, onClick: handleSubmit, disabled: isLoading, children: isLoading ? 'Processing...' : isCreateMode ? 'Create' : 'Update' })] })] })] }))] })] }));
};
export default StudentManager;
