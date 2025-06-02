import axios, { AxiosError } from 'axios';
import { Assignment } from '../types/assignment';
import { getApiBaseUrl } from '../utils/apiMode';

// Define interface for submission file objects
interface SubmissionFile {
  name: string;
  type?: string;
  size?: number;
  url?: string;
  attachmentId?: string | number;
  id?: string | number;
}

const API_URL = getApiBaseUrl();

// Create axios instance for assignment API
const assignmentApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
assignmentApi.interceptors.request.use(config => {
  // Get token from sessionStorage
  const token = sessionStorage.getItem('auth_token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling helper
const handleApiError = <T>(error: any, message: string): T => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    console.error(`${message}: ${axiosError.message}`, axiosError.response?.data);
  } else {
    console.error(`${message}: ${error}`);
  }
  throw error;
};

// API Functions

/**
 * Get all assignments for a specific course
 */
export const getAssignments = async (courseId: string | number): Promise<Assignment[]> => {
  try {
    // GET: api/courses/{courseId}/assignments
    const response = await assignmentApi.get<any[]>(`/courses/${courseId}/assignments`);
    
    // Add debug logging to see the actual API response
    console.log('API response for assignments:', response.data);
    
    // Map the API response to our Assignment interface
    // Use the appropriate property names from the API (might be 'id', 'assignmentId', etc.)
    const assignments = response.data.map(item => ({
      id: item.assignmentId || item.id,  // Try both possible property names
      title: item.title,
      instructions: item.instructions || item.description || '',
      points: item.points?.toString() || '100',
      dueDate: item.dueDate || '',
      dueTime: item.dueTime || '',
      topic: item.topic || 'No topic',
      attachments: item.attachments || [],
      assignTo: item.assignTo || ['All students'],
      scheduledFor: item.scheduledFor || null,
      className: item.className,
      section: item.section,
      classId: item.classId || courseId.toString(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt,
      allowLateSubmissions: item.allowLateSubmissions,
      lateSubmissionPolicy: item.lateSubmissionPolicy
    }));
    
    console.log('Mapped assignments:', assignments);
    
    return assignments;
  } catch (error) {
    return handleApiError(error, `Failed to fetch assignments for course ${courseId}`);
  }
};

/**
 * Get a specific assignment by ID
 */
export const getAssignment = async (assignmentId: string | number): Promise<Assignment> => {
  try {
    // GET: api/assignments/{id}
    const response = await assignmentApi.get<Assignment>(`/assignments/${assignmentId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to fetch assignment ${assignmentId}`);
  }
};

/**
 * Create a new assignment for a course
 */
export const createAssignment = async (courseId: string | number, assignment: Partial<Assignment>): Promise<Assignment> => {
  try {
    console.log(`API: Attempting to create assignment for course ${courseId}`, assignment);
    
    // POST: api/courses/{courseId}/assignments
    const response = await assignmentApi.post(`/courses/${courseId}/assignments`, assignment);
    
    // Log the raw API response for debugging
    console.log('API: Raw assignment creation response:', response.data);
    
    // Check if we got a valid response
    const responseData = response.data;
    const hasRequiredFields = responseData.id || responseData.assignmentId || responseData._id;
    
    if (!hasRequiredFields) {
      console.warn('API: Response missing ID field, check the API documentation');
    }
    
    return responseData;
  } catch (error) {
    console.error('API: Assignment creation failed', error);
    return handleApiError(error, `Failed to create assignment for course ${courseId}`);
  }
};

/**
 * Update an existing assignment
 */
export const updateAssignment = async (assignmentId: string | number, assignment: Partial<Assignment>): Promise<Assignment> => {
  try {
    // PUT: api/assignments/{id}
    const response = await assignmentApi.put<Assignment>(`/assignments/${assignmentId}`, assignment);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to update assignment ${assignmentId}`);
  }
};

/**
 * Delete an assignment
 */
export const deleteAssignment = async (assignmentId: string | number): Promise<void> => {
  // Check if assignmentId is valid and not undefined
  if (!assignmentId) {
    console.error('Cannot delete assignment: ID is undefined');
    throw new Error('Assignment ID is required for deletion');
  }
  
  try {
    console.log(`API: Attempting to delete assignment with ID: ${assignmentId}`);
    // DELETE: api/assignments/{id}
    await assignmentApi.delete(`/assignments/${assignmentId}`);
    console.log(`API: Successfully deleted assignment with ID: ${assignmentId}`);
  } catch (error) {
    console.error(`API: Failed to delete assignment ${assignmentId}`, error);
    handleApiError(error, `Failed to delete assignment ${assignmentId}`);
  }
};

/**
 * Get all submissions for an assignment (teacher only)
 * GET: api/assignments/{assignmentId}/submissions
 */
export const getSubmissions = async (assignmentId: string | number): Promise<any[]> => {
  try {
    const response = await assignmentApi.get(`/assignments/${assignmentId}/submissions`);
    console.log('API response for submissions:', response.data);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Error getting assignment submissions');
  }
};

/**
 * Get student's own submissions for an assignment (student only)
 * GET: api/assignments/{assignmentId}/my-submissions
 */
export const getMySubmissions = async (assignmentId: string | number): Promise<any[]> => {
  try {
    const response = await assignmentApi.get(`/assignments/${assignmentId}/my-submissions`);
    console.log('API response for my submissions:', response.data);
    return response.data;
  } catch (error) {
    // If the my-submissions endpoint doesn't exist, try the general endpoint
    // Some APIs might allow students to see their own submissions through the general endpoint
    try {
      const response = await assignmentApi.get(`/assignments/${assignmentId}/submissions`);
      console.log('API response for submissions (fallback):', response.data);
      return response.data;
    } catch (fallbackError) {
      return handleApiError(error, 'Error getting my assignment submissions');
    }
  }
};

/**
 * Find the most recent submission for a student
 * This is a helper function that doesn't try to delete anything
 */
const findStudentSubmission = async (assignmentId: string | number, studentId: string | number): Promise<any | null> => {
  try {
    console.log(`Finding latest submission for student ${studentId} on assignment ${assignmentId}`);

    try {
      // Try to get student's own submissions first (for students)
      // This avoids the 403 error when students try to access all submissions
      let submissions;
      try {
        submissions = await getMySubmissions(assignmentId);
        console.log('Successfully retrieved my submissions');
      } catch (mySubmissionsError) {
        console.log('My submissions endpoint failed, trying general submissions endpoint');
        // Fallback to general submissions (for teachers or if my-submissions doesn't exist)
        submissions = await getSubmissions(assignmentId);
        console.log('Successfully retrieved general submissions');
      }

      // Find all submissions for this student
      const studentSubmissions = submissions.filter(sub => {
        const subStudentId = sub.userId || sub.studentId;
        return subStudentId?.toString() === studentId?.toString();
      });

      if (studentSubmissions.length === 0) {
        console.log('No existing submissions found for this student');
        return null;
      }

      // Sort by date (newest first)
      const sortedSubmissions = studentSubmissions.sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.submittedDate || 0).getTime();
        const dateB = new Date(b.submittedAt || b.submittedDate || 0).getTime();
        return dateB - dateA;
      });

      // Return the most recent submission
      console.log(`Found ${studentSubmissions.length} submissions, using the most recent one`);
      return sortedSubmissions[0];
    } catch (error) {
      console.warn('Error finding submissions:', error);
      return null;
    }
  } catch (error) {
    console.error('Error in find process:', error);
    return null;
  }
};

/**
 * Submit assignment (student only)
 * POST: api/assignments/{assignmentId}/submissions
 */
export const submitAssignment = async (assignmentId: string | number, submission: any): Promise<any> => {
  try {
    console.log('Starting submission process for assignment:', assignmentId);
    
    // First, check if the student already has a submission for this assignment
    // This helps prevent duplicate submissions and ensures complete replacement of files
    try {
      console.log('Checking for existing submissions...');
      // Use getMySubmissions to avoid 403 errors for students
      let existingSubmissions;
      try {
        existingSubmissions = await getMySubmissions(assignmentId);
        console.log('Retrieved my submissions successfully');
      } catch (mySubmissionsError) {
        console.log('My submissions failed, trying general submissions');
        existingSubmissions = await getSubmissions(assignmentId);
      }
      const studentId = submission.studentId || submission.userId;
      
      if (existingSubmissions && Array.isArray(existingSubmissions)) {
        // Find all submissions for this student
        const studentSubmissions = existingSubmissions.filter(sub => 
          (sub.userId?.toString() === studentId || sub.studentId?.toString() === studentId)
        );
        
        console.log(`Found ${studentSubmissions.length} existing submissions for student ${studentId}`);
        
        // Handle each existing submission to ensure proper cleanup
        if (studentSubmissions.length > 0) {
          // Sort by date (newest first) to find the most recent submission
          const sortedSubmissions = studentSubmissions.sort((a, b) => {
            const dateA = new Date(a.submittedAt || a.submittedDate || 0).getTime();
            const dateB = new Date(b.submittedAt || b.submittedDate || 0).getTime();
            return dateB - dateA;
          });
          
          // Delete and completely replace ALL previous submissions
          // This is the only reliable way to ensure old files don't persist
          for (const prevSubmission of sortedSubmissions) {
            console.log(`Processing existing submission to COMPLETELY REMOVE: ${prevSubmission.submissionId || prevSubmission.id}`);
            
            // First try to unsubmit through the API
            const submissionIdToUnsubmit = prevSubmission.submissionId || prevSubmission.id;
            if (submissionIdToUnsubmit) {
              try {
                console.log(`Unsubmitting existing submission: ${submissionIdToUnsubmit}`);
                await unsubmitAssignment(submissionIdToUnsubmit);
                console.log(`Successfully unsubmitted previous submission: ${submissionIdToUnsubmit}`);
                
                // Also try to directly delete the submission if possible
                try {
                  console.log(`Attempting direct deletion of submission: ${submissionIdToUnsubmit}`);
                  await assignmentApi.delete(`/submissions/${submissionIdToUnsubmit}`);
                  console.log(`Successfully deleted previous submission: ${submissionIdToUnsubmit}`);
                } catch (deleteError) {
                  console.log(`Direct deletion not supported or failed: ${deleteError}`);
                  // Continue even if deletion fails
                }
              } catch (unsubmitError) {
                console.warn(`Error unsubmitting previous submission ${submissionIdToUnsubmit}, continuing:`, unsubmitError);
              }
            }
          }
          
          // Add a longer delay to ensure backend has fully processed all deletion operations
          console.log('Waiting for backend to process all submission deletions...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (checkError) {
      console.warn('Error checking for existing submissions, continuing with new submission:', checkError);
    }
    
    // Check if we have an existing submission - we'll use this in our request to ensure proper replacement
    // of files rather than adding to them
    let existingSubmissionId = null;
    try {
      const existingSubmission = await findStudentSubmission(assignmentId, submission.studentId || submission.userId);
      if (existingSubmission) {
        console.log('Found existing submission that will be replaced:', existingSubmission.id || existingSubmission.submissionId);
        existingSubmissionId = existingSubmission.id || existingSubmission.submissionId;
        
        // Try to unsubmit the existing submission if we have an ID
        if (existingSubmissionId) {
          try {
            await unsubmitAssignment(existingSubmissionId);
            console.log(`Successfully unsubmitted previous submission: ${existingSubmissionId}`);
          } catch (unsubError) {
            console.warn(`Unable to unsubmit previous submission: ${unsubError}`);
          }
        }
      } else {
        console.log('No existing submission found - creating new submission');
      }
    } catch (findError) {
      console.warn('Error checking for existing submissions:', findError);
    }
    
    // Extract files from submission data if they exist
    const files = submission.files ? [...submission.files].filter(f => f instanceof File) : [];
    console.log(`Found ${files.length} files to upload`);
    
    // Create a completely fresh submission data object
    // This ensures no stale data persists
    const submissionData: any = {
      assignmentId: submission.assignmentId,
      studentId: submission.studentId || submission.userId,
      studentName: submission.studentName || submission.userName,
      submittedDate: new Date().toISOString(), // Always use current timestamp
      status: 'submitted',
      comment: submission.comment || ''
    };
    
    // Process files - convert File objects to metadata
    const processedFiles = files.map((file: File) => {
      if (file instanceof File) {
        return {
          name: file.name,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file), // Create temporary URL for local preview
          timestamp: new Date().toISOString(), // Add upload timestamp to help with sorting
          // Add id field to ensure file is uniquely identifiable after page reload
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`
        };
      }
      return file as unknown as SubmissionFile;
    });
    
    // Use the processed files array
    submissionData.files = processedFiles;
    
    // Add a submissionContent field if one doesn't exist
    if (!submissionData.submissionContent && submissionData.comment) {
      submissionData.submissionContent = submissionData.comment;
    } else if (!submissionData.submissionContent && files.length > 0) {
      submissionData.submissionContent = 'File submission';
    }
    
    let uploadedFiles = [];
    let response;
    
    // Two different approaches depending on whether we have files to upload
    if (files.length > 0) {
      // Approach 1: Upload files first, then create submission
      try {
        console.log('Uploading files before creating submission...');
        // Import the file upload API lazily to avoid circular dependencies
        const { uploadSubmissionFiles } = await import('./fileUploadApi');
        
        // Upload files without a submissionId first
        uploadedFiles = await uploadSubmissionFiles(assignmentId, files);
        console.log('Files uploaded successfully before submission:', uploadedFiles);
        
        // Add uploaded files metadata to submission data
        if (uploadedFiles && uploadedFiles.length > 0) {
          // Process uploaded files to ensure they have all required fields for persistence
          const enrichedFiles = uploadedFiles.map(file => ({
            ...file,
            // Ensure every file has these critical fields
            name: file.name || file.fileName || 'unnamed-file',
            type: file.type || file.mimeType || 'application/octet-stream',
            id: file.id || file.attachmentId || `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            // Store the link permanently in localStorage as a backup
            persistenceKey: `file_${assignmentId}_${file.name}`,
            // Mark this file as a submission attachment for filtering
            isSubmissionAttachment: true
          }));

          // Store in both places to maximize chances of persistence
          submissionData.files = enrichedFiles;
          submissionData.attachments = enrichedFiles;
          
          // Also store the files in localStorage as a backup mechanism
          try {
            localStorage.setItem(`assignment_${assignmentId}_files`, JSON.stringify(enrichedFiles));
            console.log('Backed up submission files to localStorage');
          } catch (e) {
            console.warn('Failed to back up files to localStorage:', e);
          }
        }
        
        // Now create the submission with file metadata
        response = await assignmentApi.post(`/assignments/${assignmentId}/submissions`, submissionData);
        console.log('Submission created with file metadata:', response.data);
      } catch (error) {
        console.error('Error in file-first approach:', error);
        // If file upload fails, fall back to creating submission first
        response = await assignmentApi.post(`/assignments/${assignmentId}/submissions`, submissionData);
        console.log('Fallback: Submission created without files:', response.data);
      }
    } else {
      // Approach 2: Just create the submission (no files)
      response = await assignmentApi.post(`/assignments/${assignmentId}/submissions`, submissionData);
      console.log('Submission created (no files):', response.data);
    }
    
    // Make sure response data exists
    if (!response || !response.data) {
      throw new Error('No response from submission API');
    }
    
    // If we have files but couldn't upload them before, or they weren't associated
    // Try uploading them again with the submission ID
    if (files.length > 0 && 
        response.data && 
        response.data.submissionId && 
        (!response.data.files || !response.data.files.length)) {
      try {
        console.log('Uploading files with submission ID:', response.data.submissionId);
        const { uploadSubmissionFiles } = await import('./fileUploadApi');
        
        // Upload files with the submission ID
        uploadedFiles = await uploadSubmissionFiles(
          assignmentId, 
          files,
          response.data.submissionId
        );
        
        console.log('Files uploaded with submission ID:', uploadedFiles);
        
        // Add the uploaded files to the response
        if (uploadedFiles && uploadedFiles.length > 0) {
          response.data.files = uploadedFiles;
          response.data.attachments = uploadedFiles;
        }
      } catch (uploadError) {
        console.error('Error uploading files with submission ID:', uploadError);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Error in submission process:', error);
    return handleApiError(error, 'Error submitting assignment');
  }
};

/**
 * Get submission by ID
 * GET: api/submissions/{id}
 */
export const getSubmission = async (submissionId: string | number): Promise<any> => {
  try {
    const response = await assignmentApi.get(`/submissions/${submissionId}`);
    console.log('API response for submission details:', response.data);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Error getting submission details');
  }
};

/**
 * Grade submission (teacher only)
 * PUT: api/submissions/{id}/grade
 */
export const gradeSubmission = async (submissionId: string | number, gradeData: any): Promise<any> => {
  try {
    const response = await assignmentApi.put(`/submissions/${submissionId}/grade`, gradeData);
    console.log('API response for grading submission:', response.data);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Error grading submission');
  }
};

/**
 * Add or update feedback (teacher only)
 * PUT: api/submissions/{id}/feedback
 */
export const addFeedback = async (submissionId: string | number, feedback: string): Promise<any> => {
  try {
    const response = await assignmentApi.put(`/submissions/${submissionId}/feedback`, { feedback });
    console.log('API response for adding feedback:', response.data);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Error adding feedback to submission');
  }
};

/**
 * Unsubmit a submission (student only)
 * DELETE: api/submissions/{id}/unsubmit
 */
export const unsubmitAssignment = async (submissionId: string | number): Promise<any> => {
  try {
    const response = await assignmentApi.delete(`/submissions/${submissionId}/unsubmit`);
    console.log('API response for unsubmitting assignment:', response.data);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Error unsubmitting assignment');
  }
};

/**
 * Create or update a submission
 */
export const saveSubmission = async (assignmentId: string | number, submission: any): Promise<any> => {
  try {
    if (submission.id) {
      // Update existing submission
      const response = await assignmentApi.put(`/submissions/${submission.id}`, submission);
      return response.data;
    } else {
      // Create new submission
      const response = await assignmentApi.post(`/assignments/${assignmentId}/submissions`, submission);
      return response.data;
    }
  } catch (error) {
    return handleApiError(error, 'Failed to save submission');
  }
};

/**
 * Get calendar assignments for display on the calendar page
 * GET: api/calendar/assignments
 */
export const getCalendarAssignments = async (): Promise<Assignment[]> => {
  try {
    try {
      // First attempt to get from real API
      const response = await assignmentApi.get<any[]>('/calendar/assignments');
      console.log('API response for calendar assignments:', response.data);
      
      // Map the API response to our Assignment interface
      const assignments = response.data.map(item => ({
        id: item.assignmentId || item.id,
        title: item.title,
        instructions: item.instructions || item.description || '',
        points: item.points?.toString() || '100',
        dueDate: item.dueDate || '',
        dueTime: item.dueTime || '',
        topic: item.topic || 'No topic',
        attachments: item.attachments || [],
        assignTo: item.assignTo || ['All students'],
        scheduledFor: item.scheduledFor || null,
        className: item.className || '',
        section: item.section || '',
        classId: item.classId || '',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt,
        allowLateSubmissions: item.allowLateSubmissions,
        lateSubmissionPolicy: item.lateSubmissionPolicy,
        color: item.color || '#4285f4'
      }));
      
      console.log('Mapped calendar assignments:', assignments);
      return assignments;
    } catch (apiError) {
      // If real API fails, fallback to manual implementation that fetches from each course
      console.warn('Real API endpoint not available, falling back to course-by-course assignment fetching');
      
      // Import course API dynamically to avoid circular dependency
      const courseApi = await import('../api/courseApi');
      
      // Get all courses
      const courses = await courseApi.getCourses();
      
      // Fetch assignments for all courses
      let allAssignments: Assignment[] = [];
      
      for (const course of courses) {
        try {
          const courseAssignments = await getAssignments(course.id);
          // Add course color and name to each assignment
          const enhancedAssignments = courseAssignments.map(assignment => ({
            ...assignment,
            color: course.color || '#4285f4',
            className: course.name,
            section: course.section
          }));
          allAssignments.push(...enhancedAssignments);
        } catch (error) {
          console.error(`Error fetching assignments for course ${course.id}:`, error);
        }
      }
      
      // If we didn't get any assignments, add some test data
      if (allAssignments.length === 0 && courses.length > 0) {
        // Create test assignments
        const today = new Date();
        
        // Generate dates for the current week
        const getCurrentWeekDates = () => {
          const dates: Date[] = [];
          const startOfWeek = new Date(today);
          // Adjust to the start of the week (Sunday)
          startOfWeek.setDate(today.getDate() - today.getDay());
          
          // Generate dates for each day of the week
          for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            dates.push(date);
          }
          return dates;
        };
        
        const weekDates = getCurrentWeekDates();
        
        // Create test assignments for each course, distributed throughout the week
        courses.forEach((course) => {
          // Assign 1-2 assignments per course
          const numAssignments = 1 + Math.floor(Math.random() * 2);
          
          for (let i = 0; i < numAssignments; i++) {
            // Select a date from the current week (avoid using Sunday)
            const dateIndex = 1 + Math.floor(Math.random() * 6); // Monday to Saturday
            const dueDate = weekDates[dateIndex];
            
            // Format date as YYYY-MM-DD
            const formattedDate = dueDate.toISOString().split('T')[0];
            
            // Generate a test assignment
            const testAssignment: Assignment = {
              id: `test-${course.id}-${i}`,
              title: `Assignment ${i + 1} for ${course.name}`,
              instructions: `Complete the following tasks for ${course.name}...`,
              points: '100',
              dueDate: formattedDate,
              dueTime: '11:59 PM',
              topic: 'Test Topic',
              attachments: [],
              assignTo: ['All students'],
              scheduledFor: null,
              className: course.name,
              section: course.section || '',
              classId: course.id,
              createdAt: new Date().toISOString(),
              color: course.color || '#4285f4'
            };
            
            allAssignments.push(testAssignment);
          }
        });
        
        console.log('Added test assignments:', allAssignments);
      }
      
      return allAssignments;
    }
  } catch (error) {
    return handleApiError(error, 'Failed to fetch calendar assignments');
  }
};

/**
 * Download a submission file
 * GET: /api/submissions/{submissionId}/files/{fileId}
 */
export const downloadSubmissionFile = async (submissionId: string | number, fileId: string | number): Promise<Blob> => {
  try {
    console.log(`API: Downloading file ${fileId} from submission ${submissionId}`);
    
    // Based on our API structure, this is the correct endpoint
    const url = `/submissions/${submissionId}/files/${fileId}`;
    console.log(`API: Making request to: ${API_URL}${url}`);
    
    // Set responseType to 'blob' to handle file downloads
    const response = await assignmentApi.get(url, {
      responseType: 'blob'
    });
    
    console.log('API: File download successful');
    return response.data;
  } catch (error) {
    console.error(`API: Failed to download file ${fileId} from submission ${submissionId}`, error);
    return handleApiError(error, `Failed to download file from submission`);
  }
};

/**
 * Create a download link for a submission file and trigger download
 * This is a helper function to easily download files in components
 */
export const downloadAndSaveFile = async (submissionId: string | number, fileId: string | number, fileName: string): Promise<void> => {
  try {
    const blob = await downloadSubmissionFile(submissionId, fileId);
    
    // Create a blob URL and trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

export default {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getSubmissions,
  getMySubmissions,
  getSubmission,
  submitAssignment,
  gradeSubmission,
  addFeedback,
  unsubmitAssignment,
  saveSubmission,
  getCalendarAssignments,
  downloadSubmissionFile,
  downloadAndSaveFile
};