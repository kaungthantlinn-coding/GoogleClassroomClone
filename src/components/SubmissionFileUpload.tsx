import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { uploadSubmissionFile } from '../api/fileUploadApi';
import { CheckCircle, Paperclip, Upload, X } from 'lucide-react';

interface SubmissionFileUploadProps {
  assignmentId: string | number;
  submissionId?: string | number;
  onUploadSuccess?: (fileData: any) => void;
  onUploadError?: (error: Error) => void;
  initialFiles?: Array<{id?: string | number; name: string; type?: string; [key: string]: any}>;
}

const SubmissionFileUpload: React.FC<SubmissionFileUploadProps> = ({
  assignmentId,
  submissionId,
  onUploadSuccess,
  onUploadError,
  initialFiles = []
}) => {
  // Track the file selected for upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track submitted state based only on API data (initialFiles from props)
  const [isSubmitted, setIsSubmitted] = useState(initialFiles.length > 0);
  const [submittedFiles, setSubmittedFiles] = useState<any[]>(initialFiles);
  
  // For optional comment
  const [comment, setComment] = useState('');

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setError(null);
    }
  };
  
  // Clear selected file
  const handleClearFile = () => {
    setSelectedFile(null);
  };

  // Handle Turn In button click
  const handleTurnIn = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      console.log(`Uploading file: ${selectedFile.name} for assignment ${assignmentId}`);
      
      // Upload the file to the API
      const result = await uploadSubmissionFile(assignmentId, selectedFile, submissionId);
      console.log('Upload result:', result);
      
      // Notify parent component about the success
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
      
      // Update UI state
      setSubmittedFiles([result]);
      setSelectedFile(null);
      setIsSubmitted(true);
      
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(`Failed to upload: ${err.message || 'Unknown error'}`);
      if (onUploadError) {
        onUploadError(err);
      }
    } finally {
      setUploading(false);
    }
  };

  // Handle Edit Submission button
  const handleEditSubmission = async () => {
    try {
      setIsSubmitted(false);
    } catch (err: any) {
      console.error('Error preparing edit:', err);
    }
  };

  return (
    <div>
      {/* Handle non-submitted state - Upload UI */}
      {!isSubmitted ? (
        <div>
          <h3 className="text-lg font-medium mb-2">Your work</h3>
          
          <div className="mb-4">
            <p className="block mb-2 text-sm font-medium text-gray-700">Add attachment</p>
            
            {!selectedFile ? (
              // File upload area when no file selected
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
                    onChange={handleFileChange} 
                    accept=".pdf,.docx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                  />
                </label>
              </div>
            ) : (
              // Show selected file
              <div>
                <p className="text-sm font-medium mb-1">Selected files:</p>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <Paperclip className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500 ml-2">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                  </div>
                  <button 
                    onClick={handleClearFile} 
                    className="text-gray-400 hover:text-red-500"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">Add comment (optional)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment to your submission..."
              className="min-h-[100px] resize-none"
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="flex justify-end">
            <Button 
              onClick={handleTurnIn} 
              disabled={uploading || !selectedFile}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? 'Uploading...' : 'Turn in'}
            </Button>
          </div>
        </div>
      ) : (
        // Handle submitted state - Confirmation UI
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Assignment Submitted</h2>
          <p className="text-gray-600 mb-6">Your assignment has been successfully submitted.</p>
          
          <div className="mb-6 mt-4">
            <p className="text-sm text-gray-600 mb-1">Submitted files:</p>
            <div className="flex items-center py-2">
              <div className="bg-gray-200 w-5 h-5 mr-2">
              </div>
              <span className="text-sm text-gray-700">
                {submittedFiles[0]?.id || ''}
              </span>
            </div>
          </div>
          
          <Button 
            onClick={handleEditSubmission}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Edit Submission
          </Button>
        </div>
      )}
    </div>
  );
};

export default SubmissionFileUpload;
