import React, { useState, useRef, useEffect } from 'react';
import { FileText, Calendar, MoreVertical, Edit, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AssignmentCardProps {
  id: string;
  title: string;
  description?: string;
  points: string;
  dueDate: string;
  isOverdue?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  id,
  title,
  description,
  points,
  dueDate,
  isOverdue = false,
  onEdit,
  onDelete
}) => {
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
    if (onEdit) {
      onEdit(id);
    }
    setShowMenu(false);
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete(id);
    }
    setShowDeleteConfirmation(false);
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
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow" id={`assignment-${id}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-start gap-3">
            <FileText className="text-[#1a73e8] mt-1" size={20} />
            <h3 className="text-lg font-medium text-[#1a73e8]">{title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[#1a73e8] font-medium">
              {points} pts
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
                  <button 
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                  >
                    <Trash size={16} />
                    Delete
                  </button>
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
          <div className="flex items-center gap-1 text-sm">
            <Calendar size={16} className={isOverdue ? "text-red-500" : "text-[#5f6368]"} />
            <span className={isOverdue ? "text-red-500" : "text-[#5f6368]"}>
              {dueDate ? `Due ${formatDueDate(dueDate)}` : 'No due date'}
            </span>
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
                  if (onDelete) {
                    onDelete(id);
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