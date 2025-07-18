import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '@/components/ui/button';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-toastify';

interface User {
  username?: string;
}

interface Student {
  student_id: string;
  user?: User;
  name?: string;
  email?: string;
  program?: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Student[];
}

const StudentManager: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUrl, setCurrentUrl] = useState('/api/students/');
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);

  const token = localStorage.getItem('access_token');

  const fetchStudents = React.useCallback(async (url: string) => {
    setLoading(true);
    try {
      const res = await axios.get<PaginatedResponse>(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data.results);
      setNextPage(res.data.next);
      setPrevPage(res.data.previous);
    } catch (err) {
      console.error('Error fetching students:', err);
      toast.error('Failed to fetch students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let url = currentUrl;
    if (search || programFilter) {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (programFilter) params.append('program', programFilter);
      url = `/api/students/?${params.toString()}`;
    }
    fetchStudents(url);
  }, [currentUrl, search, programFilter, fetchStudents]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await axios.delete(`/api/students/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Student deleted');
      fetchStudents(currentUrl);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete student');
    }
  };

  const handleEdit = (student: Student) => {
    setEditStudent(student);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editStudent) return;
    try {
      await axios.put(`/api/students/${editStudent.student_id}/`, editStudent, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Student updated');
      fetchStudents(currentUrl);
      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update student');
    }
  };

  const handleCreate = async () => {
    if (!editStudent) return;
    try {
      await axios.post('/api/students/', editStudent, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Student created');
      fetchStudents('/api/students/');
      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create student');
    }
  };

  const exportToCSV = () => {
    const headers = ['Student ID', 'Username', 'Name', 'Email', 'Program'];
    const rows = students.map((s) => [
      s.student_id,
      s.user?.username || '',
      s.name || '',
      s.email || '',
      s.program || '',
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'students.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const openCreateModal = () => {
    setIsCreateMode(true);
    setEditStudent({
      student_id: '',
      name: '',
      email: '',
      program: '',
      user: { username: '' },
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Student Manager</h2>

      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex gap-2 w-full md:w-2/3">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
          <label htmlFor="programFilter" className="sr-only">
            Filter by program
          </label>
          <select
            id="programFilter"
            aria-label="Filter by program"
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">All Programs</option>
            <option value="CS">CS</option>
            <option value="IT">IT</option>
            <option value="ENG">ENG</option>
            <option value="BBA">BBA</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreateModal} className="flex items-center gap-1">
            <Plus size={16} /> Add Student
          </Button>
          <Button onClick={exportToCSV}>Export CSV</Button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : students.length === 0 ? (
        <p>No students found.</p>
      ) : (
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left">ID</th>
              <th className="border px-2 py-1 text-left">Username</th>
              <th className="border px-2 py-1 text-left">Name</th>
              <th className="border px-2 py-1 text-left">Email</th>
              <th className="border px-2 py-1 text-left">Program</th>
              <th className="border px-2 py-1 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.student_id}>
                <td className="border px-2 py-1">{student.student_id}</td>
                <td className="border px-2 py-1">{student.user?.username ?? '—'}</td>
                <td className="border px-2 py-1">{student.name ?? '—'}</td>
                <td className="border px-2 py-1">{student.email ?? '—'}</td>
                <td className="border px-2 py-1">{student.program ?? '—'}</td>
                <td className="border px-2 py-1 flex gap-2">
                  <button
                    onClick={() => handleEdit(student)}
                    className="text-blue-600 hover:underline"
                    aria-label="Edit student"
                    title="Edit student"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(student.student_id)}
                    className="text-red-600 hover:underline"
                    title="Delete student"
                    aria-label="Delete student"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex justify-between">
        <Button
          onClick={() => prevPage && setCurrentUrl(prevPage)}
          disabled={!prevPage}
          className="bg-gray-300 hover:bg-gray-400 text-black rounded disabled:opacity-50"
        >
          Previous
        </Button>
        <Button
          onClick={() => nextPage && setCurrentUrl(nextPage)}
          disabled={!nextPage}
          className="bg-gray-300 hover:bg-gray-400 text-black rounded disabled:opacity-50"
        >
          Next
        </Button>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Panel className="bg-white p-6 rounded shadow w-full max-w-md">
            <Dialog.Title className="text-lg font-semibold mb-4">
              {isCreateMode ? 'Add Student' : 'Edit Student'}
            </Dialog.Title>
            <div className="mb-2">
              <label className="block text-sm font-medium">Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={editStudent?.user?.username || ''}
                onChange={(e) =>
                  setEditStudent((prev) =>
                    prev ? { ...prev, user: { ...prev.user, username: e.target.value } } : null
                  )
                }
                className="border w-full rounded px-2 py-1"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                placeholder="Enter name"
                value={editStudent?.name || ''}
                onChange={(e) => setEditStudent((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                className="border w-full rounded px-2 py-1"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                placeholder="Enter email"
                value={editStudent?.email || ''}
                onChange={(e) => setEditStudent((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                className="border w-full rounded px-2 py-1"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Program</label>
              <input
                type="text"
                placeholder="Enter program"
                value={editStudent?.program || ''}
                onChange={(e) => setEditStudent((prev) => (prev ? { ...prev, program: e.target.value } : null))}
                className="border w-full rounded px-2 py-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsDialogOpen(false)} className="bg-gray-200 text-black">
                Cancel
              </Button>
              <Button onClick={isCreateMode ? handleCreate : handleUpdate}>
                {isCreateMode ? 'Create' : 'Update'}
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default StudentManager;
