// src/types/user.ts

export interface BaseUser {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'lecturer' | 'admin';
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  date_joined?: string;
  last_login?: string;
}

export interface StudentProfile {
  student_id: number;
  name: string;
  email: string;
  program: string;
  user: User;
}
export interface LecturerProfile {
  lecturer_id: string;
  name: string;
  email: string;
  department: string;
  is_admin: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'lecturer' | 'admin';
  first_name?: string;
  last_name?: string;
} 
export interface UserProfile {
  id: number;
  bio?: string;
  location?: string;
  profile_picture?: string;
}

export interface Student extends BaseUser {
  role: 'student';
  profile: StudentProfile;
  // Or if using flat structure:
  student_id: string;
  name: string;
  program: string;
}
export interface Lecturer extends BaseUser {
  role: 'lecturer';
  profile: LecturerProfile;
  userprofile?: UserProfile;
}

export interface Admin extends BaseUser {
  role: 'admin';
  userprofile?: UserProfile;
}


export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}
// For API responses
export interface AuthTokens {
  access: string;
  refresh: string;
}

// For course enrollment
export interface Course {
  id: number;
  title: string;
  code: string;
  description: string;
  credit_hours: number;
  created_by: number; 
}

export interface Enrollment {
  id: number;
  student: Student;
  course: Course;
  enrolled_at: string;
  enrolled_by?: number;
}
// For attendance
export interface Session {
  id: number;
  session_id: string;
  class_name: string;
  lecturer: Lecturer;
  course: Course;
  gps_latitude: number;
  gps_longitude: number;
  allowed_radius: number;
  timestamp: string;
  attendance_window?: string;
}

export interface Attendance {
  id: number;
  student: Student;
  session: Session;
  status: 'Present' | 'Absent';
  check_in_time: string;
  check_out_time?: string;
  latitude?: number;
  longitude?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}