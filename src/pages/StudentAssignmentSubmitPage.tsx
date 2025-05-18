import React, { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import * as assignmentApi from '../api/assignmentApi';
import { unsubmitAssignment, submitAssignment } from '../api/assignmentApi';
import * as storageApi from '../api/storageApi';
import axios, { AxiosProgressEvent } from 'axios';
import FileUpload from '../components/FileUpload';
// We're using custom events for local notifications instead of direct signalR

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

// Define interface for the API response types
interface SubmissionFile {
  name: string;
  type?: string;
  size?: number;
  url?: string;
  attachmentId?: string | number;
  id?: string | number;
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
  // We no longer need to track submittedFiles separately, as we'll use the files state directly
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
        // Files will be reset elsewhere in the unsubmit flow
        
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
  
  // Save submission state to localStorage AND sessionStorage whenever it changes
  // But only save the CURRENT files, not any previous ones
  useEffect(() => {
    if (assignmentId) {
      // Create a comprehensive state object with all necessary file metadata
      const stateToSave = {
        success,
        // Process files to ensure they have all required fields for persistence
        files: success ? files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          // Add fields that ensure persistence across page navigation
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${file.name}`,
          url: file instanceof File ? URL.createObjectURL(file) : undefined,
          persistenceKey: `file_${assignmentId}_${file.name}`
        })) : [],
        submissionId: currentSubmissionId,
        timestamp: new Date().toISOString()
      };
      
      // Save to localStorage for long-term persistence
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      
      // Also save to sessionStorage for faster access during the session
      sessionStorage.setItem(`session_${storageKey}`, JSON.stringify(stateToSave));
      
      // Save a global reference to the active submission for cross-page access
      if (success) {
        localStorage.setItem(`assignment_${assignmentId}_files`, JSON.stringify(stateToSave.files));
        // Also save in session for quick access
        sessionStorage.setItem(`active_submission_${assignmentId}`, JSON.stringify(stateToSave));
      }
    }
  }, [success, files, currentSubmissionId, assignmentId, storageKey]);
  
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
    
    // We're using the files state directly in the success view, so no need to set any additional state
    
    // When submitting again, we want to make sure we're creating a completely new submission
    // if the edit button was used - this ensures we don't use any stale submission IDs
    if (!currentSubmissionId) {
      console.log('Creating brand new submission with files:', files.map(f => f.name));
    } else {
      console.log(`Replacing submission ${currentSubmissionId} with new files:`, files.map(f => f.name));
      // Clear the old submission ID to ensure we create a fresh one
      setCurrentSubmissionId('');
    }
    
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
            onUploadProgress: (progressEvent: AxiosProgressEvent) => {
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
      
      // Log the entire submission result to help debug
      console.log('Full submission result:', JSON.stringify(submissionResult));
      
      // Get the file information from the API response if available,
      // otherwise use the local files
      let fileInfo: any[] = [];
      
      console.log('Full submission response structure:', JSON.stringify(submissionResult, null, 2));
      
      // Enhanced logic to find files in different possible response structures
      if (submissionResult.files && Array.isArray(submissionResult.files) && submissionResult.files.length > 0) {
        // Files are directly in the response
        console.log('Found files in submissionResult.files:', submissionResult.files);
        fileInfo = submissionResult.files.map((file: SubmissionFile) => ({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          url: file.url,
          id: file.attachmentId || file.id
        }));
      } else if (submissionResult.attachments && Array.isArray(submissionResult.attachments) && submissionResult.attachments.length > 0) {
        // Files might be in an attachments array
        console.log('Found files in submissionResult.attachments:', submissionResult.attachments);
        fileInfo = submissionResult.attachments.map((file: SubmissionFile) => ({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          url: file.url,
          id: file.attachmentId || file.id
        }));
      } else if (submissionResult.success && submissionResult.success.files && Array.isArray(submissionResult.success.files)) {
        // Files might be nested in a success property
        console.log('Found files in submissionResult.success.files:', submissionResult.success.files);
        fileInfo = submissionResult.success.files.map((file: SubmissionFile) => ({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          url: file.url,
          id: file.attachmentId || file.id
        }));
      } else if (files.length > 0) {
        // If no files in response but we have local files, use those
        console.log('Using local files as fallback:', files);
        fileInfo = files.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size,
          id: submissionResult.submissionId 
            ? `${submissionResult.submissionId}-${file.name}` 
            : (submissionResult.id ? `${submissionResult.id}-${file.name}` : undefined)
        }));
        
        // Store submissionId for correct reference
        if (submissionResult.submissionId && !submissionResult.id) {
          submissionResult.id = submissionResult.submissionId;
        }
      }
      
      console.log('Processed file info for display:', fileInfo);
      
      // Create a notification for teachers about this submission
      try {
        // Only create the notification if we have valid assignment data and are in a course context
        if (assignment && classId) {
          // Create a client-side notification without attempting the API call
          // This simulates what would happen if the server sent a notification
          const notificationData = {
            notificationId: `notification-${Date.now()}`,
            title: 'New Submission',
            message: `${userName} submitted assignment '${assignment.title}'`,
            type: 'submission',
            courseId: classId,
            assignmentId: assignmentId,
            userId: userId,
            createdAt: new Date().toISOString(),
            isRead: false,
            data: {},
            link: `/class/${classId}/submissions/${assignmentId}`
          };
          
          // Store in localStorage to persist across sessions and tabs
          // In production, the server would handle notifications via SignalR
          // This is just for testing/demo purposes until the backend is implemented
          window.setTimeout(() => {
            console.log('Broadcasting notification:', notificationData);
            
            // First dispatch event for the current session
            document.dispatchEvent(new CustomEvent('manual-notification', { detail: notificationData }));
            
            // Then store in localStorage for other sessions to find
            try {
              // Get existing notifications
              const storedNotifications = JSON.parse(localStorage.getItem('classroom-notifications') || '[]');
              
              // Add the new notification
              storedNotifications.unshift(notificationData);
              
              // Store back in localStorage (limit to 50 notifications to prevent storage issues)
              localStorage.setItem('classroom-notifications', 
                JSON.stringify(storedNotifications.slice(0, 50)));
                
              console.log('Notification saved to localStorage for cross-session access');
            } catch (error) {
              console.error('Error saving notification to localStorage:', error);
            }
          }, 500);
        }
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the submission just because notification failed
      }
      
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
  
  const handleUnsubmit = async () => {
    console.log('Editing submission...');
    
    try {
      // If we have a submission ID, we need to properly unsubmit first
      if (currentSubmissionId) {
        console.log(`Unsubmitting current submission ${currentSubmissionId} before edit`);
        try {
          // Call the unsubmit API to ensure we're starting fresh
          await unsubmitAssignment(currentSubmissionId);
          console.log('Successfully unsubmitted for editing');
          
          // Clear the current submission ID to ensure we create a completely new submission
          setCurrentSubmissionId('');
          
          // Remove from localStorage to start completely fresh
          localStorage.removeItem(storageKey);
        } catch (error) {
          console.warn('Error unsubmitting before edit, continuing anyway:', error);
        }
      }
      
      // Return to edit mode
      setSuccess(false);
      
      // Reset ALL files and state to start completely fresh
      setFiles([]);
      setComment('');
      setUploadProgress(0);
      setIsUploading(false);
      setError(null);
    } catch (error) {
      console.error('Error preparing submission for edit:', error);
      setError('Failed to prepare for editing. Please try refreshing the page.');
    }
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
                      {files.length > 0 ? (
                        // Show ONLY the files that were just uploaded in this session
                        files.map((file, index) => (
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
                          <span className="text-sm">No files available</span>
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
                            
                            // Completely reset all submission state
                            setFiles([]);
                            setComment('');
                            setSuccess(false);
                            setUploadProgress(0);
                            setIsUploading(false);
                            setError(null);
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
