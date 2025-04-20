import React, { useState, useEffect } from 'react';
import { ChevronLeft, Star, Download, CheckCircle } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Input } from '../components/ui/input';

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
  const [activeTab, setActiveTab] = useState<'grade' | 'comments'>('grade');
  const [feedback, setFeedback] = useState<string>('');
  
  // Extract class information from location state or local storage
  const classIdFromPath = location.pathname.match(/\/class\/([^\/]+)/) ? 
    location.pathname.match(/\/class\/([^\/]+)/)![1] : null;
  
  const classIdFromState = location.state?.classId;
  const classIdFromStorage = localStorage.getItem('currentClassId');
  
  const classId = classIdFromPath || classIdFromState || classIdFromStorage || null;
  
  // If we have a class ID, store it for persistence across navigation
  useEffect(() => {
    if (classId) {
      localStorage.setItem('currentClassId', classId);
    }
  }, [classId]);
  
  // Class data state
  const [classData, setClassData] = useState(() => {
    // Try to get class data from localStorage
    const storedClassData = localStorage.getItem('currentClassData');
    if (storedClassData) {
      try {
        return JSON.parse(storedClassData);
      } catch (e) {
        console.error("Failed to parse class data from localStorage", e);
      }
    }
    // Default values
    return {
      className: "Cloud",
      section: "Batch 2"
    };
  });

  // Update localStorage when class data changes
  useEffect(() => {
    localStorage.setItem('currentClassData', JSON.stringify(classData));
  }, [classData]);
  
  // Load the student data based on studentId
  useEffect(() => {
    // Try to get class data from localStorage or location state
    let className = "Cloud";
    let section = "Batch 2";
    
    try {
      const classDataStr = localStorage.getItem(`classData-${classId}`);
      if (classDataStr) {
        const classData = JSON.parse(classDataStr);
        if (classData) {
          className = classData.name || classData.className || className;
          section = classData.section || section;
        }
      } else if (location.state?.className) {
        className = location.state.className;
        section = location.state.section || section;
      }
      
      setClassData({
        className,
        section
      });
    } catch (e) {
      console.error('Error loading class data from localStorage', e);
    }
    
    // Try to load assignment data from localStorage
    let assignmentTitle = 'Test';
    let assignmentPoints = '100';
    
    try {
      const assignmentKey = `assignment-${assignmentId}`;
      const storedAssignment = localStorage.getItem(assignmentKey);
      
      if (storedAssignment) {
        const parsedAssignment = JSON.parse(storedAssignment);
        if (parsedAssignment) {
          assignmentTitle = parsedAssignment.title || assignmentTitle;
          assignmentPoints = parsedAssignment.points || assignmentPoints;
          // Update class data if available in the assignment
          if (parsedAssignment.className) {
            className = parsedAssignment.className;
            setClassData((prevData: { className: string; section: string }) => ({
              ...prevData,
              className: parsedAssignment.className
            }));
          }
        }
      }
    } catch (e) {
      console.error('Error loading assignment data from localStorage', e);
    }
    
    // In a real app, this would be an API call, but we'll use mock data for the demo
    const studentData: { [key: string]: StudentSubmission } = {
      '1001': {
        id: '1',
        studentName: 'Alice Smith',
        studentId: '1001',
        submittedDate: 'June 12th, 2023 10:00 PM',
        graded: false,
        assignment: {
          id: assignmentId || '',
          title: assignmentTitle,
          className: className,
          section: section,
          points: assignmentPoints,
        },
        attachedFiles: [
          { name: 'algebra_homework.pdf', type: 'pdf' },
        ],
      },
      '1002': {
        id: '2',
        studentName: 'Bob Johnson',
        studentId: '1002',
        submittedDate: 'June 17th, 2023 09:30 PM',
        graded: false,
        assignment: {
          id: assignmentId || '',
          title: assignmentTitle,
          className: className,
          section: section,
          points: assignmentPoints,
        },
        attachedFiles: [
          { name: 'algebra_homework_bob.pdf', type: 'pdf' },
        ],
      },
      '1003': {
        id: '3',
        studentName: 'Charlie Davis',
        studentId: '1003',
        submittedDate: 'June 10th, 2023 08:15 PM',
        graded: true,
        grade: 100,
        gradePercentage: 100.0,
        letterGrade: 'A',
        feedback: 'Excellent Work',
        gradedDate: 'April 19th, 2025 11:10 PM',
        assignment: {
          id: assignmentId || '',
          title: assignmentTitle,
          className: className,
          section: section,
          points: assignmentPoints,
        },
        attachedFiles: [
          { name: 'algebra_homework_charlie.pdf', type: 'pdf' },
        ],
      }
    };
    
    // Set the submission data for the current studentId
    if (studentId && studentData[studentId]) {
      setSubmission(studentData[studentId]);
    }
  }, [assignmentId, studentId, location, classId]);
  
  // Listen for new assignment creation events
  useEffect(() => {
    const handleNewAssignment = (event: CustomEvent) => {
      const { assignmentId: newAssignmentId } = event.detail;
      
      // If this is the current assignment being viewed, update the submission data
      if (newAssignmentId === assignmentId && submission) {
        try {
          const assignmentKey = `assignment-${newAssignmentId}`;
          const storedAssignment = localStorage.getItem(assignmentKey);
          
          if (storedAssignment && submission) {
            const parsedAssignment = JSON.parse(storedAssignment);
            // Update the submission with new assignment data
            setSubmission(prevSubmission => {
              if (!prevSubmission) return prevSubmission;
              
              return {
                ...prevSubmission,
                assignment: {
                  ...prevSubmission.assignment,
                  title: parsedAssignment.title || prevSubmission.assignment.title,
                  points: parsedAssignment.points || prevSubmission.assignment.points,
                  className: parsedAssignment.className || prevSubmission.assignment.className,
                }
              };
            });
          }
        } catch (e) {
          console.error('Error loading new assignment data from localStorage', e);
        }
      }
    };
    
    // Add event listener for new assignment creation
    window.addEventListener('newAssignmentCreated', handleNewAssignment as EventListener);
    
    return () => {
      window.removeEventListener('newAssignmentCreated', handleNewAssignment as EventListener);
    };
  }, [assignmentId, submission]);
  
  const [points, setPoints] = useState<string>('');
  const [sendEmail, setSendEmail] = useState<boolean>(true);
  
  // Update form state when submission changes and has grade data
  useEffect(() => {
    if (submission?.grade) {
      setPoints(submission.grade.toString());
    }
    if (submission?.feedback) {
      setFeedback(submission.feedback);
    }
  }, [submission]);
  
  const handleBackToSubmissions = () => {
    // Check if we're in a class context
    const isInClassContext = location.pathname.includes('/class/');
    
    if (isInClassContext) {
      // If we're in a class context, keep that context in navigation
      navigate(`/class/${classId}/submissions/${assignmentId}`, {
        state: {
          className: submission?.assignment.className,
          section: submission?.assignment.section,
          assignmentTitle: submission?.assignment.title
        }
      });
    } else {
      // Store class data in localStorage
      if (submission?.assignment.className) {
        try {
          const classData = {
            name: submission.assignment.className,
            section: submission.assignment.section || '',
            id: classId
          };
          localStorage.setItem(`classData-${classId}`, JSON.stringify(classData));
        } catch (e) {
          console.error('Error saving class data to localStorage', e);
        }
      }
      
      // Navigate to the submissions page with state to preserve context
      navigate(`/submissions/${assignmentId}`, {
        state: {
          className: submission?.assignment.className,
          section: submission?.assignment.section,
          classId: classId,
          assignmentTitle: submission?.assignment.title
        }
      });
    }
  };
  
  const handleSubmitGrade = () => {
    if (!submission) return;
    
    const numPoints = parseInt(points);
    const maxPoints = parseInt(submission.assignment.points);
    const percentage = (numPoints / maxPoints) * 100;
    const letterGrade = getLetterGrade(percentage);
    
    // Update the submission with grade info
    const updatedSubmission: StudentSubmission = {
      ...submission,
      grade: numPoints,
      gradePercentage: percentage,
      letterGrade: letterGrade,
      feedback: feedback,
      graded: true,
      gradedDate: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).replace(' at', '')
    };
    
    console.log('Submitting grade:', updatedSubmission);
    
    // In a real app, this would make an API call to update the grade
    setSubmission(updatedSubmission);
    
    // Save the graded submission to localStorage so the submissions page can update
    localStorage.setItem('gradedSubmission', JSON.stringify({
      id: updatedSubmission.id,
      studentId: updatedSubmission.studentId,
      grade: updatedSubmission.grade,
      letterGrade: updatedSubmission.letterGrade,
      feedback: updatedSubmission.feedback
    }));
    
    // Navigate back to submissions list after a short delay
    setTimeout(() => {
      // Check if we're in a class context
      const isInClassContext = location.pathname.includes('/class/');
      
      if (isInClassContext) {
        navigate(`/class/${classId}/submissions/${assignmentId}`, {
          state: {
            className: submission.assignment.className,
            section: submission.assignment.section,
            classId: classId,
            assignmentTitle: submission.assignment.title
          }
        });
      } else {
        navigate(`/submissions/${assignmentId}`, {
          state: {
            className: submission.assignment.className,
            section: submission.assignment.section,
            classId: classId,
            assignmentTitle: submission.assignment.title
          }
        });
      }
    }, 500);
  };
  
  const handleFileDownload = (file: { name: string; type: string }) => {
    console.log(`Downloading file: ${file.name}`);
    
    // In a real application, this would initiate a file download from a server
    // For this demo, we'll simulate a download by creating a dummy file
    
    // Create a dummy text content (in a real app, you would use the actual file content)
    const dummyContent = `This is a simulated download of ${file.name}.
    
In a real application, this would be the actual content of the file.
For this demo, we're just creating a text file with this message.

File requested by: ${submission?.studentName}
Assignment: ${submission?.assignment.title}
Date: ${new Date().toLocaleString()}`;
    
    // Create a Blob from the content
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    
    // Trigger the download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  // Display loading state if submission data is not yet loaded
  if (!submission) {
    return (
      <div className="flex flex-col w-full p-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="gap-2 p-0 hover:bg-transparent" 
            onClick={handleBackToSubmissions}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to submissions</span>
          </Button>
        </div>
        <div className="flex justify-center items-center h-64">
          <p>Loading submission data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col w-full">


      {/* Banner removed as requested */}
      
      <div className="p-6">
        {/* Back link */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="gap-2 p-0 hover:bg-transparent" 
            onClick={handleBackToSubmissions}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to submissions</span>
          </Button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side - Student submission */}
          <div className="flex-1 border rounded-lg">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold">{submission.studentName}'s Submission</h1>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>Submitted on {submission.submittedDate}</span>
              </div>
              
              <div className="mt-2 flex items-center">
                <span className="text-gray-600">Assignment: </span>
                <span className="ml-1 font-medium">{submission.assignment.title}</span>
              </div>
            </div>
            
            <div className="p-6 border-b">
              <h2 className="text-lg font-medium mb-4">Attached files</h2>
              {submission.attachedFiles.map((file, index) => (
                <div key={index} className="flex items-center mb-2">
                  <a href="#" className="flex items-center gap-2 text-blue-600 hover:underline flex-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span>{file.name}</span>
                  </a>
                  <button 
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    onClick={() => handleFileDownload(file)}
                    title="Download file"
                  >
                    <Download size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Graded info section - only shows if the submission is graded */}
            {submission.graded && (
              <div className="p-6 bg-green-50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="text-green-600 h-5 w-5" />
                  <h2 className="text-lg font-medium">Graded</h2>
                </div>
                
                <div className="flex items-center mb-3">
                  <div className="font-medium text-lg">{submission.grade} / {submission.assignment.points} points</div>
                  <div className="ml-2 px-2 py-0.5 rounded text-green-600 font-medium">{submission.letterGrade}</div>
                  <div className="ml-auto text-gray-600">{submission.gradePercentage?.toFixed(1)}%</div>
                </div>
                
                {submission.feedback && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"></polygon>
                      </svg>
                      <span className="font-medium">{submission.feedback}</span>
                    </div>
                  </div>
                )}
                
                <div className="text-sm text-gray-600">
                  Graded on {submission.gradedDate}
                </div>
              </div>
            )}
            
            <div className="p-6">
              <h2 className="text-lg font-medium mb-3">Submission History</h2>
              <div className="border-l-2 border-gray-200 pl-4 ml-2">
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>{submission.submittedDate}</span>
                  </div>
                  <div className="mt-2 ml-6">
                    <div className="mb-1">Attached files:</div>
                    {submission.attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center text-gray-600 mb-1">
                        <span className="flex-1">{file.name}</span>
                        <button 
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          onClick={() => handleFileDownload(file)}
                          title="Download file"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="mt-2 text-green-600 font-medium">Submitted</div>
                  </div>
                </div>
                
                {/* Grading history entry */}
                {submission.graded && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <CheckCircle size={16} className="text-green-600" />
                      <span>{submission.gradedDate}</span>
                    </div>
                    <div className="mt-2 ml-6">
                      <div className="flex">
                        <span className="text-gray-600">Grade: </span>
                        <span className="ml-1 font-medium">{submission.grade} / {submission.assignment.points}</span>
                        <span className={`ml-2 ${getGradeColor(submission.letterGrade || 'F')}`}>({submission.letterGrade})</span>
                      </div>
                      {submission.feedback && (
                        <div className="text-gray-600">Feedback: {submission.feedback}</div>
                      )}
                      <div className="mt-2 text-green-600 font-medium">Graded</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right side - Grading */}
          <div className="w-full lg:w-96 border rounded-lg">
            <div className="p-4 border-b flex items-center gap-2">
              <div className="flex-1 text-xl font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <span>Grade Submission</span>
              </div>
            </div>
            
            <div className="flex border-b">
              <button 
                className={`flex-1 py-3 px-4 font-medium ${activeTab === 'grade' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab('grade')}
              >
                <div className="flex items-center justify-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>Grade</span>
                </div>
              </button>
              <button 
                className={`flex-1 py-3 px-4 font-medium ${activeTab === 'comments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab('comments')}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span>Comments</span>
                </div>
              </button>
            </div>
            
            {activeTab === 'grade' && (
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points (out of {submission.assignment.points})
                  </label>
                  <Input 
                    type="number" 
                    placeholder="Enter points" 
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    min="0"
                    max={submission.assignment.points}
                  />
                </div>
                
                {/* Grade display with letter and percentage */}
                {points && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Grade:</span>
                      <span className={`font-semibold ${getGradeColor(getLetterGrade(parseInt(points) / parseInt(submission.assignment.points) * 100))}`}>
                        {getLetterGrade(parseInt(points) / parseInt(submission.assignment.points) * 100)}
                        <span className="text-gray-600 ml-2">
                          ({((parseInt(points) / parseInt(submission.assignment.points)) * 100).toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          parseInt(points) / parseInt(submission.assignment.points) >= 0.9 
                            ? 'bg-green-500' 
                            : parseInt(points) / parseInt(submission.assignment.points) >= 0.8 
                              ? 'bg-blue-500' 
                              : parseInt(points) / parseInt(submission.assignment.points) >= 0.7 
                                ? 'bg-yellow-500' 
                                : parseInt(points) / parseInt(submission.assignment.points) >= 0.6 
                                  ? 'bg-orange-500' 
                                  : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, (parseInt(points) / parseInt(submission.assignment.points)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback to student (optional)
                  </label>
                  <Textarea 
                    placeholder="Add private feedback for the student" 
                    className="min-h-[120px]"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center space-x-2 mb-6">
                  <Switch 
                    id="send-email" 
                    checked={sendEmail}
                    onCheckedChange={setSendEmail}
                  />
                  <label htmlFor="send-email" className="text-sm text-gray-700">
                    Send email notification
                  </label>
                </div>
                
                <Button 
                  className="w-full"
                  onClick={handleSubmitGrade}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Submit Grade
                </Button>
              </div>
            )}
            
            {activeTab === 'comments' && (
              <div className="p-6">
                <div className="flex justify-center items-center h-40 text-gray-500">
                  No comments yet
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSubmissionPage;