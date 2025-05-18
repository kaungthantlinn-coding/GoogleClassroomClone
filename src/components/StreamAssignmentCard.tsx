import React from 'react';
import { Link } from 'react-router-dom';
import { Assignment } from '../types/assignment';
import { format } from 'date-fns';
import { FileText, Calendar } from 'lucide-react';

interface StreamAssignmentCardProps {
  assignment: Assignment;
  classId: string;
}

const StreamAssignmentCard: React.FC<StreamAssignmentCardProps> = ({ assignment, classId }) => {
  // Parse the due date for display
  const parseDueDate = () => {
    if (!assignment.dueDate) return 'No due date';
    
    try {
      const dateObj = new Date(assignment.dueDate);
      let displayDate = format(dateObj, 'MMM d');
      
      // Add time if it exists
      if (assignment.dueTime) {
        displayDate += ` · ${assignment.dueTime}`;
      }
      
      return displayDate;
    } catch (error) {
      console.error('Error parsing date:', error);
      return assignment.dueDate;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden hover:shadow transition-shadow duration-200">
      {/* Header with icon and type indicator */}
      <div className="flex items-center p-4 bg-[#1a73e8] text-white">
        <FileText size={18} className="mr-2" />
        <span className="text-sm font-medium">Assignment</span>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <Link to={`/c/${classId}/a/${assignment.id}`}>
          <h3 className="text-base font-medium text-[#1a73e8] hover:underline">{assignment.title}</h3>
        </Link>
        
        {/* Due date */}
        <div className="flex items-center mt-3 text-[#5f6368] text-sm">
          <Calendar size={16} className="mr-1" />
          <span>Due {parseDueDate()}</span>
        </div>
      </div>
    </div>
  );
};

export default StreamAssignmentCard;
