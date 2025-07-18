import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Dialog from '@/components/ui/Dialog';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import api from '@/utils/api';
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
    return (_jsxs("div", { className: "p-4", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Manage Students" }), _jsxs("div", { className: "flex flex-wrap gap-2 mb-4", children: [_jsx(Input, { placeholder: "Search by username or name", value: search, onChange: (e) => setSearch(e.target.value), className: "flex-1 min-w-[200px]" }), _jsxs("select", { value: programFilter, onChange: (e) => setProgramFilter(e.target.value), className: "border rounded px-2 py-1 bg-white", "aria-label": "Filter by program", children: [_jsx("option", { value: "", children: "All Programs" }), _jsx("option", { value: "Computer Science", children: "Computer Science" }), _jsx("option", { value: "Information Tech", children: "Information Tech" }), _jsx("option", { value: "Engineering", children: "Engineering" }), _jsx("option", { value: "Networking and information security", children: "Networking" })] }), _jsx(Button, { onClick: exportCsv, disabled: loading, children: "Export CSV" }), _jsx(Button, { onClick: () => openEditModal(), disabled: loading, children: "Add Student" })] }), _jsx("div", { className: "overflow-x-auto bg-white rounded-lg shadow", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Student ID" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Username" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Name" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Email" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Program" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-4 text-center", children: "Loading students..." }) })) : students.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-4 text-center", children: "No students found" }) })) : (students.map((student) => (_jsxs("tr", { children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: student.student_id }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: student.user.username }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: student.name }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: student.email }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: student.program }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { variant: "ghost", onClick: () => openEditModal(student), children: _jsx(Pencil, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", onClick: () => handleDelete(student.student_id), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }) })] }, student.student_id)))) })] }) }), (next || previous) && (_jsxs("div", { className: "flex justify-between mt-4", children: [_jsx(Button, { onClick: () => previous && fetchStudents(previous), disabled: !previous || loading, children: "Previous" }), _jsx(Button, { onClick: () => next && fetchStudents(next), disabled: !next || loading, children: "Next" })] })), _jsx(Dialog, { isOpen: isDialogOpen, onClose: closeModal, children: _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: isCreateMode ? 'Add Student' : 'Edit Student' }), _jsxs("div", { className: "space-y-2", children: [_jsx(Input, { label: "Student ID", placeholder: "Enter student ID", type: "number", value: editStudent?.student_id || '', onChange: (e) => setEditStudent((prev) => ({
                                        ...(prev || {
                                            student_id: 0,
                                            user: { username: '' },
                                            name: '',
                                            email: '',
                                            program: '',
                                        }),
                                        student_id: Number(e.target.value),
                                    })), required: true }), _jsx(Input, { label: "Username", placeholder: "Enter username", value: editStudent?.user.username || '', onChange: (e) => setEditStudent((prev) => ({
                                        ...(prev || {
                                            student_id: 0,
                                            user: { username: '' },
                                            name: '',
                                            email: '',
                                            program: '',
                                        }),
                                        user: { username: e.target.value },
                                    })), required: true }), _jsx(Input, { label: "Name", placeholder: "Enter full name", value: editStudent?.name || '', onChange: (e) => setEditStudent((prev) => ({
                                        ...(prev || {
                                            student_id: 0,
                                            user: { username: '' },
                                            name: '',
                                            email: '',
                                            program: '',
                                        }),
                                        name: e.target.value,
                                    })) }), _jsx(Input, { label: "Email", placeholder: "Enter email", type: "email", value: editStudent?.email || '', onChange: (e) => setEditStudent((prev) => ({
                                        ...(prev || {
                                            student_id: 0,
                                            user: { username: '' },
                                            name: '',
                                            email: '',
                                            program: '',
                                        }),
                                        email: e.target.value,
                                    })) }), _jsx(Input, { label: "Program", placeholder: "Enter program", value: editStudent?.program || '', onChange: (e) => setEditStudent((prev) => ({
                                        ...(prev || {
                                            student_id: 0,
                                            user: { username: '' },
                                            name: '',
                                            email: '',
                                            program: '',
                                        }),
                                        program: e.target.value,
                                    })) })] }), _jsxs("div", { className: "flex justify-end space-x-2 pt-4", children: [_jsx(Button, { variant: "outline", onClick: closeModal, children: "Cancel" }), _jsx(Button, { onClick: isCreateMode ? handleCreate : handleUpdate, disabled: isSubmitting, children: isSubmitting
                                        ? 'Processing...'
                                        : isCreateMode
                                            ? 'Create'
                                            : 'Update' })] })] }) })] }));
};
export default StudentManager;
