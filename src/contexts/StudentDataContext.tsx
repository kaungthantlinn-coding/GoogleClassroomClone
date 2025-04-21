import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Student {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  assignmentAvg?: string;
  participation?: string;
  finalGrade?: string;
  finalGradeColor?: string;
}

interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  status: 'submitted' | 'late' | 'missing' | 'graded';
  submittedDate?: string;
  grade?: number;
  letterGrade?: string;
  gradePercentage?: number;
  feedback?: string;
}

interface StudentDataContextType {
  students: Student[];
  submissions: Submission[];
  addStudent: (student: Student) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  removeStudent: (id: string) => void;
  updateSubmission: (submissionId: string, data: Partial<Submission>) => void;
  getStudentById: (id: string) => Student | undefined;
  getSubmissionsByStudentId: (studentId: string) => Submission[];
  syncGradeData: () => void;
}

const StudentDataContext = createContext<StudentDataContextType | undefined>(undefined);

export const useStudentData = () => {
  const context = useContext(StudentDataContext);
  if (context === undefined) {
    throw new Error('useStudentData must be used within a StudentDataProvider');
  }
  return context;
};

interface StudentDataProviderProps {
  children: ReactNode;
}

export const StudentDataProvider: React.FC<StudentDataProviderProps> = ({ children }) => {
  // Initialize students from localStorage or with default data
  const [students, setStudents] = useState<Student[]>(() => {
    const savedStudents = localStorage.getItem('students');
    if (savedStudents) {
      try {
        return JSON.parse(savedStudents);
      } catch (e) {
        console.error('Error parsing saved students', e);
      }
    }
    
    // Default students if none in localStorage
    return [
      {
        id: '1001',
        name: 'Alice Smith',
        email: 'alice.smith@example.com',
        assignmentAvg: '91.3%',
        participation: '95%',
        finalGrade: '92%',
        finalGradeColor: 'text-green-600'
      },
      {
        id: '1002',
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        assignmentAvg: '83.3%',
        participation: '90%',
        finalGrade: '84%',
        finalGradeColor: 'text-blue-600'
      },
      {
        id: '1003',
        name: 'Charlie Davis',
        email: 'charlie.davis@example.com',
        assignmentAvg: '78.8%',
        participation: '85%',
        finalGrade: '80%',
        finalGradeColor: 'text-blue-600'
      },
      {
        id: '1004',
        name: 'Diana Wilson',
        email: 'diana.wilson@example.com',
        assignmentAvg: '0%',
        participation: '0%',
        finalGrade: '0%',
        finalGradeColor: 'text-red-600'
      }
    ];
  });

  // Initialize submissions from localStorage or with default data
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const savedSubmissions = localStorage.getItem('submissions');
    if (savedSubmissions) {
      try {
        return JSON.parse(savedSubmissions);
      } catch (e) {
        console.error('Error parsing saved submissions', e);
      }
    }
    
    // Default submissions if none in localStorage
    return [
      {
        id: 'sub-1001',
        studentName: 'Alice Smith',
        studentId: '1001',
        status: 'submitted',
        submittedDate: 'June 12th, 2023 10:00 PM'
      },
      {
        id: 'sub-1002',
        studentName: 'Bob Johnson',
        studentId: '1002',
        status: 'late',
        submittedDate: 'June 17th, 2023 09:30 PM'
      },
      {
        id: 'sub-1003',
        studentName: 'Charlie Davis',
        studentId: '1003',
        status: 'graded',
        submittedDate: 'June 10th, 2023 08:15 PM',
        grade: 100,
        letterGrade: 'A',
        gradePercentage: 100
      },
      {
        id: 'sub-1004',
        studentName: 'Diana Wilson',
        studentId: '1004',
        status: 'missing'
      }
    ];
  });

  // Save students to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('students', JSON.stringify(students));
  }, [students]);

  // Save submissions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('submissions', JSON.stringify(submissions));
  }, [submissions]);

  // Listen for grade updates from StudentSubmissionPage
  useEffect(() => {
    const handleGradeUpdate = () => {
      const gradedSubmissionJson = localStorage.getItem('gradedSubmission');
      if (gradedSubmissionJson) {
        try {
          const gradedSubmission = JSON.parse(gradedSubmissionJson);
          
          // Update the submissions list with graded submission
          setSubmissions(prevSubmissions =>
            prevSubmissions.map(sub =>
              sub.id === gradedSubmission.id ?
              {
                ...sub,
                status: 'graded',
                grade: gradedSubmission.grade,
                letterGrade: gradedSubmission.letterGrade,
                gradePercentage: gradedSubmission.gradePercentage
              } :
              sub
            )
          );
          
          // Also update the student's grade data
          syncGradeData();
          
          // Remove the temporary storage
          localStorage.removeItem('gradedSubmission');
        } catch (e) {
          console.error('Error parsing graded submission', e);
        }
      }
    };

    // Check for graded submissions when component mounts
    handleGradeUpdate();

    // Listen for the custom event that signals a new assignment was created or updated
    window.addEventListener('newAssignmentCreated', handleGradeUpdate);
    
    return () => {
      window.removeEventListener('newAssignmentCreated', handleGradeUpdate);
    };
  }, []);

  // Add a new student
  const addStudent = (student: Student) => {
    setStudents(prevStudents => [...prevStudents, student]);
    
    // Create an empty submission for this student for all existing assignments
    // This is a simplified approach - in a real app, you'd need to create submissions for each assignment
    const newSubmission: Submission = {
      id: `sub-${student.id}-${Date.now()}`,
      studentName: student.name,
      studentId: student.id,
      status: 'missing'
    };
    
    setSubmissions(prevSubmissions => [...prevSubmissions, newSubmission]);
    
    // Dispatch event to notify other components
    const newStudentEvent = new CustomEvent('studentDataUpdated', {
      detail: { type: 'add', studentId: student.id }
    });
    window.dispatchEvent(newStudentEvent);
  };

  // Update an existing student
  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.id === id ? { ...student, ...data } : student
      )
    );
    
    // If the student's name was updated, update it in all their submissions too
    if (data.name) {
      setSubmissions(prevSubmissions =>
        prevSubmissions.map(submission =>
          submission.studentId === id ? { ...submission, studentName: data.name as string } : submission
        )
      );
    }
    
    // Dispatch event to notify other components
    const updateStudentEvent = new CustomEvent('studentDataUpdated', {
      detail: { type: 'update', studentId: id }
    });
    window.dispatchEvent(updateStudentEvent);
  };

  // Remove a student
  const removeStudent = (id: string) => {
    setStudents(prevStudents => prevStudents.filter(student => student.id !== id));
    
    // Also remove all submissions from this student
    setSubmissions(prevSubmissions => prevSubmissions.filter(submission => submission.studentId !== id));
    
    // Dispatch event to notify other components
    const removeStudentEvent = new CustomEvent('studentDataUpdated', {
      detail: { type: 'remove', studentId: id }
    });
    window.dispatchEvent(removeStudentEvent);
  };

  // Update a submission
  const updateSubmission = (submissionId: string, data: Partial<Submission>) => {
    setSubmissions(prevSubmissions =>
      prevSubmissions.map(submission =>
        submission.id === submissionId ? { ...submission, ...data } : submission
      )
    );
    
    // If this is a grade update, sync with student data
    if (data.grade !== undefined || data.status === 'graded') {
      syncGradeData();
    }
    
    // Dispatch event to notify other components
    const updateSubmissionEvent = new CustomEvent('submissionUpdated', {
      detail: { submissionId }
    });
    window.dispatchEvent(updateSubmissionEvent);
  };

  // Get a student by ID
  const getStudentById = (id: string) => {
    return students.find(student => student.id === id);
  };

  // Get all submissions for a student
  const getSubmissionsByStudentId = (studentId: string) => {
    return submissions.filter(submission => submission.studentId === studentId);
  };

  // Sync grades between submissions and student data
  const syncGradeData = () => {
    // For each student, calculate their average grade from all submissions
    const updatedStudents = students.map(student => {
      const studentSubmissions = submissions.filter(sub => sub.studentId === student.id);
      const gradedSubmissions = studentSubmissions.filter(sub => sub.status === 'graded' && sub.grade !== undefined);
      
      // If the student has no graded submissions, return the student unchanged
      if (gradedSubmissions.length === 0) {
        return student;
      }
      
      // Calculate average grade
      const totalPoints = gradedSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0);
      const avgGrade = totalPoints / gradedSubmissions.length;
      const avgPercentage = (avgGrade).toFixed(1) + '%';
      
      // Determine grade color based on average
      let finalGradeColor = 'text-red-600';
      if (avgGrade >= 90) finalGradeColor = 'text-green-600';
      else if (avgGrade >= 80) finalGradeColor = 'text-blue-600';
      else if (avgGrade >= 70) finalGradeColor = 'text-yellow-600';
      else if (avgGrade >= 60) finalGradeColor = 'text-orange-600';
      
      // Update the student with new grade data
      return {
        ...student,
        assignmentAvg: avgPercentage,
        finalGrade: avgPercentage,
        finalGradeColor
      };
    });
    
    setStudents(updatedStudents);
    
    // Dispatch event to notify other components about the grade update
    const gradeUpdateEvent = new CustomEvent('gradesUpdated');
    window.dispatchEvent(gradeUpdateEvent);
  };

  const value = {
    students,
    submissions,
    addStudent,
    updateStudent,
    removeStudent,
    updateSubmission,
    getStudentById,
    getSubmissionsByStudentId,
    syncGradeData
  };

  return (
    <StudentDataContext.Provider value={value}>
      {children}
    </StudentDataContext.Provider>
  );
};

export type { Student, Submission };

export default StudentDataContext;