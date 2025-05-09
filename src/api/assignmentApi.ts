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
    // POST: api/courses/{courseId}/assignments
    const response = await assignmentApi.post<Assignment>(`/courses/${courseId}/assignments`, assignment);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to create assignment');
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
 * Get all submissions for an assignment
 */
export const getSubmissions = async (assignmentId: string | number): Promise<any[]> => {
  try {
    const response = await assignmentApi.get(`/assignments/${assignmentId}/submissions`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to fetch submissions for assignment ${assignmentId}`);
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
  saveSubmission
}; 