import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { Announcement, CommentInput, Comment } from '../types/announcement';

// The base URL should include /api as a prefix for all endpoints
const API_URL = 'http://localhost:5203/api';

// Log the API URL during initialization
console.log(`Announcement API initialized with base URL: ${API_URL}`);

// Cache for debouncing identical requests
const requestCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 10000; // 10 seconds cache

// Create an axios instance
const announcementApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
const addAuthToken = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  let token = sessionStorage.getItem('auth_token');
  
  // For development purposes, if no token exists, create a dummy one
  if (!token) {
    token = 'dev-dummy-token';
    console.warn('Using development dummy token. This should not happen in production.');
    sessionStorage.setItem('auth_token', token);
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Log all outgoing requests
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data);
  
  return config;
};

announcementApi.interceptors.request.use(addAuthToken);

// Add response interceptor to handle rate limiting and log responses
announcementApi.interceptors.response.use(
  response => {
    // Log successful responses
    console.log(`API Response (${response.status}): ${response.config.method?.toUpperCase()} ${response.config.url}`, 
      response.data ? 'Data received' : 'No data');
    return response;
  },
  async (error: AxiosError) => {
    const statusCode = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    
    // Log failed responses
    console.error(`API Error (${statusCode}): ${method} ${url}`, error.response?.data || error.message);
    
    // Handle rate limiting (429 Too Many Requests)
    if (statusCode === 429) {
      console.warn('Rate limit exceeded. Implementing exponential backoff.');
      
      // Get retry-after header or default to 2 seconds
      const retryAfter = parseInt(error.response?.headers['retry-after'] || '2', 10);
      
      // Wait for the specified time
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      
      // Retry the request
      return announcementApi.request(error.config as any);
    }
    
    return Promise.reject(error);
  }
);

// Error handler helper
const handleApiError = (error: any, defaultMessage: string) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      // The server responded with a status code outside of 2xx
      const data = axiosError.response.data as any;
      if (data && data.message) {
        throw new Error(data.message);
      } else if (data && typeof data === 'string') {
        throw new Error(data);
      }
    } else if (axiosError.request) {
      // The request was made but no response was received
      throw new Error('No response received from server. Please check your connection.');
    }
  }
  // Default error
  console.error(defaultMessage, error);
  throw new Error(defaultMessage);
};

// Helper function for caching GET requests
const cachedGet = async <T>(url: string, params?: any): Promise<T> => {
  const cacheKey = `${url}:${JSON.stringify(params || {})}`;
  const now = Date.now();
  
  // Check cache
  if (requestCache[cacheKey] && (now - requestCache[cacheKey].timestamp) < CACHE_TTL) {
    console.log(`Using cached response for ${url}`);
    return requestCache[cacheKey].data;
  }
  
  // Make the actual request
  try {
    const response = await announcementApi.get<T>(url, { params });
    // Store in cache
    requestCache[cacheKey] = {
      data: response.data,
      timestamp: now
    };
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Helper function to safely check if an ID is generated
const isGeneratedId = (id: string | number | undefined): boolean => {
  if (!id) return false;
  const idStr = String(id);
  return idStr.startsWith('generated-') || idStr.startsWith('local-') || idStr.startsWith('created-');
};

// API Functions
export const getAnnouncements = async (courseId: string): Promise<Announcement[]> => {
  try {
    if (!courseId || courseId === 'undefined') {
      console.error('Invalid course ID provided for getting announcements:', courseId);
      return [];
    }
    
    // Determine if the ID is a GUID
    const isGuid = typeof courseId === 'string' && courseId.includes('-');
    let endpoint = '';
    
    if (isGuid) {
      console.log('Using GUID endpoint format for fetching announcements');
      endpoint = `/courses/guid/${courseId}/announcements`;
    } else {
      console.log('Using numeric ID endpoint format for fetching announcements');
      endpoint = `/courses/${courseId}/announcements`;
    }
    
    const response = await cachedGet<any[]>(endpoint);
    
    // Map API response to the expected Announcement format
    const announcements = response.map(item => {
      // Log the raw item to see what fields are available
      console.log('Raw announcement data from API:', item);
      
      // Check for different possible ID field names
      let id = item.id || item.announcementId || item.announcementGuid || null;
      
      // When the server doesn't provide an ID, generate one and log a warning
      if (!id) {
        console.warn('Found announcement without ID, generating fallback ID');
        id = `generated-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
      
      // Ensure all required fields exist with fallbacks
      return {
        id: id,
        classId: item.classId || item.courseId || courseId,
        content: item.content || item.text || item.message || '',
        authorId: item.authorId || item.userId || '1004',
        authorName: item.authorName || item.userName || 'User',
        authorAvatar: item.authorAvatar || item.userAvatar,
        createdAt: item.createdAt || item.dateCreated || new Date().toISOString(),
        updatedAt: item.updatedAt || item.dateUpdated,
        attachments: item.attachments || [],
        comments: (item.comments || []).map((comment: any) => ({
          id: comment.id || `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          content: comment.content || comment.text || '',
          authorId: comment.authorId || comment.userId || '1004',
          authorName: comment.authorName || comment.userName || 'User',
          authorAvatar: comment.authorAvatar || comment.userAvatar,
          createdAt: comment.createdAt || comment.dateCreated || new Date().toISOString(),
          updatedAt: comment.updatedAt || comment.dateUpdated
        }))
      };
    });
    
    console.log(`Fetched ${announcements.length} announcements for course ${courseId}`);
    return announcements;
  } catch (error) {
    console.error(`Failed to fetch announcements for course ${courseId}:`, error);
    return []; // Return empty array on error
  }
};

export const createAnnouncement = async (announcement: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
  try {
    // Validate classId
    if (!announcement.classId) {
      console.error('Missing classId in announcement data:', announcement);
      throw new Error('Missing classId in announcement data');
    }
    
    // Log the data being sent to help with debugging
    console.log(`Creating announcement for class: ${announcement.classId}`, announcement);

    // Determine the correct endpoint based on ID format
    const isGuid = typeof announcement.classId === 'string' && announcement.classId.includes('-');
    let endpoint = '';
    
    if (isGuid) {
      console.log('Using GUID endpoint format');
      endpoint = `/courses/guid/${announcement.classId}/announcements`;
    } else {
      console.log('Using numeric ID endpoint format');
      endpoint = `/courses/${announcement.classId}/announcements`;
    }

    // Prepare the data in the format expected by the API
    const apiData = {
      classId: announcement.classId,
      content: announcement.content,
      authorId: announcement.authorId || '1004',
      authorName: announcement.authorName || 'User',
      attachments: announcement.attachments || []
    };

    // Make API call with the appropriate endpoint
    const response = await announcementApi.post(endpoint, apiData);
    
    // Log the raw response data
    console.log('Raw API response for create announcement:', response.data);

    // Ensure the returned announcement has a valid ID and is in the expected format
    const createdAnnouncement: Announcement = {
      id: response.data.id || response.data.announcementId || response.data.announcementGuid || 
          `created-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      classId: response.data.classId || response.data.courseId || announcement.classId,
      content: response.data.content || response.data.text || response.data.message || announcement.content,
      authorId: response.data.authorId || response.data.userId || announcement.authorId,
      authorName: response.data.authorName || response.data.userName || announcement.authorName,
      authorAvatar: response.data.authorAvatar || response.data.userAvatar || announcement.authorAvatar,
      createdAt: response.data.createdAt || response.data.dateCreated || new Date().toISOString(),
      updatedAt: response.data.updatedAt || response.data.dateUpdated,
      attachments: response.data.attachments || announcement.attachments || [],
      comments: (response.data.comments || []).map((comment: any) => ({
        id: comment.id || `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        content: comment.content || comment.text || '',
        authorId: comment.authorId || comment.userId || '1004',
        authorName: comment.authorName || comment.userName || 'User',
        authorAvatar: comment.authorAvatar || comment.userAvatar,
        createdAt: comment.createdAt || comment.dateCreated || new Date().toISOString(),
        updatedAt: comment.updatedAt || comment.dateUpdated
      }))
    };

    // Log success with the processed announcement
    console.log(`Successfully created announcement with ID: ${createdAnnouncement.id}`);
    
    // Invalidate cache for this course's announcements
    const cacheKey = `/courses/${announcement.classId}/announcements:{}`;
    delete requestCache[cacheKey];
    
    // Also invalidate GUID-based cache if applicable
    if (isGuid) {
      const guidCacheKey = `/courses/guid/${announcement.classId}/announcements:{}`;
      delete requestCache[guidCacheKey];
    }
    
    return createdAnnouncement;
  } catch (error) {
    // Enhanced error logging
    console.error(`Failed to create announcement for class ${announcement.classId || 'unknown'}:`, error);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error(`Server response:`, error.response.data);
    }
    
    // In development, automatically create a fallback without throwing errors
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Creating fallback announcement in development mode');
      const fallbackAnnouncement: Announcement = {
        ...announcement,
        id: `local-${Date.now()}`,
        createdAt: new Date().toISOString(),
        comments: []
      };
      
      return fallbackAnnouncement;
    }
    
    return handleApiError(error, 'Failed to create announcement');
  }
};

export const updateAnnouncement = async (announcementId: string | number, announcement: Partial<Announcement>): Promise<Announcement> => {
  try {
    // Validate the announcement ID
    if (!announcementId || announcementId === 'undefined') {
      console.error('Invalid announcement ID provided for update:', announcementId);
      throw new Error(`Invalid announcement ID: ${announcementId}`);
    }
    
    // Check if this is a generated ID
    if (isGeneratedId(announcementId)) {
      console.warn(`Trying to update announcement with generated ID: ${announcementId}`);
      console.warn('This announcement only exists in the frontend and not on the server.');
      
      // For generated IDs, we need special handling
      if (announcement.classId && announcement.content) {
        // If we have enough data, create a new announcement instead
        console.log('Creating new announcement instead of updating generated one');
        
        // Prepare data for a new announcement
        const newAnnouncementData: any = {
          classId: announcement.classId,
          content: announcement.content,
          authorId: announcement.authorId || '1004',
          authorName: announcement.authorName || 'User',
          attachments: announcement.attachments || []
        };
        
        // Create a new announcement instead
        return await createAnnouncement(newAnnouncementData);
      } else {
        // Not enough data to create a new one - return the original with updated fields
        console.log('Returning locally updated announcement (not saved to server)');
        return {
          ...announcement,
          id: announcementId,
          updatedAt: new Date().toISOString()
        } as Announcement;
      }
    }
    
    console.log(`Making API call to update announcement: ${announcementId}`);
    const response = await announcementApi.put<Announcement>(`/announcements/${announcementId}`, announcement);
    
    // Create a unique key for this update request based on ID and content
    const updateKey = `update_${announcementId}_${JSON.stringify(announcement)}`;
    const now = Date.now();
    
    // Cache this update result
    requestCache[updateKey] = {
      data: response.data,
      timestamp: now
    };
    
    // Invalidate cache for all announcements since we don't know which course this belongs to
    Object.keys(requestCache).forEach(key => {
      if (key.includes('/api/announcements') && !key.includes('update_')) {
        delete requestCache[key];
      }
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to update announcement ${announcementId}`);
  }
};

export const deleteAnnouncement = async (announcementId: string | number): Promise<void> => {
  try {
    // Validate the announcement ID
    if (!announcementId || announcementId === 'undefined') {
      console.error('Invalid announcement ID provided for deletion:', announcementId);
      throw new Error(`Invalid announcement ID: ${announcementId}`);
    }
    
    // Check if this is a generated ID
    if (isGeneratedId(announcementId)) {
      console.warn(`Deleting locally generated announcement: ${announcementId}`);
      console.warn('This announcement only exists in the frontend and not on the server.');
      // For generated IDs, we just pretend it was deleted successfully
      return Promise.resolve();
    }
    
    // Create a unique key for this delete request
    const deleteKey = `delete_${announcementId}`;
    const now = Date.now();
    
    // Check if we have a recent identical delete request
    if (requestCache[deleteKey] && (now - requestCache[deleteKey].timestamp) < 2000) {
      console.log(`Skipping duplicate delete request for announcement: ${announcementId}`);
      return Promise.resolve();
    }
    
    console.log(`Making API call to delete announcement: ${announcementId}`);
    await announcementApi.delete(`/announcements/${announcementId}`);
    
    // Cache this delete operation
    requestCache[deleteKey] = {
      data: true,
      timestamp: now
    };
    
    // Invalidate cache for all announcements
    Object.keys(requestCache).forEach(key => {
      if (key.includes('/api/announcements') && !key.includes('delete_')) {
        delete requestCache[key];
      }
    });
    
    return Promise.resolve();
  } catch (error) {
    return handleApiError(error, `Failed to delete announcement ${announcementId}`);
  }
};

export const getComments = async (announcementId: string | number): Promise<Comment[]> => {
  try {
    // Validate the announcement ID
    if (!announcementId || announcementId === 'undefined') {
      console.error('Invalid announcement ID provided for fetching comments:', announcementId);
      throw new Error(`Invalid announcement ID: ${announcementId}`);
    }
    
    // Since API_URL already includes /api, we don't need to include it in the path
    console.log(`Fetching comments for announcement: ${announcementId}`);
    const response = await announcementApi.get<any[]>(`/announcements/${announcementId}/comments`);
    
    console.log(`Received response for comments from: ${announcementId}`, response.data);
    return processCommentsResponse(response);
  } catch (error) {
    console.error(`Failed to fetch comments for announcement ${announcementId}:`, error);
    return []; // Return empty array instead of throwing to avoid breaking the UI
  }
};

// Helper function to process comments response
const processCommentsResponse = (response: any) => {
  // Map API response to the expected Comment format
  const comments = (response.data || []).map((comment: any, index: number) => {
    // Check for missing comment ID and generate one if needed
    const commentId = comment.id || comment.commentId || `generated-comment-${Date.now()}-${index}`;
    
    console.log(`Processing comment from API:`, {
      originalId: comment.id,
      generatedId: commentId,
      content: comment.content || comment.text || ''
    });
    
    return {
      id: commentId, // Ensure ID is always present
      content: comment.content || comment.text || '',
      authorId: comment.authorId || comment.userId || '1004',
      authorName: comment.authorName || comment.userName || 'User',
      authorAvatar: comment.authorAvatar || comment.userAvatar,
      createdAt: comment.createdAt || comment.dateCreated || new Date().toISOString(),
      updatedAt: comment.updatedAt || comment.dateUpdated
    };
  });
  
  console.log(`Processed ${comments.length} comments from response`);
  return comments;
};

export const addComment = async (announcementId: string | number, comment: CommentInput): Promise<Announcement> => {
  try {
    // Validate inputs
    if (!announcementId || announcementId === 'undefined') {
      console.error('Invalid announcementId provided to addComment:', announcementId);
      throw new Error('Invalid announcement ID');
    }
    if (!comment.text.trim()) {
      console.error('Empty comment text provided to addComment');
      throw new Error('Comment text cannot be empty');
    }
    
    // Transform the comment data to match the expected API format
    const apiCommentData = {
      content: comment.text,
      authorId: comment.userId,
      authorName: comment.userName
    };
    
    // Log the API call
    console.log(`Making API call to add comment to announcement ${announcementId}:`, apiCommentData);
    
    // Since API_URL already includes /api, we don't need to include it in the path
    const response = await announcementApi.post<Announcement>(
      `/announcements/${announcementId}/comments`, 
      apiCommentData
    );
    
    console.log(`Successfully added comment to announcement ${announcementId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to add comment to announcement ${announcementId}:`, error);
    throw error;
  }
};

export const editComment = async (commentId: string, commentData: string | { content: string }): Promise<Announcement> => {
  try {
    // Validate comment ID
    if (!commentId || commentId === 'undefined') {
      console.error('Invalid commentId provided to editComment:', commentId);
      throw new Error(`Cannot edit comment: Invalid comment ID: ${commentId}`);
    }
    
    // Handle different parameter types - string or object with content property
    const content = typeof commentData === 'string' ? commentData : commentData.content;
    
    // Validate content
    if (!content.trim()) {
      console.error('Empty content provided to editComment');
      throw new Error('Comment content cannot be empty');
    }
    
    console.log(`Making API call to edit comment ${commentId} with content: ${content}`);
    
    // Since API_URL already includes /api, we don't need to include it in the path
    const response = await announcementApi.put<Announcement>(
      `/comments/${commentId}`, 
      { content }
    );
    
    console.log(`Successfully edited comment ${commentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error editing comment ${commentId}:`, error);
    throw error;
  }
};

export const deleteComment = async (_announcementId: string | number | null, commentId: string): Promise<Announcement> => {
  try {
    // Validate the comment ID
    if (!commentId || commentId === 'undefined') {
      console.error('Invalid commentId provided to deleteComment:', commentId);
      throw new Error(`Invalid comment ID: ${commentId}`);
    }
    
    // Since API_URL already includes /api, we don't need to include it in the path
    console.log(`Making API call to delete comment: ${commentId}`);
    const response = await announcementApi.delete<Announcement>(`/comments/${commentId}`);
    
    console.log(`Successfully deleted comment ${commentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting comment ${commentId}:`, error);
    throw error;
  }
};