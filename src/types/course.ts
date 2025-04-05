export interface Course {
  id: string;
  name: string;
  section: string;
  teacherName: string;
  coverImage?: string;
  enrollmentCode: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'teacher' | 'student';
}