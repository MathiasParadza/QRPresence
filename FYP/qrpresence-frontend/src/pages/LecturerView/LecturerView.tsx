import React, { useEffect, useState } from 'react';
import { useLocation} from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActionCards } from './ActionCards';
import { CourseManagement } from './CourseManagement';
import { EnrollmentManager } from './EnrollmentManager';
import { QrCodeSection } from './QrCodeSection';
import AttendanceStats from './AttendanceStats';
import { fetchWithAuth } from '@/lib/api'; 
import { toast } from 'react-toastify';

interface Course {
  id: number;
  code: string;
  title: string;
  description: string;
  credit_hours: number;
  created_by: number;
}

interface Student {
  id: number;
  student_id: string;
  name: string;
  program: string;
}

interface Enrollment {
  id: number;
  student: Student;
  course: Course;
  enrolled_at: string;
}

interface AttendanceRecord {
  id: number;
  student?: {
    student_id?: string;
    user?: {
      username?: string;
    };
  };
  session?: {
    class_name?: string;
  };
  status: string;
  check_in_time: string;
  check_out_time?: string;
}

const BASE_URL = import.meta.env.REACT_APP_BASE_URL || 'http://localhost:8000';

const LecturerView = () => {
  const location = useLocation();
  
  // State management
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodes, setQrCodes] = useState<string[]>([]);
  const [attendanceReport, setAttendanceReport] = useState<AttendanceRecord[]>([]);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [aiQuery, setAiQuery] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [courseForm, setCourseForm] = useState({
    code: '',
    title: '',
    description: '',
    credit_hours: 3
  });
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  // Fetch QR codes
  useEffect(() => {
    const fetchQrCodes = async () => {
      try {
        const data = await fetchWithAuth('/api/qr-codes/') as unknown as { qr_codes: string[] };
        setQrCodes(data?.qr_codes || []);
        if (!qrCodeUrl && data?.qr_codes?.length) {
          setQrCodeUrl(data.qr_codes[0]);
        }
      } catch (err) {
        console.error('Failed to load QR codes', err);
      }
    };

    fetchQrCodes();
  }, [qrCodeUrl]);

  // Set QR code from location state
  useEffect(() => {
    if (location.state?.qrCodeUrl) {
      setQrCodeUrl(location.state.qrCodeUrl);
    }
  }, [location.state]);

  const handleLogout = React.useCallback(() => {
    localStorage.removeItem('access_token'); 
    window.location.href = '/login'; 
  }, []);


  // Fetch attendance records
  const fetchAttendanceRecord = React.useCallback(async () => {
    setLoadingReport(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const data = await fetchWithAuth(`/api/lecturer/lecturer-attendance/?${queryParams}`);
      // If response has 'results' and 'count', use them; otherwise, treat as array
      if (data && typeof data === 'object' && 'results' in data && 'count' in data) {
        setAttendanceReport(data.results as AttendanceRecord[]);
        setTotalPages(Math.ceil((data.count as number) / 10));
      } else if (Array.isArray(data)) {
        setAttendanceReport(data);
        setTotalPages(Math.ceil(data.length / 10));
      } else {
        setAttendanceReport([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
      setError('Failed to load attendance data');
      if (err instanceof Error && err.message === 'Unauthorized') {
        handleLogout();
      }
    } finally {
      setLoadingReport(false);
    }
  }, [currentPage, searchTerm, statusFilter, handleLogout]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingCourses(true);
        const [coursesData, studentsData] = await Promise.all([
          fetchWithAuth('/api/lecturer/courses/'),
          fetchWithAuth('/api/students/')
        ]);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
        setStudents(Array.isArray(studentsData) ? studentsData : []);
      } catch (error) {
        console.error('Failed to fetch initial data', error);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAttendanceRecord();
  }, [fetchAttendanceRecord]);

  // Fetch enrollments when course is selected
  useEffect(() => {
    const fetchCourseEnrollments = async () => {
      if (!selectedCourse) return;
      
      setLoadingEnrollments(true);
      try {
        const queryParams = new URLSearchParams({ course_id: selectedCourse.toString() });
        const data = await fetchWithAuth(`/api/lecturer/enrollments/?${queryParams}`);
        setEnrollments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch enrollments', error);
      } finally {
        setLoadingEnrollments(false);
      }
    };

    fetchCourseEnrollments();
  }, [selectedCourse]);

  const handleAIQuery = async () => {
    if (!aiQuery.trim()) return;
    
    setAiLoading(true);
    setAiResponse('');
    try {
      const data = await fetchWithAuth('/api/ai-chat/', {
        method: 'POST',
        body: JSON.stringify({ query: aiQuery })
      }) as { response?: string };
      setAiResponse(data?.response || 'No response');
    } catch {
      setAiResponse('Error getting insights.');
    } finally {
      setAiLoading(false);
    }
  };
const handleCreateCourse = async (courseData: {
  code: string;
  title: string;
  description: string;
  credit_hours: number;
}): Promise<void> => {
  try {
    // Format the code to ensure consistency (uppercase, no spaces)
    const formattedCode = courseData.code.trim().toUpperCase().replace(/\s+/g, '');

    const token = localStorage.getItem('access_token');
    const response = await fetch(`${BASE_URL}/api/lecturer/courses/create/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: formattedCode, // Use formatted code
        title: courseData.title.trim(),
        description: courseData.description.trim(),
        credit_hours: Number(courseData.credit_hours) // Ensure it's a number
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Handle specific field errors
      if (errorData.code) {
        throw new Error(`Course Code: ${errorData.code.join(', ')}`);
      }
      if (errorData.title) {
        throw new Error(`Title: ${errorData.title.join(', ')}`);
      }
      throw new Error(errorData.detail || 'Failed to create course');
    }

    const data = await response.json();
    setCourses(prev => [...prev, data]);
    setShowCourseModal(false);
    setCourseForm({
      code: '',
      title: '',
      description: '',
      credit_hours: 3
    });
    toast.success('Course created successfully!');
  } catch (error) {
    console.error('Failed to create course', error);
    toast.error(
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message?: string }).message || 'Failed to create course'
        : 'Failed to create course'
    );
    throw error;
  }
};
  const handleEnrollStudents = async (studentIds: number[]): Promise<void> => {
    if (!selectedCourse) return;
    
    setLoadingEnrollments(true);
    try {
      const data = await fetchWithAuth(`/api/lecturer/enrollments/${selectedCourse}/enroll/`, {
        method: 'POST',
        body: JSON.stringify({ student_ids: studentIds })
      });
      setEnrollments(Array.isArray(data) ? data : []);
      setSelectedStudents([]);
      fetchAttendanceRecord();
    } catch (error) {
      console.error('Failed to enroll students', error);
      throw error;
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const exportCsv = () => {
    const query = new URLSearchParams();
    if (searchTerm) query.append('search', searchTerm);
    if (statusFilter) query.append('status', statusFilter);

    window.open(`${BASE_URL}/api/lecturer/lecturer-attendance/export-csv/?${query.toString()}`, '_blank');
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'attendance_qr.png';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl font-bold text-purple-700">Lecturer Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* AI Chat Box */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold text-purple-700 mb-4">AI Attendance Insights</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <input
              type="text"
              placeholder="Ask a question about attendance..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
            />
            <button
              onClick={handleAIQuery}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
              disabled={aiLoading}
            >
              {aiLoading ? 'Thinking...' : 'Ask AI'}
            </button>
          </div>
          {aiResponse && (
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 whitespace-pre-wrap">
              {aiResponse}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <Tabs defaultValue="actions" className="w-full">
            <TabsList className="grid grid-cols-4 gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 mb-8">
              <TabsTrigger
                value="actions"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white bg-white text-gray-700 hover:bg-gray-100 transition-all duration-200 rounded-lg py-3 font-medium"
              >
                Actions
              </TabsTrigger>
              <TabsTrigger
                value="courses"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white bg-white text-gray-700 hover:bg-gray-100 transition-all duration-200 rounded-lg py-3 font-medium"
              >
                Courses
              </TabsTrigger>
              <TabsTrigger
                value="qrcode"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white bg-white text-gray-700 hover:bg-gray-100 transition-all duration-200 rounded-lg py-3 font-medium"
              >
                QR Codes
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white bg-white text-gray-700 hover:bg-gray-100 transition-all duration-200 rounded-lg py-3 font-medium"
              >
                Statistics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="actions">
             <ActionCards />
            </TabsContent>
            
            <TabsContent value="courses">
              <CourseManagement 
                courses={courses}
                isLoading={loadingCourses}
                onCreateCourse={handleCreateCourse}
                onSelectCourse={setSelectedCourse}
                showCourseModal={showCourseModal}
                setShowCourseModal={setShowCourseModal}
                courseForm={courseForm}
                setCourseForm={setCourseForm}
              />
              {selectedCourse && (
                <EnrollmentManager
                  course={courses.find(c => c.id === selectedCourse)!}
                  students={students}
                  enrollments={enrollments}
                  isLoading={loadingEnrollments}
                  selectedStudents={selectedStudents}
                  onSelectStudents={setSelectedStudents}
                  onEnroll={handleEnrollStudents}
                />
              )}
            </TabsContent>
            
            <TabsContent value="qrcode">
              <QrCodeSection 
                qrCodes={qrCodes}
                qrCodeUrl={qrCodeUrl}
                onDownload={downloadQRCode}
              />
            </TabsContent>
            
            <TabsContent value="stats">
              <AttendanceStats 
                attendanceReport={attendanceReport}
                loading={loadingReport}
                error={error}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                currentPage={currentPage}
                totalPages={totalPages}
                onSearchChange={setSearchTerm}
                onStatusFilterChange={setStatusFilter}
                onPageChange={setCurrentPage}
                onExport={exportCsv}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LecturerView;