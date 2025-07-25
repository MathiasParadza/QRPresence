import { useState } from 'react';
import { Course } from '@/types';

export interface CourseManagementProps {
  courses: Course[];
  isLoading: boolean;
  onCreateCourse: (courseData: Omit<Course, 'id' | 'created_by'>) => Promise<void>;
  onSelectCourse: (courseId: number | null) => void;
  showCourseModal: boolean;
  courseForm: {
    code: string;
    title: string;
    description: string;
    credit_hours: number;
  };
  setCourseForm: React.Dispatch<React.SetStateAction<{
    code: string;
    title: string;
    description: string;
    credit_hours: number;
  }>>;
  setShowCourseModal: React.Dispatch<React.SetStateAction<boolean>>;
}
interface CourseFormState {
  code: string;
  title: string;
  description: string;
  credit_hours: number;
}

export const CourseManagement = ({ 
  courses, 
  onCreateCourse,
  onSelectCourse,
  isLoading = false
}: CourseManagementProps) => {
  const [showModal, setShowModal] = useState(false);
  const [courseForm, setCourseForm] = useState<CourseFormState>({
    code: '',
    title: '',
    description: '',
    credit_hours: 3
  });
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!courseForm.code || !courseForm.title) {
      setError('Course code and title are required');
      return;
    }

    try {
      setError(null);
      await onCreateCourse(courseForm);
      setShowModal(false);
      setCourseForm({
        code: '',
        title: '',
        description: '',
        credit_hours: 3
      });
    } catch (err) {
      setError('Failed to create course. Please try again.');
      console.error('Course creation error:', err);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCourseForm(prev => ({
      ...prev,
      [name]: name === 'credit_hours' ? Number(value) : value
    }));
  };

  return (
    <div className="space-y-8">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold text-purple-800">Your Courses</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            aria-label="Create new course"
          >
            + Create Course
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading courses...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
              <article 
                key={course.id} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h2 className="font-bold text-lg">{course.code} - {course.title}</h2>
                <p className="text-gray-600 text-sm mt-1">{course.credit_hours} credit hours</p>
                <p className="text-gray-500 text-sm mt-2 line-clamp-2">{course.description}</p>
                <button
                  onClick={() => onSelectCourse(course.id)}
                  className="mt-3 w-full bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 rounded text-sm transition-colors"
                  aria-label={`Manage students for ${course.code}`}
                >
                  Manage Students
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Course Creation Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 id="modal-title" className="text-lg font-semibold">Create New Course</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="course-code" className="block text-sm font-medium text-gray-700 mb-1">
                  Course Code*
                </label>
                <input
                  id="course-code"
                  type="text"
                  name="code"
                  placeholder="CS101"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={courseForm.code}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="course-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Course Title*
                </label>
                <input
                  id="course-title"
                  type="text"
                  name="title"
                  placeholder="Introduction to Computer Science"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={courseForm.title}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="course-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="course-description"
                  name="description"
                  placeholder="Course description"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  value={courseForm.description}
                  onChange={handleFormChange}
                />
              </div>

              <div>
                <label htmlFor="credit-hours" className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Hours
                </label>
                <input
                  id="credit-hours"
                  type="number"
                  name="credit_hours"
                  min="1"
                  max="6"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={courseForm.credit_hours}
                  onChange={handleFormChange}
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isLoading || !courseForm.code || !courseForm.title}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300"
              >
                {isLoading ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};