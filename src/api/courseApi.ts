import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { Course } from '../types/course';

const API_URL = 'http://localhost:5203/api/courses';

// Types for request/response
interface CreateCourseRequest {
  name: string;
  section: string;
  teacherName?: string;
  subject?: string;
  room?: string;
  color?: string;
  textColor?: string;
  coverImage?: string;
  enrollmentCode?: string;
}

interface UpdateCourseRequest extends CreateCourseRequest {
  id: string;
  coverImage?: string;
  enrollmentCode?: string;
}

interface EnrollmentCodeResponse {
  enrollmentCode: string;
}

// Create an axios instance
const courseApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000 // Add a timeout to prevent hanging requests
});

// Default auth token that works with the API
const DEFAULT_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDA0IiwiZW1haWwiOiJ0ZWFjaGVyMUBnbWFpbC5jb20iLCJqdGkiOiIwYmZhYjBiZi1kZWY0LTQyNWMtYTA2YS1kNDFiNDJmYzUxNGUiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoidGVhY2hlciIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IlRlYWNoZXIiLCJleHAiOjE3NDYzNjE4ODgsImlzcyI6IkNsYXNzcm9vbUFQSSIsImF1ZCI6IkNsYXNzcm9vbUNsaWVudCJ9._-a-uyMdr3VMBEnRWDfjLCq_bfvQnOmCL4jApTiZH-4';

// Add token to requests if available
const addAuthToken = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  // First try to get token from sessionStorage
  let token = sessionStorage.getItem('auth_token');
  
  // Then try localStorage as fallback
  if (!token) {
    token = localStorage.getItem('auth_token');
  }
  
  // Check for token in cookies as a third option
  if (!token) {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
    if (authCookie) {
      token = authCookie.split('=')[1];
    }
  }
  
  // For development purposes, if no token exists, use the default token
  if (!token) {
    token = DEFAULT_AUTH_TOKEN;
    console.warn('Using default auth token. In production, this should be a user-specific token.');
    // Store it in sessionStorage for future requests
    try {
      sessionStorage.setItem('auth_token', token);
      
      // Also store in localStorage for persistence
      localStorage.setItem('auth_token', token);
    } catch (e) {
      console.error('Failed to store token in storage:', e);
    }
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Add response interceptor to handle token refresh if needed
courseApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't already tried to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Reset the token to the default token in development
      sessionStorage.setItem('auth_token', DEFAULT_AUTH_TOKEN);
      localStorage.setItem('auth_token', DEFAULT_AUTH_TOKEN);
      
      // Update the Authorization header with the default token
      originalRequest.headers.Authorization = `Bearer ${DEFAULT_AUTH_TOKEN}`;
      
      // Retry the original request with the new token
      return courseApi(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

courseApi.interceptors.request.use(addAuthToken);

// Error handler helper
const handleApiError = (error: any, defaultMessage: string) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    console.error('API Error:', {
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      data: axiosError.response?.data,
      headers: axiosError.response?.headers,
      config: {
        url: axiosError.config?.url,
        method: axiosError.config?.method,
        headers: axiosError.config?.headers
      }
    });
    
    if (axiosError.response) {
      // The server responded with a status code outside of 2xx
      const data = axiosError.response.data as any;
      const statusCode = axiosError.response.status;
      
      if (statusCode === 429) {
        throw new Error('Too many requests. Please try again later.');
      }
      
      if (statusCode === 401 || statusCode === 403) {
        throw new Error('Authentication error. Please log in again.');
      }
      
      if (data && data.message) {
        throw new Error(data.message);
      } else if (data && typeof data === 'string') {
        throw new Error(data);
      }
      
      throw new Error(`Server error (${statusCode}): ${axiosError.response.statusText || defaultMessage}`);
    } else if (axiosError.request) {
      // The request was made but no response was received
      throw new Error('No response received from server. Please check your connection.');
    }
  }
  // Default error
  console.error(defaultMessage, error);
  throw new Error(defaultMessage);
};

// Add a cache for course data to reduce duplicate API calls
const courseCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 60000; // 1 minute cache for courses

// Helper function to get course data with caching
const getCachedCourse = async (id: string): Promise<Course> => {
  // Normalize the ID to handle different formats
  const normalizedId = id.trim().toLowerCase();
  
  // Check if we have this course in the cache
  if (courseCache[normalizedId] && (Date.now() - courseCache[normalizedId].timestamp) < CACHE_TTL) {
    console.log(`Using cached course data for ID: ${id}`);
    return courseCache[normalizedId].data;
  }
  
  try {
    // Check if the id is a GUID (contains hyphens)
    const isGuid = normalizedId.includes('-');
    
    let response;
    if (isGuid) {
      response = await courseApi.get<Course>(`/guid/${id}`);
    } else {
      response = await courseApi.get<Course>(`/${id}`);
    }
    
    // Map API response to expected frontend format if needed
    const courseData = response.data;
    if (courseData.courseId && !courseData.id) {
      courseData.id = courseData.courseId.toString();
    }
    
    // Store in cache using multiple keys for different IDs
    const now = Date.now();
    courseCache[normalizedId] = { data: courseData, timestamp: now };
    
    // Also cache by numeric ID and GUID if available
    if (courseData.courseId) {
      courseCache[courseData.courseId.toString()] = { data: courseData, timestamp: now };
    }
    if (courseData.courseGuid) {
      courseCache[courseData.courseGuid.toLowerCase()] = { data: courseData, timestamp: now };
    }
    
    return courseData;
  } catch (error) {
    throw error;
  }
};

// API Functions
export const getCourses = async (): Promise<Course[]> => {
  try {
    const response = await courseApi.get<Course[]>('');
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to fetch courses');
  }
};

export const getCourseById = async (id: string): Promise<Course> => {
  if (!id || id === 'undefined') {
    console.error('Invalid course ID provided:', id);
    return Promise.reject(new Error(`Invalid course ID: ${id}`));
  }
  
  try {
    return await getCachedCourse(id);
  } catch (error) {
    return handleApiError(error, `Failed to fetch course with ID ${id}`);
  }
};

export const getCourseByGuid = async (guid: string): Promise<Course> => {
  if (!guid || guid === 'undefined') {
    console.error('Invalid course GUID provided:', guid);
    return Promise.reject(new Error(`Invalid course GUID: ${guid}`));
  }
  
  try {
    const response = await courseApi.get<Course>(`/guid/${guid}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to fetch course with GUID ${guid}`);
  }
};

export const getCourseDetailByGuid = async (guid: string): Promise<Course> => {
  try {
    const response = await courseApi.get<Course>(`/guid/${guid}/detail`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to fetch detailed course with GUID ${guid}`);
  }
};

export const getCourseDetail = async (id: string): Promise<Course> => {
  try {
    const response = await courseApi.get<Course>(`/${id}/detail`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to fetch detailed course with ID ${id}`);
  }
};

export const getCourseMembers = async (id: string): Promise<any[]> => {
  try {
    const response = await courseApi.get<any[]>(`/${id}/members`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to fetch members for course with ID ${id}`);
  }
};

export const createCourse = async (courseData: CreateCourseRequest): Promise<Course> => {
  try {
    console.log('Creating course with data:', courseData);
    
    // Make the API call
    const response = await courseApi.post<Course>('', courseData);
    
    console.log('Course created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Error Details:', error);
    return handleApiError(error, 'Failed to create course');
  }
};

export const updateCourse = async (id: string, courseData: UpdateCourseRequest): Promise<Course> => {
  if (!id || id === 'undefined') {
    console.error('Invalid course ID provided for update:', id);
    return Promise.reject(new Error(`Invalid course ID for update: ${id}`));
  }
  
  try {
    // Check if the id is a GUID (contains hyphens)
    const isGuid = id.includes('-');
    
    let response;
    if (isGuid) {
      response = await courseApi.put<Course>(`/guid/${id}`, courseData);
    } else {
      response = await courseApi.put<Course>(`/${id}`, courseData);
    }
    
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to update course with ID ${id}`);
  }
};

export const deleteCourse = async (id: string): Promise<void> => {
  if (!id || id === 'undefined') {
    console.error('Invalid course ID provided for deletion:', id);
    return Promise.reject(new Error(`Invalid course ID for deletion: ${id}`));
  }
  
  try {
    // Check if the id is a GUID (contains hyphens)
    const isGuid = id.includes('-');
    
    if (isGuid) {
      await courseApi.delete(`/guid/${id}`);
    } else {
      await courseApi.delete(`/${id}`);
    }
    return Promise.resolve();
  } catch (error) {
    return handleApiError(error, `Failed to delete course with ID ${id}`);
  }
};

export const enrollCourse = async (id: string): Promise<void> => {
  try {
    await courseApi.post(`/${id}/enroll`);
    return Promise.resolve();
  } catch (error) {
    return handleApiError(error, `Failed to enroll in course with ID ${id}`);
  }
};

export const unenrollCourse = async (id: string): Promise<void> => {
  try {
    await courseApi.post(`/${id}/unenroll`);
    return Promise.resolve();
  } catch (error) {
    return handleApiError(error, `Failed to unenroll from course with ID ${id}`);
  }
};

export const generateEnrollmentCode = async (): Promise<string> => {
  try {
    const response = await courseApi.get<EnrollmentCodeResponse>('/generate-enrollment-code');
    return response.data.enrollmentCode;
  } catch (error) {
    return handleApiError(error, 'Failed to generate enrollment code');
  }
};

export const getEnrollmentCode = async (id: string): Promise<string> => {
  try {
    const response = await courseApi.get<EnrollmentCodeResponse>(`/${id}/enrollment-code`);
    return response.data.enrollmentCode;
  } catch (error) {
    return handleApiError(error, `Failed to fetch enrollment code for course with ID ${id}`);
  }
};

export const regenerateEnrollmentCode = async (id: string): Promise<string> => {
  try {
    const response = await courseApi.post<EnrollmentCodeResponse>(`/${id}/regenerate-enrollment-code`);
    return response.data.enrollmentCode;
  } catch (error) {
    return handleApiError(error, `Failed to regenerate enrollment code for course with ID ${id}`);
  }
};

export const regenerateColors = async (id: string): Promise<Course> => {
  try {
    const response = await courseApi.post<Course>(`/${id}/regenerate-colors`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to regenerate colors for course with ID ${id}`);
  }
};

export const removeMember = async (courseId: string, userId: string): Promise<void> => {
  try {
    await courseApi.delete(`/${courseId}/members/${userId}`);
    return Promise.resolve();
  } catch (error) {
    return handleApiError(error, `Failed to remove member ${userId} from course ${courseId}`);
  }
}; 