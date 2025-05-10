import * as assignmentApi from '../api/assignmentApi';

export type AssignmentStatus = 'due-soon' | 'completed' | 'missing' | 'upcoming';

export interface Assignment {
  id: string;
  title: string;
  description?: string; // Add description field
  instructions: string;
  points: string;
  dueDate: string;
  dueTime: string;
  topic: string;
  attachments: {
    type: 'drive' | 'youtube' | 'link' | 'file' | 'document';
    name: string;
    url: string;
    thumbnail?: string;
  }[];
  assignTo: string[];
  scheduledFor: string | null;
  gradeCategory?: string;
  rubric?: {
    criteria: { description: string; points: number }[];
  };
  className?: string;
  section?: string;
  classId?: string;
  createdAt: string;
  updatedAt?: string;
  status?: AssignmentStatus;
  allowLateSubmissions?: boolean;
  lateSubmissionPolicy?: string;
  color?: string;
}

// Get all assignments - this method is not used with real API
export const getAllAssignments = async (): Promise<Assignment[]> => {
  try {
    // Not directly supported in API, consider using a different approach
    console.warn('getAllAssignments is not directly supported with the API implementation');
    return [];
  } catch (error) {
    console.error('Error getting all assignments', error);
    return [];
  }
};

// Get assignments for a specific class
export const getClassAssignments = async (classId: string): Promise<Assignment[]> => {
  try {
    return await assignmentApi.getAssignments(classId);
  } catch (error) {
    console.error(`Error getting assignments for class ${classId}:`, error);
    return [];
  }
};

// Helper function to extract or generate an ID
const ensureAssignmentId = (assignment: any): string => {
  // If the assignment already has an ID, use it
  if (assignment.id) return assignment.id;
  
  // Check if the response has an id property that might be nested or named differently
  const possibleIdKeys = ['id', 'assignmentId', 'assignment_id', '_id'];
  for (const key of possibleIdKeys) {
    if (assignment[key]) return assignment[key];
  }
  
  // Look for an ID in the response URL if it exists
  if (assignment.url) {
    const urlMatch = assignment.url.match(/\/(\d+)$/); // Extract ID from URL ending with /123
    if (urlMatch && urlMatch[1]) return urlMatch[1];
  }
  
  // Generate a temporary ID if none exists
  // This is a fallback to prevent app crashes, but these assignments may need special handling
  console.warn('Generating temporary ID for assignment:', assignment.title);
  return `temp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

// Save an assignment
export const saveAssignment = async (assignment: Partial<Assignment>): Promise<Assignment> => {
  try {
    const classId = assignment.classId || '';
    let savedAssignment: Assignment;
    
    if (assignment.id) {
      // Update existing assignment
      savedAssignment = await assignmentApi.updateAssignment(assignment.id, assignment);
    } else {
      // Create new assignment
      const apiResponse = await assignmentApi.createAssignment(classId, assignment);
      
      // Process the API response
      savedAssignment = { ...apiResponse };
      
      // Ensure we have an ID (either from API or generated)
      if (!savedAssignment.id) {
        const extractedId = ensureAssignmentId(apiResponse);
        savedAssignment.id = extractedId;
        console.log(`Assignment created with extracted/generated ID: ${extractedId}`);
      } else {
        console.log(`Assignment created successfully with ID: ${savedAssignment.id}`);
      }
    }
    
    // Dispatch event to notify other components
    const assignmentEvent = new CustomEvent(assignment.id ? 'assignmentUpdated' : 'newAssignmentCreated', {
      detail: { assignmentId: savedAssignment.id, assignmentData: savedAssignment }
    });
    window.dispatchEvent(assignmentEvent);
    
    return savedAssignment;
  } catch (error) {
    console.error('Error saving assignment', error);
    throw error;
  }
};

// Delete an assignment
export const deleteAssignment = async (assignmentId: string): Promise<boolean> => {
  if (!assignmentId) {
    console.error('Cannot delete assignment: Assignment ID is required');
    return false;
  }

  try {
    console.log(`Attempting to delete assignment with ID: ${assignmentId}`);
    // The API expects a numeric ID, so make sure we're working with a number
    // If the ID is not a number (like in a legacy or special format), try to extract a numeric part
    let numericId: number;
    
    if (!isNaN(Number(assignmentId))) {
      numericId = Number(assignmentId);
    } else {
      // For special format like "assignment-123", try to extract the numeric part
      const match = assignmentId.match(/\d+/);
      if (match) {
        numericId = Number(match[0]);
      } else {
        console.error(`Cannot delete assignment: ID format "${assignmentId}" is not supported by the API`);
        return false;
      }
    }
    
    // Call the API with the numeric ID
    await assignmentApi.deleteAssignment(numericId);
    
    // Dispatch event to notify other components
    const assignmentEvent = new CustomEvent('assignmentDeleted', {
      detail: { assignmentId }
    });
    window.dispatchEvent(assignmentEvent);
    
    return true;
  } catch (error) {
    console.error(`Error deleting assignment ${assignmentId}:`, error);
    return false;
  }
};

// Calculate assignment status based on due date
export const calculateAssignmentStatus = (assignment: Assignment): AssignmentStatus => {
  if (!assignment.dueDate) return 'upcoming';
  
  const now = new Date();
  const dueDate = new Date(`${assignment.dueDate} ${assignment.dueTime || '23:59'}`);
  
  // Check if the assignment is already completed (this would need to be tracked separately)
  // For now, we'll just use a placeholder logic
  const isCompleted = false; // This should be replaced with actual completion status
  
  if (isCompleted) {
    return 'completed';
  }
  
  // If the due date has passed
  if (dueDate < now) {
    return 'missing';
  }
  
  // If due date is within the next 48 hours
  const twoDaysFromNow = new Date(now);
  twoDaysFromNow.setHours(twoDaysFromNow.getHours() + 48);
  
  if (dueDate <= twoDaysFromNow) {
    return 'due-soon';
  }
  
  return 'upcoming';
};

// Get upcoming assignments for a class
export const getUpcomingAssignments = async (classId: string): Promise<Assignment[]> => {
  try {
    const assignments = await getClassAssignments(classId);
    
    // Add status to each assignment
    const assignmentsWithStatus = assignments.map(assignment => ({
      ...assignment,
      status: calculateAssignmentStatus(assignment)
    }));
    
    // Sort by due date (closest first)
    return assignmentsWithStatus.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      
      const dateA = new Date(`${a.dueDate} ${a.dueTime || '23:59'}`);
      const dateB = new Date(`${b.dueDate} ${b.dueTime || '23:59'}`);
      
      return dateA.getTime() - dateB.getTime();
    });
  } catch (error) {
    console.error(`Error getting upcoming assignments for class ${classId}:`, error);
    return [];
  }
};