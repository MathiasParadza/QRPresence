import { useState } from 'react';
import { Student, Course, Enrollment } from '@/types';

export interface EnrollmentManagerProps {
  course: Course;
  students: Student[];
  enrollments: Enrollment[];
  isLoading: boolean;
  selectedStudents: number[];
  onSelectStudents: (studentIds: number[]) => void;
  onEnroll: (studentIds: number[]) => Promise<void>;
  error?: string;
}



export const EnrollmentManager = ({ 
  course, 
  students,
  enrollments = [],
  onEnroll,
  isLoading = false,
  error
}: EnrollmentManagerProps) => {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [isLocalLoading, setLocalLoading] = useState(false);
  
  const loading = isLoading || isLocalLoading;

  const handleEnroll = async () => {
    try {
      setLocalLoading(true);
      await onEnroll(selectedStudents);
      setSelectedStudents([]);
    } catch (err) {
      console.error('Enrollment failed:', err);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => Number(option.value));
    setSelectedStudents(selectedOptions);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6" role="region" aria-label="Student enrollment">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-purple-800" id="enrollment-heading">
          Enroll Students in {course.title}
        </h2>
      </div>

      <div className="space-y-4" aria-labelledby="enrollment-heading">
        <div>
          <label htmlFor="student-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select Students
          </label>
          <select
            id="student-select"
            multiple
            value={selectedStudents.map(String)}
            onChange={handleSelectionChange}
            className="w-full border border-gray-300 rounded-lg p-2 h-40"
            aria-describedby="student-select-help"
            aria-multiselectable="true"
          >
            {students.map(student => (
              <option 
                key={student.id} 
                value={student.id}
                aria-label={`${student.name}, ${student.program}`}
              >
                {student.student_id} - {student.name} ({student.program})
              </option>
            ))}
          </select>
          <p id="student-select-help" className="text-sm text-gray-500 mt-1">
            Hold Ctrl/Cmd to select multiple students
          </p>
        </div>

        {enrollments.length > 0 && (
          <section aria-labelledby="enrolled-students-heading">
            <h3 id="enrolled-students-heading" className="font-medium text-gray-700 mb-2">
              Currently Enrolled
            </h3>
            <ul className="space-y-1">
              {enrollments.map(enrollment => (
                <li key={enrollment.id} className="text-sm text-gray-600">
                  {enrollment.student.name} ({enrollment.student.student_id})
                </li>
              ))}
            </ul>
          </section>
        )}

        {error && (
          <div role="alert" className="text-red-500 text-sm mt-2">
            {error}
          </div>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={handleEnroll}
            disabled={selectedStudents.length === 0 || loading}
            className={`w-full ${
              loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
            } text-white px-4 py-2 rounded-lg font-medium transition-colors`}
          >
            {`Enroll ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
          </button>
          {loading && (
            <span className="sr-only" aria-live="polite">Processing enrollment</span>
          )}
        </div>
      </div>
    </div>
  );
};