import { User } from './user';
import * as materialApi from '../api/materialApi';

export interface Material {
  id: string;
  title: string;
  description: string;
  topic: string;
  attachments: {
    type: 'drive' | 'youtube' | 'link' | 'file' | 'document';
    name: string;
    url: string;
    thumbnail?: string;
  }[];
  assignTo: string[];
  scheduledFor: string | null;
  className?: string;
  section?: string;
  classId?: string;
  createdAt: string;
  updatedAt?: string;
  color?: string;
}

// Local storage key for materials
const MATERIALS_STORAGE_KEY = 'classroom_materials';

// Get all materials - this method is not used with real API
export const getAllMaterials = async (): Promise<Material[]> => {
  try {
    // Not directly supported in API, consider using a different approach
    console.warn('getAllMaterials is not directly supported with the API implementation');
    return [];
  } catch (error) {
    console.error('Error getting all materials', error);
    return [];
  }
};

// Get materials for a specific class
export const getClassMaterials = async (classId: string): Promise<Material[]> => {
  try {
    return await materialApi.getMaterials(classId);
  } catch (error) {
    console.error(`Error getting materials for class ${classId}:`, error);
    return [];
  }
};

// Save a material
export const saveMaterial = async (material: Material): Promise<Material> => {
  try {
    const classId = material.classId || '';
    let savedMaterial: Material;
    
    if (material.id) {
      // Update existing material
      savedMaterial = await materialApi.updateMaterial(material.id, material);
    } else {
      // Create new material
      savedMaterial = await materialApi.createMaterial(classId, material);
    }
    
    // Dispatch event to notify other components
    const materialEvent = new CustomEvent('materialUpdated', {
      detail: { materialId: savedMaterial.id, materialData: savedMaterial }
    });
    window.dispatchEvent(materialEvent);
    
    return savedMaterial;
  } catch (error) {
    console.error('Error saving material', error);
    throw error;
  }
};

// Delete a material
export const deleteMaterial = async (materialId: string): Promise<boolean> => {
  if (!materialId) {
    console.error('Cannot delete material: Material ID is required');
    return false;
  }

  try {
    // The API expects a numeric ID, so make sure we're working with a number
    // If the ID is not a number (like in a legacy or special format), try to extract a numeric part
    let numericId: number;
    
    if (!isNaN(Number(materialId))) {
      numericId = Number(materialId);
    } else {
      // For special format like "material-123", try to extract the numeric part
      const match = materialId.match(/\d+/);
      if (match) {
        numericId = Number(match[0]);
      } else {
        console.error(`Cannot delete material: ID format "${materialId}" is not supported by the API`);
        return false;
      }
    }
    
    // Call the API with the numeric ID
    await materialApi.deleteMaterial(numericId);
    
    // Dispatch event to notify other components
    const materialEvent = new CustomEvent('materialDeleted', {
      detail: { materialId }
    });
    window.dispatchEvent(materialEvent);
    
    return true;
  } catch (error) {
    console.error(`Error deleting material ${materialId}:`, error);
    return false;
  }
};

// Create a new material
export const createMaterial = async (materialData: Omit<Material, 'id' | 'createdAt'>): Promise<Material> => {
  try {
    // For API implementation, we delegate directly to the API createMaterial function
    const classId = materialData.classId || '';
    return await materialApi.createMaterial(classId, materialData);
  } catch (error) {
    console.error('Error creating material', error);
    throw error;
  }
};

// Get a material by ID
export const getMaterialById = async (materialId: string): Promise<Material | null> => {
  try {
    return await materialApi.getMaterial(materialId);
  } catch (error) {
    console.error(`Error getting material ${materialId}:`, error);
    return null;
  }
};