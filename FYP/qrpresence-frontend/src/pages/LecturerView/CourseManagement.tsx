import React, { useEffect, useState } from 'react';

interface Course {
  id: number;
  title: string;
  code: string;
  description: string;
  credit_hours: number;
}

interface ApiError {
  detail?: string;
  error?: string;
  message?: string;
  status_code?: number;
}

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    credit_hours: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lecturer/courses/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData: ApiError = await res.json();
        throw {
          status: res.status,
          ...errorData
        };
      }

      const data: Course[] = await res.json();
      setCourses(data);
      setSuccess('Courses loaded successfully');
    } catch (err: unknown) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (err: unknown) => {
    if (typeof err === 'object' && err !== null) {
      const errorObj = err as ApiError & { status?: number };
      if (errorObj.status === 401) {
        setError({
          detail: 'Authentication failed. Please login again.',
          status_code: 401
        });
      } else if (errorObj.detail || errorObj.error) {
        setError(errorObj);
      } else if (errorObj.message) {
        setError({ detail: errorObj.message });
      } else {
        setError({ detail: 'An unexpected error occurred' });
      }
    } else {
      setError({ detail: 'An unexpected error occurred' });
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/lecturer/courses/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          credit_hours: Number(formData.credit_hours),
        }),
      });

      if (!res.ok) {
        const errorData: ApiError = await res.json();
        throw {
          status: res.status,
          ...errorData
        };
      }

      const data: Course = await res.json();
      setCourses(prev => [...prev, data]);
      setFormData({ title: '', code: '', description: '', credit_hours: '' });
      setSuccess('Course created successfully!');
    } catch (err: unknown) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const formatError = (error: ApiError | null) => {
    if (!error) return null;
    
    if (error.detail) return error.detail;
    if (error.error) return error.error;
    if (error.message) return error.message;
    
    return 'An unknown error occurred';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Course Management</h1>

      {/* Create Course Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-8 bg-white shadow p-4 rounded">
        <h2 className="text-xl font-semibold">Create New Course</h2>
        
        <div>
          <label className="block font-medium">Title</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            placeholder="Enter course name"
          />
        </div>
        
        <div>
          <label className="block font-medium">Code</label>
          <input
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            placeholder="Enter course code"
          />
        </div>
        
        <div>
          <label className="block font-medium">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            placeholder="Enter course description"
            rows={3}
          />
        </div>
        
        <div>
          <label className="block font-medium">Credit Hours</label>
          <input
            name="credit_hours"
            type="number"
            min={1}
            value={formData.credit_hours}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            placeholder="Enter credit hours"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:bg-blue-400"
        >
          {loading ? 'Creating...' : 'Add Course'}
        </button>
        
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {formatError(error)}
            {error.status_code && ` (Status: ${error.status_code})`}
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
      </form>

      {/* Course List */}
      <div className="bg-white shadow p-4 rounded">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Courses</h2>
          <button 
            onClick={fetchCourses} 
            disabled={loading}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
        
        {loading && courses.length === 0 ? (
          <div className="text-center py-8">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-8">No courses found.</div>
        ) : (
          <div className="space-y-3">
            {courses.map(course => (
              <div key={course.id} className="border p-4 rounded hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold">
                      {course.title} <span className="text-blue-600">({course.code})</span>
                    </h3>
                    <p className="text-gray-700 mt-1">{course.description}</p>
                  </div>
                  <span className="bg-gray-200 px-2 py-1 rounded text-sm">
                    {course.credit_hours} credit hour{course.credit_hours !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagement;