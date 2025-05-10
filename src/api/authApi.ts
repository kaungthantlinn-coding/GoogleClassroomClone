import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { User } from '../types/course';

const API_URL = 'http://localhost:5203/api/Auth';
const USER_SETTINGS_URL = 'http://localhost:5203/api/UserSettings';

// Types for request/response
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'teacher' | 'student';
}

interface AuthResponse {
  user: User;
  token: string;
}

interface UserSettings {
  name: string;
  email: string;
  avatar?: string;
  role: string;
  emailNotifications: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// Create an axios instance
const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a user settings axios instance
const userSettingsApi = axios.create({
  baseURL: USER_SETTINGS_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
const addAuthToken = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

authApi.interceptors.request.use(addAuthToken);
userSettingsApi.interceptors.request.use(addAuthToken);

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

export const login = async (credentials: LoginRequest): Promise<User> => {
  try {
    const response = await authApi.post<AuthResponse>('/login', credentials);
    
    // Validate response format
    if (!response.data.token) {
      throw new Error('Invalid response: Missing authentication token');
    }
    
    // Store token in sessionStorage
    sessionStorage.setItem('auth_token', response.data.token);
    
    // Store user role
    if (response.data.user && response.data.user.role) {
      sessionStorage.setItem('user_role', response.data.user.role);
      localStorage.setItem('user_role', response.data.user.role);
    }
    
    return response.data.user;
  } catch (error) {
    return handleApiError(error, 'Login failed. Please check your credentials.');
  }
};

export const register = async (userData: RegisterRequest): Promise<User> => {
  try {
    const response = await authApi.post<AuthResponse>('/register', userData);
    
    // Validate response format
    if (!response.data.token) {
      throw new Error('Invalid response: Missing authentication token');
    }
    
    // Store token in sessionStorage
    sessionStorage.setItem('auth_token', response.data.token);
    
    // Store user role
    if (response.data.user && response.data.user.role) {
      sessionStorage.setItem('user_role', response.data.user.role);
      localStorage.setItem('user_role', response.data.user.role);
    }
    
    return response.data.user;
  } catch (error) {
    return handleApiError(error, 'Registration failed. Please try again.');
  }
};

export const logout = (): void => {
  // Remove token from sessionStorage and localStorage
  sessionStorage.removeItem('auth_token');
  localStorage.removeItem('auth_token');
  
  // Remove user role
  sessionStorage.removeItem('user_role');
  localStorage.removeItem('user_role');
  
  // You could also call a logout endpoint if needed
  try {
    authApi.post('/logout');
  } catch (error) {
    console.warn('Could not notify server about logout:', error);
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = sessionStorage.getItem('auth_token');
    if (!token) return null;
    
    const response = await authApi.get<User>('/me');
    
    // Store user role if available
    if (response.data && response.data.role) {
      sessionStorage.setItem('user_role', response.data.role);
      localStorage.setItem('user_role', response.data.role);
    }
    
    return response.data;
  } catch (error) {
    console.error('Failed to get current user:', error);
    
    // Clear token if it's an authentication error (401)
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_role');
      localStorage.removeItem('user_role');
    }
    
    return null;
  }
};

// User Settings API functions
export const getUserSettings = async (): Promise<UserSettings> => {
  try {
    const response = await userSettingsApi.get<UserSettings>('');
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to get user settings');
  }
};

export const updateUserSettings = async (settings: UserSettings): Promise<UserSettings> => {
  try {
    const response = await userSettingsApi.put<UserSettings>('', settings);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to update user settings');
  }
};

export const changePassword = async (passwordData: ChangePasswordRequest): Promise<void> => {
  try {
    await userSettingsApi.post('/change-password', passwordData);
    return Promise.resolve();
  } catch (error) {
    return handleApiError(error, 'Failed to change password');
  }
}; 