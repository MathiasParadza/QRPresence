import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Dialog from '@/components/ui/Dialog';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import api from '@/utils/api';
import { ArrowLeft } from "lucide-react";
import { useNavigate } from 'react-router-dom';


interface User {
  username: string;
}

interface Student {
  student_id: number;
  user: User;
  name: string;
  email: string;
  program: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Student[];
}

const StudentManager: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  

  const fetchStudents = React.useCallback(async (url: string = '/api/students/') => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse>(url, {
        params: {
          search: search?.trim() || undefined,
          program: programFilter?.trim() || undefined,
        },
      });
      setStudents(res.data.results || []);
      setNext(res.data.next);
      setPrevious(res.data.previous);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [search, programFilter]);

  useEffect(() => {
    fetchStudents();
  }, [search, programFilter, fetchStudents]);

  const handleCreate = async (): Promise<void> => {
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
    } catch (error) {
      console.error('Create error:', error);
      toast.error('Failed to create student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (): Promise<void> => {
    if (!editStudent?.student_id) return;
    
    setIsSubmitting(true);
    try {
      await api.put(`/api/students/${editStudent.student_id}/`, editStudent);
      toast.success('Student updated successfully');
      setIsDialogOpen(false);
      setEditStudent(null);
      fetchStudents();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (student_id: number): Promise<void> => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    try {
      await api.delete(`/api/students/${student_id}/`);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete student');
    }
  };

  const exportCsv = async (): Promise<void> => {
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
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV');
    }
  };

  const openEditModal = (student: Student | null = null): void => {
    setEditStudent(student || {
      student_id: 0,
      user: { username: '' },
      name: '',
      email: '',
      program: ''
    });
    setIsDialogOpen(true);
  };

  const closeModal = (): void => {
    setIsDialogOpen(false);
    setEditStudent(null);
  };

  const isCreateMode = !editStudent?.student_id;
  const navigate = useNavigate();
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Students
              </label>
              <Input
                placeholder="Search by username or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border-gray-300 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Program
              </label>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                aria-label="Filter by program"
              >
                <option value="">All Programs</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Tech">Information Tech</option>
                <option value="Engineering">Engineering</option>
                <option value="Networking and information security">Networking</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={exportCsv} 
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export CSV
              </Button>
              <Button 
                onClick={() => openEditModal()} 
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                {loading ? (
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
                        <p className="text-sm">Try adjusting your search criteria or add a new student</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((student, index) => (
                    <tr 
                      key={student.student_id} 
                      className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {student.student_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {student.user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {student.program}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            onClick={() => openEditModal(student)}
                            className="p-2 text-green-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
                          >
                            <Pencil className="h-4 w-4" title="Edit student" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleDelete(student.student_id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors"
                          >
                            <Trash2 className="h-4 w-4" title="Delete student" />
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
              disabled={!previous || loading}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </Button>
            <Button
              onClick={() => next && fetchStudents(next)}
              disabled={!next || loading}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </Button>
          </div>
        )}

        {/* Modal Dialog */}
        <Dialog isOpen={isDialogOpen} onClose={closeModal}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-xl font-semibold text-purple-800">
                  {isCreateMode ? 'Add New Student' : 'Edit Student'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isCreateMode ? 'Enter student information below' : 'Update student details'}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Input
                    label="Student ID"
                    placeholder="Enter student ID"
                    type="number"
                    value={editStudent?.student_id || ''}
                    onChange={(e) =>
                      setEditStudent((prev) => ({
                        ...(prev || {
                          student_id: 0,
                          user: { username: '' },
                          name: '',
                          email: '',
                          program: '',
                        }),
                        student_id: Number(e.target.value),
                      }))
                    }
                    className="border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <Input
                    label="Username"
                    placeholder="Enter username"
                    value={editStudent?.user.username || ''}
                    onChange={(e) =>
                      setEditStudent((prev) => ({
                        ...(prev || {
                          student_id: 0,
                          user: { username: '' },
                          name: '',
                          email: '',
                          program: '',
                        }),
                        user: { username: e.target.value },
                      }))
                    }
                    className="border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <Input
                    label="Full Name"
                    placeholder="Enter full name"
                    value={editStudent?.name || ''}
                    onChange={(e) =>
                      setEditStudent((prev) => ({
                        ...(prev || {
                          student_id: 0,
                          user: { username: '' },
                          name: '',
                          email: '',
                          program: '',
                        }),
                        name: e.target.value,
                      }))
                    }
                    className="border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <Input
                    label="Email Address"
                    placeholder="Enter email"
                    type="email"
                    value={editStudent?.email || ''}
                    onChange={(e) =>
                      setEditStudent((prev) => ({
                        ...(prev || {
                          student_id: 0,
                          user: { username: '' },
                          name: '',
                          email: '',
                          program: '',
                        }),
                        email: e.target.value,
                      }))
                    }
                    className="border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <Input
                    label="Program"
                    placeholder="Enter program"
                    value={editStudent?.program || ''}
                    onChange={(e) =>
                      setEditStudent((prev) => ({
                        ...(prev || {
                          student_id: 0,
                          user: { username: '' },
                          name: '',
                          email: '',
                          program: '',
                        }),
                        program: e.target.value,
                      }))
                    }
                    className="border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={closeModal}
                  className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Cancel
                </Button>
                <Button
                  onClick={isCreateMode ? handleCreate : handleUpdate}
                  disabled={isSubmitting}
                  className={`px-6 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCreateMode 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting
                    ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      )
                    : isCreateMode
                    ? 'Create Student'
                    : 'Update Student'}
                </Button>
              </div>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default StudentManager;