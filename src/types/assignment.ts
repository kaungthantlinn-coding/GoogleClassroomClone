import { User } from './user';

export type AssignmentStatus = 'due-soon' | 'completed' | 'missing' | 'upcoming';

export interface Assignment {
  id: string;
  title: string;
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

// Local storage key for assignments
const ASSIGNMENTS_STORAGE_KEY = 'classroom_assignments';

// Get all assignments from localStorage
export const getAllAssignments = (): Assignment[] => {
  try {
    const storedAssignments = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    return storedAssignments ? JSON.parse(storedAssignments) : [];
  } catch (error) {
    console.error('Error getting assignments from localStorage', error);
    return [];
  }
};

// Get assignments for a specific class
export const getClassAssignments = (classId: string): Assignment[] => {
  const allAssignments = getAllAssignments();
  return allAssignments.filter(assignment => assignment.classId === classId);
};

// Save an assignment to localStorage
export const saveAssignment = (assignment: Assignment): Assignment => {
  try {
    const assignments = getAllAssignments();
    const existingIndex = assignments.findIndex(a => a.id === assignment.id);
    
    if (existingIndex >= 0) {
      // Update existing assignment
      assignments[existingIndex] = {
        ...assignments[existingIndex],
        ...assignment,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new assignment
      assignments.push({
        ...assignment,
        createdAt: new Date().toISOString()
      });
    }
    
    localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
    
    // Also save individual assignment data for quick access
    const assignmentKey = `assignment-${assignment.id}`;
    localStorage.setItem(assignmentKey, JSON.stringify(assignment));
    
    // Dispatch event to notify other components
    const assignmentEvent = new CustomEvent('assignmentUpdated', {
      detail: { assignmentId: assignment.id, assignmentData: assignment }
    });
    window.dispatchEvent(assignmentEvent);
    
    return assignment;
  } catch (error) {
    console.error('Error saving assignment to localStorage', error);
    return assignment;
  }
};

// Delete an assignment from localStorage
export const deleteAssignment = (assignmentId: string): boolean => {
  try {
    const assignments = getAllAssignments();
    const filteredAssignments = assignments.filter(a => a.id !== assignmentId);
    
    localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(filteredAssignments));
    
    // Also remove individual assignment data
    localStorage.removeItem(`assignment-${assignmentId}`);
    
    // Dispatch event to notify other components
    const assignmentEvent = new CustomEvent('assignmentDeleted', {
      detail: { assignmentId }
    });
    window.dispatchEvent(assignmentEvent);
    
    return true;
  } catch (error) {
    console.error('Error deleting assignment from localStorage', error);
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
export const getUpcomingAssignments = (classId: string): Assignment[] => {
  const assignments = getClassAssignments(classId);
  
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
};