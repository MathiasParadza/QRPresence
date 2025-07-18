import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Dialog from '@/components/ui/Dialog';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import api from '@/utils/api';

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
    } catch (error) {
      console.error('Create error:', error);
      toast.error('Failed to create student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
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

  const handleDelete = async (student_id: number) => {
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
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV');
    }
  };

  const openEditModal = (student: Student | null = null) => {
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

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Manage Students</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        <Input
          placeholder="Search by username or name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className="border rounded px-2 py-1 bg-white"
          aria-label="Filter by program"
        >
          <option value="">All Programs</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Information Tech">Information Tech</option>
          <option value="Engineering">Engineering</option>
          <option value="Networking and information security">Networking</option>
        </select>
        <Button onClick={exportCsv} disabled={loading}>
          Export CSV
        </Button>
        <Button onClick={() => openEditModal()} disabled={loading}>
          Add Student
        </Button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Program
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  Loading students...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  No students found
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.student_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.student_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.program}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        onClick={() => openEditModal(student)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(student.student_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(next || previous) && (
        <div className="flex justify-between mt-4">
          <Button
            onClick={() => previous && fetchStudents(previous)}
            disabled={!previous || loading}
          >
            Previous
          </Button>
          <Button
            onClick={() => next && fetchStudents(next)}
            disabled={!next || loading}
          >
            Next
          </Button>
        </div>
      )}

      <Dialog isOpen={isDialogOpen} onClose={closeModal}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {isCreateMode ? 'Add Student' : 'Edit Student'}
          </h3>
          <div className="space-y-2">
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
              required
            />
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
              required
            />
            <Input
              label="Name"
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
            />
            <Input
              label="Email"
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
            />
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
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={isCreateMode ? handleCreate : handleUpdate}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Processing...'
                : isCreateMode
                ? 'Create'
                : 'Update'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default StudentManager;