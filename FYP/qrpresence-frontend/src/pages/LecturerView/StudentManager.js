import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import Dialog from '@/components/ui/Dialog';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/button';
import { Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
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
    // FIXED: Remove fetchStudents from dependency array to prevent infinite loop
    useEffect(() => {
        fetchStudents();
    }, [search, programFilter, fetchStudents]); // Add fetchStudents to dependency array
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
            // FIXED: Removed extra slash from URL
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
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "mb-8", children: [_jsxs(Button, { variant: "secondary", onClick: () => navigate('/lecturerview'), className: "hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 mb-4", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "Back to Dashboard"] }), _jsx("h2", { className: "text-3xl font-bold text-purple-800 mb-2", children: "Student Management" }), _jsx("p", { className: "text-gray-600", children: "Manage student records and information" })] }), _jsx("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6", children: _jsxs("div", { className: "flex flex-col lg:flex-row gap-4 items-start lg:items-end", children: [_jsx("div", { className: "flex-1 min-w-0", children: _jsx(Input, { label: "Search Students", placeholder: "Search by username or name...", value: search, onChange: (e) => setSearch(e.target.value) }) }), _jsxs("div", { className: "w-full lg:w-48", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Filter by Program" }), _jsxs("select", { value: programFilter, "aria-label": "Filter by Program", onChange: (e) => setProgramFilter(e.target.value), className: "w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:ring-purple-500 focus:border-purple-500", children: [_jsx("option", { value: "", children: "All Programs" }), _jsx("option", { value: "Computer Science", children: "Computer Science" }), _jsx("option", { value: "Information Tech", children: "Information Tech" }), _jsx("option", { value: "Engineering", children: "Engineering" })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { onClick: exportCsv, disabled: isLoading, className: "bg-green-600 hover:bg-green-700", children: "Export CSV" }), _jsx(Button, { onClick: () => openEditModal(), disabled: isLoading, className: "bg-purple-600 hover:bg-purple-700", children: "Add Student" })] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gradient-to-r from-purple-600 to-blue-600", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider", children: "Student ID" }), _jsx("th", { className: "px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider", children: "Username" }), _jsx("th", { className: "px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider", children: "Name" }), _jsx("th", { className: "px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider", children: "Email" }), _jsx("th", { className: "px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider", children: "Program" }), _jsx("th", { className: "px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: isLoading ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-12 text-center", children: _jsxs("div", { className: "flex items-center justify-center", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-3" }), _jsx("span", { className: "text-gray-600", children: "Loading students..." })] }) }) })) : students.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-12 text-center", children: _jsxs("div", { className: "text-gray-500", children: [_jsx("p", { className: "text-lg mb-2", children: "No students found" }), _jsx("p", { className: "text-sm", children: "Try adjusting your search criteria" })] }) }) })) : (students.map((student) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600", children: student.student_id }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: student.user.username }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: student.name }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: student.email }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800", children: student.program }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { variant: "ghost", onClick: () => openEditModal(student), "aria-label": "Edit student", children: _jsx(Pencil, { className: "h-4 w-4 text-blue-600" }) }), _jsx(Button, { variant: "ghost", onClick: () => handleDelete(student.student_id), "aria-label": "Delete student", children: _jsx(Trash2, { className: "h-4 w-4 text-red-600" }) })] }) })] }, student.student_id)))) })] }) }) }), (next || previous) && (_jsxs("div", { className: "flex justify-center items-center space-x-4 mt-6", children: [_jsx(Button, { onClick: () => previous && fetchStudents(previous), disabled: !previous || isLoading, className: "bg-gray-600 hover:bg-gray-700", children: "Previous" }), _jsx(Button, { onClick: () => next && fetchStudents(next), disabled: !next || isLoading, className: "bg-gray-600 hover:bg-gray-700", children: "Next" })] })), _jsx(Dialog, { isOpen: isDialogOpen, onClose: () => setIsDialogOpen(false), "aria-labelledby": "student-dialog-title", children: _jsxs("div", { className: "bg-white rounded-lg p-6 w-full max-w-lg", children: [_jsx("h3", { id: "student-dialog-title", className: "text-xl font-semibold text-purple-800 mb-4", children: isCreateMode ? 'Add New Student' : 'Edit Student' }), _jsxs("div", { className: "space-y-4", children: [_jsx(Input, { name: "student_id", label: "Student ID", type: "number", value: editStudent?.student_id || '', onChange: (e) => setEditStudent(prev => ({
                                            ...prev,
                                            student_id: parseInt(e.target.value) || 0
                                        })), required: true }), _jsx(Input, { name: "username", label: "Username", value: editStudent?.user.username || '', onChange: (e) => setEditStudent(prev => ({
                                            ...prev,
                                            user: {
                                                ...prev.user,
                                                username: e.target.value
                                            }
                                        })), required: true }), _jsx(Input, { name: "name", label: "Full Name", value: editStudent?.name || '', onChange: (e) => setEditStudent(prev => ({
                                            ...prev,
                                            name: e.target.value
                                        })) }), _jsx(Input, { name: "email", label: "Email", type: "email", value: editStudent?.email || '', onChange: (e) => setEditStudent(prev => ({
                                            ...prev,
                                            email: e.target.value
                                        })) }), _jsx(Input, { name: "program", label: "Program", value: editStudent?.program || '', onChange: (e) => setEditStudent(prev => ({
                                            ...prev,
                                            program: e.target.value
                                        })) })] }), _jsxs("div", { className: "flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200", children: [_jsx(Button, { variant: "outline", onClick: () => setIsDialogOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleSubmit, disabled: isLoading, className: isCreateMode ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700', "aria-busy": isLoading, children: isLoading ? 'Processing...' : isCreateMode ? 'Create' : 'Update' })] })] }) })] }) }));
};
export default StudentManager;
