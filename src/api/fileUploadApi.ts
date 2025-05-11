import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiMode';

const API_URL = getApiBaseUrl();

// Create axios instance for file uploads
const fileUploadApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Add auth token to requests
fileUploadApi.interceptors.request.use(config => {
  // Get token from sessionStorage
  const token = sessionStorage.getItem('auth_token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Upload files for a submission
 * @param assignmentId The ID of the assignment
 * @param files Array of File objects to upload
 * @returns Array of uploaded file metadata
 */
export const uploadSubmissionFiles = async (assignmentId: string | number, files: File[]): Promise<any[]> => {
  try {
    if (!files.length) return [];
    
    const formData = new FormData();
    
    // Add assignment ID to form data
    formData.append('assignmentId', assignmentId.toString());
    
    // Add each file to form data
    files.forEach((file, index) => {
      formData.append(`files`, file); // Use 'files' as the field name
    });
    
    // Make the upload request
    const response = await fileUploadApi.post('/submissions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        // Calculate and report upload progress if needed
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        console.log(`Upload progress: ${percentCompleted}%`);
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
};

/**
 * Download a submission file
 * @param fileId The ID of the file to download
 * @param fileName The name to save the file as
 */
export const downloadSubmissionFile = async (fileId: string, fileName: string): Promise<void> => {
  try {
    // Make the download request with blob response type
    const response = await fileUploadApi.get(`/submissions/files/${fileId}`, {
      responseType: 'blob',
    });
    
    // Create blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
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
  uploadSubmissionFiles,
  downloadSubmissionFile
}; 