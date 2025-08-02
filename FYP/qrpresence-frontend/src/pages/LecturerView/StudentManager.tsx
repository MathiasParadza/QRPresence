import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import Dialog from '@/components/ui/Dialog';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/button';
import { Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import type { StudentProfile, PaginatedResponse } from '@/types/user';

type Status = 'idle' | 'loading' | 'success' | 'error';

const StudentManager: React.FC = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<StudentProfile | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const navigate = useNavigate();

  const fetchStudents = useCallback(async (url: string = '/api/students/') => {
    setStatus('loading');
    try {
      // Build query string
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (programFilter.trim()) params.append('program', programFilter.trim());
      const fetchUrl = url.includes('?') ? `${url}&${params.toString()}` : `${url}?${params.toString()}`;
      const { data } = await fetchWithAuth<PaginatedResponse<StudentProfile>>(fetchUrl);
      if (data) {
        setStudents(data.results);
        setNext(data.next);
        setPrevious(data.previous);
        setStatus('success');
      } else {
        setStudents([]);
        setNext(null);
        setPrevious(null);
        setStatus('error');
        toast.error('Failed to fetch students: No data returned');
      }
    } catch (error) {
      setStatus('error');
      toast.error(error instanceof Error ? error.message : 'Failed to fetch students');
      setStudents([]);
    }
  }, [search, programFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const openEditModal = (student: StudentProfile | null = null) => {
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
    } catch (error) {
      setStatus('error');
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    }
  };

  const handleDelete = async (studentId: number) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    setStatus('loading');
    try {
      await fetchWithAuth(`/api/students/${studentId}/`, { method: 'DELETE' });
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (error) {
      setStatus('error');
      toast.error(error instanceof Error ? error.message : 'Deletion failed');
    }
  };

  const exportCsv = async () => {
    setStatus('loading');
    try {

      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/students/export-csv/', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) throw new Error('Failed to export CSV');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch {
      setStatus('error');
      toast.error('Failed to export CSV');
    } finally {
      setStatus('idle');
    }
  };


  const isLoading = status === 'loading';
  const isCreateMode = !editStudent?.student_id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="secondary"
            onClick={() => navigate('/lecturerview')}
            className="hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <h2 className="text-3xl font-bold text-purple-800 mb-2">Student Management</h2>
          <p className="text-gray-600">Manage student records and information</p>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            <div className="flex-1 min-w-0">
              <Input
                label="Search Students"
                placeholder="Search by username or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Program
              </label>
              <select
                value={programFilter}
                aria-label="Filter by Program"
                onChange={(e) => setProgramFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Programs</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Tech">Information Tech</option>
                <option value="Engineering">Engineering</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={exportCsv} 
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                Export CSV
              </Button>
              <Button 
                onClick={() => openEditModal()} 
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Add Student
              </Button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-purple-600 to-blue-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-3"></div>
                        <span className="text-gray-600">Loading students...</span>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <p className="text-lg mb-2">No students found</p>
                        <p className="text-sm">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.student_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {student.student_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {student.program}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            onClick={() => openEditModal(student)}
                            aria-label="Edit student"
                          >
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleDelete(student.student_id)}
                            aria-label="Delete student"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {(next || previous) && (
          <div className="flex justify-center items-center space-x-4 mt-6">
            <Button
              onClick={() => previous && fetchStudents(previous)}
              disabled={!previous || isLoading}
              className="bg-gray-600 hover:bg-gray-700"
            >
              Previous
            </Button>
            <Button
              onClick={() => next && fetchStudents(next)}
              disabled={!next || isLoading}
              className="bg-gray-600 hover:bg-gray-700"
            >
              Next
            </Button>
          </div>
        )}

        {/* Edit/Create Dialog */}
        <Dialog 
          isOpen={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)}
          aria-labelledby="student-dialog-title"
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 id="student-dialog-title" className="text-xl font-semibold text-purple-800 mb-4">
              {isCreateMode ? 'Add New Student' : 'Edit Student'}
            </h3>
            
            <div className="space-y-4">
              <Input
                name="student_id"
                label="Student ID"
                type="number"
                value={editStudent?.student_id || ''}
                onChange={(e) => setEditStudent(prev => ({
                  ...prev!,
                  student_id: parseInt(e.target.value) || 0
                }))}
                required
              />
              <Input
                name="username"
                label="Username"
                value={editStudent?.user.username || ''}
                onChange={(e) => setEditStudent(prev => ({
                  ...prev!,
                  user: {
                    ...prev!.user,
                    username: e.target.value
                  }
                }))}
                required
              />
              <Input
                name="name"
                label="Full Name"
                value={editStudent?.name || ''}
                onChange={(e) => setEditStudent(prev => ({
                  ...prev!,
                  name: e.target.value
                }))}
              />
              <Input
                name="email"
                label="Email"
                type="email"
                value={editStudent?.email || ''}
                onChange={(e) => setEditStudent(prev => ({
                  ...prev!,
                  email: e.target.value
                }))}
              />
              <Input
                name="program"
                label="Program"
                value={editStudent?.program || ''}
                onChange={(e) => setEditStudent(prev => ({
                  ...prev!,
                  program: e.target.value
                }))}
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className={isCreateMode ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
                aria-busy={isLoading}
              >
                {isLoading ? 'Processing...' : isCreateMode ? 'Create' : 'Update'}
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default StudentManager;