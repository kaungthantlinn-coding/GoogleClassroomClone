import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { useStudentData, Student } from '../contexts/StudentDataContext';
import * as storageApi from '../api/storageApi';
import * as assignmentApi from '../api/assignmentApi';

interface StudentSubmission {
  id: string;
  studentName: string;
  studentId: string;
  submittedDate: string;
  gradedDate?: string;
  grade?: number;
  gradePercentage?: number;
  letterGrade?: string;
  feedback?: string;
  graded?: boolean;
  assignment: {
    id: string;
    title: string;
    className: string;
    section?: string;
    points: string;
  };
  attachedFiles: {
    name: string;
    type: string;
  }[];
}

// Helper function to get letter grade based on percentage
const getLetterGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

// Helper function to get color for grade
const getGradeColor = (letterGrade: string): string => {
  switch (letterGrade) {
    case 'A': return 'text-green-600';
    case 'B': return 'text-blue-600';
    case 'C': return 'text-yellow-600';
    case 'D': return 'text-orange-600';
    case 'F': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const StudentSubmissionPage: React.FC = () => {
  const { assignmentId, studentId } = useParams<{ assignmentId: string; studentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [submission, setSubmission] = useState<StudentSubmission | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [points, setPoints] = useState<string>('');
  const [sendEmail, setSendEmail] = useState<boolean>(false);
  const [showNoSubmission, setShowNoSubmission] = useState(false);
  
  // Get user role from sessionStorage only
  const userRole = sessionStorage.getItem('user_role');
  const isStudent = userRole?.toLowerCase() === 'student';
  const isTeacher = userRole?.toLowerCase() === 'teacher' || !isStudent; // Default to teacher if role not set
  
  // If the user is a student, redirect to their own submission page or show access denied
  useEffect(() => {
    if (isStudent) {
      // Get the current user ID from sessionStorage
      const currentUserId = sessionStorage.getItem('user_id');
      
      if (currentUserId && studentId && currentUserId !== studentId) {
        // If the student is trying to access another student's submission, show access denied
        console.log('Access denied: Student attempting to view another student\'s submission');
        setAccessDenied(true);
      } else if (!currentUserId) {
        // If no user ID is found, just show access denied
        console.log('Access denied: No user ID found for student');
        setAccessDenied(true);
      }
      // If the student is viewing their own submission, allow access
    }
  }, [isStudent, studentId]);
  
  // Extract class information from location state
  const pathMatch = location.pathname.match(/\/class\/([^/]+)/);
  const classIdFromPath = pathMatch ? pathMatch[1] : null;
  
  const classIdFromState = location.state?.classId;
  // Use only path or state for classId to avoid localStorage
  const classId = classIdFromPath || classIdFromState || null;
  
  // Class data state with default values
  const [classData, setClassData] = useState({
    className: location.state?.className || "Cloud",
    section: location.state?.section || "Batch 2"
  });
  
  // Get student data from context
  const { students } = useStudentData();
  const student = students?.find((s: Student) => s.id === studentId);
  
  // Load assignment and submission data
  useEffect(() => {
    const loadAssignmentData = async () => {
      if (!assignmentId) return;
      
      setLoading(true);
      
      try {
        // Default values for assignment data
        let assignmentTitle = location.state?.assignmentTitle || "Assignment";
        let assignmentPoints = "100";
        let className = classData.className;
        let section = classData.section;
        
        try {
          // Fetch assignment data from API using assignmentApi
          const assignmentData = await assignmentApi.getAssignment(assignmentId);
          if (assignmentData) {
            assignmentTitle = assignmentData.title || assignmentTitle;
            assignmentPoints = assignmentData.points || assignmentPoints;
            
            // Use assignment class info if available
            if (assignmentData.className) {
              className = assignmentData.className;
              section = assignmentData.section || section;
            }
          }
        } catch (error) {
          console.error('Error loading assignment data:', error);
        }
        
        // Use class data from API if classId is available
        if (classId) {
          try {
            const classData = await storageApi.getClassData(classId);
            if (classData) {
              className = classData.name || classData.className || className;
              section = classData.section || section;
            }
          } catch (classError) {
            console.error('Error loading class data from API:', classError);
          }
        }
        
        setClassData({
          className,
          section
        });
        
        // Now load the student submission from the API
        await loadStudentSubmission(className, section, assignmentTitle, assignmentPoints);
        
      } catch (error) {
        console.error('Error loading assignment data:', error);
        setLoading(false);
      }
    };
    
    // Function to load the student submission from API
    const loadStudentSubmission = async (className: string, section: string, 
                                        assignmentTitle: string, assignmentPoints: string) => {
      try {
        if (!assignmentId) {
          console.error('Assignment ID is required');
          setLoading(false);
          return;
        }
        
        // Get submission data from API - first get all submissions for this assignment
        const submissionsData = await assignmentApi.getSubmissions(assignmentId);
        console.log('API submissions for assignment:', submissionsData);
        
        // Find the specific student submission
        const apiSubmission = submissionsData.find((sub: any) => 
          sub.userId?.toString() === studentId || sub.submissionId?.toString() === location.state?.submissionId
        );
        
        console.log('Found student submission from API:', apiSubmission);
        
        if (apiSubmission) {
          // Get student data from context or create default
          const studentData = student || {
            id: apiSubmission.userId?.toString() || studentId || 'unknown',
            name: apiSubmission.userName || 'Unknown Student'
          };
          
          // Create a combined submission object with API data
          const submissionData: StudentSubmission = {
            id: apiSubmission.submissionId?.toString() || 'unknown',
            studentName: apiSubmission.userName || studentData.name,
            studentId: apiSubmission.userId?.toString() || studentData.id,
            submittedDate: apiSubmission.submittedAt || '',
            gradedDate: apiSubmission.gradedDate || '',
            grade: apiSubmission.grade,
            feedback: apiSubmission.feedback || '',
            graded: apiSubmission.graded || false,
            assignment: {
              id: assignmentId,
              title: assignmentTitle || 'Assignment',
              className,
              section,
              points: assignmentPoints
            },
            attachedFiles: apiSubmission.files || [{
              name: 'assignment.pdf',
              type: 'application/pdf'
            }]
          };
          
          // Calculate grade percentage and letter grade
          if (submissionData.grade !== undefined && assignmentPoints) {
            const pointsPossible = parseInt(assignmentPoints);
            if (!isNaN(pointsPossible) && pointsPossible > 0) {
              const percentage = Math.round((submissionData.grade / pointsPossible) * 100);
              submissionData.gradePercentage = percentage;
              submissionData.letterGrade = getLetterGrade(percentage);
            }
          }
          
          console.log('Created submission data object:', submissionData);
          setSubmission(submissionData);
          setFeedback(submissionData.feedback || '');
          
          // Update form state when submission has grade data
          if (submissionData.grade) {
            setPoints(submissionData.grade.toString());
          }
          
        } else {
          // Create an empty submission if none found
          console.log('No submission found for student, creating empty record');
          
          // After a delay, show the no submission message
          setTimeout(() => setShowNoSubmission(true), 1000);
          
          setSubmission({
            id: `submission-${Date.now()}`,
            studentName: student?.name || 'Unknown Student',
            studentId: studentId || 'unknown',
            submittedDate: '',
            graded: false,
            assignment: {
              id: assignmentId,
              title: assignmentTitle || 'Assignment',
              className,
              section,
              points: assignmentPoints
            },
            attachedFiles: []
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading student submission:', error);
        setLoading(false);
      }
    };
    
    // Load data when component mounts
    if (assignmentId && studentId) {
      loadAssignmentData();
    }
  }, [assignmentId, studentId, student, classId, location.state]);
  
  // Handle navigation back to submissions list
  const handleBackToSubmissions = useCallback(() => {
    if (classId) {
      navigate(`/class/${classId}/submissions/${assignmentId}`, {
        state: {
          classId,
          className: classData.className,
          section: classData.section,
          assignmentTitle: submission?.assignment?.title
        }
      });
    } else {
      navigate(`/submissions/${assignmentId}`, {
        state: {
          className: classData.className,
          section: classData.section,
          assignmentTitle: submission?.assignment?.title
        }
      });
    }
  }, [navigate, assignmentId, classId, classData, submission]);
  
  // Handle grade submission
  const handleSubmitGrade = useCallback(async () => {
    if (!submission) return;
    
    const pointsNum = parseFloat(points);
    if (isNaN(pointsNum)) {
      // Show error message
      return;
    }
    
    const maxPoints = parseFloat(submission.assignment.points);
    
    try {
      setLoading(true);
      
      // Create grade data object
      const gradeData = {
        submissionId: submission.id,
        grade: pointsNum,
        feedback: feedback,
        gradedDate: new Date().toISOString(),
        graded: true,
        sendEmail
      };
      
      // Call API to grade the submission
      try {
        await assignmentApi.gradeSubmission(submission.id, gradeData);
      } catch (apiError) {
        console.error('API error grading submission:', apiError);
      }
      
      // Update local submission data
      const updatedSubmission = {
        ...submission,
        grade: pointsNum,
        graded: true,
        gradedDate: new Date().toLocaleString('en-US'),
        feedback,
        gradePercentage: maxPoints > 0 ? Math.round((pointsNum / maxPoints) * 100) : undefined
      };
      
      if (updatedSubmission.gradePercentage) {
        updatedSubmission.letterGrade = getLetterGrade(updatedSubmission.gradePercentage);
      }
      
      setSubmission(updatedSubmission);
      
      // Success message
      console.log('Grade submitted successfully');
      
      setLoading(false);
      
      // Optional: Go back to submissions list
      if (sendEmail) {
        setTimeout(() => {
          handleBackToSubmissions();
        }, 1500);
      }
    } catch (error) {
      console.error('Error submitting grade:', error);
      setLoading(false);
    }
  }, [submission, points, feedback, sendEmail, handleBackToSubmissions]);
  
  // Handle file download
  const handleFileDownload = useCallback((fileName: string) => {
    // In a real implementation, this would download the actual file
    console.log(`Downloading file: ${fileName}`);
    // Mock download for demo
    const a = document.createElement('a');
    a.href = '#';
    a.download = fileName;
    a.click();
  }, []);
  
  // Render access denied message
  if (accessDenied) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-300 rounded-lg p-6 flex flex-col items-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h1>
          <p className="text-red-600 mb-4 text-center">
            You do not have permission to view this submission.
          </p>
          <Button
            onClick={() => navigate(-1)}
            className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // Render no submission message
  if (showNoSubmission && !submission?.submittedDate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4 flex items-center">
          <Button 
            onClick={handleBackToSubmissions}
            variant="outline"
            className="flex items-center gap-1 mr-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Submissions
          </Button>
          <h1 className="text-xl font-semibold">
            {student?.name || 'Student'}'s Submission
          </h1>
        </div>
        
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-6 flex flex-col items-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-bold text-amber-700 mb-2">No Submission Found</h2>
          <p className="text-amber-600 mb-4 text-center">
            This student has not submitted any work for this assignment yet.
          </p>
          <Button
            onClick={handleBackToSubmissions}
            className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Submissions
          </Button>
        </div>
      </div>
    );
  }
  
  // Render submission details
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with back button and title */}
      <div className="mb-6 flex items-center gap-4">
        <Button 
          onClick={handleBackToSubmissions}
          variant="outline"
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Submissions
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{submission?.studentName}'s Submission</h1>
          <p className="text-sm text-gray-500">
            {submission?.assignment?.title} • {submission?.assignment?.className}
            {submission?.assignment?.section && ` • ${submission?.assignment?.section}`}
          </p>
        </div>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Student submission */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                <CheckCircle className="h-4 w-4 text-blue-700" />
              </div>
              Submission Details
            </h2>
            
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="font-medium">
                  {submission?.submittedDate 
                    ? new Date(submission.submittedDate).toLocaleString('en-US') 
                    : 'Not submitted'}
                </p>
              </div>
              {submission?.graded && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Graded</p>
                  <p className="font-medium">
                    {submission?.gradedDate 
                      ? new Date(submission.gradedDate).toLocaleString('en-US') 
                      : 'Not graded'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Attached Files */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Attached Files:</p>
              {submission?.attachedFiles && submission.attachedFiles.length > 0 ? (
                <div className="space-y-2">
                  {submission.attachedFiles.map((file, index) => (
                    <div key={index} className="bg-gray-50 rounded p-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-gray-200 w-8 h-8 flex items-center justify-center rounded mr-3">
                          <span className="text-gray-600 text-xs">📄</span>
                        </div>
                        <span className="text-sm font-medium">{file.name}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleFileDownload(file.name)}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No files attached</p>
              )}
            </div>
            
            {/* Student comment */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Student Comment:</p>
              <div className="bg-gray-50 rounded p-4 min-h-[100px]">
                <p className="text-sm text-gray-700">
                  {submission?.feedback || 'No comment provided.'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right column - Grading (for teachers) */}
        {isTeacher && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Grade Submission</h2>
              
              {/* Grade input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points
                </label>
                <div className="flex items-center">
                  <Input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    placeholder="0"
                    min="0"
                    max={submission?.assignment?.points}
                    className="w-20 mr-2"
                  />
                  <span className="text-sm text-gray-500">
                    / {submission?.assignment?.points}
                  </span>
                </div>
              </div>
              
              {/* Feedback input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback
                </label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback to the student..."
                  className="min-h-[100px]"
                />
              </div>
              
              {/* Email notification option */}
              <div className="flex items-center mb-6">
                <Switch
                  id="email-notification"
                  checked={sendEmail}
                  onCheckedChange={setSendEmail}
                  className="mr-2"
                />
                <label 
                  htmlFor="email-notification" 
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Notify student by email
                </label>
              </div>
              
              {/* Submit button */}
              <Button
                onClick={handleSubmitGrade}
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Grade'}
              </Button>
            </div>
            
            {/* Current grade display */}
            {submission?.graded && (
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Current Grade</h2>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-1">
                      {submission.grade} / {submission.assignment.points}
                    </div>
                    {submission.gradePercentage && (
                      <div className="flex items-center justify-center gap-2">
                        <span className={`text-xl font-semibold ${getGradeColor(submission.letterGrade || '')}`}>
                          {submission.letterGrade}
                        </span>
                        <span className="text-gray-500">
                          ({submission.gradePercentage}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSubmissionPage;
