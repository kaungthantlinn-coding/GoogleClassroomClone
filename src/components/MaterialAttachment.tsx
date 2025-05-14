import React, { useState } from 'react';
import { 
  Download, 
  Eye, 
  Link as LinkIcon, 
  Film, 
  Image, 
  File as FileIcon,
  FileText,
  Loader2
} from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiMode';

interface MaterialAttachmentProps {
  attachment: {
    type: 'drive' | 'youtube' | 'link' | 'file' | 'document';
    name: string;
    url: string;
    thumbnail?: string;
    fileId?: number;
    size?: number;
    uploadDate?: string;
  };
  showActions?: boolean;
}

const MaterialAttachment: React.FC<MaterialAttachmentProps> = ({ 
  attachment, 
  showActions = true 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const baseUrl = getApiBaseUrl();

  // If the URL is relative, prepend the base URL
  const fullUrl = attachment.url.startsWith('/') 
    ? `${baseUrl}${attachment.url}` 
    : attachment.url;

  // Format file size for display (kb, mb, etc)
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle file download
  const handleDownload = async () => {
    try {
      setIsLoading(true);
      
      // Fetch the file
      const response = await fetch(fullUrl, {
        headers: {
          // Include auth token if needed
          Authorization: `Bearer ${sessionStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      
      // Get file blob
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attachment.name; // Use original filename
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
      setIsLoading(false);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle preview (open in new tab)
  const handlePreview = () => {
    window.open(fullUrl, '_blank');
  };

  // Render appropriate icon based on file type
  const renderIcon = () => {
    const iconSize = 18;
    const iconClass = "flex-shrink-0 text-gray-500";
    
    switch (attachment.type) {
      case 'document':
        return <FileText size={iconSize} className={iconClass} />;
      case 'youtube':
        return <Film size={iconSize} className={iconClass} />;
      case 'drive':
        return <Image size={iconSize} className={iconClass} />;
      case 'link':
        return <LinkIcon size={iconSize} className={iconClass} />;
      default:
        return <FileIcon size={iconSize} className={iconClass} />;
    }
  };

  // Get file extension from name
  const getFileExtension = (filename: string): string => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toUpperCase() || '' : '';
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
      {/* File icon */}
      <div className="w-8 h-8 flex items-center justify-center bg-white rounded-md border border-gray-200">
        {renderIcon()}
      </div>
      
      {/* File information */}
      <div className="flex-grow min-w-0">
        <div className="font-medium text-sm text-gray-800 truncate" title={attachment.name}>
          {attachment.name}
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span>{getFileExtension(attachment.name)}</span>
          {attachment.size && <span>•</span>}
          {attachment.size && <span>{formatFileSize(attachment.size)}</span>}
        </div>
      </div>
      
      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-1">
          {isLoading ? (
            <button disabled className="p-1 rounded-full hover:bg-gray-200 text-gray-500 opacity-50">
              <Loader2 size={18} className="animate-spin" />
            </button>
          ) : (
            <>
              <button 
                onClick={handleDownload}
                className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                title="Download"
              >
                <Download size={18} />
              </button>
              <button 
                onClick={handlePreview}
                className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                title="Preview"
              >
                <Eye size={18} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MaterialAttachment;
