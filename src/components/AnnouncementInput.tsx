import React, { useState, useContext, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, Youtube, Upload, Link2, Users, Image, PaperclipIcon, X } from 'lucide-react';
import { ClassDataContext } from '../pages/ClassPage';
import { saveAnnouncement } from '../types/announcement';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

const AnnouncementInput = ({ onAnnouncementPosted }: { onAnnouncementPosted?: () => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<{ id: string; type: string; url: string; name: string }[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [recipient, setRecipient] = useState('all');
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const classData = useContext(ClassDataContext);
  const { classId } = useParams<{ classId: string }>();
  const user = useAuthStore((state) => state.user) || { id: 'user1', name: 'You', avatar: undefined };
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const handlePost = () => {
    if (!content.trim() && attachments.length === 0) return;
    
    setIsPosting(true);
    
    // Create a new announcement
    const announcement = {
      id: `announcement-${Date.now()}`,
      classId: classId || 'unknown',
      content: content.trim(),
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      createdAt: new Date().toISOString(),
      attachments: attachments.length > 0 ? attachments : [],
      comments: []
    };
    
    console.log('Creating announcement with classId:', classId);
    console.log('Current URL:', window.location.href);
    console.log('Announcement to save:', announcement);
    
    // Get existing announcements first
    let existingAnnouncements = [];
    try {
      const stored = localStorage.getItem('classroom_announcements');
      if (stored) {
        existingAnnouncements = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error reading existing announcements:", e);
    }
    
    // Add new announcement and save directly to localStorage
    try {
      existingAnnouncements.push(announcement);
      localStorage.setItem('classroom_announcements', JSON.stringify(existingAnnouncements));
      console.log('Saved announcement. Total announcements:', existingAnnouncements.length);
      
    } catch (e) {
      console.error('Error saving announcement to localStorage:', e);
    }
    
    // Reset form
    setContent('');
    setAttachments([]);
    setIsExpanded(false);
    setIsPosting(false);
    
    // Call callback if provided
    if (onAnnouncementPosted) {
      setTimeout(() => {
        onAnnouncementPosted();
      }, 100); // Small delay to ensure localStorage is updated
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Create a URL for the file
      const url = URL.createObjectURL(file);
      
      // Add to attachments
      setAttachments([
        ...attachments,
        {
          id: `attachment-${Date.now()}`,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          url,
          name: file.name
        }
      ]);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const handleAttachLink = () => {
    const url = prompt('Enter a URL:');
    if (url) {
      setAttachments([
        ...attachments,
        {
          id: `attachment-${Date.now()}`,
          type: 'link',
          url,
          name: url
        }
      ]);
    }
  };

  // Focus the input when expanded
  useEffect(() => {
    if (isExpanded && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [isExpanded]);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {!isExpanded ? (
        <div 
          className="flex items-start p-4 cursor-text" 
          onClick={() => setIsExpanded(true)}
        >
          <div className="w-8 h-8 rounded-full bg-[#1a73e8] flex items-center justify-center text-white text-sm mr-3">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
            ) : (
              user.name[0].toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <div className="w-full py-1.5 text-sm text-[#5f6368]">
              Announce something to your class
            </div>
          </div>
          <div className="ml-2">
            <div className="p-2 text-gray-400">
              <svg viewBox="0 0 24 24" width="22" height="22" className="mx-auto">
                <path fill="currentColor" d="M17,7h2v2h-2V7z M17,11h2v2h-2V11z M17,15h2v2h-2V15z M11,7h2V18h-2V7z M7,14h2v2H7V14z M7,10h2v2H7V10z M5,7v12 h14V7H5z M21,5H3v16h18V5z"/>
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6">
          {/* Recipients Selection */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#3c4043] text-[13px]">For</span>
            <div className="flex items-center gap-2 flex-1">
              <button className="px-4 py-2 text-[13px] rounded-md bg-[#f8f9fa] hover:bg-[#f1f3f4] flex items-center gap-2">
                {classData.className} {classData.section}
                <svg className="w-4 h-4 text-[#5f6368]" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                </svg>
              </button>
              <button 
                className={`px-4 py-2 text-[13px] rounded-md border hover:bg-[#f8f9fa] flex items-center gap-2 ${
                  recipient === 'all' ? 'border-[#1a73e8] text-[#1a73e8]' : 'border-[#dadce0] text-[#5f6368]'
                }`}
                onClick={() => setRecipient('all')}
              >
                <Users size={16} />
                All students
              </button>
            </div>
          </div>

          {/* Text Input */}
          <div className="bg-[#f8f9fa] rounded-lg p-4 mb-4 min-h-[120px]">
            <textarea
              ref={textInputRef}
              placeholder="Announce something to your class"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-[#3c4043] text-[15px] placeholder-[#5f6368] resize-none min-h-[80px]"
            />
            
            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map(attachment => (
                  <div key={attachment.id} className="flex items-center justify-between p-2 bg-white rounded border border-[#dadce0]">
                    <div className="flex items-center gap-2">
                      {attachment.type === 'image' ? (
                        <Image size={16} className="text-[#5f6368]" />
                      ) : attachment.type === 'link' ? (
                        <Link2 size={16} className="text-[#5f6368]" />
                      ) : (
                        <PaperclipIcon size={16} className="text-[#5f6368]" />
                      )}
                      <span className="text-sm text-[#3c4043] truncate max-w-[300px]">{attachment.name}</span>
                    </div>
                    <button 
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      className="p-1 hover:bg-[#f1f3f4] rounded-full"
                    >
                      <X size={16} className="text-[#5f6368]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button className="p-2 hover:bg-[#f1f3f4] rounded">
                <Bold size={18} className="text-[#444746]" />
              </button>
              <button className="p-2 hover:bg-[#f1f3f4] rounded">
                <Italic size={18} className="text-[#444746]" />
              </button>
              <button className="p-2 hover:bg-[#f1f3f4] rounded">
                <Underline size={18} className="text-[#444746]" />
              </button>
              <div className="h-5 w-[1px] bg-[#dadce0] mx-1"></div>
              <div className="relative">
                <button 
                  className="p-2 hover:bg-[#f1f3f4] rounded"
                  onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
                >
                  <svg className="w-5 h-5 text-[#444746]" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  </svg>
                </button>
                
                {/* Attachment options dropdown */}
                {showAttachmentOptions && (
                  <div className="absolute left-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <input 
                      type="file" 
                      ref={attachmentInputRef}
                      className="hidden" 
                      onChange={handleAttachmentUpload}
                    />
                    <button 
                      className="flex items-center gap-2 px-4 py-2 text-sm text-[#3c4043] hover:bg-[#f8f9fa] w-full text-left"
                      onClick={() => attachmentInputRef.current?.click()}
                    >
                      <Upload size={16} />
                      Upload file
                    </button>
                    <button 
                      className="flex items-center gap-2 px-4 py-2 text-sm text-[#3c4043] hover:bg-[#f8f9fa] w-full text-left"
                      onClick={handleAttachLink}
                    >
                      <Link2 size={16} />
                      Add link
                    </button>
                    <button 
                      className="flex items-center gap-2 px-4 py-2 text-sm text-[#3c4043] hover:bg-[#f8f9fa] w-full text-left"
                      onClick={() => { 
                        setShowAttachmentOptions(false);
                        window.open('https://youtube.com', '_blank');
                      }}
                    >
                      <Youtube size={16} />
                      YouTube
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsExpanded(false)}
                className="px-6 py-2 text-[#1967d2] hover:bg-[#f6fafe] rounded text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handlePost}
                disabled={(!content.trim() && attachments.length === 0) || isPosting}
                className={`px-6 py-2 rounded text-sm font-medium transition-colors ${
                  (!content.trim() && attachments.length === 0) || isPosting
                    ? 'bg-[#e2e2e2] text-[#666]'
                    : 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'
                }`}
              >
                {isPosting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementInput; 