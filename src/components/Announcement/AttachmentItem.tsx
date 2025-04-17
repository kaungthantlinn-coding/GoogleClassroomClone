import React from 'react';
import { FileText, Image as ImageIcon, Download, File } from 'lucide-react';
import { Attachment } from '../../types/announcement';

interface AttachmentItemProps {
  attachment: Attachment;
}

const AttachmentItem: React.FC<AttachmentItemProps> = ({ attachment }) => {
  const getFileIcon = () => {
    const fileType = attachment.type.toLowerCase();
    
    if (fileType.includes('pdf')) {
      return <FileText className="text-red-500" size={24} />;
    } else if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('png') || fileType.includes('jpeg')) {
      return <ImageIcon className="text-purple-600" size={24} />;
    } else {
      return <File className="text-yellow-500" size={24} />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    // In a real app, this would trigger the actual download
    window.open(attachment.url, '_blank');
  };

  return (
    <div className="p-3 bg-[#f5f5f5] rounded-md mb-2 flex items-center justify-between">
      <div className="flex items-center">
        {getFileIcon()}
        <div className="ml-3">
          <div className="font-medium text-[#3c4043]">{attachment.name}</div>
          <div className="text-xs text-[#5f6368]">
            {attachment.size ? formatFileSize(attachment.size) : 'Unknown size'}
          </div>
        </div>
      </div>
      <button 
        onClick={handleDownload}
        className="p-2 hover:bg-[#e0e0e0] rounded-full"
        title="Download"
      >
        <Download size={16} className="text-[#5f6368]" />
      </button>
    </div>
  );
};

export default AttachmentItem; 