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

// Add auth token to requests
materialApi.interceptors.request.use(config => {
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
    // Use the appropriate property names from the API (might be 'id', 'materialId', etc.)
    const materials = response.data.map(item => ({
      id: item.materialId || item.id,  // Try both possible property names
      title: item.title || 'Untitled Material',
      description: item.description || '',
      topic: item.topic || 'No topic',
      attachments: item.attachments || [],
      assignTo: item.assignTo || ['All students'],
      scheduledFor: item.scheduledFor || null,
      className: item.className,
      section: item.section,
      classId: item.classId || courseId.toString(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt
    }));
    
    console.log('Mapped materials:', materials);
    
    return materials;
  } catch (error) {
    return handleApiError(error, `Failed to fetch materials for course ${courseId}`);
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
    const response = await materialApi.post<Material>(`/courses/${courseId}/materials`, material);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to create material');
  }
};

/**
 * Update an existing material
 */
export const updateMaterial = async (materialId: string | number, material: Partial<Material>): Promise<Material> => {
  try {
    // PUT: api/materials/{id}
    const response = await materialApi.put<Material>(`/materials/${materialId}`, material);
    return response.data;
  } catch (error) {
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

export default {
  getMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial
}; 