import React, { useState, useRef, useEffect } from 'react';
import { Announcement, Comment, addComment, removeComment, deleteAnnouncement, updateAnnouncement } from '../../types/announcement';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, Send, Edit, Trash, Copy, X } from 'lucide-react';

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
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const isAuthor = currentUserId === announcement.authorId;
  const createdAt = new Date(announcement.createdAt);
  
  // Format time as HH:MM AM/PM
  const timeString = createdAt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });

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

  return (
    <div className="bg-white rounded-lg border border-gray-300 shadow-sm mb-3">
      {/* Announcement header */}
      <div className="px-4 py-3 flex items-start justify-between">
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
            {announcement.authorAvatar ? (
              <img 
                src={announcement.authorAvatar} 
                alt={announcement.authorName} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  // Fall back to initial avatar if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `
                    <div class="w-full h-full bg-blue-500 flex items-center justify-center text-white">
                      ${announcement.authorName[0].toUpperCase()}
                    </div>
                  `;
                }}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white">
                {announcement.authorName[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{announcement.authorName}</h3>
            <p className="text-xs text-gray-500">{timeString}</p>
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
      <div className="px-4 pb-2">
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
      
      {/* Comment section */}
      <div className="border-t border-gray-200 px-4 py-2">
        {/* Comment input */}
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
            {currentUserAvatar ? (
              <img 
                src={currentUserAvatar} 
                alt={currentUserName} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  // Fall back to initial avatar if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `
                    <div class="w-full h-full bg-blue-500 flex items-center justify-center text-white text-sm">
                      ${currentUserName[0].toUpperCase()}
                    </div>
                  `;
                }}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-sm">
                {currentUserName[0].toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex-1 flex items-center relative">
            <input
              type="text"
              placeholder="Add class comment..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm"
              value={commentText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommentText(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter') {
                  handleSubmitComment();
                }
              }}
            />
            
            <button
              className="absolute right-2 p-1 text-gray-400 hover:text-blue-500 disabled:text-gray-300"
              disabled={!commentText.trim()}
              onClick={handleSubmitComment}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {deleteModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Delete announcement?</h3>
            <p className="text-gray-600 mb-6">This will permanently delete this announcement and all its comments.</p>
            <div className="flex justify-end gap-3">
              <button 
                className="px-4 py-2 text-gray-700"
                onClick={() => setDeleteModalVisible(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={handleDeleteAnnouncement}
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