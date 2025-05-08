import React, { useState, useRef, useEffect } from 'react';
import { Comment } from '../../types/announcement';
import { Edit, Trash, MoreVertical } from 'lucide-react';

interface CommentItemProps {
  comment: Comment;
  renderAvatar: (name: string, size: "sm" | "md") => React.ReactNode;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  currentUserId: string;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  renderAvatar, 
  onEdit, 
  onDelete,
  currentUserId
}) => {
  // Debug logging for comment object
  console.log('CommentItem received comment:', { 
    id: comment.id,
    content: comment.content,
    authorId: comment.authorId,
    fullComment: comment
  });
  
  const commentDate = new Date(comment.createdAt);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus on input when editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);
  
  const handleEditClick = () => {
    setIsEditing(true);
    setShowDropdown(false);
  };
  
  const handleDeleteClick = () => {
    if (onDelete && comment.id) {
      console.log(`CommentItem: Requesting deletion of comment ${comment.id}`);
      onDelete(comment.id);
    } else {
      console.error(`CommentItem: Cannot delete comment - ${!onDelete ? 'onDelete handler missing' : 'comment.id missing'}`);
    }
    setShowDropdown(false);
  };
  
  const handleSaveEdit = () => {
    // Get the comment ID or generate a fallback if missing
    const commentId = comment.id || `temp-${Date.now()}`;
    
    if (onEdit && editedContent.trim()) {
      console.log(`CommentItem: Saving edited comment ${commentId} with content: ${editedContent.trim()}`);
      onEdit(commentId, editedContent.trim());
      setIsEditing(false);
    } else {
      console.error(`CommentItem: Cannot save edit - ${!onEdit ? 'onEdit handler missing' : editedContent.trim() === '' ? 'empty content' : 'unknown error'}`);
    }
  };
  
  const handleCancelEdit = () => {
    setEditedContent(comment.content);
    setIsEditing(false);
  };

  return (
    <div className="py-3 flex border-b border-gray-100 last:border-b-0 relative">
      <div className="mr-3 flex-shrink-0">
        {comment.authorAvatar ? (
          <img
            src={comment.authorAvatar}
            alt={comment.authorName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          renderAvatar(comment.authorName, "sm")
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <h4 className="font-medium text-gray-900">{comment.authorName}</h4>
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-2">
              {commentDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
              })}
            </span>
            {/* Make the action menu visible for all users for testing */}
            {(
              <div className="relative">
                <button
                  ref={menuButtonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-gray-500"
                  aria-label="More options"
                >
                  <MoreVertical size={18} />
                  <span className="text-xs">action</span>
                </button>
                
                {showDropdown && (
                  <div
                    ref={dropdownRef}
                    className="absolute right-0 mt-1 bg-white shadow-md rounded-md border border-[#dadce0] z-20 py-1 w-32 overflow-hidden"
                  >
                    <div className="text-center text-xs font-medium text-[#5f6368] py-1 border-b border-[#e8eaed]">
                      Options
                    </div>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-[#f8f9fa] text-sm flex items-center gap-2 text-[#3c4043]"
                      onClick={handleEditClick}
                    >
                      <Edit size={14} className="text-[#444746]" />
                      <span>Edit</span>
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-[#f8f9fa] text-sm flex items-center gap-2 text-[#d93025]"
                      onClick={handleDeleteClick}
                    >
                      <Trash size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="mt-1 flex flex-col">
            <input
              ref={inputRef}
              type="text"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="py-1 px-2 border border-gray-300 rounded text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
            />
            <div className="flex justify-end gap-2 mt-1">
              <button
                onClick={handleCancelEdit}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editedContent.trim()}
                className={`text-xs ${editedContent.trim() ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400'}`}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-800 mt-1 py-1 px-1 rounded transition-colors duration-100 text-sm">
              {comment.content}
            </p>
            {/* Only show edit/delete buttons for the comment owner or teacher */}
            {(currentUserId === comment.authorId || currentUserId === '1004') && (
              <div className="flex mt-1 ml-1 gap-2">
                <button
                  onClick={handleEditClick}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-gray-100 text-blue-600 border border-gray-200"
                >
                  <Edit size={12} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-gray-100 text-red-600 border border-gray-200"
                >
                  <Trash size={12} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
