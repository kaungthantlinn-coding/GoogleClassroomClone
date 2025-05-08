import axios from 'axios';
import { AxiosInstance } from 'axios';

const API_URL = 'http://localhost:5203/api';

// Create axios instance for storage
const storageApi: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
storageApi.interceptors.request.use(config => {
  // Get token from sessionStorage (this is still needed for authentication)
  const token = sessionStorage.getItem('auth_token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Storage API functions to replace localStorage
 * These functions make server API calls instead of using client-side storage
 */

// Comments API endpoints
export const getComments = async (announcementId: string | number): Promise<any[]> => {
  try {
    // Using real-world API: GET /api/announcements/{announcementId}/comments
    const response = await storageApi.get(`/announcements/${announcementId}/comments`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get comments for announcement ${announcementId}:`, error);
    return [];
  }
};

export const addComment = async (announcementId: string | number, commentData: any): Promise<any> => {
  try {
    // Using real-world API: POST /api/announcements/{announcementId}/comments
    const response = await storageApi.post(`/announcements/${announcementId}/comments`, commentData);
    return response.data;
  } catch (error) {
    console.error(`Failed to add comment to announcement ${announcementId}:`, error);
    throw error;
  }
};

export const editComment = async (commentId: string | number, content: string): Promise<any> => {
  try {
    // Using real-world API: PUT /api/comments/{commentId}
    const response = await storageApi.put(`/comments/${commentId}`, { content });
    return response.data;
  } catch (error) {
    console.error(`Failed to edit comment ${commentId}:`, error);
    throw error;
  }
};

export const deleteComment = async (commentId: string | number): Promise<any> => {
  try {
    // Using real-world API: DELETE /api/comments/{commentId}
    const response = await storageApi.delete(`/comments/${commentId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete comment ${commentId}:`, error);
    throw error;
  }
};

// Course/class data
export const saveClassData = async (classId: string | number, data: any): Promise<void> => {
  try {
    await storageApi.post(`/user/data/class/${classId}`, { data });
  } catch (error) {
    console.error(`Failed to save class data for ${classId}:`, error);
    throw error;
  }
};

export const getClassData = async (classId: string | number): Promise<any> => {
  try {
    const response = await storageApi.get(`/user/data/class/${classId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to retrieve class data for ${classId}:`, error);
    return null;
  }
};

// Announcements
export const getAnnouncements = async (classId: string | number): Promise<any[]> => {
  try {
    const response = await storageApi.get(`/courses/${classId}/announcements`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get announcements for class ${classId}:`, error);
    return [];
  }
};

// Assignments
export const getAssignments = async (classId: string | number): Promise<any[]> => {
  try {
    const response = await storageApi.get(`/courses/${classId}/assignments`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get assignments for class ${classId}:`, error);
    return [];
  }
};

export const saveAssignment = async (classId: string | number, assignment: any): Promise<any> => {
  try {
    if (assignment.id) {
      // Update existing assignment
      const response = await storageApi.put(`/assignments/${assignment.id}`, assignment);
      return response.data;
    } else {
      // Create new assignment
      const response = await storageApi.post(`/courses/${classId}/assignments`, assignment);
      return response.data;
    }
  } catch (error) {
    console.error(`Failed to save assignment:`, error);
    throw error;
  }
};

export const deleteAssignment = async (assignmentId: string | number): Promise<void> => {
  try {
    await storageApi.delete(`/assignments/${assignmentId}`);
  } catch (error) {
    console.error(`Failed to delete assignment ${assignmentId}:`, error);
    throw error;
  }
};

// Materials
export const getMaterials = async (classId: string | number): Promise<any[]> => {
  try {
    const response = await storageApi.get(`/courses/${classId}/materials`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get materials for class ${classId}:`, error);
    return [];
  }
};

export const saveMaterial = async (classId: string | number, material: any): Promise<any> => {
  try {
    if (material.id) {
      // Update existing material
      const response = await storageApi.put(`/materials/${material.id}`, material);
      return response.data;
    } else {
      // Create new material
      const response = await storageApi.post(`/courses/${classId}/materials`, material);
      return response.data;
    }
  } catch (error) {
    console.error(`Failed to save material:`, error);
    throw error;
  }
};

export const deleteMaterial = async (materialId: string | number): Promise<void> => {
  try {
    await storageApi.delete(`/materials/${materialId}`);
  } catch (error) {
    console.error(`Failed to delete material ${materialId}:`, error);
    throw error;
  }
};

// Submissions
export const getSubmissions = async (assignmentId: string | number): Promise<any[]> => {
  try {
    const response = await storageApi.get(`/assignments/${assignmentId}/submissions`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get submissions for assignment ${assignmentId}:`, error);
    return [];
  }
};

export const saveSubmission = async (assignmentId: string | number, submission: any): Promise<any> => {
  try {
    if (submission.id) {
      // Update existing submission
      const response = await storageApi.put(`/submissions/${submission.id}`, submission);
      return response.data;
    } else {
      // Create new submission
      const response = await storageApi.post(`/assignments/${assignmentId}/submissions`, submission);
      return response.data;
    }
  } catch (error) {
    console.error(`Failed to save submission:`, error);
    throw error;
  }
};

// Course operations
export const updateCourse = async (courseId: string | number, courseData: any): Promise<any> => {
  try {
    // Using real-world API: PUT /api/courses/{courseId}
    // Using PUT as specified in the API documentation
    const response = await storageApi.put(`/courses/${courseId}`, courseData);
    console.log('Course update response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Failed to update course ${courseId}:`, error);
    throw error;
  }
};

export const updateCourseTheme = async (courseId: string | number, themeData: any): Promise<any> => {
  try {
    // Convert courseId to string for consistency
    const courseIdStr = courseId.toString();
    
    // Ensure the color value is properly formatted (hashtag format expected by API)
    let colorValue = themeData.color;
    if (colorValue && !colorValue.startsWith('#')) {
      colorValue = `#${colorValue}`;
    }
    
    // Create the theme update data with the EXACT field names expected by the API
    // Based on the provided API implementation
    const themeUpdateData = {
      courseId: courseIdStr,       // The course ID
      themeColor: colorValue,      // NOTE: Using 'themeColor' as expected by the API
      headerImage: themeData.coverImage  // NOTE: Using 'headerImage' as expected by the API
    };
    
    console.log('Updating course theme with correct field names:', themeUpdateData);
    
    // Use the dedicated theme update endpoint with PUT as specified in API docs
    // PUT: api/courses/theme
    const response = await storageApi.put('/courses/theme', themeUpdateData);
    console.log('Course theme update response:', response.data);
    
    // After a successful theme update, save the theme data to localStorage as a fallback
    // This ensures it can be retrieved even if the API cache isn't updated properly
    try {
      // Create a theme cache to store themes by courseId
      let themeCache = JSON.parse(localStorage.getItem('themeCache') || '{}');
      
      // Update the cache with the new theme
      themeCache[courseIdStr] = {
        color: colorValue,
        coverImage: themeData.coverImage,
        updatedAt: new Date().toISOString()
      };
      
      // Save the updated cache back to localStorage
      localStorage.setItem('themeCache', JSON.stringify(themeCache));
      console.log(`Saved theme for course ${courseIdStr} to local cache`);
      
      // Dispatch a global event that can be listened to by any component
      window.dispatchEvent(new CustomEvent('themeUpdated', { 
        detail: { 
          courseId: courseIdStr, 
          theme: {
            color: colorValue,
            coverImage: themeData.coverImage
          } 
        } 
      }));
    } catch (cacheError) {
      console.error('Failed to update theme cache:', cacheError);
      // Continue anyway since the theme update itself succeeded
    }
    
    return response.data;
  } catch (error) {
    console.error(`Failed to update course theme for ${courseId}:`, error);
    throw error;
  }
};

// User preferences/settings
export const getUserPreferences = async (): Promise<any> => {
  try {
    const response = await storageApi.get('/user/preferences');
    return response.data;
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    return {};
  }
};

export const saveUserPreferences = async (preferences: any): Promise<void> => {
  try {
    await storageApi.post('/user/preferences', preferences);
  } catch (error) {
    console.error('Failed to save user preferences:', error);
    throw error;
  }
};

// Generic data storage (for any other data previously stored in localStorage)
export const getData = async (key: string): Promise<any> => {
  try {
    const response = await storageApi.get(`/user/data/${key}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get data for key ${key}:`, error);
    return null;
  }
};

export const saveData = async (key: string, data: any): Promise<void> => {
  try {
    await storageApi.post(`/user/data/${key}`, { data });
  } catch (error) {
    console.error(`Failed to save data for key ${key}:`, error);
    throw error;
  }
};

export const deleteData = async (key: string): Promise<void> => {
  try {
    await storageApi.delete(`/user/data/${key}`);
  } catch (error) {
    console.error(`Failed to delete data for key ${key}:`, error);
    throw error;
  }
}; 