import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Users, Calendar, Clock, Upload, Link as LinkIcon, AlertCircle, Paperclip, Plus, FileText, Check } from 'lucide-react';

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
  gradeCategory?: string;
  rubric?: {
    criteria: { description: string; points: number }[];
  };
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
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [points, setPoints] = useState('100');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [topic, setTopic] = useState('No topic');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isCreatingRubric, setIsCreatingRubric] = useState(false);
  const [assignTo, setAssignTo] = useState<string[]>(['All students']);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [gradeCategory, setGradeCategory] = useState('');
  const [showGradeCategories, setShowGradeCategories] = useState(false);
  const [gradeCategories] = useState(['Homework', 'Classwork', 'Test', 'Quiz', 'Project']);
  const [showSchedulingOptions, setShowSchedulingOptions] = useState(false);
  const [allowLateSubmissions, setAllowLateSubmissions] = useState(true);
  const [showPointsDropdown, setShowPointsDropdown] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [topics] = useState(['Unit 1', 'Unit 2', 'Projects', 'Homework']);
  const [rubric, setRubric] = useState<{ criteria: { description: string; points: number }[] }>({
    criteria: []
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
      setGradeCategory(assignmentToEdit.gradeCategory || '');
      
      if (assignmentToEdit.rubric) {
        setIsCreatingRubric(true);
        setRubric(assignmentToEdit.rubric);
      } else {
        setIsCreatingRubric(false);
        setRubric({ criteria: [] });
      }
    } else if (isOpen && !assignmentToEdit) {
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

  const handleSubmit = () => {
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
      gradeCategory,
      rubric: isCreatingRubric ? rubric : undefined
    };

    if (assignmentToEdit) {
      onSubmit(assignmentData, assignmentToEdit.id);
    } else {
      onSubmit(assignmentData);
    }
    
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setInstructions('');
    setPoints('100');
    setDueDate('');
    setDueTime('');
    setTopic('No topic');
    setAttachments([]);
    setIsCreatingRubric(false);
    setAssignTo(['All students']);
    setScheduledFor(null);
    setGradeCategory('');
    setRubric({ criteria: [] });
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

  const addRubricCriteria = () => {
    setRubric({
      criteria: [
        ...rubric.criteria,
        { description: 'New criteria', points: 10 }
      ]
    });
  };

  const updateRubricCriteria = (index: number, description: string, points: number) => {
    const newCriteria = [...rubric.criteria];
    newCriteria[index] = { description, points };
    setRubric({ criteria: newCriteria });
  };

  const removeRubricCriteria = (index: number) => {
    const newCriteria = [...rubric.criteria];
    newCriteria.splice(index, 1);
    setRubric({ criteria: newCriteria });
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

              {/* Rubric Section */}
              {isCreatingRubric && (
                <div className="bg-white border border-[#e0e0e0] rounded-lg p-4 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-[#3c4043]">Rubric</h3>
                    <button 
                      onClick={() => setIsCreatingRubric(false)}
                      className="text-[#1a73e8] text-sm hover:bg-[#f6fafe] px-2 py-1 rounded"
                    >
                      Remove
                    </button>
                  </div>
                  
                  {rubric.criteria.length > 0 ? (
                    <div className="space-y-4 mb-4">
                      {rubric.criteria.map((criterion, index) => (
                        <div key={index} className="flex items-start gap-4 p-3 bg-[#f8f9fa] rounded">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={criterion.description}
                              onChange={(e) => updateRubricCriteria(index, e.target.value, criterion.points)}
                              className="w-full p-2 bg-white border border-[#dadce0] rounded focus:outline-none text-sm"
                              placeholder="Criterion description"
                            />
                          </div>
                          <div className="w-24">
                            <input
                              type="number"
                              value={criterion.points}
                              onChange={(e) => updateRubricCriteria(index, criterion.description, Number(e.target.value))}
                              className="w-full p-2 bg-white border border-[#dadce0] rounded focus:outline-none text-sm"
                              placeholder="Points"
                              min="0"
                            />
                          </div>
                          <button 
                            onClick={() => removeRubricCriteria(index)}
                            className="p-2 hover:bg-[#e8eaed] rounded-full"
                          >
                            <X size={16} className="text-[#5f6368]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-[#5f6368] text-sm">
                      No criteria added yet
                    </div>
                  )}
                  
                  <button 
                    onClick={addRubricCriteria}
                    className="w-full p-3 border border-dashed border-[#dadce0] rounded text-[#1a73e8] text-sm hover:bg-[#f6fafe] flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Add criterion
                  </button>
                </div>
              )}
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
                          if (newTopic) {
                            setTopic(newTopic);
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

            {/* Grade Category */}
            <div className="bg-white border border-[#e0e0e0] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-[#3c4043]">Grade Category</h3>
                <div className="relative">
                  <button 
                    onClick={() => setShowGradeCategories(!showGradeCategories)}
                    className="text-[#1a73e8] text-sm hover:bg-[#f6fafe] px-2 py-1 rounded flex items-center gap-1"
                  >
                    {gradeCategory || 'No category'}
                    <ChevronDown size={16} />
                  </button>
                  {showGradeCategories && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <button
                        onClick={() => {
                          setGradeCategory('');
                          setShowGradeCategories(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        {!gradeCategory && <Check size={16} className="text-[#1a73e8]" />}
                        <span className={!gradeCategory ? 'text-[#1a73e8]' : ''}>
                          No category
                        </span>
                      </button>
                      <div className="border-t border-gray-200 my-1"></div>
                      {gradeCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setGradeCategory(category);
                            setShowGradeCategories(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          {gradeCategory === category && <Check size={16} className="text-[#1a73e8]" />}
                          <span className={gradeCategory === category ? 'text-[#1a73e8]' : ''}>
                            {category}
                          </span>
                        </button>
                      ))}
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => {
                          const newCategory = prompt('Enter new category name:');
                          if (newCategory) {
                            setGradeCategory(newCategory);
                          }
                          setShowGradeCategories(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-[#1a73e8] flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Create new category
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
                        type="date" 
                        value={scheduledFor || ''}
                        onChange={(e) => setScheduledFor(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border rounded-l focus:outline-none"
                      />
                      <button 
                        onClick={() => setScheduledFor(null)}
                        className="px-3 py-2 bg-[#f8f9fa] border border-l-0 rounded-r text-sm text-[#5f6368] hover:bg-[#f1f3f4]"
                      >
                        Clear
                      </button>
                    </div>
                    <p className="text-xs text-[#5f6368] mt-1">
                      {scheduledFor 
                        ? `This assignment will be posted on ${new Date(scheduledFor).toLocaleDateString()}`
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
                        onChange={() => setAllowLateSubmissions(!allowLateSubmissions)}
                        className="mr-2"
                      />
                      <label htmlFor="lateSubmissions" className="text-sm text-[#3c4043]">
                        Accept late submissions
                      </label>
                    </div>
                    {allowLateSubmissions && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="relative flex items-center">
                          <AlertCircle size={16} className="absolute left-2 text-[#5f6368]" />
                          <select className="pl-8 pr-3 py-2 text-sm border rounded focus:outline-none appearance-none bg-[#f8f9fa]">
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

            <div>
              <button 
                onClick={() => setIsCreatingRubric(!isCreatingRubric)}
                className="text-[#1a73e8] text-sm hover:bg-[#f6fafe] px-4 py-2 rounded flex items-center gap-1"
              >
                <Plus size={16} />
                {isCreatingRubric ? 'Edit Rubric' : 'Rubric'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentModal; 