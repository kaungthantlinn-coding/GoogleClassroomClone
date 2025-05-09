import React, { useState, useRef, useEffect } from 'react';
import { FileText, Calendar, MoreVertical, Edit, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AssignmentCardProps {
  id?: string; // Make id optional to handle cases where it might be undefined
  title: string;
  description?: string;
  points: string;
  dueDate: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  id,
  title,
  description,
  points,
  dueDate,
  onEdit,
  onDelete
}) => {
  // Check if this assignment has a valid ID
  const hasValidId = !!id && (typeof id === 'string' || typeof id === 'number');
  
  // Log the ID for debugging purposes
  console.log(`Assignment Card ID: ${id}, Valid: ${hasValidId}`);
  
  // For string IDs, ensure we can extract a numeric part if needed
  const extractNumericId = () => {
    if (!id) return null;
    if (!isNaN(Number(id))) return id;
    const match = id.toString().match(/\d+/);
    return match ? match[0] : null;
  };

  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleViewSubmissions = () => {
    // Check if we're in a class context
    const currentPath = window.location.pathname;
    const classMatch = currentPath.match(/\/class\/([^\/]+)/);
    
    if (classMatch && classMatch[1]) {
      // If we're in a class, navigate to the class-specific submissions route
      const classId = classMatch[1];
      navigate(`/class/${classId}/submissions/${id}`);
    } else {
      // Otherwise use the generic submissions route
      navigate(`/submissions/${id}`);
    }
  };

  const handleEdit = () => {
    if (!hasValidId) {
      alert('This assignment cannot be edited because it has no ID. Please contact the administrator.');
      setShowMenu(false);
      return;
    }
    
    if (onEdit) {
      onEdit(id);
    }
    setShowMenu(false);
  };

  // Function to handle delete button clicks
  const handleDeleteClick = () => {
    // We know delete functionality is available if the button appears
    // So we just need to close the menu and show the confirmation
    setShowMenu(false);
    setShowDeleteConfirmation(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDueDate = (dateString: string) => {
    if (!dateString) return 'No due date';
    
    const dateObj = new Date(dateString);
    const now = new Date();
    
    // Check if the date is in the past
    const isPastDue = dateObj < now && dateObj.toDateString() !== now.toDateString();
    
    return {
      formatted: dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      isPastDue
    };
  };

  return (
    <>
      <div className={`bg-white border ${!hasValidId ? 'border-red-300' : 'border-gray-200'} rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow`} id={`assignment-${id || 'no-id'}`}>
        {!hasValidId && (
          <div className="mb-2 text-xs text-red-500 bg-red-50 p-1 rounded">
            Warning: This assignment has no ID and cannot be edited or deleted
          </div>
        )}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-start gap-2 sm:gap-3">
            <FileText className="text-[#1a73e8] mt-1 sm:w-5 sm:h-5" size={18} />
            <h3 className="text-lg font-medium text-[#1a73e8]">{title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[#1a73e8] font-medium">
              {points} points
            </div>
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-full">
                <MoreVertical size={18} className="text-[#5f6368]" />
              </button>
              
              {showMenu && (
                <div 
                  ref={menuRef}
                  className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 w-44"
                >
                  <button 
                    onClick={handleEdit}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit size={16} className="text-[#5f6368]" />
                    Edit
                  </button>
                  {hasValidId && onDelete && (
                    <button 
                      onClick={handleDeleteClick}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                    >
                      <Trash size={16} />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {description && (
          <p className="ml-8 text-[#5f6368] mb-4">
            {description}
          </p>
        )}
        
        <div className="flex justify-between items-center mt-3">
          <div className="flex items-center gap-1 text-xs sm:text-sm">
            {dueDate ? (
              <>
                {(() => {
                  const due = formatDueDate(dueDate);
                  if (due === 'No due date') {
                    return (
                      <>
                        <Calendar size={14} className="sm:w-4 sm:h-4 text-[#5f6368]" />
                        <span className="text-[#5f6368]">No due date</span>
                      </>
                    );
                  } else {
                    const { formatted, isPastDue } = due;
                    return (
                      <>
                        <Calendar size={14} className={`sm:w-4 sm:h-4 ${isPastDue ? "text-red-500" : "text-[#5f6368]"}`} />
                        <span className={isPastDue ? "text-red-500" : "text-[#5f6368]"}>
                          Due {formatted}
                        </span>
                      </>
                    );
                  }
                })()} 
              </>
            ) : (
              <>
                <Calendar size={16} className="text-[#5f6368]" />
                <span className="text-[#5f6368]">No due date</span>
              </>
            )}
          </div>
          
          <button 
            onClick={handleViewSubmissions}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            View submissions
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-medium text-[#3c4043] mb-2">Delete Assignment</h2>
            <p className="text-[#5f6368] mb-6">
              Are you sure you want to delete this assignment? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded text-[#3c4043] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Make sure we have a valid ID before proceeding with deletion
                  if (!hasValidId || !id) {
                    console.error('Cannot delete assignment: Valid ID is required');
                    setShowDeleteConfirmation(false);
                    return;
                  }
                  
                  // Execute the delete operation with the API
                  try {
                    const numericId = extractNumericId();
                    console.log(`Deleting assignment with ID: ${id}, extracted ID: ${numericId}`);
                    
                    if (onDelete) {
                      // Only proceed if we have a valid ID and a delete handler
                      onDelete(id);
                    }
                  } catch (error) {
                    console.error('Error when attempting to delete assignment:', error);
                  }
                  
                  setShowDeleteConfirmation(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AssignmentCard;