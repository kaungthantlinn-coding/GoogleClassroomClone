import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Users, Calendar, Upload, Link as LinkIcon, Plus, FileText } from 'lucide-react';
import { Material, saveMaterial } from '../types/material';
import { useParams } from 'react-router-dom';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (materialData: MaterialData, editId?: string) => void;
  className?: string;
  materialToEdit?: (MaterialData & { id: string }) | null;
}

export interface MaterialData {
  title: string;
  description: string;
  topic: string;
  attachments: Attachment[];
  assignTo: string[];
  scheduledFor: string | null;
}

interface Attachment {
  type: 'drive' | 'youtube' | 'link' | 'file' | 'document';
  name: string;
  url: string;
  thumbnail?: string;
}

const MaterialModal: React.FC<MaterialModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  className = 'Class',
  materialToEdit
}) => {
  const { classId } = useParams<{ classId: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('No topic');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [assignTo, setAssignTo] = useState<string[]>(['All students']);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [showSchedulingOptions, setShowSchedulingOptions] = useState(false);
  
  const [topics, setTopics] = useState(() => {
    // Load topics from localStorage if available
    const savedTopics = localStorage.getItem('topicsList');
    if (savedTopics) {
      try {
        const parsedTopics = JSON.parse(savedTopics);
        return Array.isArray(parsedTopics) ? parsedTopics : ['Unit 1', 'Unit 2', 'Projects', 'Homework'];
      } catch (e) {
        console.error('Error parsing saved topics', e);
      }
    }
    return ['Unit 1', 'Unit 2', 'Projects', 'Homework'];
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && materialToEdit) {
      setTitle(materialToEdit.title);
      setDescription(materialToEdit.description);
      setTopic(materialToEdit.topic);
      setAttachments(materialToEdit.attachments);
      setAssignTo(materialToEdit.assignTo);
      setScheduledFor(materialToEdit.scheduledFor);
      
      // Show advanced options if scheduled date is configured
      if (materialToEdit.scheduledFor) {
        setShowSchedulingOptions(true);
      }
    } else if (isOpen && !materialToEdit) {
      // Load saved values from localStorage when opening a new material form
      const savedTopic = localStorage.getItem('lastSelectedTopic');
      const savedScheduledDate = localStorage.getItem('scheduledPostDate');
      const savedTopicsList = localStorage.getItem('topicsList');
      
      // Initialize form with saved values if they exist
      if (savedTopic) setTopic(savedTopic);
      if (savedScheduledDate) {
        setScheduledFor(savedScheduledDate);
        setShowSchedulingOptions(true); // Show advanced options if there's a scheduled date
      }
      if (savedTopicsList) {
        try {
          const parsedTopics = JSON.parse(savedTopicsList);
          if (Array.isArray(parsedTopics) && parsedTopics.length > 0) {
            // Update topics state with saved topics using the setter function
            setTopics(parsedTopics);
          }
        } catch (e) {
          console.error('Error parsing saved topics list', e);
        }
      }
      
      // Reset other form fields
      resetForm();
    }
  }, [isOpen, materialToEdit]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTopic('No topic');
    setAttachments([]);
    setAssignTo(['All students']);
    setScheduledFor(null);
  };

  const handleSubmit = () => {
    const materialData: MaterialData = {
      title,
      description,
      topic,
      attachments,
      assignTo,
      scheduledFor,
    };

    // Save the topic for future use
    localStorage.setItem('lastSelectedTopic', topic);
    
    // Save scheduled date if set
    if (scheduledFor) {
      localStorage.setItem('scheduledPostDate', scheduledFor);
    }

    // If we're editing an existing material, include the ID
    if (materialToEdit) {
      onSubmit(materialData, materialToEdit.id);
    } else {
      // Create a new material
      const newMaterial: Material = {
        ...materialData,
        id: `material-${Date.now()}`,
        classId: classId || '',
        className: className,
        section: '',
        createdAt: new Date().toISOString(),
      };
      
      // Save the material
      saveMaterial(newMaterial);
      
      // Notify parent component
      onSubmit(materialData);
      
      // Dispatch event to notify other components
      const materialEvent = new CustomEvent('newMaterialCreated', {
        detail: { materialId: newMaterial.id, materialData: newMaterial }
      });
      window.dispatchEvent(materialEvent);
    }

    // Reset form and close modal
    resetForm();
    onClose();
  };

  const handleAddAttachment = (type: Attachment['type']) => {
    // For demonstration, we'll just add a placeholder attachment
    // In a real app, you would handle file uploads, Google Drive integration, etc.
    const newAttachment: Attachment = {
      type,
      name: `Sample ${type} attachment`,
      url: '#',
    };
    
    setAttachments([...attachments, newAttachment]);
  };

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const handleSelectTopic = (selectedTopic: string) => {
    setTopic(selectedTopic);
    setShowTopicDropdown(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-16 z-50">
      <div ref={modalRef} className="bg-white w-full max-w-[1000px] rounded-lg h-[calc(100vh-100px)] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose}>
              <X size={24} className="text-[#5f6368]" />
            </button>
            <div className="flex items-center gap-3">
              <FileText className="text-[#5f6368]" size={24} />
              <h1 className="text-[32px] text-[#3c4043] font-normal">Material</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="px-6 py-2 text-sm text-[#444746] hover:bg-[#f8f9fa] rounded"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!title.trim()}
              className={`px-6 py-2 text-sm rounded font-medium ${title.trim() ? 'bg-[#1a73e8] text-white hover:bg-[#1557b0]' : 'bg-[#e8eaed] text-[#5f6368] cursor-not-allowed'}`}
            >
              Post
            </button>
          </div>
        </div>

        <div className="flex p-6">
          {/* Left side - Material form */}
          <div className="flex-1 pr-6">
            <div className="space-y-6">
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-4 text-[#3c4043] placeholder-[#5f6368] bg-[#f8f9fa] rounded-t border-b border-[#e0e0e0] focus:outline-none text-[16px]"
              />

              <div className="bg-[#f8f9fa] p-4 rounded">
                <textarea
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[100px] bg-transparent placeholder-[#5f6368] focus:outline-none resize-none text-[14px]"
                />
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-[#edf2fa] rounded">
                      <span className="font-bold">B</span>
                    </button>
                    <button className="p-2 hover:bg-[#edf2fa] rounded">
                      <span className="italic">I</span>
                    </button>
                    <button className="p-2 hover:bg-[#edf2fa] rounded">
                      <span className="underline">U</span>
                    </button>
                    <button className="p-2 hover:bg-[#edf2fa] rounded">
                      <span className="text-[#5f6368]">≡</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm text-[#3c4043]">Attachments</h3>
                  <div className="space-y-2">
                    {attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-[#f8f9fa] rounded">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-[#5f6368]" />
                          <span className="text-sm">{attachment.name}</span>
                        </div>
                        <button 
                          onClick={() => handleRemoveAttachment(index)}
                          className="text-[#5f6368] hover:text-[#1a73e8]"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attach Section */}
              <div>
                <h3 className="text-sm text-[#3c4043] mb-4">Attach</h3>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleAddAttachment('drive')}
                    className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded"
                  >
                    <img src="/drive-icon.svg" alt="Drive" className="w-6 h-6" />
                    <span className="text-xs text-[#5f6368]">Drive</span>
                  </button>
                  <button 
                    onClick={() => handleAddAttachment('youtube')}
                    className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded"
                  >
                    <img src="/youtube-icon.svg" alt="YouTube" className="w-6 h-6" />
                    <span className="text-xs text-[#5f6368]">YouTube</span>
                  </button>
                  <button 
                    onClick={() => handleAddAttachment('document')}
                    className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded"
                  >
                    <Plus size={24} className="text-[#5f6368]" />
                    <span className="text-xs text-[#5f6368]">Create</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded"
                  >
                    <Upload size={24} className="text-[#5f6368]" />
                    <span className="text-xs text-[#5f6368]">Upload</span>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          handleAddAttachment('file');
                        }
                      }}
                    />
                  </button>
                  <button 
                    onClick={() => handleAddAttachment('link')}
                    className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded"
                  >
                    <LinkIcon size={24} className="text-[#5f6368]" />
                    <span className="text-xs text-[#5f6368]">Link</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Material settings */}
          <div className="w-[300px] space-y-4">
            <div className="bg-white border border-[#e0e0e0] rounded-lg p-4">
              <h3 className="text-sm font-medium text-[#3c4043] mb-4">For</h3>
              <button className="w-full px-3 py-2 text-sm border rounded hover:bg-[#f8f9fa] flex items-center justify-between">
                <span>{className}</span>
                <ChevronDown size={16} className="text-[#5f6368]" />
              </button>
              <button className="mt-3 w-full px-3 py-2 text-sm border rounded hover:bg-[#f8f9fa] flex items-center gap-2 text-[#1a73e8]">
                <Users size={16} />
                All students
              </button>
            </div>

            <div className="bg-white border border-[#e0e0e0] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#3c4043]">Topic</h3>
                <div className="relative">
                  <button 
                    onClick={() => setShowTopicDropdown(!showTopicDropdown)}
                    className="text-[#1a73e8] text-sm hover:bg-[#f6fafe] px-2 py-1 rounded flex items-center gap-1"
                  >
                    {topic}
                    <ChevronDown size={16} />
                  </button>
                  
                  {showTopicDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#e0e0e0] rounded-lg shadow-lg z-10">
                      <div className="p-2 max-h-60 overflow-y-auto">
                        <button 
                          onClick={() => handleSelectTopic('No topic')}
                          className={`w-full text-left px-3 py-2 text-sm rounded ${topic === 'No topic' ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'hover:bg-[#f8f9fa]'}`}
                        >
                          No topic
                        </button>
                        {topics.map((t) => (
                          <button 
                            key={t}
                            onClick={() => handleSelectTopic(t)}
                            className={`w-full text-left px-3 py-2 text-sm rounded ${topic === t ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'hover:bg-[#f8f9fa]'}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scheduling Options */}
            <div className="bg-white border border-[#e0e0e0] rounded-lg p-4">
              <button 
                onClick={() => setShowSchedulingOptions(!showSchedulingOptions)}
                className="w-full flex items-center justify-between text-sm font-medium text-[#3c4043]"
              >
                <span>Scheduling options</span>
                <ChevronDown size={16} className={`text-[#5f6368] transition-transform ${showSchedulingOptions ? 'rotate-180' : ''}`} />
              </button>
              
              {showSchedulingOptions && (
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm text-[#3c4043] mb-2">Schedule post</h4>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-[#5f6368]" />
                      <input 
                        type="date" 
                        value={scheduledFor || ''}
                        onChange={(e) => setScheduledFor(e.target.value)}
                        className="border border-[#dadce0] rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialModal;