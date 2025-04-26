import { User } from './user';

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

// Get all materials from localStorage
export const getAllMaterials = (): Material[] => {
  try {
    const storedMaterials = localStorage.getItem(MATERIALS_STORAGE_KEY);
    return storedMaterials ? JSON.parse(storedMaterials) : [];
  } catch (error) {
    console.error('Error getting materials from localStorage', error);
    return [];
  }
};

// Get materials for a specific class
export const getClassMaterials = (classId: string): Material[] => {
  const allMaterials = getAllMaterials();
  return allMaterials.filter(material => material.classId === classId);
};

// Save a material to localStorage
export const saveMaterial = (material: Material): Material => {
  try {
    const materials = getAllMaterials();
    const existingIndex = materials.findIndex(m => m.id === material.id);
    
    if (existingIndex >= 0) {
      // Update existing material
      materials[existingIndex] = {
        ...materials[existingIndex],
        ...material,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new material
      materials.push({
        ...material,
        createdAt: new Date().toISOString()
      });
    }
    
    localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(materials));
    
    // Also save individual material data for quick access
    const materialKey = `material-${material.id}`;
    localStorage.setItem(materialKey, JSON.stringify(material));
    
    // Dispatch event to notify other components
    const materialEvent = new CustomEvent('materialUpdated', {
      detail: { materialId: material.id, materialData: material }
    });
    window.dispatchEvent(materialEvent);
    
    return material;
  } catch (error) {
    console.error('Error saving material to localStorage', error);
    return material;
  }
};

// Delete a material from localStorage
export const deleteMaterial = (materialId: string): boolean => {
  try {
    const materials = getAllMaterials();
    const filteredMaterials = materials.filter(m => m.id !== materialId);
    
    if (filteredMaterials.length === materials.length) {
      // Material not found
      return false;
    }
    
    localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(filteredMaterials));
    
    // Also remove individual material data
    localStorage.removeItem(`material-${materialId}`);
    
    // Dispatch event to notify other components
    const materialEvent = new CustomEvent('materialDeleted', {
      detail: { materialId }
    });
    window.dispatchEvent(materialEvent);
    
    return true;
  } catch (error) {
    console.error('Error deleting material from localStorage', error);
    return false;
  }
};

// Create a new material
export const createMaterial = (materialData: Omit<Material, 'id' | 'createdAt'>): Material => {
  const newMaterial: Material = {
    ...materialData,
    id: `material-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  
  saveMaterial(newMaterial);
  
  // Dispatch event to notify other components
  const materialEvent = new CustomEvent('newMaterialCreated', {
    detail: { materialId: newMaterial.id, materialData: newMaterial }
  });
  window.dispatchEvent(materialEvent);
  
  return newMaterial;
};

// Get a material by ID
export const getMaterialById = (materialId: string): Material | null => {
  try {
    // First try to get from individual storage
    const materialKey = `material-${materialId}`;
    const storedMaterial = localStorage.getItem(materialKey);
    
    if (storedMaterial) {
      return JSON.parse(storedMaterial);
    }
    
    // If not found, search in all materials
    const allMaterials = getAllMaterials();
    return allMaterials.find(m => m.id === materialId) || null;
  } catch (error) {
    console.error('Error getting material by ID', error);
    return null;
  }
};