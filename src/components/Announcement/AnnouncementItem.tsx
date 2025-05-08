import React, { useState, useRef, useEffect } from 'react';
import { Announcement, Comment, addComment, removeComment, deleteAnnouncement, updateAnnouncement, editComment, getCommentsForAnnouncement } from '../../types/announcement';
import { MoreVertical, Edit, Trash, Copy, Users } from 'lucide-react';
import CommentItem from './CommentItem';

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
  const [showAllComments, setShowAllComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(announcement.comments || []);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const createdAt = new Date(announcement.createdAt);

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

  // Handle editing a comment
  const handleEditComment = async (commentId: string, newContent: string) => {
    try {
      console.log(`AnnouncementItem: Editing comment ${commentId} with new content: ${newContent}`);
      
      // Call the API function to edit the comment
      await editComment(commentId, newContent);
      
      // Update local state immediately for responsive UI
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId ? { ...comment, content: newContent } : comment
        )
      );
      
      // Get latest data from the server to ensure we're in sync
      fetchComments();
      console.log(`Comment ${commentId} edited successfully`);
    } catch (error) {
      console.error(`Error editing comment ${commentId}:`, error);
      alert('Failed to edit comment. Please try again.');
    }
  };
  
  // Handle deleting a comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      console.log(`AnnouncementItem: Deleting comment ${commentId}`);
      
      // Call the API function to delete the comment
      await removeComment(commentId);
      
      // Update local state immediately for responsive UI
      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
      
      // Refetch comments to ensure sync with server
      fetchComments();
      console.log(`Comment ${commentId} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting comment ${commentId}:`, error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  // Fetch comments separately
  const fetchComments = async () => {
    if (!announcement.id) return;

    setIsLoadingComments(true);
    try {
      const fetchedComments = await getCommentsForAnnouncement(announcement.id);
      setComments(fetchedComments);
    } catch (error) {
      console.error(`Failed to fetch comments for announcement ${announcement.id}:`, error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Fetch comments on initial load and when needed
  useEffect(() => {
    fetchComments();
  }, [announcement.id]);

  // Also update comments array whenever announcement.comments changes
  // This ensures we have both API data and any comments included in the announcement object
  useEffect(() => {
    if (announcement.comments && announcement.comments.length > 0) {
      // If we have comments from the announcement object (which might be the case in some responses)
      // we'll use those until we get the fresh data from the API
      setComments(prevComments => {
        if (prevComments.length === 0) {
          return announcement.comments;
        }
        return prevComments;
      });
    }
  }, [announcement.comments]);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    try {
      // Prepare comment data for API with fallback values
      const commentData = {
        userId: currentUserId || '1004', // Ensure we have a user ID
        userName: currentUserName || 'User', // Ensure we have a user name
        text: commentText.trim()
      };

      console.log(`Submitting comment to announcement ${announcement.id}`, commentData);

      // Call API to add comment
      await addComment(announcement.id, commentData);
      setCommentText('');

      // Fetch latest comments instead of relying on parent update
      fetchComments();
      onAnnouncementUpdate();
    } catch (error) {
      console.error(`Failed to add comment to announcement ${announcement.id}:`, error);
    }
  };

  const handleDeleteAnnouncement = async () => {
    try {
      // Convert ID to string and check if it's a generated ID
      const idStr = String(announcement.id);
      const isGeneratedId = idStr.startsWith('generated-') ||
                            idStr.startsWith('local-') ||
                            idStr.startsWith('created-');

      if (isGeneratedId) {
        console.warn(`Deleting generated announcement with ID: ${idStr}`);
        // For generated IDs, we just pretend it was deleted successfully
        setDeleteModalVisible(false);
        onAnnouncementUpdate();
        return;
      }

      const success = await deleteAnnouncement(announcement.id);
      if (success) {
        setDeleteModalVisible(false);
        onAnnouncementUpdate();
      }
    } catch (error) {
      console.error(`Failed to delete announcement ${announcement.id}:`, error);
      setDeleteModalVisible(false);
      alert('Failed to delete announcement. Please try again.');
    }
  };

  const handleEditAnnouncement = () => {
    setIsEditing(true);
    setShowDropdown(false);
  };

  const handleSaveEdit = async () => {
    if (!editedContent.trim()) return;

    // Validate that announcement ID exists
    if (!announcement.id) {
      console.error('Cannot update announcement: ID is undefined');
      alert('Error updating announcement: Invalid ID');
      setIsEditing(false);
      return;
    }

    // Convert ID to string and check if it's a generated ID
    const idStr = String(announcement.id);
    const isGeneratedId = idStr.startsWith('generated-') ||
                          idStr.startsWith('local-') ||
                          idStr.startsWith('created-');

    if (isGeneratedId) {
      console.warn(`Editing generated announcement with ID: ${idStr}`);
      alert('Note: This is a temporary announcement that exists only in your browser. Your changes will be saved locally but not on the server.');
    }

    try {
      console.log(`Updating announcement with ID: ${announcement.id}`);

      // Update via API
      await updateAnnouncement(announcement.id, {
        content: editedContent,
        updatedAt: new Date().toISOString()
      });

      setIsEditing(false);
      onAnnouncementUpdate();
    } catch (error) {
      console.error(`Failed to update announcement ${announcement.id}:`, error);

      if (isGeneratedId) {
        // For generated IDs, still close the editor since we handle this specially
        setIsEditing(false);
        onAnnouncementUpdate();
      } else {
        alert('Failed to save changes. Please try again.');
        setIsEditing(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(announcement.content);
    setIsEditing(false);
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
    if (!comments || comments.length === 0) {
      return [];
    }

    if (showAllComments || comments.length <= 1) {
      return comments;
    } else {
      // Only show the first comment
      return [comments[0]];
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
              <div key={`author-avatar-${announcement.id}`}>
                {renderAvatar(announcement.authorName)}
              </div>
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
              key="dropdown-menu"
              ref={dropdownRef}
              className="absolute right-0 mt-1 bg-white shadow-md rounded-md border border-[#dadce0] z-10 py-1 w-48 overflow-hidden"
            >
              <div key="options-header" className="text-center text-xs font-medium text-[#5f6368] py-1 border-b border-[#e8eaed]">
                Options
              </div>

              <button
                key="edit-button"
                className="w-full text-left px-4 py-2.5 hover:bg-[#f8f9fa] text-sm flex items-center gap-3 text-[#3c4043]"
                onClick={handleEditAnnouncement}
              >
                <Edit key="edit-icon" size={16} className="text-[#444746]" />
                <span key="edit-text">Edit</span>
              </button>

              <button
                key="delete-button"
                className="w-full text-left px-4 py-2.5 hover:bg-[#f8f9fa] text-sm flex items-center gap-3 text-[#d93025]"
                onClick={() => {
                  setDeleteModalVisible(true);
                  setShowDropdown(false);
                }}
              >
                <Trash key="trash-icon" size={16} />
                <span key="delete-text">Delete</span>
              </button>

              <div key="divider" className="border-t border-[#dadce0] my-1"></div>

              <button
                key="copy-button"
                className="w-full text-left px-4 py-2.5 hover:bg-[#f8f9fa] text-sm flex items-center gap-3 text-[#3c4043]"
                onClick={handleCopyLink}
              >
                <Copy key="copy-icon" size={16} className="text-[#444746]" />
                <span key="copy-text">Copy link</span>
              </button>
            </div>
          )}

          {linkCopied && (
            <div key="link-copied-message" className="absolute right-0 mt-1 bg-gray-800 text-white text-xs py-1 px-2 rounded">
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
                key="cancel-edit-button"
                onClick={handleCancelEdit}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                key="save-edit-button"
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
      {comments && comments.length > 0 && (
        <div className="px-4 py-2 flex items-center">
          <button
            onClick={toggleShowAllComments}
            className="text-sm text-gray-600 border-t border-gray-200 pt-2 w-full text-left flex items-center hover:text-[#1a73e8]"
          >
            <Users size={16} className="mr-1.5 text-[#1a73e8]" />
            {comments.length} class comment{comments.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Comments section */}
      {isLoadingComments ? (
        <div className="px-4 py-3 text-center text-gray-500">
          Loading comments...
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="px-4">
          {visibleComments().map((comment, index) => (
            <CommentItem
              key={`${announcement.id}-comment-${comment.id || index}`}
              comment={comment}
              renderAvatar={renderAvatar}
              currentUserId={currentUserId}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 py-2 text-center text-gray-500 text-sm border-t border-gray-100">
          No comments yet
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
            <div key="current-user-avatar">
              {renderAvatar(currentUserName, "sm")}
            </div>
          )}
        </div>
        <input
          ref={commentInputRef}
          type="text"
          placeholder="Add class comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
          className="flex-1 outline-none py-2 text-gray-700 text-sm border-b border-transparent focus:border-blue-500 transition-colors"
        />
        <button
          onClick={handleSubmitComment}
          disabled={!commentText.trim()}
          className={`ml-2 p-2 rounded-full ${
            commentText.trim() ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-300'
          }`}
          aria-label="Send comment"
        >
          {/* Paper airplane icon for send */}
          <svg viewBox="0 0 24 24" width="20" height="20" className="fill-current">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
          </svg>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalVisible && (
        <div key="delete-modal-overlay" className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div key="delete-modal-content" className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-[#3c4043] mb-3">Delete announcement?</h3>
            <p className="text-[#5f6368] mb-6">
              This will permanently delete the announcement and all its comments. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                key="cancel-delete-button"
                onClick={() => setDeleteModalVisible(false)}
                className="px-5 py-2 text-[#1a73e8] hover:bg-[#f6fafe] rounded font-medium"
              >
                Cancel
              </button>
              <button
                key="confirm-delete-button"
                onClick={handleDeleteAnnouncement}
                className="px-5 py-2 bg-[#1a73e8] text-white rounded hover:bg-[#1765c6] font-medium"
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