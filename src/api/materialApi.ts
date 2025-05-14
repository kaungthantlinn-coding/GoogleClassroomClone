import axios, { AxiosError } from 'axios';
import { Material } from '../types/material';
import { getApiBaseUrl } from '../utils/apiMode';

const API_URL = getApiBaseUrl();

// Create axios instance for material API
const materialApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for file uploads (with multipart/form-data content type)
const fileUploadApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Add auth token to requests
materialApi.interceptors.request.use(config => {
  // Get token from sessionStorage
  const token = sessionStorage.getItem('auth_token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add auth token to file upload requests
fileUploadApi.interceptors.request.use(config => {
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
 * Get all materials for a specific course
 */
export const getMaterials = async (courseId: string | number): Promise<Material[]> => {
  try {
    // GET: api/courses/{courseId}/materials
    const response = await materialApi.get<any[]>(`/courses/${courseId}/materials`);
    
    // Add debug logging to see the actual API response
    console.log('API response for materials:', response.data);
    
    // Map the API response to our Material interface
    const materials = response.data.map(item => {
      // Convert files to our attachments format
      let attachments = [];
      
      // Handle single file property
      if (item.file) {
        attachments.push({
          type: getFileType(item.file.type),
          name: item.file.name,
          url: item.file.url,
          fileId: item.file.attachmentId,
          size: item.file.size,
          uploadDate: item.file.uploadDate
        });
      }
      
      // Handle files array property (prioritize this if both exist)
      if (item.files && Array.isArray(item.files) && item.files.length > 0) {
        attachments = item.files.map((file: {
          attachmentId: number;
          name: string;
          type: string;
          size: number;
          url: string;
          uploadDate: string;
        }) => ({
          type: getFileType(file.type),
          name: file.name,
          url: file.url,
          fileId: file.attachmentId,
          size: file.size,
          uploadDate: file.uploadDate
        }));
      }
      
      // If there are existing attachments in the legacy format, add them too
      if (item.attachments && Array.isArray(item.attachments)) {
        attachments = [...attachments, ...item.attachments];
      }
      
      return {
        id: item.materialId || item.id,  // Try both possible property names
        materialGuid: item.materialGuid, // Preserve the original GUID
        title: item.title || 'Untitled Material',
        description: item.description || '',
        topic: item.topic || 'No topic',
        attachments: attachments,
        assignTo: item.assignTo || ['All students'],
        scheduledFor: item.scheduledFor || null,
        className: item.courseName || item.className, // Handle different property names
        section: item.section,
        classId: item.courseId?.toString() || item.classId || courseId.toString(),
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt,
        color: item.color
      };
    });
    
    console.log('Mapped materials:', materials);
    
    return materials;
  } catch (error) {
    return handleApiError(error, `Failed to fetch materials for course ${courseId}`);
  }
};

// Helper function to determine file type from MIME type
const getFileType = (mimeType: string): 'drive' | 'youtube' | 'link' | 'file' | 'document' => {
  if (!mimeType) return 'file';
  
  if (mimeType.includes('pdf')) {
    return 'document';
  } else if (mimeType.includes('video')) {
    return 'youtube'; // Not exactly YouTube but used for video mime type
  } else if (mimeType.includes('image')) {
    return 'drive'; // Not exactly Google Drive but used for image mime type
  } else if (mimeType.includes('text/uri-list')) {
    return 'link';
  } else {
    return 'file';
  }
};

/**
 * Get a specific material by ID
 */
export const getMaterial = async (materialId: string | number): Promise<Material> => {
  try {
    // GET: api/materials/{id}
    const response = await materialApi.get<Material>(`/materials/${materialId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to fetch material ${materialId}`);
  }
};

/**
 * Create a new material for a course
 */
export const createMaterial = async (courseId: string | number, material: Partial<Material>): Promise<Material> => {
  try {
    // POST: api/courses/{courseId}/materials
    console.log(`API: Creating material for course ${courseId}`, material);
    const response = await materialApi.post<any>(`/courses/${courseId}/materials`, material);
    console.log('API: Material creation response:', response.data);
    
    // Validate that we got a valid ID back from the API
    if (!response.data || !response.data.id) {
      console.error('API did not return a valid material ID', response.data);
      
      // If the API didn't return an ID but did return a materialId, use that instead
      if (response.data && response.data.materialId) {
        console.log(`Using materialId instead of id: ${response.data.materialId}`);
        response.data.id = response.data.materialId;
      } else {
        // Generate a temporary ID if none was provided
        console.warn('No ID returned from API, generating a temporary ID');
        response.data = response.data || {};
        response.data.id = `temp-material-${Date.now()}`;
      }
    }
    
    // Ensure we have a complete material object
    const savedMaterial: Material = {
      id: response.data.id,
      title: response.data.title || material.title || 'Untitled Material',
      description: response.data.description || material.description || '',
      topic: response.data.topic || material.topic || 'No topic',
      attachments: response.data.attachments || material.attachments || [],
      assignTo: response.data.assignTo || material.assignTo || ['All students'],
      scheduledFor: response.data.scheduledFor || material.scheduledFor || null,
      className: response.data.className || material.className || '',
      section: response.data.section || material.section || '',
      classId: response.data.classId || material.classId || courseId.toString(),
      createdAt: response.data.createdAt || new Date().toISOString(),
      updatedAt: response.data.updatedAt || null
    };
    
    console.log('API: Returned material with ID:', savedMaterial.id);
    return savedMaterial;
  } catch (error) {
    console.error('Failed to create material:', error);
    return handleApiError(error, 'Failed to create material');
  }
};

/**
 * Update an existing material
 */
export const updateMaterial = async (materialId: string | number, material: Partial<Material>): Promise<Material> => {
  try {
    // PUT: api/materials/{id}
    console.log(`API: Updating material with ID ${materialId}`, material);
    const response = await materialApi.put<any>(`/materials/${materialId}`, material);
    console.log('API: Material update response:', response.data);
    
    // Validate that we got a valid ID back from the API
    if (!response.data || !response.data.id) {
      console.error('API did not return a valid material ID', response.data);
      
      // If the API didn't return an ID but did return a materialId, use that instead
      if (response.data && response.data.materialId) {
        console.log(`Using materialId instead of id: ${response.data.materialId}`);
        response.data.id = response.data.materialId;
      } else {
        // Use the ID we sent if none was returned
        console.warn('No ID returned from API, using provided ID');
        response.data = response.data || {};
        response.data.id = materialId.toString();
      }
    }
    
    // Ensure we have a complete material object
    const savedMaterial: Material = {
      id: response.data.id,
      title: response.data.title || material.title || 'Untitled Material',
      description: response.data.description || material.description || '',
      topic: response.data.topic || material.topic || 'No topic',
      attachments: response.data.attachments || material.attachments || [],
      assignTo: response.data.assignTo || material.assignTo || ['All students'],
      scheduledFor: response.data.scheduledFor || material.scheduledFor || null,
      className: response.data.className || material.className || '',
      section: response.data.section || material.section || '',
      classId: response.data.classId || material.classId || '',
      createdAt: response.data.createdAt || material.createdAt || new Date().toISOString(),
      updatedAt: response.data.updatedAt || new Date().toISOString()
    };
    
    console.log('API: Returned updated material with ID:', savedMaterial.id);
    return savedMaterial;
  } catch (error) {
    console.error(`Failed to update material ${materialId}:`, error);
    return handleApiError(error, `Failed to update material ${materialId}`);
  }
};

/**
 * Delete a material
 */
export const deleteMaterial = async (materialId: string | number): Promise<void> => {
  // Check if materialId is valid and not undefined
  if (!materialId) {
    console.error('Cannot delete material: ID is undefined');
    throw new Error('Material ID is required for deletion');
  }
  
  try {
    console.log(`API: Attempting to delete material with ID: ${materialId}`);
    // DELETE: api/materials/{id}
    await materialApi.delete(`/materials/${materialId}`);
    console.log(`API: Successfully deleted material with ID: ${materialId}`);
  } catch (error) {
    console.error(`API: Failed to delete material ${materialId}`, error);
    handleApiError(error, `Failed to delete material ${materialId}`);
  }
};

/**
 * Upload a file for a material
 */
export const uploadMaterialFile = async (materialId: string | number | undefined, file: File): Promise<any> => {
  // Validate the material ID - this is required
  if (!materialId) {
    console.error('Cannot upload file: Material ID is required');
    throw new Error('Material ID is required for file upload');
  }

  try {
    // Debug logging to help track issues
    console.log(`API: Processing material ID for file upload: ${materialId}`, typeof materialId);
    
    // Convert to numeric ID if needed
    let numericId: number;
    
    if (!isNaN(Number(materialId))) {
      // If it's already a number or can be directly converted
      numericId = Number(materialId);
    } else {
      // For special format like "material-123", extract the numeric part
      const match = String(materialId).match(/\d+/);
      if (match) {
        numericId = Number(match[0]);
      } else {
        console.error(`Invalid material ID format: ${materialId}`);
        throw new Error(`Invalid material ID format: ${materialId}`);
      }
    }

    // Additional validation to ensure we have a valid number
    if (isNaN(numericId) || numericId <= 0) {
      console.error(`Invalid numeric material ID: ${numericId}`);
      throw new Error(`Invalid numeric material ID: ${numericId}`);
    }

    // Create form data
    const formData = new FormData();
    formData.append('materialId', numericId.toString());
    formData.append('file', file);
    
    console.log(`API: Uploading file for material ID: ${numericId}`);
    
    // POST: api/materials/upload
    const response = await fileUploadApi.post('/materials/upload', formData);
    console.log('API: File upload successful', response.data);
    
    return response.data;
  } catch (error) {
    console.error(`API: Failed to upload file for material ${materialId}`, error);
    return handleApiError(error, `Failed to upload file for material ${materialId}`);
  }
};

/**
 * Download a material file by its ID
 */
export const downloadMaterialFile = async (fileId: string | number): Promise<Blob> => {
  try {
    // GET: api/materials/files/{fileId}
    const response = await materialApi.get(`/materials/files/${fileId}`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to download material file ${fileId}`);
  }
};

/**
 * Delete a material file by its ID
 */
export const deleteMaterialFile = async (fileId: string | number): Promise<void> => {
  try {
    // DELETE: api/materials/files/{fileId}
    console.log(`API: Attempting to delete material file with ID: ${fileId}`);
    await materialApi.delete(`/materials/files/${fileId}`);
    console.log(`API: Successfully deleted material file with ID: ${fileId}`);
  } catch (error) {
    console.error(`API: Failed to delete material file ${fileId}`, error);
    handleApiError(error, `Failed to delete material file ${fileId}`);
  }
};

export default {
  getMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  uploadMaterialFile,
  downloadMaterialFile,
  deleteMaterialFile
};