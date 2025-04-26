import React, { useState, useRef, useEffect } from 'react';
import { FileText, MoreVertical, Edit, Trash, Link as LinkIcon, BookOpen } from 'lucide-react';

interface MaterialCardProps {
  id: string;
  title: string;
  description?: string;
  attachments?: {
    type: 'drive' | 'youtube' | 'link' | 'file' | 'document';
    name: string;
    url: string;
    thumbnail?: string;
  }[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({
  id,
  title,
  description,
  attachments = [],
  onEdit,
  onDelete
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Get icon based on attachment type
  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'link':
        return <LinkIcon size={16} className="text-[#5f6368]" />;
      default:
        return <FileText size={16} className="text-[#5f6368]" />;
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow" id={`material-${id}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-start gap-3">
            <BookOpen size={24} className="text-[#2563eb] mt-1" />
            <div>
              <h3 className="text-[16px] font-medium text-[#3c4043]">{title}</h3>
              {description && (
                <p className="text-[14px] text-[#5f6368] mt-1">
                  {description.length > 100 ? `${description.substring(0, 100)}...` : description}
                </p>
              )}
              
              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 text-[14px] text-[#3c4043]">
                      {getAttachmentIcon(attachment.type)}
                      <span>{attachment.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="relative">
            {showMenu && (
              <div ref={menuRef} className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl z-20 animate-fade-in">
                {/* Caret */}
                <div className="absolute right-4 -bottom-2 w-3 h-3 bg-white border-l border-t border-gray-200 rotate-45 z-30"></div>
                <button 
                  onClick={handleEdit}
                  className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50 text-sm text-left rounded-t-xl"
                >
                  <Edit size={16} className="text-[#5f6368]" />
                  Edit
                </button>
                <button 
                  onClick={handleDeleteClick}
                  className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50 text-sm text-left text-red-600 rounded-b-xl"
                >
                  <Trash size={16} />
                  Delete
                </button>
              </div>
            )}
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <MoreVertical size={20} className="text-[#5f6368]" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete material</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete "{title}"? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
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

export default MaterialCard;