import React from 'react';
import { X, Calendar } from 'lucide-react';
import { Assignment } from '../types/assignment';

interface UpcomingAssignmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignments: Assignment[];
}

const UpcomingAssignmentsModal: React.FC<UpcomingAssignmentsModalProps> = ({
  isOpen,
  onClose,
  assignments
}) => {
  if (!isOpen) return null;

  // Format due date for display
  const formatDueDate = (dateString: string, timeString: string): string => {
    if (!dateString) return 'No due date';
    
    try {
      const date = new Date(`${dateString} ${timeString || '23:59'}`);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      });
    } catch (e) {
      return dateString; // Return the original string if parsing fails
    }
  };

  // Get color based on assignment status
  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'due-soon': return '#e37400'; // Orange
      case 'completed': return '#1e8e3e'; // Green
      case 'missing': return '#d93025';   // Red
      case 'upcoming': return '#1a73e8';  // Blue
      default: return '#1a73e8';          // Default blue
    }
  };

  // Get status text for display
  const getStatusText = (status?: string): string => {
    switch (status) {
      case 'due-soon': return 'Due Soon';
      case 'completed': return 'Completed';
      case 'missing': return 'Missing';
      case 'upcoming': return 'Upcoming';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-medium text-[#3c4043]">Upcoming Assignments</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} className="text-[#5f6368]" />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-grow p-4">
          {assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div 
                  key={assignment.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start">
                    <div 
                      className="w-3 h-3 rounded-full mt-1.5 mr-3"
                      style={{ backgroundColor: getStatusColor(assignment.status) }}
                    ></div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-[#3c4043]">{assignment.title}</h3>
                        <span 
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ 
                            backgroundColor: `${getStatusColor(assignment.status)}20`,
                            color: getStatusColor(assignment.status)
                          }}
                        >
                          {getStatusText(assignment.status)}
                        </span>
                      </div>
                      <p className="text-sm text-[#5f6368] mt-1">
                        {assignment.instructions && assignment.instructions.length > 100 
                          ? `${assignment.instructions.substring(0, 100)}...` 
                          : assignment.instructions}
                      </p>
                      <div className="flex items-center mt-2 text-sm text-[#5f6368]">
                        <Calendar size={16} className="mr-1" />
                        <span>Due {formatDueDate(assignment.dueDate, assignment.dueTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[#5f6368]">No upcoming assignments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpcomingAssignmentsModal;