import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiMode';
import { extractFileId } from '../utils/idUtils';

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
 * Upload a file for a submission
 * @param assignmentId The ID of the assignment
 * @param file File object to upload
 * @param submissionId Optional existing submission ID
 * @returns Uploaded file metadata
 */
export const uploadSubmissionFile = async (
  assignmentId: string | number, 
  file: File, 
  submissionId?: string | number
): Promise<any> => {
  try {
    if (!file) {
      throw new Error('No file provided for upload');
    }
    
    const formData = new FormData();
    
    // Add assignment ID to form data (required)
    formData.append('assignmentId', assignmentId.toString());
    
    // Add submission ID if provided (optional but highly recommended)
    if (submissionId) {
      formData.append('submissionId', submissionId.toString());
      console.log(`Associating file with submission ID: ${submissionId}`);
    } else {
      console.warn('No submissionId provided for file upload - files may not be associated with the submission');
    }
    
    // Add file to form data
    formData.append('file', file);
    
    // Also pass original filename explicitly to ensure it's preserved
    formData.append('originalFilename', file.name);
    
    // Pass file type to help with MIME type preservation
    formData.append('fileType', file.type);
    
    console.log(`Uploading file for assignment ${assignmentId}${submissionId ? ` and submission ${submissionId}` : ''}`);
    console.log(`File details: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    
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
    
    console.log('File upload response:', response.data);
    
    // Check if response contains files property
    if (response.data && response.data.files && Array.isArray(response.data.files)) {
      return response.data.files[0]; // Return the first file uploaded
    } else if (response.data && response.data.success && response.data.success.files) {
      return response.data.success.files[0]; // Alternative response format
    } else {
      // Return whatever we got
      return response.data;
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Upload multiple files for a submission
 * @param assignmentId The ID of the assignment
 * @param files Array of File objects to upload
 * @param submissionId Optional existing submission ID
 * @returns Array of uploaded file metadata
 */
export const uploadSubmissionFiles = async (
  assignmentId: string | number, 
  files: File[],
  submissionId?: string | number
): Promise<any[]> => {
  try {
    if (!files.length) return [];
    
    console.log(`Uploading ${files.length} files for assignment ${assignmentId}${submissionId ? ` and submission ${submissionId}` : ''}`);
    
    const results = [];
    
    // Upload each file individually
    for (const file of files) {
      const result = await uploadSubmissionFile(assignmentId, file, submissionId);
      
      // Process the result to ensure it's in a consistent format
      const processedResult = result.files ? result.files[0] : result;
      results.push(processedResult);
    }
    
    console.log(`Successfully uploaded ${results.length} files:`, results);
    return results;
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    throw error;
  }
};

/**
 * Download a submission file
 * @param submissionId The ID of the submission
 * @param fileId The ID of the file to download
 * @param fileName The name to save the file as
 */
export const downloadSubmissionFile = async (submissionId: string | number, fileId: string | number, fileName: string): Promise<void> => {
  try {
    // Extract numeric parts for cleaner IDs - match how we handle IDs in the upload function
    const cleanSubmissionId = typeof submissionId === 'string' ? extractFileId(submissionId) : submissionId;
    const cleanFileId = typeof fileId === 'string' ? extractFileId(fileId) : fileId;
    
    // This might be encoded in the fileId (e.g., "1055-filename.pdf")
    // If so, the API might be expecting just "1055" as the ID
    console.log(`Attempting to download file ${fileName}`);
    console.log(`Submission ID: ${cleanSubmissionId}, File ID: ${cleanFileId}`);
    
    // Create an array of download approaches to try
    const downloadApproaches = [
      // Approach 1: Direct file download with file ID + query param for submission (matches upload pattern)
      async () => {
        console.log(`Trying direct file download with query params`);
        return await fileUploadApi.get(`/files/download/${cleanFileId}`, {
          params: { submissionId: cleanSubmissionId },
          responseType: 'blob'
        });
      },
      
      // Approach 2: Through submission endpoint
      async () => {
        console.log(`Trying through submission endpoint`);
        return await fileUploadApi.get(`/submissions/download`, {
          params: { submissionId: cleanSubmissionId, fileId: cleanFileId },
          responseType: 'blob'
        });
      },
      
      // Approach 3: Base64 encoded file ID
      async () => {
        // For files that might have special characters in their IDs
        const encodedFileId = encodeURIComponent(cleanFileId.toString());
        console.log(`Trying with encoded file ID: ${encodedFileId}`);
        return await fileUploadApi.get(`/submissions/${cleanSubmissionId}/files/${encodedFileId}`, {
          responseType: 'blob'
        });
      },
      
      // Approach 4: Standard REST path-based approach
      async () => {
        console.log(`Trying standard REST path`);
        return await fileUploadApi.get(`/submissions/${cleanSubmissionId}/files/${cleanFileId}`, {
          responseType: 'blob'
        });
      }
    ];
    
    // Try each approach until one works
    let response = null;
    let lastError = null;
    
    for (const approach of downloadApproaches) {
      try {
        response = await approach();
        if (response && response.status === 200) {
          console.log('Download successful!');
          break;
        }
      } catch (error: any) {
        console.log('Download approach failed:', error?.message || 'Unknown error');
        lastError = error;
      }
    }
    
    // If no approach was successful, throw the last error
    if (!response) {
      console.error('All download approaches failed');
      throw lastError || new Error('Failed to download file');
    }
    
    // Process successful download
    const contentType = response.headers['content-type'];
    console.log(`Downloaded file type: ${contentType}`);
    
    // Create blob URL and trigger browser download
    const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
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

/**
 * Delete a submission file
 * @param fileId The ID of the file to delete
 * @returns The operation result
 */
export const deleteSubmissionFile = async (fileId: string | number): Promise<any> => {
  try {
    console.log(`Deleting file with ID: ${fileId}`);
    const response = await fileUploadApi.delete(`/submissions/files/${fileId}`);
    console.log('File deletion response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

export default {
  uploadSubmissionFile,
  uploadSubmissionFiles,
  downloadSubmissionFile,
  deleteSubmissionFile
};