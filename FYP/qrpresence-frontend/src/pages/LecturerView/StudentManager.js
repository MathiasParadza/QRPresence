import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Dialog from '@/components/ui/Dialog';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import api from '@/utils/api';
import { ArrowLeft } from "lucide-react";
import { useNavigate } from 'react-router-dom';
const StudentManager = () => {
    const [students, setStudents] = useState([]);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);
    const [search, setSearch] = useState('');
    const [programFilter, setProgramFilter] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editStudent, setEditStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fetchStudents = React.useCallback(async (url = '/api/students/') => {
        setLoading(true);
        try {
            const res = await api.get(url, {
                params: {
                    search: search?.trim() || undefined,
                    program: programFilter?.trim() || undefined,
                },
            });
            setStudents(res.data.results || []);
            setNext(res.data.next);
            setPrevious(res.data.previous);
        }
        catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Failed to fetch students');
            setStudents([]);
        }
        finally {
            setLoading(false);
        }
    }, [search, programFilter]);
    useEffect(() => {
        fetchStudents();
    }, [search, programFilter, fetchStudents]);
    const handleCreate = async () => {
        if (!editStudent?.student_id) {
            toast.error('Student ID required');
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post('/api/students/', editStudent);
            toast.success('Student created successfully');
            setIsDialogOpen(false);
            setEditStudent(null);
            fetchStudents();
        }
        catch (error) {
            console.error('Create error:', error);
            toast.error('Failed to create student');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleUpdate = async () => {
        if (!editStudent?.student_id)
            return;
        setIsSubmitting(true);
        try {
            await api.put(`/api/students/${editStudent.student_id}/`, editStudent);
            toast.success('Student updated successfully');
            setIsDialogOpen(false);
            setEditStudent(null);
            fetchStudents();
        }
        catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to update student');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleDelete = async (student_id) => {
        if (!confirm('Are you sure you want to delete this student?'))
            return;
        try {
            await api.delete(`/api/students/${student_id}/`);
            toast.success('Student deleted successfully');
            fetchStudents();
        }
        catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete student');
        }
    };
    const exportCsv = async () => {
        try {
            const response = await api.get('/api/students/export-csv/', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'students.csv');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        }
        catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export CSV');
        }
    };
    const openEditModal = (student = null) => {
        setEditStudent(student || {
            student_id: 0,
            user: { username: '' },
            name: '',
            email: '',
            program: ''
        });
        setIsDialogOpen(true);
    };
    const closeModal = () => {
        setIsDialogOpen(false);
        setEditStudent(null);
    };
    const isCreateMode = !editStudent?.student_id;
    const navigate = useNavigate();
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "mb-8", children: [_jsxs(Button, { variant: "secondary", onClick: () => navigate('/lecturerview'), className: "hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 mb-4", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "Back to Dashboard"] }), _jsx("h2", { className: "text-3xl font-bold text-purple-800 mb-2", children: "Student Management" }), _jsx("p", { className: "text-gray-600", children: "Manage student records and information" })] }), _jsx("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6", children: _jsxs("div", { className: "flex flex-col lg:flex-row gap-4 items-start lg:items-end", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Search Students" }), _jsx(Input, { placeholder: "Search by username or name...", value: search, onChange: (e) => setSearch(e.target.value), className: "w-full border-gray-300 focus:ring-purple-500 focus:border-purple-500" })] }), _jsxs("div", { className: "w-full lg:w-48", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Filter by Program" }), _jsxs("select", { value: programFilter, onChange: (e) => setProgramFilter(e.target.value), className: "w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:ring-purple-500 focus:border-purple-500", "aria-label": "Filter by program", children: [_jsx("option", { value: "", children: "All Programs" }), _jsx("option", { value: "Computer Science", children: "Computer Science" }), _jsx("option", { value: "Information Tech", children: "Information Tech" }), _jsx("option", { value: "Engineering", children: "Engineering" }), _jsx("option", { value: "Networking and information security", children: "Networking" })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { onClick: exportCsv, disabled: loading, className: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed", children: "Export CSV" }), _jsx(Button, { onClick: () => openEditModal(), disabled: loading, className: "bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed", children: "Add Student" })] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gradient-to-r from-purple-600 to-blue-600", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider", children: "Student ID" }), _jsx("th", { className: "px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider", children: "Username" }), _jsx("th", { className: "px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider", children: "Name" }), _jsx("th", { className: "px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider", children: "Email" }), _jsx("th", { className: "px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider", children: "Program" }), _jsx("th", { className: "px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-12 text-center", children: _jsxs("div", { className: "flex items-center justify-center", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-3" }), _jsx("span", { className: "text-gray-600", children: "Loading students..." })] }) }) })) : students.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-12 text-center", children: _jsxs("div", { className: "text-gray-500", children: [_jsx("p", { className: "text-lg mb-2", children: "No students found" }), _jsx("p", { className: "text-sm", children: "Try adjusting your search criteria or add a new student" })] }) }) })) : (students.map((student, index) => (_jsxs("tr", { className: `hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`, children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600", children: student.student_id }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600", children: student.user.username }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600", children: student.name }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-blue-600", children: student.email }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600", children: _jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800", children: student.program }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { variant: "ghost", onClick: () => openEditModal(student), className: "p-2 text-green-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors", children: _jsx(Pencil, { className: "h-4 w-4", title: "Edit student" }) }), _jsx(Button, { variant: "ghost", onClick: () => handleDelete(student.student_id), className: "p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors", children: _jsx(Trash2, { className: "h-4 w-4", title: "Delete student" }) })] }) })] }, student.student_id)))) })] }) }) }), (next || previous) && (_jsxs("div", { className: "flex justify-center items-center space-x-4 mt-6", children: [_jsx(Button, { onClick: () => previous && fetchStudents(previous), disabled: !previous || loading, className: "px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed", children: "Previous" }), _jsx(Button, { onClick: () => next && fetchStudents(next), disabled: !next || loading, className: "px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed", children: "Next" })] })), _jsx(Dialog, { isOpen: isDialogOpen, onClose: closeModal, children: _jsx("div", { className: "bg-white rounded-lg p-6 w-full max-w-lg mx-4", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "border-b border-gray-200 pb-4", children: [_jsx("h3", { className: "text-xl font-semibold text-purple-800", children: isCreateMode ? 'Add New Student' : 'Edit Student' }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: isCreateMode ? 'Enter student information below' : 'Update student details' })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("div", { children: _jsx(Input, { label: "Student ID", placeholder: "Enter student ID", type: "number", value: editStudent?.student_id || '', onChange: (e) => setEditStudent((prev) => ({
                                                    ...(prev || {
                                                        student_id: 0,
                                                        user: { username: '' },
                                                        name: '',
                                                        email: '',
                                                        program: '',
                                                    }),
                                                    student_id: Number(e.target.value),
                                                })), className: "border-gray-300 focus:ring-purple-500 focus:border-purple-500", required: true }) }), _jsx("div", { children: _jsx(Input, { label: "Username", placeholder: "Enter username", value: editStudent?.user.username || '', onChange: (e) => setEditStudent((prev) => ({
                                                    ...(prev || {
                                                        student_id: 0,
                                                        user: { username: '' },
                                                        name: '',
                                                        email: '',
                                                        program: '',
                                                    }),
                                                    user: { username: e.target.value },
                                                })), className: "border-gray-300 focus:ring-purple-500 focus:border-purple-500", required: true }) }), _jsx("div", { children: _jsx(Input, { label: "Full Name", placeholder: "Enter full name", value: editStudent?.name || '', onChange: (e) => setEditStudent((prev) => ({
                                                    ...(prev || {
                                                        student_id: 0,
                                                        user: { username: '' },
                                                        name: '',
                                                        email: '',
                                                        program: '',
                                                    }),
                                                    name: e.target.value,
                                                })), className: "border-gray-300 focus:ring-purple-500 focus:border-purple-500" }) }), _jsx("div", { children: _jsx(Input, { label: "Email Address", placeholder: "Enter email", type: "email", value: editStudent?.email || '', onChange: (e) => setEditStudent((prev) => ({
                                                    ...(prev || {
                                                        student_id: 0,
                                                        user: { username: '' },
                                                        name: '',
                                                        email: '',
                                                        program: '',
                                                    }),
                                                    email: e.target.value,
                                                })), className: "border-gray-300 focus:ring-purple-500 focus:border-purple-500" }) }), _jsx("div", { children: _jsx(Input, { label: "Program", placeholder: "Enter program", value: editStudent?.program || '', onChange: (e) => setEditStudent((prev) => ({
                                                    ...(prev || {
                                                        student_id: 0,
                                                        user: { username: '' },
                                                        name: '',
                                                        email: '',
                                                        program: '',
                                                    }),
                                                    program: e.target.value,
                                                })), className: "border-gray-300 focus:ring-purple-500 focus:border-purple-500" }) })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4 border-t border-gray-200", children: [_jsx(Button, { variant: "outline", onClick: closeModal, className: "px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md", children: "Cancel" }), _jsx(Button, { onClick: isCreateMode ? handleCreate : handleUpdate, disabled: isSubmitting, className: `px-6 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${isCreateMode
                                                ? 'bg-green-600 hover:bg-green-700'
                                                : 'bg-blue-600 hover:bg-blue-700'}`, children: isSubmitting
                                                ? (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" }), "Processing..."] }))
                                                : isCreateMode
                                                    ? 'Create Student'
                                                    : 'Update Student' })] })] }) }) })] }) }));
};
export default StudentManager;
