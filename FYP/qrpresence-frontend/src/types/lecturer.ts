export interface AttendanceRecord {
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
  check_out_time: string | null;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface Course {
  id: number;
  code: string;
  title: string;
  description: string;
  credit_hours: number;
  created_by: number;
}

export interface Student {
  id: number;
  student_id: string;
  name: string;
  program: string;
}

export interface Enrollment {
  id: number;
  student: Student;
  course: Course;
  enrolled_at: string;
}

export type CourseFormData = Omit<Course, 'id' | 'created_by'>;