import React from 'react';
import { Link } from 'react-router-dom';
import { Material } from '../types/material';
import { Book, ExternalLink, FileText, Image, Link as LinkIcon, Video } from 'lucide-react';

interface StreamMaterialCardProps {
  material: Material;
  classId: string;
}

const StreamMaterialCard: React.FC<StreamMaterialCardProps> = ({ material, classId }) => {
  // Helper to get the appropriate icon for the attachment type
  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText size={16} className="text-gray-500" />;
      case 'drive':
        return <Image size={16} className="text-gray-500" />;
      case 'youtube':
        return <Video size={16} className="text-gray-500" />;
      case 'link':
        return <LinkIcon size={16} className="text-gray-500" />;
      default:
        return <FileText size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden hover:shadow transition-shadow duration-200">
      {/* Header with icon and type indicator */}
      <div className="flex items-center p-4 bg-[#26a69a] text-white">
        <Book size={18} className="mr-2" />
        <span className="text-sm font-medium">Material</span>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <Link to={`/c/${classId}/m/${material.id}`}>
          <h3 className="text-base font-medium text-[#26a69a] hover:underline">{material.title}</h3>
        </Link>
        
        {material.description && (
          <p className="mt-2 text-sm text-gray-600">{material.description}</p>
        )}
        
        {/* Attachments */}
        {material.attachments && material.attachments.length > 0 && (
          <div className="mt-3">
            {material.attachments.map((attachment, index) => (
              <div key={index} className="flex items-center mt-1 text-sm text-gray-700">
                {getAttachmentIcon(attachment.type)}
                <a 
                  href={attachment.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 hover:underline flex items-center"
                >
                  {attachment.name}
                  <ExternalLink size={12} className="ml-1" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamMaterialCard;
