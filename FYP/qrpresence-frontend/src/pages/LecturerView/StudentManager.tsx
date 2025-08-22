import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Pencil, Trash2, ArrowLeft, Plus, Download } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import type { StudentProfile, PaginatedResponse } from '@/types/user';

// Import the CSS file
import './StudentManager.css';

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
  }, [search, programFilter, fetchStudents]);

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
      const response = await fetch('http://localhost:8000/api/students/export-csv/', {
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
    <div className="student-manager-container">
      <div className="student-manager-container__background">
        <div className="student-manager-container__overlay"></div>
      </div>
      
      <div className="student-manager-content">
        {/* Header */}
        <div className="student-manager-header">
          <div className="student-manager-header__back-button">
            <button 
              className="student-manager-button student-manager-button--secondary"
              onClick={() => navigate('/lecturerview')}
            >
              <ArrowLeft className="student-manager-icon" />
              Back to Dashboard
            </button>
          </div>

          <h1 className="student-manager-header__title">Student Management</h1>
          <span className="student-manager-header__subtitle">
            Manage student records and information
          </span>
        </div>

        {/* Controls Section */}
        <div className="student-manager-card">
          <div className="student-manager-card__content">
            <div className="student-manager-controls">
              <div className="student-manager-controls__search student-manager-field">
                <label className="student-manager-field__label">Search Students</label>
                <input
                  type="text"
                  className="student-manager-field__input"
                  placeholder="Search by username or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <div className="student-manager-controls__filter student-manager-field">
                <label className="student-manager-field__label">Filter by Program</label>
                <select
                  className="student-manager-field__select"
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  title="Filter by Program"
                >
                  <option value="">All Programs</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Tech">Information Tech</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>

              <div className="student-manager-controls__actions">
                <button 
                  className="student-manager-button student-manager-button--success"
                  onClick={exportCsv} 
                  disabled={isLoading}
                >
                  <Download className="student-manager-icon" />
                  Export CSV
                </button>
                <button 
                  className="student-manager-button student-manager-button--primary"
                  onClick={() => openEditModal()} 
                  disabled={isLoading}
                >
                  <Plus className="student-manager-icon" />
                  Add Student
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="student-manager-card student-manager-table-container">
          <div className="student-manager-card__content">
            <div className="student-manager-table-wrapper">
              <table className="student-manager-table">
                <thead className="student-manager-table__header">
                  <tr>
                    <th className="student-manager-table__header-cell">Student ID</th>
                    <th className="student-manager-table__header-cell">Username</th>
                    <th className="student-manager-table__header-cell">Name</th>
                    <th className="student-manager-table__header-cell">Email</th>
                    <th className="student-manager-table__header-cell">Program</th>
                    <th className="student-manager-table__header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="student-manager-table__body">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="student-manager-loading">
                        <div className="student-manager-loading__content">
                          <div className="student-manager-spinner"></div>
                          <span>Loading students...</span>
                        </div>
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="student-manager-empty">
                        <div className="student-manager-empty__title">No students found</div>
                        <div className="student-manager-empty__subtitle">Try adjusting your search criteria</div>
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.student_id} className="student-manager-table__row">
                        <td className="student-manager-table__cell student-manager-table__cell--id">
                          {student.student_id}
                        </td>
                        <td className="student-manager-table__cell">
                          {student.user.username}
                        </td>
                        <td className="student-manager-table__cell student-manager-table__cell--name">
                          {student.name}
                        </td>
                        <td className="student-manager-table__cell">
                          {student.email}
                        </td>
                        <td className="student-manager-table__cell">
                          <span className="student-manager-program-badge">
                            {student.program}
                          </span>
                        </td>
                        <td className="student-manager-table__cell student-manager-table__cell--actions">
                          <div className="student-manager-actions">
                            <button
                              className="student-manager-button student-manager-button--ghost"
                              onClick={() => openEditModal(student)}
                              aria-label="Edit student"
                            >
                              <Pencil className="student-manager-icon student-manager-icon--small" />
                            </button>
                            <button
                              className="student-manager-button student-manager-button--ghost"
                              onClick={() => handleDelete(student.student_id)}
                              aria-label="Delete student"
                            >
                              <Trash2 className="student-manager-icon student-manager-icon--small" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {(next || previous) && (
          <div className="student-manager-pagination">
            <button
              className="student-manager-button student-manager-button--secondary"
              onClick={() => previous && fetchStudents(previous)}
              disabled={!previous || isLoading}
            >
              Previous
            </button>
            <button
              className="student-manager-button student-manager-button--secondary"
              onClick={() => next && fetchStudents(next)}
              disabled={!next || isLoading}
            >
              Next
            </button>
          </div>
        )}

        {/* Edit/Create Dialog */}
        {isDialogOpen && (
          <div className="student-manager-dialog">
            <div className="student-manager-dialog__backdrop" onClick={() => setIsDialogOpen(false)}></div>
            <div className="student-manager-dialog__content">
              <div className="student-manager-dialog__header">
                <h2 className="student-manager-dialog__title">
                  {isCreateMode ? 'Add New Student' : 'Edit Student'}
                </h2>
              </div>
              
              <div className="student-manager-dialog__body">
                <div className="student-manager-dialog__form">
                  <div className="student-manager-field">
                    <label className="student-manager-field__label">Student ID</label>
                    <input
                      type="number"
                      className="student-manager-field__input"
                      value={editStudent?.student_id || ''}
                      onChange={(e) => setEditStudent(prev => ({
                        ...prev!,
                        student_id: parseInt(e.target.value) || 0
                      }))}
                      required
                      title="Student ID"
                    />
                  </div>
                  
                  <div className="student-manager-field">
                    <label className="student-manager-field__label">Username</label>
                    <input
                      type="text"
                      className="student-manager-field__input"
                      value={editStudent?.user.username || ''}
                      onChange={(e) => setEditStudent(prev => ({
                        ...prev!,
                        user: {
                          ...prev!.user,
                          username: e.target.value
                        }
                      }))}
                      required
                      title="Username"
                    />
                  </div>
                  
                  <div className="student-manager-field">
                    <label className="student-manager-field__label">Full Name</label>
                    <input
                      type="text"
                      className="student-manager-field__input"
                      value={editStudent?.name || ''}
                      onChange={(e) => setEditStudent(prev => ({
                        ...prev!,
                        name: e.target.value
                      }))}
                      title="Full Name"
                    />
                  </div>
                  
                  <div className="student-manager-field">
                    <label className="student-manager-field__label">Email</label>
                    <input
                      type="email"
                      className="student-manager-field__input"
                      value={editStudent?.email || ''}
                      onChange={(e) => setEditStudent(prev => ({
                        ...prev!,
                        email: e.target.value
                      }))}
                      title="Email"
                    />
                  </div>
                  
                  <div className="student-manager-field">
                    <label className="student-manager-field__label">Program</label>
                    <input
                      type="text"
                      className="student-manager-field__input"
                      value={editStudent?.program || ''}
                      onChange={(e) => setEditStudent(prev => ({
                        ...prev!,
                        program: e.target.value
                      }))}
                      title="Program"
                    />
                  </div>
                </div>
              </div>

              <div className="student-manager-dialog__actions">
                <button 
                  className="student-manager-button student-manager-button--secondary"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className={`student-manager-button ${isCreateMode ? 'student-manager-button--success' : 'student-manager-button--primary'}`}
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : isCreateMode ? 'Create' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentManager;