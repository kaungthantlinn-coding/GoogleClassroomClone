import React, { useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  files: File[];
  maxFiles?: number;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  files,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  className = '',
}) => {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (e.target.files && e.target.files.length > 0) {
      // Check if adding these files would exceed maxFiles
      if (files.length + e.target.files.length > maxFiles) {
        setError(`You can only upload up to ${maxFiles} files`);
        return;
      }
      
      const newFiles: File[] = [];
      
      // Validate each file
      Array.from(e.target.files).forEach(file => {
        // Check file size
        if (file.size > maxSize) {
          setError(`File "${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`);
          return;
        }
        
        // Check file type if allowedTypes is specified
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
          setError(`File type "${file.type}" is not allowed`);
          return;
        }
        
        newFiles.push(file);
      });
      
      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles]);
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      <div className="mb-4">
        <label htmlFor="file-upload" className="block mb-2 text-sm font-medium text-gray-700">
          Add attachment
        </label>
        <div className="flex items-center justify-center w-full">
          <label 
            htmlFor="file-upload" 
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-500" />
              <p className="mb-1 text-sm text-gray-500">Click to upload files</p>
              <p className="text-xs text-gray-500">PDF, DOCX, JPG, PNG</p>
            </div>
            <input 
              id="file-upload" 
              type="file" 
              className="hidden" 
              multiple 
              onChange={handleFileChange} 
              ref={fileInputRef}
            />
          </label>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {/* Display selected files */}
      {files.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Selected files:</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <FileText size={16} className="text-gray-500 mr-2" />
                  <div>
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-2">({formatFileSize(file.size)})</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveFile(index)}
                  className="text-gray-400 hover:text-red-500"
                  type="button"
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 