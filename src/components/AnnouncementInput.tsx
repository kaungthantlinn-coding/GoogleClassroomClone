import React, { useState, useContext, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, Youtube, Upload, Link2, Users, Image, PaperclipIcon, X, ChevronDown, Search, MessageSquare, Clock } from 'lucide-react';
import { ClassDataContext } from '../pages/ClassPage';
import { saveAnnouncement } from '../types/announcement';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { Course } from '../types/course';
import { getCourses } from '../api/courseApi';

// Custom type for the dropdown courses
interface DropdownCourse extends Partial<Course> {
  id: string;
  name: string;
  section: string;
  teacherName?: string;
  color?: string;
  textColor?: string;
  isDefault?: boolean;
  avatar?: string;
}

interface Announcement {
  id: string;
  classId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  attachments: { id: string; type: string; url: string; name: string }[];
  comments: any[];
}

const AnnouncementInput = ({ onAnnouncementPosted }: { onAnnouncementPosted?: () => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<{ id: string; type: string; url: string; name: string }[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [recipient, setRecipient] = useState('all');
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAnnouncementDropdown, setShowAnnouncementDropdown] = useState(false);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  
  const classData = useContext(ClassDataContext);
  const { classId } = useParams<{ classId: string }>();
  const user = useAuthStore((state) => state.user) || { id: 'user1', name: 'You', avatar: undefined };
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const classDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const announcementDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch available classes
  const { data: courses } = useQuery<DropdownCourse[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      try {
        // Fetch courses from the API
        const coursesData = await getCourses();
        
        // Convert Course[] to DropdownCourse[]
        return coursesData.map(course => ({
          ...course,
          avatar: course.name ? course.name[0].toUpperCase() : 'C',
          isDefault: false
        }));
      } catch (error) {
        console.error('Error fetching courses:', error);
        return [];
      }
    },
  });

  // Set current class as selected on initial load
  useEffect(() => {
    if (!classId) {
      console.log("No classId in URL params");
      return;
    }
    
    console.log("Current classId from URL params:", classId, typeof classId);
    
    // Always set the current classId in selectedClasses for immediate use
    setSelectedClasses([classId]);
    
    // Also check if courses are loaded
    if (courses && courses.length > 0) {
      console.log("Available courses:", JSON.stringify(courses.map(c => ({
        id: c.id,
        courseId: c.courseId,
        courseGuid: c.courseGuid,
        name: c.name
      }))));
      
      // Determine if the current ID is a GUID
      const isGuid = typeof classId === 'string' && classId.includes('-');
      console.log(`Class ID from URL is a ${isGuid ? 'GUID' : 'numeric ID'}: ${classId}`);
      
      // Try to find by exact match
      let currentClass = courses.find(c => c.id === classId);
      console.log("Found by exact ID match:", currentClass ? JSON.stringify(currentClass) : "undefined");
      
      // Try to find by numeric ID
      if (!currentClass) {
        currentClass = courses.find(c => c.courseId?.toString() === classId);
        console.log("Found by numeric ID:", currentClass ? JSON.stringify(currentClass) : "undefined");
      }
      
      // Try to find by GUID
      if (!currentClass) {
        currentClass = courses.find(c => c.courseGuid === classId);
        console.log("Found by GUID:", currentClass ? JSON.stringify(currentClass) : "undefined");
      }
      
      // If found by any method, use the appropriate ID based on the API endpoint requirements
      if (currentClass) {
        let idToUse;
        
        if (isGuid) {
          // If URL has GUID, prefer to use the GUID for consistency
          idToUse = currentClass.courseGuid || classId;
          console.log("Using GUID for consistency:", idToUse);
        } else {
          // Otherwise use the numeric ID or fallback to the course's id field
          idToUse = currentClass.courseId?.toString() || currentClass.id;
          console.log("Using numeric ID for consistency:", idToUse);
        }
        
        console.log("Setting selected class to:", idToUse);
        setSelectedClasses([idToUse]);
      }
    }
  }, [classId, courses]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(event.target as Node)) {
        setShowClassDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (showClassDropdown && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchTerm('');
    }
  }, [showClassDropdown]);
  
  // Load recent announcements
  useEffect(() => {
    const loadRecentAnnouncements = async () => {
      try {
        if (!classId) return;
        
        // Use API to get announcements for current class
        const announcements = await import('../api/announcementApi')
          .then(api => api.getAnnouncements(classId));
          
        if (announcements && announcements.length > 0) {
          // Sort by date (newest first) and take the 10 most recent
          const sorted = announcements
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);
            
          setRecentAnnouncements(sorted);
        }
      } catch (e) {
        console.error("Error loading recent announcements:", e);
        setRecentAnnouncements([]);
      }
    };
    
    loadRecentAnnouncements();
    
  }, [classId]);
  
  // Handle click outside to close announcement dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (announcementDropdownRef.current && !announcementDropdownRef.current.contains(event.target as Node)) {
        setShowAnnouncementDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePost = () => {
    if (!content.trim() && attachments.length === 0) return;
    
    // Validate that we have a valid classId to use
    let currentClassId = classId;
    
    // If we have any selected classes, prioritize the first selected class
    if (selectedClasses.length > 0) {
      currentClassId = selectedClasses[0];
      console.log("Using selected class ID:", currentClassId);
    } else if (classId) {
      console.log("Using URL param class ID:", classId);
    } else {
      console.error("No valid class ID available for posting announcement");
      alert("Cannot post announcement: No class selected");
      setIsPosting(false);
      return;
    }
    
    // Ensure we have a valid value
    if (!currentClassId) {
      console.error("Failed to determine a valid class ID for announcement");
      alert("Cannot post announcement: Invalid class selection");
      setIsPosting(false);
      return;
    }
    
    setIsPosting(true);
    
    // Determine if the ID is a GUID
    const isGuid = typeof currentClassId === 'string' && currentClassId.includes('-');
    console.log(`ID format: ${isGuid ? 'GUID' : 'Numeric'}`);
    
    // Process each selected class (for now, just the current one)
    try {
      console.log("Posting announcement to class ID:", currentClassId);
      
      // Import courseApi to get the actual course if needed
      import('../api/courseApi')
        .then(async (courseApi) => {
          let targetCourseId = currentClassId;
          
          // If using a GUID, ensure we have the right endpoint format
          if (isGuid) {
            console.log("Using GUID format for API call");
            // No need to transform the ID, the announcementApi will handle it
          } else {
            console.log("Using numeric ID format for API call");
            // For numeric IDs, we can use them directly as well
          }
          
          // Prepare announcement data with guaranteed classId
          const announcementData = {
            classId: targetCourseId,
            content: content.trim(),
            authorId: user.id || "1004", // Ensure we have a valid user ID
            authorName: user.name || "User",
            authorAvatar: user.avatar,
            attachments: attachments.length > 0 ? attachments : []
          };
          
          console.log("Announcement data before API call:", JSON.stringify(announcementData));
          
          // Call the API to create the announcement
          return import('../api/announcementApi')
            .then(api => api.createAnnouncement(announcementData));
        })
        .then(createdAnnouncement => {
          console.log('Successfully created announcement:', createdAnnouncement);
          
          // Reset form
          setContent('');
          setAttachments([]);
          setIsExpanded(false);
          setIsPosting(false);
          
          // Notify parent component that announcements were posted
          if (onAnnouncementPosted) {
            setTimeout(() => {
              onAnnouncementPosted();
            }, 100);
          }
        })
        .catch(error => {
          console.error(`Failed to create announcement for class ${currentClassId}:`, error);
          setIsPosting(false);
          alert("Could not post announcement. Please try again.");
        });
    } catch (error) {
      console.error('Error in create announcement flow:', error);
      setIsPosting(false);
      alert("An unexpected error occurred. Please try again.");
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

  // Toggle class selection
  const toggleClassSelection = (courseId: string, e?: React.MouseEvent | React.ChangeEvent) => {
    // If this was triggered by clicking the checkbox directly, stop propagation
    if (e) {
      e.stopPropagation();
    }
    
    setSelectedClasses(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  };

  // Select or deselect all classes
  const selectAllClasses = () => {
    if (courses && courses.length > 0) {
      if (selectedClasses.length === courses.length) {
        // Deselect all
        setSelectedClasses([]);
      } else {
        // Select all
        setSelectedClasses(courses.map(course => course.id));
      }
    }
  };

  // Get selected class display
  const getSelectedClassDisplay = () => {
    if (!courses || selectedClasses.length === 0) {
      return classData.className || 'Select a class';
    }
    
    if (selectedClasses.length > 1) {
      return `${selectedClasses.length} classes selected`;
    }
    
    const selectedClass = courses.find(c => c.id === selectedClasses[0]);
    if (selectedClass) {
      return `${selectedClass.name} ${selectedClass.section}`;
    }
    
    return classData.className || 'Select a class';
  };

  // Filter courses by search term
  const getFilteredCourses = () => {
    if (!courses) return { defaultCourses: [], userCourses: [] };
    
    const filtered = courses.filter(course => {
      const searchString = `${course.name} ${course.section}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });
    
    return {
      defaultCourses: filtered.filter(c => c.isDefault),
      userCourses: filtered.filter(c => !c.isDefault)
    };
  };

  // Focus the input when expanded
  useEffect(() => {
    if (isExpanded && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [isExpanded]);

  const { defaultCourses, userCourses } = getFilteredCourses();
  const hasUserCourses = userCourses.length > 0;

  // Format date for announcement display
  const formatAnnouncementDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };
  
  // Get class name by ID
  const getClassNameById = (classId: string) => {
    if (!courses) return 'Unknown Class';
    const course = courses.find(c => c.id === classId);
    return course ? course.name : 'Unknown Class';
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6 relative">
      {!isExpanded ? (
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center cursor-text" onClick={() => setIsExpanded(true)}>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3 text-gray-500">
              <span className="text-sm">{user.name ? user.name[0] : 'Y'}</span>
            </div>
            <span className="text-gray-500">Announce something to your class</span>
          </div>
          
          {/* Announcement history button */}
          <div className="relative" ref={announcementDropdownRef}>
            <button 
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
              onClick={() => setShowAnnouncementDropdown(!showAnnouncementDropdown)}
              title="Recent announcements"
            >
              <MessageSquare size={20} />
            </button>
            
            {/* Scrollable announcement dropdown */}
            {showAnnouncementDropdown && (
              <div className="absolute right-0 mt-1 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[450px] overflow-hidden flex flex-col">
                <div className="sticky top-0 bg-white p-3 border-b z-10 flex items-center">
                  <Clock size={16} className="text-gray-500 mr-2" />
                  <h3 className="text-sm font-medium">Recent Announcements</h3>
                </div>
                
                <div className="overflow-y-auto max-h-[400px] p-2">
                  {recentAnnouncements.length > 0 ? (
                    recentAnnouncements.map(announcement => (
                      <div key={announcement.id} className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center mb-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2 text-gray-600">
                            <span className="text-xs">{announcement.authorName[0]}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{announcement.authorName}</span>
                              <span className="text-xs text-gray-500">{formatAnnouncementDate(announcement.createdAt)}</span>
                            </div>
                            <span className="text-xs text-gray-500">{getClassNameById(announcement.classId)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{announcement.content}</p>
                        {announcement.attachments.length > 0 && (
                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            <PaperclipIcon size={12} className="mr-1" />
                            <span>{announcement.attachments.length} attachment{announcement.attachments.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No recent announcements
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6">
          {/* Recipients Selection */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#3c4043] text-[13px] font-medium">For</span>
            <div className="flex items-center gap-2 flex-1" ref={classDropdownRef}>
              <div className="relative">
                <button 
                  className="px-4 py-2 text-[13px] bg-[#f1f3f4] hover:bg-[#e8eaed] rounded flex items-center justify-between min-w-[220px]"
                  onClick={() => setShowClassDropdown(!showClassDropdown)}
                >
                  <span>{getSelectedClassDisplay()}</span>
                  <ChevronDown size={16} className="text-[#5f6368] ml-4" />
                </button>
                
                {showClassDropdown && (
                  <div 
                    ref={classDropdownRef} 
                    className="absolute top-full left-0 mt-1 w-80 bg-white shadow-lg rounded-lg z-10 border border-gray-200 max-h-[350px] overflow-hidden flex flex-col"
                  >
                    <div className="sticky top-0 bg-white p-2 border-b z-10">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search classes..."
                          className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="overflow-y-auto flex-1 scroll-smooth" style={{ scrollBehavior: 'smooth' }}>
                      {/* Select All option */}
                      <div className="p-2 hover:bg-gray-100 rounded-md cursor-pointer" onClick={selectAllClasses}>
                        <label className="flex items-center space-x-3 cursor-pointer w-full">
                          <input
                            type="checkbox"
                            className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            checked={courses && courses.length > 0 && selectedClasses.length === courses.length}
                            onChange={selectAllClasses}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="font-medium">Select All</span>
                        </label>
                      </div>
                
                      {/* Default classes */}
                      {defaultCourses.length > 0 && (
                        <>
                          <div className="px-3 py-2 bg-gray-100 text-xs font-medium text-gray-500 uppercase sticky top-0">
                            DEFAULT CLASSES
                          </div>
                          {defaultCourses.map(course => (
                            <div 
                              key={course.id} 
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => toggleClassSelection(course.id)}
                            >
                              <label className="flex items-center space-x-3 cursor-pointer w-full">
                                <input
                                  type="checkbox"
                                  className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  checked={selectedClasses.includes(course.id)}
                                  onChange={(e) => toggleClassSelection(course.id, e)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                                    style={{ backgroundColor: course.color }}
                                  >
                                    {course.avatar}
                                  </div>
                                  <div>
                                    <div className="font-medium">{course.name}</div>
                                    <div className="text-sm text-gray-500">{course.section}</div>
                                  </div>
                                </div>
                              </label>
                            </div>
                          ))}
                        </>
                      )}
                
                      {/* User courses */}
                      {userCourses.length > 0 && (
                        <>
                          <div className="px-3 py-2 bg-gray-100 text-xs font-medium text-gray-500 uppercase sticky top-0">
                            YOUR CLASSES
                          </div>
                          {userCourses.map(course => (
                            <div 
                              key={course.id} 
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => toggleClassSelection(course.id)}
                            >
                              <label className="flex items-center space-x-3 cursor-pointer w-full">
                                <input
                                  type="checkbox"
                                  className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  checked={selectedClasses.includes(course.id)}
                                  onChange={(e) => toggleClassSelection(course.id, e)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                                    style={{ backgroundColor: course.color }}
                                  >
                                    {course.avatar}
                                  </div>
                                  <div>
                                    <div className="font-medium">{course.name}</div>
                                    <div className="text-sm text-gray-500">{course.section}</div>
                                  </div>
                                </div>
                              </label>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                className={`px-4 py-2 text-[13px] rounded-md border flex items-center gap-2 ${
                  recipient === 'all' ? 'border-[#1a73e8] text-[#1a73e8]' : 'border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa]'
                }`}
                onClick={() => setRecipient('all')}
              >
                <Users size={16} />
                <span className="font-medium">All students</span>
              </button>
            </div>
          </div>

          {/* Selected classes pills */}
          {selectedClasses.length > 1 && courses && (
            <div className="flex flex-wrap gap-2 mb-4 ml-11">
              {selectedClasses.map(id => {
                const course = courses.find(c => c.id === id);
                if (!course) return null;
                
                return (
                  <div key={id} className="flex items-center bg-[#e8f0fe] text-[#1967d2] rounded-full px-3 py-1 text-xs">
                    <span>{course.name}</span>
                    <button 
                      className="ml-2 text-[#1967d2] hover:text-[#1a73e8]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClasses(prev => prev.filter(cid => cid !== id));
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

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
                disabled={(!content.trim() && attachments.length === 0) || isPosting || (!classId && selectedClasses.length === 0)}
                className={`px-6 py-2 rounded text-sm font-medium transition-colors ${
                  (!content.trim() && attachments.length === 0) || isPosting || (!classId && selectedClasses.length === 0)
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