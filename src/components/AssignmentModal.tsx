import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Users, Calendar, Clock, Upload, Link as LinkIcon, AlertCircle, Paperclip, Plus, FileText, Check } from 'lucide-react';
import { Assignment, saveAssignment } from '../types/assignment';
import { useParams } from 'react-router-dom';
import * as storageApi from '../api/storageApi';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assignmentData: AssignmentData, editId?: string) => void;
  className?: string;
  assignmentToEdit?: (AssignmentData & { id: string }) | null;
}

export interface AssignmentData {
  title: string;
  instructions: string;
  points: string;
  dueDate: string;
  dueTime: string;
  topic: string;
  attachments: Attachment[];
  assignTo: string[];
  scheduledFor: string | null;
  allowLateSubmissions?: boolean;
  lateSubmissionPolicy?: string;
}

interface Attachment {
  type: 'drive' | 'youtube' | 'link' | 'file' | 'document';
  name: string;
  url: string;
  thumbnail?: string;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  className = 'Class',
  assignmentToEdit
}) => {
  const { classId } = useParams<{ classId: string }>();
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [points, setPoints] = useState('100');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [topic, setTopic] = useState('No topic');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [assignTo, setAssignTo] = useState<string[]>(['All students']);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [showSchedulingOptions, setShowSchedulingOptions] = useState(true); // Show by default for better discoverability
  const [allowLateSubmissions, setAllowLateSubmissions] = useState(() => {
    const savedSetting = localStorage.getItem('allowLateSubmissions');
    return savedSetting ? savedSetting === 'true' : true;
  });
  const [lateSubmissionPolicy, setLateSubmissionPolicy] = useState(() => {
    return localStorage.getItem('lateSubmissionPolicy') || 'mark';
  });
  const [showPointsDropdown, setShowPointsDropdown] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
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
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

  useEffect(() => {
    if (isOpen && assignmentToEdit) {
      setTitle(assignmentToEdit.title);
      setInstructions(assignmentToEdit.instructions);
      setPoints(assignmentToEdit.points);
      setDueDate(assignmentToEdit.dueDate);
      setDueTime(assignmentToEdit.dueTime);
      setTopic(assignmentToEdit.topic);
      setAttachments(assignmentToEdit.attachments);
      setAssignTo(assignmentToEdit.assignTo);
      setScheduledFor(assignmentToEdit.scheduledFor);
      
      // Load late submission settings if they exist
      if (assignmentToEdit.allowLateSubmissions !== undefined) {
        setAllowLateSubmissions(assignmentToEdit.allowLateSubmissions);
      }
      if (assignmentToEdit.lateSubmissionPolicy) {
        setLateSubmissionPolicy(assignmentToEdit.lateSubmissionPolicy);
      }
      
      // Show advanced options if scheduled date or late submissions are configured
      if (assignmentToEdit.scheduledFor || assignmentToEdit.allowLateSubmissions !== undefined) {
        setShowSchedulingOptions(true);
      }
    } else if (isOpen && !assignmentToEdit) {
      // Load saved values from API when opening a new assignment form
      const loadPreferences = async () => {
        try {
          const preferences = await storageApi.getUserPreferences();
          if (preferences) {
            // Initialize form with saved values if they exist
            if (preferences.lastSelectedTopic) {
              setTopic(preferences.lastSelectedTopic);
            }
            
            if (preferences.scheduledPostDate) {
              setScheduledFor(preferences.scheduledPostDate);
              setShowSchedulingOptions(true); // Show advanced options if there's a scheduled date
            }
            
            if (preferences.allowLateSubmissions !== undefined) {
              setAllowLateSubmissions(
                typeof preferences.allowLateSubmissions === 'string' 
                  ? preferences.allowLateSubmissions === 'true'
                  : preferences.allowLateSubmissions
              );
              setShowSchedulingOptions(true); // Show advanced options if there are late submission settings
            }
            
            if (preferences.lateSubmissionPolicy) {
              setLateSubmissionPolicy(preferences.lateSubmissionPolicy);
            }
            
            if (preferences.topicsList) {
              try {
                const parsedTopics = 
                  typeof preferences.topicsList === 'string'
                    ? JSON.parse(preferences.topicsList)
                    : preferences.topicsList;
                    
                if (Array.isArray(parsedTopics) && parsedTopics.length > 0) {
                  // Update topics state with saved topics
                  setTopics(parsedTopics);
                }
              } catch (e) {
                console.error('Error parsing saved topics list', e);
              }
            }
          }
        } catch (error) {
          console.error('Error loading preferences from API:', error);
          
          // Fallback to localStorage if API fails
          try {
            // Load saved values from localStorage
            const savedTopic = localStorage.getItem('lastSelectedTopic');
            const savedScheduledDate = localStorage.getItem('scheduledPostDate');
            const savedAllowLateSubmissions = localStorage.getItem('allowLateSubmissions');
            const savedLateSubmissionPolicy = localStorage.getItem('lateSubmissionPolicy');
            const savedTopicsList = localStorage.getItem('topicsList');
            
            // Initialize form with saved values if they exist
            if (savedTopic) setTopic(savedTopic);
            if (savedScheduledDate) {
              setScheduledFor(savedScheduledDate);
              setShowSchedulingOptions(true);
            }
            if (savedAllowLateSubmissions) {
              setAllowLateSubmissions(savedAllowLateSubmissions === 'true');
              setShowSchedulingOptions(true);
            }
            if (savedLateSubmissionPolicy) {
              setLateSubmissionPolicy(savedLateSubmissionPolicy);
            }
            if (savedTopicsList) {
              try {
                const parsedTopics = JSON.parse(savedTopicsList);
                if (Array.isArray(parsedTopics) && parsedTopics.length > 0) {
                  setTopics(parsedTopics);
                }
              } catch (e) {
                console.error('Error parsing saved topics list', e);
              }
            }
          } catch (localStorageError) {
            console.error('Error loading from localStorage fallback:', localStorageError);
          }
        }
      };
      
      loadPreferences();
      
      // Reset other form fields
      resetForm();
    }
  }, [isOpen, assignmentToEdit]);

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

  const getDueDateDisplayText = () => {
    return dueDate ? dueDate : 'No due date';
  };

  const handleSubmit = async () => {
    const assignmentData: AssignmentData = {
      title,
      instructions,
      points,
      dueDate,
      dueTime,
      topic,
      attachments,
      assignTo,
      scheduledFor,
      allowLateSubmissions,
      lateSubmissionPolicy
    };

    try {
      if (assignmentToEdit) {
        // Create updated assignment object with the existing ID
        const updatedData: Assignment = {
          ...assignmentData,
          id: assignmentToEdit.id,
          updatedAt: new Date().toISOString(),
          className: className,
          section: document.title.includes('-') ? document.title.split('-')[1].trim() : '',
          classId: classId || '',
          createdAt: (assignmentToEdit as any).createdAt || new Date().toISOString()
        };
        
        // Save the updated assignment using our API utility function
        await saveAssignment(updatedData);
        
        onSubmit(assignmentData, assignmentToEdit.id);
      } else {
        // Get section from document title if available
        const section = document.title.includes('-') ? document.title.split('-')[1].trim() : '';
        
        // Create a partial assignment object - let API generate the ID
        const newAssignmentData: Partial<Assignment> = {
          ...assignmentData,
          createdAt: new Date().toISOString(),
          className: className,
          section: section,
          classId: classId || ''
        };
        
        // Save the assignment using our API utility function
        const savedAssignment = await saveAssignment(newAssignmentData);
        
        // Use the server-assigned ID
        onSubmit(assignmentData, savedAssignment.id);
      }
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving assignment:', error);
      // You could add error handling UI here
    }
  };

  const resetForm = async () => {
    setTitle('');
    setInstructions('');
    setPoints('100');
    setDueDate('');
    setDueTime('');
    
    try {
      // Load preferences from API
      const preferences = await storageApi.getUserPreferences();
      
      // Preserve topic if available in API
      if (preferences?.lastSelectedTopic) {
        setTopic(preferences.lastSelectedTopic);
      } else {
        setTopic('No topic');
      }
      
      // Preserve scheduled post date if available in API
      if (preferences?.scheduledPostDate) {
        setScheduledFor(preferences.scheduledPostDate);
      } else {
        setScheduledFor(null);
      }
      
      // Preserve late submission settings if available in API
      if (preferences?.allowLateSubmissions !== undefined) {
        const value = preferences.allowLateSubmissions;
        setAllowLateSubmissions(
          typeof value === 'string' ? value === 'true' : value
        );
      } else {
        setAllowLateSubmissions(true);
      }
    } catch (error) {
      console.error('Error loading preferences in resetForm:', error);
      
      // Fallback to localStorage if API fails
      // Preserve topic if it was previously set in localStorage
      const savedTopic = localStorage.getItem('lastSelectedTopic');
      setTopic(savedTopic || 'No topic');
      
      // Preserve scheduled post date if it was previously set in localStorage
      const savedScheduledDate = localStorage.getItem('scheduledPostDate');
      setScheduledFor(savedScheduledDate || null);
      
      // Preserve late submission settings if they were previously set in localStorage
      const savedAllowLateSubmissions = localStorage.getItem('allowLateSubmissions');
      if (savedAllowLateSubmissions) {
        setAllowLateSubmissions(savedAllowLateSubmissions === 'true');
      }
    }
    
    setAttachments([]);
    setAssignTo(['All students']);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newAttachments: Attachment[] = Array.from(files).map(file => ({
        type: 'file',
        name: file.name,
        url: URL.createObjectURL(file),
      }));
      
      setAttachments([...attachments, ...newAttachments]);
    }
  };

  const addDriveAttachment = () => {
    // Mock drive attachment
    setAttachments([...attachments, {
      type: 'drive',
      name: 'Assignment Document',
      url: '#',
      thumbnail: '/drive-icon.svg'
    }]);
  };

  const addYouTubeAttachment = () => {
    // Mock YouTube attachment
    setAttachments([...attachments, {
      type: 'youtube',
      name: 'Instructional Video',
      url: 'https://www.youtube.com/watch?v=example',
      thumbnail: '/youtube-icon.svg'
    }]);
  };

  const addLinkAttachment = () => {
    const url = prompt('Enter URL:');
    if (url) {
      setAttachments([...attachments, {
        type: 'link',
        name: new URL(url).hostname,
        url
      }]);
    }
  };

  const createNewDocument = () => {
    // Mock document creation
    setAttachments([...attachments, {
      type: 'document',
      name: 'New Document',
      url: '#',
      thumbnail: '/docs-icon.svg'
    }]);
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  // Save preference to API 
  const savePreference = async (key: string, value: any) => {
    try {
      // Get current preferences
      const preferences = await storageApi.getUserPreferences() || {};
      // Update the specific preference
      preferences[key] = value;
      // Save all preferences
      await storageApi.saveUserPreferences(preferences);
    } catch (error) {
      console.error(`Error saving preference ${key}:`, error);
      // Fallback to localStorage if API fails
      try {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      } catch (e) {
        console.error('Error using localStorage fallback:', e);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-16 z-50 overflow-y-auto">
      <div ref={modalRef} className="bg-white w-full max-w-[1000px] rounded-lg max-h-[calc(100vh-100px)] overflow-y-auto mb-8">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose}>
              <X size={24} className="text-[#5f6368]" />
            </button>
            <div className="flex items-center gap-3">
              <FileText className="text-[#5f6368]" size={24} />
              <h1 className="text-[32px] text-[#3c4043] font-normal">Assignment</h1>
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
              className={`px-6 py-2 text-sm ${title ? 'bg-[#1a73e8] text-white hover:bg-[#1557b0]' : 'bg-[#dadce0] text-[#5f6368]'} rounded font-medium`}
              disabled={!title}
            >
              Assign
            </button>
          </div>
        </div>

        <div className="flex p-6">
          {/* Left side - Assignment form */}
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
                  placeholder="Instructions (optional)"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
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
                  <div className="flex items-center gap-2">
                    <button onClick={handleFileUpload} className="p-2 hover:bg-[#edf2fa] rounded-full">
                      <Paperclip size={20} className="text-[#5f6368]" />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileSelected} 
                      style={{ display: 'none' }} 
                      multiple 
                    />
                  </div>
                </div>
              </div>

              {/* Attachments Display */}
              {attachments.length > 0 && (
                <div className="bg-white border border-[#e0e0e0] rounded-lg p-4">
                  <h3 className="text-sm font-medium text-[#3c4043] mb-4">Attachments</h3>
                  <div className="space-y-3">
                    {attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between bg-[#f8f9fa] p-3 rounded">
                        <div className="flex items-center gap-3">
                          {attachment.type === 'drive' && <img src="/drive-icon.svg" alt="Drive" className="w-6 h-6" />}
                          {attachment.type === 'youtube' && <img src="/youtube-icon.svg" alt="YouTube" className="w-6 h-6" />}
                          {attachment.type === 'file' && <Paperclip size={20} className="text-[#5f6368]" />}
                          {attachment.type === 'link' && <LinkIcon size={20} className="text-[#5f6368]" />}
                          {attachment.type === 'document' && <FileText size={20} className="text-[#5f6368]" />}
                          <span className="text-sm text-[#3c4043]">{attachment.name}</span>
                        </div>
                        <button onClick={() => removeAttachment(index)} className="p-1 hover:bg-[#e8eaed] rounded-full">
                          <X size={16} className="text-[#5f6368]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attach Section */}
              <div>
                <h3 className="text-sm text-[#3c4043] mb-4">Attach</h3>
                <div className="flex gap-4 flex-wrap">
                  <button 
                    onClick={addDriveAttachment}
                    className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded"
                  >
                    <img src="/drive-icon.svg" alt="Drive" className="w-6 h-6" />
                    <span className="text-xs text-[#5f6368]">Drive</span>
                  </button>
                  <button 
                    onClick={addYouTubeAttachment}
                    className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded"
                  >
                    <img src="/youtube-icon.svg" alt="YouTube" className="w-6 h-6" />
                    <span className="text-xs text-[#5f6368]">YouTube</span>
                  </button>
                  <button 
                    onClick={createNewDocument}
                    className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded"
                  >
                    <Plus size={24} className="text-[#5f6368]" />
                    <span className="text-xs text-[#5f6368]">Create</span>
                  </button>
                  <button 
                    onClick={handleFileUpload}
                    className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded"
                  >
                    <Upload size={24} className="text-[#5f6368]" />
                    <span className="text-xs text-[#5f6368]">Upload</span>
                  </button>
                  <button 
                    onClick={addLinkAttachment}
                    className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded"
                  >
                    <LinkIcon size={24} className="text-[#5f6368]" />
                    <span className="text-xs text-[#5f6368]">Link</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Assignment settings */}
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-[#3c4043]">Points</h3>
                <div className="relative">
                  <button 
                    onClick={() => setShowPointsDropdown(!showPointsDropdown)}
                    className="text-[#1a73e8] text-sm hover:bg-[#f6fafe] px-2 py-1 rounded flex items-center gap-1"
                  >
                    {points}
                    <ChevronDown size={16} />
                  </button>
                  {showPointsDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      {['Ungraded', '10', '25', '50', '100'].map((pointValue) => (
                        <button
                          key={pointValue}
                          onClick={() => {
                            setPoints(pointValue);
                            setShowPointsDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          {points === pointValue && <Check size={16} className="text-[#1a73e8]" />}
                          <span className={points === pointValue ? 'text-[#1a73e8]' : ''}>
                            {pointValue}
                          </span>
                        </button>
                      ))}
                      <div className="border-t border-gray-200 my-1"></div>
                      <div className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          value={points === 'Ungraded' ? '' : points}
                          onChange={(e) => setPoints(e.target.value)}
                          className="w-full p-1 text-sm border border-gray-300 rounded"
                          placeholder="Custom"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-[#3c4043]">Due</h3>
                <div className="flex flex-col items-end gap-2">
                  <button 
                    className={`text-sm px-3 py-1.5 rounded flex items-center gap-2 ${
                      dueDate 
                        ? 'bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d4e6fd]' 
                        : 'text-[#1a73e8] hover:bg-[#f6fafe]'
                    }`}
                    onClick={() => setShowDueDatePicker(!showDueDatePicker)}
                  >
                    <Calendar size={16} className={dueDate ? "text-[#1a73e8]" : "text-[#5f6368]"} />
                    <span>{getDueDateDisplayText()}</span>
                    {dueDate && (
                      <X 
                        size={14} 
                        className="text-[#5f6368] hover:text-[#3c4043]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDueDate('');
                          setDueTime('');
                        }} 
                      />
                    )}
                  </button>
                  
                  {showDueDatePicker && (
                    <div className="absolute mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <input 
                            type="date" 
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="text-[#1a73e8] text-sm bg-transparent border border-[#dadce0] px-2 py-1 rounded w-[150px]"
                          />
                          <Calendar size={16} className="text-[#5f6368]" />
                        </div>
                        
                        {dueDate && (
                          <div className="flex items-center gap-2">
                            <input 
                              type="time" 
                              value={dueTime}
                              onChange={(e) => setDueTime(e.target.value)}
                              className="text-[#1a73e8] text-sm bg-transparent border border-[#dadce0] px-2 py-1 rounded w-[150px]"
                            />
                            <Clock size={16} className="text-[#5f6368]" />
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => setShowDueDatePicker(false)}
                            className="px-3 py-1 text-sm text-[#1a73e8] hover:bg-[#f6fafe] rounded"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#3c4043]">Topic</h3>
                <div className="relative">
                  <button 
                    onClick={() => setShowTopicDropdown(!showTopicDropdown)}
                    className="text-[#1a73e8] text-sm hover:bg-[#f6fafe] px-2 py-1 rounded flex items-center gap-1"
                    data-testid="topic-dropdown-button"
                  >
                    {topic}
                    <ChevronDown size={16} />
                  </button>
                  {showTopicDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <button
                        onClick={() => {
                          setTopic('No topic');
                          setShowTopicDropdown(false);
                          // Save to API
                          savePreference('lastSelectedTopic', 'No topic');
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        {topic === 'No topic' && <Check size={16} className="text-[#1a73e8]" />}
                        <span className={topic === 'No topic' ? 'text-[#1a73e8]' : ''}>
                          No topic
                        </span>
                      </button>
                      <div className="border-t border-gray-200 my-1"></div>
                      {topics.map((topicItem) => (
                        <button
                          key={topicItem}
                          onClick={() => {
                            setTopic(topicItem);
                            setShowTopicDropdown(false);
                            // Save to API
                            savePreference('lastSelectedTopic', topicItem);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          {topic === topicItem && <Check size={16} className="text-[#1a73e8]" />}
                          <span className={topic === topicItem ? 'text-[#1a73e8]' : ''}>
                            {topicItem}
                          </span>
                        </button>
                      ))}
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => {
                          const newTopic = prompt('Enter new topic name:');
                          if (newTopic && newTopic.trim() !== '') {
                            setTopic(newTopic);
                            // Add to topics list for future selection using the setter function
                            const updatedTopics = [...topics, newTopic];
                            setTopics(updatedTopics);
                            // Save to API
                            savePreference('topicsList', JSON.stringify(updatedTopics));
                          }
                          setShowTopicDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-[#1a73e8] flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Create new topic
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scheduling Options */}
            <div className="bg-white border border-[#e0e0e0] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-[#3c4043]">Advanced</h3>
                <button 
                  onClick={() => setShowSchedulingOptions(!showSchedulingOptions)}
                  className="text-[#1a73e8] text-sm hover:bg-[#f6fafe] px-2 py-1 rounded"
                >
                  {showSchedulingOptions ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showSchedulingOptions && (
                <div className="space-y-4 mt-2 pt-2 border-t border-[#e0e0e0]">
                  <div>
                    <h4 className="text-sm text-[#3c4043] mb-2">Schedule to post</h4>
                    <div className="flex">
                      <input 
                        type="datetime-local" 
                        value={scheduledFor || ''}
                        onChange={(e) => {
                          setScheduledFor(e.target.value);
                          // Save to API
                          if (e.target.value) {
                            savePreference('scheduledPostDate', e.target.value);
                          } else {
                            savePreference('scheduledPostDate', null);
                          }
                        }}
                        className="flex-1 px-3 py-2 text-sm border rounded-l focus:outline-none"
                        data-testid="schedule-date-input"
                      />
                      <button 
                        onClick={() => {
                          setScheduledFor(null);
                          savePreference('scheduledPostDate', null);
                        }}
                        className="px-3 py-2 bg-[#f8f9fa] border border-l-0 rounded-r text-sm text-[#5f6368] hover:bg-[#f1f3f4]"
                      >
                        Clear
                      </button>
                    </div>
                    <p className="text-xs text-[#5f6368] mt-1">
                      {scheduledFor 
                        ? `This assignment will be posted on ${new Date(scheduledFor).toLocaleString()}`
                        : 'This assignment will be posted immediately'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm text-[#3c4043] mb-2">Late submissions</h4>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="lateSubmissions"
                        checked={allowLateSubmissions}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setAllowLateSubmissions(isChecked);
                          // Save to API
                          savePreference('allowLateSubmissions', isChecked.toString());
                        }}
                        className="mr-2"
                        data-testid="late-submissions-checkbox"
                      />
                      <label htmlFor="lateSubmissions" className="text-sm text-[#3c4043]">
                        Accept late submissions
                      </label>
                    </div>
                    {allowLateSubmissions && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="relative flex items-center w-full">
                          <AlertCircle size={16} className="absolute left-2 text-[#5f6368]" />
                          <select 
                            className="w-full pl-8 pr-3 py-2 text-sm border rounded focus:outline-none appearance-none bg-[#f8f9fa]"
                            onChange={(e) => {
                              // Update state and save to API
                              setLateSubmissionPolicy(e.target.value);
                              savePreference('lateSubmissionPolicy', e.target.value);
                            }}
                            value={lateSubmissionPolicy}
                            data-testid="late-submission-policy"
                          >
                            <option value="mark">Mark as late</option>
                            <option value="reduce">Reduce points (10%)</option>
                            <option value="reject">Reject after 1 week</option>
                          </select>
                        </div>
                      </div>
                    )}
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

export default AssignmentModal;