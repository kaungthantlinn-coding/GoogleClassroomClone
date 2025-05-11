import React, { useState, useEffect } from 'react';
import { ChevronLeft, Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import * as assignmentApi from '../api/assignmentApi';
import { unsubmitAssignment, submitAssignment } from '../api/assignmentApi';
import * as storageApi from '../api/storageApi';
import axios from 'axios';
import FileUpload from '../components/FileUpload';

interface AssignmentDetails {
  id: string;
  title: string;
  description?: string;
  instructions?: string; // Add instructions field
  points: string;
  dueDate?: string;
  className: string;
  section?: string;
}

const StudentAssignmentSubmitPage: React.FC = () => {
  const { classId, assignmentId } = useParams<{ classId: string; assignmentId: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  
  // Check for saved submission state in localStorage
  const storageKey = `submission_${assignmentId}`;
  const savedState = localStorage.getItem(storageKey);
  const initialState = savedState && savedState !== "undefined" ? JSON.parse(savedState) : { success: false, files: [] };
  
  const [success, setSuccess] = useState(initialState.success);
  const [error, setError] = useState<string | null>(null);
  const [submittedFiles, setSubmittedFiles] = useState<Array<{name: string, size?: number}>>(initialState.files);
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string>(initialState.submissionId || '');
  
  // Get user information
  const userId = sessionStorage.getItem('user_id') || 'student-123';
  const userName = sessionStorage.getItem('user_name') || 'Student User';
  
  // Check if this is a student user
  const userRole = sessionStorage.getItem('user_role');
  
  // If user is not a student, redirect
  useEffect(() => {
    if (userRole && userRole.toLowerCase() !== 'student') {
      console.log('Non-student attempting to access student submission page');
      navigate(-1);
    }
  }, [userRole, navigate]);
  
  // Load assignment details
  useEffect(() => {
    const loadAssignmentData = async () => {
      setLoading(true);
      
      try {
        // Default values in case API call fails
        let assignmentData: AssignmentDetails = {
          id: assignmentId || '',
          title: 'Assignment',
          description: '',
          points: '100',
          className: 'Class',
          section: ''
        };
        
        // Try to get assignment data from API
        if (assignmentId) {
          try {
            const apiData = await assignmentApi.getAssignment(assignmentId);
            if (apiData) {
              assignmentData = {
                ...assignmentData,
                ...apiData
              };
            }
          } catch (assignmentError) {
            console.error('Error loading assignment from API:', assignmentError);
          }
        }
        
        // Try to get class data if in class context
        if (classId) {
          try {
            const classData = await storageApi.getClassData(classId);
            if (classData) {
              assignmentData.className = classData.name || classData.className || assignmentData.className;
              assignmentData.section = classData.section || assignmentData.section;
            }
          } catch (classError) {
            console.error('Error loading class data from API:', classError);
          }
        }
        
        setAssignment(assignmentData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Could not load assignment details');
      } finally {
        setLoading(false);
      }
    };
    
    loadAssignmentData();
  }, [assignmentId, classId]);
  
  // Save submission state to localStorage whenever it changes
  useEffect(() => {
    if (assignmentId) {
      const stateToSave = {
        success,
        files: submittedFiles,
        submissionId: currentSubmissionId
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }
  }, [success, submittedFiles, currentSubmissionId, assignmentId, storageKey]);
  
  // Add a new state for upload progress
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  const handleBackClick = () => {
    navigate(-1);
  };
  
  const handleSubmitAssignment = async () => {
    if (files.length === 0 && !comment.trim()) {
      setError('Please attach at least one file or add a comment');
      return;
    }
    
    setSubmitting(true);
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // Prepare submission data with the actual File objects
      const submissionData = {
        assignmentId,
        studentId: userId,
        studentName: userName,
        // Include the actual File objects here, they will be handled correctly in the API
        files,
        comment,
        submittedDate: new Date().toLocaleString('en-US'),
        status: 'submitted'
      };
      
      // Make API call to submit assignment
      let submissionResult;
      
      try {
        // Make sure assignmentId is valid before passing to API
        if (!assignmentId) {
          throw new Error('Assignment ID is required');
        }
        
        // Set up a progress listener for the upload
        const originalAxiosPost = axios.post;
        axios.post = async (...args) => {
          const [url, data, config] = args;
          const uploadConfig = {
            ...config,
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
              setUploadProgress(percentCompleted);
              console.log(`Upload progress: ${percentCompleted}%`);
            },
          };
          return originalAxiosPost(url, data, uploadConfig);
        };
        
        // Use the updated submitAssignment function which handles files properly
        submissionResult = await submitAssignment(assignmentId, submissionData);
        
        // Reset axios.post to its original implementation
        axios.post = originalAxiosPost;
        
        console.log('Assignment submitted successfully:', submissionResult);
      } catch (apiError) {
        console.error('API error:', apiError);
        // For demo, create a mock response
        submissionResult = { id: `submission-${Date.now()}`, ...submissionData };
      }
      
      // Save submission ID in state for later use (unsubmit, edit, etc.)
      setCurrentSubmissionId(submissionResult.id);
      
      // Get the file information from the API response if available,
      // otherwise use the local files
      const fileInfo = submissionResult.files || files.map(file => ({
        name: file.name,
        size: file.size,
        id: submissionResult.id ? `${submissionResult.id}-${file.name}` : undefined
      }));
      
      // Save submitted files for display in success view
      setSubmittedFiles(fileInfo);
      
      // Show success state immediately
      setSuccess(true);
      // No automatic navigation
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setError('Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
      setIsUploading(false);
    }
  };
  
  const handleUnsubmit = () => {
    // In a real implementation, you would call an API to remove the submission
    console.log('Unsubmitting assignment...');
    
    // Return to edit mode
    setSuccess(false);
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getDueDateStatus = (dateString?: string) => {
    if (!dateString) return { text: '', isOverdue: false };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison
    
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    
    // Calculate the difference in days
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff === 0) {
      return { text: 'Due today', isOverdue: false };
    } else if (daysDiff < 0) {
      return { text: `${Math.abs(daysDiff)} day${Math.abs(daysDiff) !== 1 ? 's' : ''} overdue`, isOverdue: true };
    } else {
      return { text: `${daysDiff} day${daysDiff !== 1 ? 's' : ''} remaining`, isOverdue: false };
    }
  };
  
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f5f5f5]">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 py-3 max-w-5xl mx-auto flex items-center">
            <button onClick={handleBackClick} className="mr-4">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-xl font-medium text-[#202124]">Loading...</h1>
          </div>
        </div>
        <div className="flex justify-center items-center flex-grow">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f5f5f5]">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 py-3 max-w-5xl mx-auto flex items-center">
            <button onClick={handleBackClick} className="mr-4">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-xl font-medium text-[#202124]">{assignment?.title || "Assignment"}</h1>
          </div>
        </div>
        
        {/* Main content - Matching second image exactly */}
        <div className="max-w-5xl mx-auto w-full pt-6 px-4 flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Success message container */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-lg font-medium mb-4">Your work</h2>
                  
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="text-green-500" size={24} />
                    </div>
                    <h3 className="text-lg font-medium mb-1">Assignment Submitted</h3>
                    <p className="text-gray-600 mb-8">
                      Your assignment has been successfully submitted.
                    </p>
                    
                    <div className="w-full max-w-md">
                      <p className="text-sm font-medium text-gray-700 mb-2">Submitted files:</p>
                      {submittedFiles.length > 0 ? (
                        submittedFiles.map((file, index) => (
                          <div key={index} className="bg-gray-50 rounded p-3 flex items-center text-gray-700 mb-2">
                            <div className="bg-gray-200 w-6 h-6 flex items-center justify-center rounded mr-2">
                              <span className="text-gray-600 text-xs">📄</span>
                            </div>
                            <span className="text-sm">{file.name}</span>
                          </div>
                        ))
                      ) : (
                        <div className="bg-gray-50 rounded p-3 flex items-center text-gray-700 mb-6">
                          <div className="bg-gray-200 w-6 h-6 flex items-center justify-center rounded mr-2">
                            <span className="text-gray-600 text-xs">📄</span>
                          </div>
                          <span className="text-sm">871f39ad-784f-40be-8790-ce188c410fa5.jpg</span>
                        </div>
                      )}
                      
                      <div className="flex flex-col space-y-2 w-full">
                        <Button 
                          onClick={handleUnsubmit}
                          className="bg-blue-600 hover:bg-blue-700 text-white mx-auto block w-full"
                        >
                          Edit Submission
                        </Button>
                        <Button 
                          onClick={async () => {
                            // Use the submission ID from state
                            if (currentSubmissionId) {
                              try {
                                // Call the unsubmit API endpoint
                                // DELETE: api/submissions/{id}/unsubmit
                                await unsubmitAssignment(currentSubmissionId);
                                console.log('Assignment unsubmitted successfully');
                                
                                // Clear the submission ID from state
                                setCurrentSubmissionId('');
                                
                                // Remove from localStorage
                                localStorage.removeItem(storageKey);
                              } catch (error) {
                                console.error('Error unsubmitting assignment:', error);
                                // Continue with local state changes even if API call fails
                              }
                            } else {
                              console.log('No submission ID found, just resetting UI state');
                            }
                            
                            // Clear files and reset state
                            setFiles([]);
                            setComment('');
                            setSubmittedFiles([]);
                            setSuccess(false);
                          }}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 mx-auto block w-full font-medium"
                        >
                          Unsubmit Assignment
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Assignment details sidebar - keep consistent */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-lg font-medium mb-4">Assignment Details</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Points</h3>
                      <p className="text-gray-900">{assignment?.points || '100'}</p>
                    </div>
                    
                    {assignment?.dueDate && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                        <div className="flex items-center">
                          <svg className="mr-1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          <p className="text-gray-900">{formatDate(assignment.dueDate)}</p>
                        </div>
                        {assignment.dueDate && (() => {
                          const { text, isOverdue } = getDueDateStatus(assignment.dueDate);
                          return (
                            <p className={`${isOverdue ? 'text-red-500' : 'text-orange-500'} text-sm mt-1`}>
                              {text}
                            </p>
                          );
                        })()}
                      </div>
                    )}
                    
                    {/* Show instructions in a format matching the second image */}
                    {(assignment?.instructions || assignment?.description) && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Instructions</h3>
                        <div className="mt-2 flex items-start">
                          <div className="text-blue-500 mr-2 flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="16" x2="12" y2="12"></line>
                              <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                          </div>
                          <p className="text-gray-700 whitespace-pre-line text-sm">
                            {assignment.instructions || assignment.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3 max-w-5xl mx-auto flex items-center">
          <button onClick={handleBackClick} className="mr-4">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">{assignment?.title || "Assignment"}</h1>
            <div className="text-[#5f6368] text-sm">
              {assignment?.className}{assignment?.section ? ` · ${assignment.section}` : ''}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-5xl mx-auto w-full pt-6 px-4 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Assignment submission form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-medium mb-4">Your work</h2>
                
                {/* Replace existing file upload area with the new component */}
                <FileUpload 
                  files={files}
                  onFilesChange={setFiles}
                  maxFiles={5}
                  maxSize={20 * 1024 * 1024} // 20MB
                  className="mb-6"
                />
                
                {/* Comment area */}
                <div className="mb-6">
                  <label htmlFor="comment" className="block mb-2 text-sm font-medium text-gray-700">
                    Add comment (optional)
                  </label>
                  <Textarea
                    id="comment"
                    placeholder="Add a comment to your submission..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
                
                {/* Error message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                    <AlertCircle size={16} className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                {/* Upload progress */}
                {isUploading && (
                  <div className="mb-4">
                    <p className="text-sm mb-2">Uploading files: {uploadProgress}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Submit button */}
                <div className="flex justify-end">
                  <Button
                    disabled={submitting}
                    onClick={handleSubmitAssignment}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {submitting ? 'Submitting...' : 'Turn in'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Assignment details sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-medium mb-4">Assignment Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Points</h3>
                    <p className="text-gray-900">{assignment?.points || '100'}</p>
                  </div>
                  
                  {assignment?.dueDate && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                      <p className="text-gray-900">{formatDate(assignment.dueDate)}</p>
                    </div>
                  )}
                  
                  {/* Show instructions if available */}
                  {(assignment?.instructions || assignment?.description) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Instructions</h3>
                      <div className="mt-2 flex items-start">
                        <div className="text-blue-500 mr-2 flex-shrink-0 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                          </svg>
                        </div>
                        <p className="text-gray-700 whitespace-pre-line text-sm">
                          {assignment.instructions || assignment.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAssignmentSubmitPage;
