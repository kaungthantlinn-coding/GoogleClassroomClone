import axios, { AxiosError } from 'axios';
import { Assignment } from '../types/assignment';
import { getApiBaseUrl } from '../utils/apiMode';

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
    if (!response.data) {
      console.warn('API: Empty response when creating assignment');
      // Return the original data with a temporary ID to prevent errors
      return {
        ...assignment as Assignment,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
    }
    
    // Determine if the response contains what we need
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
 * Submit assignment (student only)
 * POST: api/assignments/{assignmentId}/submissions
 */
export const submitAssignment = async (assignmentId: string | number, submission: any): Promise<any> => {
  try {
    // Extract files from submission data if they exist
    const files = submission.files ? [...submission.files] : [];
    
    // Create a copy of submission without the file objects (to prevent circular references)
    const submissionData = { ...submission };
    
    // Replace file objects with just the metadata
    if (submissionData.files && Array.isArray(submissionData.files)) {
      submissionData.files = submissionData.files.map(file => {
        // If it's a File object, extract its metadata
        if (file instanceof File) {
          return {
            name: file.name,
            type: file.type,
            size: file.size
          };
        }
        return file;
      });
    }
    
    // Make API call to create the submission
    const response = await assignmentApi.post(`/assignments/${assignmentId}/submissions`, submissionData);
    
    console.log('API response for submission creation:', response.data);
    
    // If we have actual File objects and the submission was created successfully
    // we could call a separate endpoint to handle file uploads
    if (files.length > 0 && response.data && response.data.id) {
      try {
        // Import the file upload API lazily to avoid circular dependencies
        const { uploadSubmissionFiles } = await import('./fileUploadApi');
        
        // Upload the files and associate them with this submission
        const uploadedFiles = await uploadSubmissionFiles(
          assignmentId, 
          files.filter(f => f instanceof File)
        );
        
        // Add the uploaded files to the response
        response.data.files = uploadedFiles;
        
        console.log('Files uploaded successfully:', uploadedFiles);
      } catch (uploadError) {
        console.error('Error uploading files:', uploadError);
        // Continue with the submission even if file upload fails
      }
    }
    
    return response.data;
  } catch (error) {
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

export default {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getSubmissions,
  getSubmission,
  submitAssignment,
  gradeSubmission,
  addFeedback,
  unsubmitAssignment,
  saveSubmission
}; 