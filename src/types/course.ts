export interface Course {
  id: string;
  name: string;
  section: string;
  teacherName: string;
  coverImage?: string;
  enrollmentCode: string;
  color?: string;
  textColor?: string;
  subject?: string;
  room?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'teacher' | 'student';
}