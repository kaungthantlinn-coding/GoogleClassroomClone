export interface Course {
  id: string;
  courseId?: number;
  courseGuid?: string;
  name: string;
  section: string;
  teacherName: string;
  coverImage?: string;
  enrollmentCode: string;
  color?: string;
  textColor?: string;
  subject?: string;
  room?: string;
  isDefault?: boolean;
  avatar?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'teacher' | 'student';
}