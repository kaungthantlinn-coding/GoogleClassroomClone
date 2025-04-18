import React, { useState, useRef, useEffect } from 'react';
import { Announcement, Comment, addComment, removeComment, deleteAnnouncement, updateAnnouncement } from '../../types/announcement';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, Send, Edit, Trash, Copy, X, List, Bold, Italic, Underline, AlignLeft, StrikethroughIcon, ChevronDown, ChevronUp, Users } from 'lucide-react';

interface AnnouncementItemProps {
  announcement: Announcement;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  onAnnouncementUpdate: () => void;
}

const AnnouncementItem: React.FC<AnnouncementItemProps> = ({
  announcement,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onAnnouncementUpdate
}) => {
  const [commentText, setCommentText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(announcement.content);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isCommentFocused, setIsCommentFocused] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState('');
  const [activeCommentDropdown, setActiveCommentDropdown] = useState<string | null>(null);
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const [showAllComments, setShowAllComments] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const commentDropdownRef = useRef<HTMLDivElement>(null);

  const isAuthor = currentUserId === announcement.authorId;
  const createdAt = new Date(announcement.createdAt);
  
  // Format time as HH:MM AM/PM
  const timeString = createdAt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });

  // Format date as "Yesterday" or the actual date if older
  const dateString = () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    if (createdAt.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (createdAt.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return createdAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close announcement dropdown
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        menuButtonRef.current && 
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
      
      // Close comment dropdown
      if (
        commentDropdownRef.current &&
        !commentDropdownRef.current.contains(event.target as Node)
      ) {
        setActiveCommentDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle showing all comments
  const toggleShowAllComments = () => {
    setShowAllComments(!showAllComments);
  };

  const toggleCommentDropdown = (commentId: string) => {
    if (activeCommentDropdown === commentId) {
      setActiveCommentDropdown(null);
    } else {
      setActiveCommentDropdown(commentId);
    }
  };

  const handleCommentMouseEnter = (commentId: string) => {
    setHoveredCommentId(commentId);
  };

  const handleCommentMouseLeave = () => {
    setHoveredCommentId(null);
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      content: commentText,
      authorId: currentUserId,
      authorName: currentUserName,
      authorAvatar: currentUserAvatar,
      createdAt: new Date().toISOString(),
      isPrivate: false
    };

    addComment(announcement.id, newComment);
    setCommentText('');
    onAnnouncementUpdate();
  };

  const handleDeleteAnnouncement = () => {
    deleteAnnouncement(announcement.id);
    setDeleteModalVisible(false);
    onAnnouncementUpdate();
  };

  const handleEditAnnouncement = () => {
    setIsEditing(true);
    setShowDropdown(false);
  };

  const handleEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditedCommentContent(content);
    setActiveCommentDropdown(null);
  };

  const handleDeleteComment = (commentId: string) => {
    removeComment(announcement.id, commentId);
    setActiveCommentDropdown(null);
    onAnnouncementUpdate();
  };

  const handleSaveCommentEdit = (commentId: string) => {
    if (!editedCommentContent.trim()) return;
    
    // Find and update the comment
    const updatedAnnouncement = {...announcement};
    const commentIndex = updatedAnnouncement.comments.findIndex(c => c.id === commentId);
    
    if (commentIndex !== -1) {
      updatedAnnouncement.comments[commentIndex] = {
        ...updatedAnnouncement.comments[commentIndex],
        content: editedCommentContent,
        updatedAt: new Date().toISOString()
      };
      
      updateAnnouncement(updatedAnnouncement);
      setEditingCommentId(null);
      setEditedCommentContent('');
      onAnnouncementUpdate();
    }
  };

  const handleSaveEdit = () => {
    if (!editedContent.trim()) return;
    
    const updatedAnnouncement = {
      ...announcement,
      content: editedContent,
      updatedAt: new Date().toISOString()
    };
    
    updateAnnouncement(updatedAnnouncement);
    setIsEditing(false);
    onAnnouncementUpdate();
  };

  const handleCancelEdit = () => {
    setEditedContent(announcement.content);
    setIsEditing(false);
  };

  const handleCancelCommentEdit = () => {
    setEditingCommentId(null);
    setEditedCommentContent('');
  };

  const handleCopyLink = () => {
    // Create a URL for the announcement (adjust as needed for your routing)
    const announcementUrl = `${window.location.origin}/announcement/${announcement.id}`;
    navigator.clipboard.writeText(announcementUrl);
    setLinkCopied(true);
    setShowDropdown(false);
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setLinkCopied(false);
    }, 2000);
  };

  // Helper to render an avatar circle with initial
  const renderAvatar = (name: string, size: "sm" | "md" = "md") => {
    const sizeClasses = size === "sm" ? "w-8 h-8" : "w-10 h-10";
    const fontSize = size === "sm" ? "text-sm" : "text-base";
    
    return (
      <div className={`${sizeClasses} rounded-full bg-[#1a73e8] flex items-center justify-center text-white ${fontSize}`}>
        {name[0].toUpperCase()}
      </div>
    );
  };

  // Determine which comments to show based on showAllComments state
  const visibleComments = () => {
    if (!announcement.comments || announcement.comments.length === 0) {
      return [];
    }
    
    if (showAllComments || announcement.comments.length <= 1) {
      return announcement.comments;
    } else {
      // Only show the first comment
      return [announcement.comments[0]];
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
      {/* Announcement header */}
      <div className="px-4 py-3 flex items-start justify-between">
        <div className="flex items-start">
          <div className="mr-3">
            {announcement.authorAvatar ? (
              <img 
                src={announcement.authorAvatar} 
                alt={announcement.authorName} 
                className="w-10 h-10 rounded-full object-cover" 
              />
            ) : (
              renderAvatar(announcement.authorName)
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{announcement.authorName}</h3>
            <p className="text-xs text-gray-500">{dateString()}</p>
          </div>
        </div>
        
        <div className="relative">
          <button 
            ref={menuButtonRef}
            onClick={() => setShowDropdown(!showDropdown)} 
            className="text-gray-500 p-1 rounded-full hover:bg-gray-100"
          >
            <MoreVertical size={20} />
          </button>
          
          {showDropdown && (
            <div 
              ref={dropdownRef}
              className="absolute right-0 mt-1 bg-white shadow-lg rounded-md border border-gray-200 z-10 py-1 w-32"
            >
              {isAuthor && (
                <button 
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"
                  onClick={handleEditAnnouncement}
                >
                  <Edit size={16} />
                  Edit
                </button>
              )}
              {isAuthor && (
                <button 
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"
                  onClick={() => {
                    setDeleteModalVisible(true);
                    setShowDropdown(false);
                  }}
                >
                  <Trash size={16} />
                  Delete
                </button>
              )}
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"
                onClick={handleCopyLink}
              >
                <Copy size={16} />
                Copy link
              </button>
            </div>
          )}
          
          {linkCopied && (
            <div className="absolute right-0 mt-1 bg-gray-800 text-white text-xs py-1 px-2 rounded">
              Link copied!
            </div>
          )}
        </div>
      </div>
      
      {/* Announcement content */}
      <div className="px-4 pb-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 min-h-[100px] text-gray-800"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
                disabled={!editedContent.trim()}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-800">{announcement.content}</p>
        )}
      </div>
      
      {/* Comment count - now clickable to toggle comments */}
      {announcement.comments && announcement.comments.length > 0 && (
        <div className="px-4 py-2 flex items-center">
          <button 
            onClick={toggleShowAllComments}
            className="text-sm text-gray-600 border-t border-gray-200 pt-2 w-full text-left flex items-center hover:text-[#1a73e8]"
          >
            <Users size={16} className="mr-1.5 text-[#1a73e8]" />
            {announcement.comments.length} class comment{announcement.comments.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}
      
      {/* Comments section */}
      {announcement.comments && announcement.comments.length > 0 && (
        <div className="px-4">
          {visibleComments().map(comment => {
            const commentDate = new Date(comment.createdAt);
            const isCommentAuthor = currentUserId === comment.authorId;
            const isEditing = editingCommentId === comment.id;
            const isDropdownVisible = activeCommentDropdown === comment.id;
            const isHovered = hoveredCommentId === comment.id;
            
            return (
              <div 
                key={comment.id} 
                className="py-3 flex border-b border-gray-100 last:border-b-0 relative"
                onMouseEnter={() => isCommentAuthor && handleCommentMouseEnter(comment.id)}
                onMouseLeave={handleCommentMouseLeave}
              >
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
                      
                      {/* Three dots menu icon - Only visible on hover */}
                      {isCommentAuthor && !isEditing && (
                        <div className="relative" ref={commentDropdownRef}>
                          <button 
                            onClick={() => toggleCommentDropdown(comment.id)}
                            className={`p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-opacity duration-150 ${
                              isHovered ? 'opacity-100' : 'opacity-0'
                            }`}
                            title="More options"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {/* Dropdown menu that appears on click */}
                          {isDropdownVisible && (
                            <div className="absolute right-0 top-full mt-1 bg-white shadow-md rounded-md border border-gray-200 z-10 py-1 w-[120px]">
                              <div className="text-center text-xs font-medium text-gray-500 py-1 border-b border-gray-100">
                                More options
                              </div>
                              <button 
                                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-sm flex items-center gap-2"
                                onClick={() => handleEditComment(comment.id, comment.content)}
                              >
                                <Edit size={14} />
                                Edit
                              </button>
                              <button 
                                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-sm flex items-center gap-2 text-red-600"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <Trash size={14} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isEditing ? (
                    <div className="mt-1">
                      <textarea
                        value={editedCommentContent}
                        onChange={(e) => setEditedCommentContent(e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 min-h-[60px] text-gray-800 text-sm"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={handleCancelCommentEdit}
                          className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveCommentEdit(comment.id)}
                          className="px-3 py-1 text-xs bg-blue-500 text-white rounded"
                          disabled={!editedCommentContent.trim()}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-800 mt-1 py-1 px-1 rounded transition-colors duration-100 hover:bg-gray-100 cursor-default">
                      {comment.content}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Comment input - Clean minimal design */}
      <div className="px-4 py-3 flex items-center border-t border-gray-100">
        <div className="mr-3 flex-shrink-0">
          {currentUserAvatar ? (
            <img 
              src={currentUserAvatar} 
              alt={currentUserName} 
              className="w-8 h-8 rounded-full object-cover" 
            />
          ) : (
            renderAvatar(currentUserName, "sm")
          )}
        </div>
        <input
          ref={commentInputRef}
          type="text"
          placeholder="Add class comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
          className="flex-1 outline-none py-2 text-gray-700 text-sm"
        />
        <button
          onClick={handleSubmitComment}
          disabled={!commentText.trim()}
          className={`ml-2 p-2 text-gray-400 ${
            commentText.trim() ? 'text-gray-500 hover:text-gray-700' : ''
          }`}
          aria-label="Send comment"
        >
          {/* Paper airplane icon for send */}
          <svg viewBox="0 0 24 24" width="24" height="24" className="fill-current">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
          </svg>
        </button>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteModalVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete announcement?</h3>
            <p className="text-gray-600 mb-6">
              This will permanently delete the announcement and all its comments. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalVisible(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAnnouncement}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementItem; 