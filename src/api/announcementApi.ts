import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { Announcement } from '../types/announcement';

const API_URL = 'http://localhost:5203/api/announcements';

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
  return config;
};

announcementApi.interceptors.request.use(addAuthToken);

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

// API Functions
export const getAnnouncements = async (courseId: string): Promise<Announcement[]> => {
  try {
    if (!courseId || courseId === 'undefined') {
      console.error('Invalid course ID provided for getting announcements:', courseId);
      return [];
    }
    
    const response = await announcementApi.get<Announcement[]>(`/course/${courseId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch announcements for course ${courseId}:`, error);
    return []; // Return empty array on error
  }
};

export const createAnnouncement = async (announcement: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
  try {
    const response = await announcementApi.post<Announcement>('', announcement);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to create announcement');
  }
};

export const updateAnnouncement = async (announcementId: string, announcement: Partial<Announcement>): Promise<Announcement> => {
  try {
    const response = await announcementApi.put<Announcement>(`/${announcementId}`, announcement);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to update announcement ${announcementId}`);
  }
};

export const deleteAnnouncement = async (announcementId: string): Promise<void> => {
  try {
    await announcementApi.delete(`/${announcementId}`);
    return Promise.resolve();
  } catch (error) {
    return handleApiError(error, `Failed to delete announcement ${announcementId}`);
  }
};

export const addComment = async (announcementId: string, comment: { userId: string; userName: string; text: string }): Promise<Announcement> => {
  try {
    const response = await announcementApi.post<Announcement>(`/${announcementId}/comments`, comment);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to add comment to announcement ${announcementId}`);
  }
};

export const deleteComment = async (announcementId: string, commentId: string): Promise<Announcement> => {
  try {
    const response = await announcementApi.delete<Announcement>(`/${announcementId}/comments/${commentId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to delete comment ${commentId} from announcement ${announcementId}`);
  }
}; 