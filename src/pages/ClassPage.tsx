import React, { useState, createContext, useEffect, useContext } from 'react';
import { useLocation, useParams, Link, Navigate } from 'react-router-dom';
import { Settings2, Copy, Calendar, MoreVertical, Expand, BellDot, Settings, Pencil, Clock } from 'lucide-react';
import ClassworkPage from './ClassworkPage';
import SubmissionsPage from './SubmissionsPage';
import ThemeCustomizer from '../components/ThemeCustomizer';
import AnnouncementInput from '../components/AnnouncementInput';
import AnnouncementList from '../components/Announcement/AnnouncementList';
import UpcomingAssignmentsModal from '../components/UpcomingAssignmentsModal';
import { Announcement } from '../types/announcement';
import { getCourseById, updateCourse } from '../api/courseApi';
import { getAnnouncements } from '../api/announcementApi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Course } from '../types/course';
import classroomImage from '../assets/classroom.png';

import { Assignment, getUpcomingAssignments } from '../types/assignment';

// Breakpoint values for responsive design
const BREAKPOINTS = {
  sm: 640,  // Small devices
  md: 768,  // Medium devices
  lg: 1024, // Large devices
  xl: 1280  // Extra large devices
};

// Use the Assignment interface from our types

// Helper function to format due date
const formatDueDate = (dateString: string): string => {
  if (!dateString) return 'No due date';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return dateString; // Return the original string if parsing fails
  }
};

// Helper function to get color based on assignment status
const getStatusColor = (status?: string): string => {
  switch (status) {
    case 'due-soon': return '#e37400'; // Orange
    case 'completed': return '#1e8e3e'; // Green
    case 'missing': return '#d93025';   // Red
    case 'upcoming': return '#1a73e8';  // Blue
    default: return '#1a73e8';          // Default blue
  }
};

// Define the class data interface
export interface ClassData extends Course {
  isNewClass?: boolean;
}

// Create a context for class data
export const ClassDataContext = createContext<ClassData>({
  id: '',
  name: 'Class',
  section: 'Section',
  teacherName: '',
  enrollmentCode: ''
});

// Import the real PeoplePage component
import PeoplePage from './PeoplePage';

// Simple wrapper component for Grades

const GradesPage: React.FC = () => {
  const classData = useContext(ClassDataContext);

  useEffect(() => {
    const className = classData.name || 'Class';
    const section = classData.section ? ` - ${classData.section}` : '';
    document.title = `${className}${section} - Grades - Google Classroom`;
  }, [classData]);

  return (
    <div className="py-6">
      <h2 className="text-2xl font-normal text-[#3c4043] mb-6">Grades</h2>
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-[#5f6368]">Grades content coming soon...</p>
      </div>
    </div>
  );
};

// Use external CDN for reliable fallback images
const FALLBACK_IMAGES = {
  education: 'https://images.pexels.com/photos/256520/pexels-photo-256520.jpeg',
  classroom: 'https://images.pexels.com/photos/733857/pexels-photo-733857.jpeg',
  default: 'https://images.pexels.com/photos/1326947/pexels-photo-1326947.jpeg'
};

// Function to validate image URLs
const isValidImageUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  if (url === 'string') return false;
  if (url.includes('http://localhost:3003/string')) return false;
  if (url.includes('http://localhost:3003/src/assets/')) return false; // Direct URL references to local assets won't work
  return true;
};

export default function ClassPage() {
  const { classId } = useParams<{ classId: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Redirect if classId is not provided
  if (!classId) {
    return <Navigate to="/" replace />;
  }

  // Helper function to determine responsive image size
  const getResponsiveImageSize = (): string => {
    // Default size for larger screens
    let size = '1600x900';

    // Check if window is available (client-side)
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;

      if (width < BREAKPOINTS.sm) {
        // Small mobile devices
        size = '640x360';
      } else if (width < BREAKPOINTS.md) {
        // Larger mobile devices
        size = '768x432';
      } else if (width < BREAKPOINTS.lg) {
        // Tablets
        size = '1024x576';
      } else if (width < BREAKPOINTS.xl) {
        // Small desktops
        size = '1280x720';
      }
    }

    return size;
  };

  // Helper function to update existing Unsplash URLs to be responsive
  const getResponsiveImageUrl = (url: string): string => {
    // If it's not an Unsplash URL, return as is
    if (!url.includes('unsplash.com')) return url;

    try {
      // Get the appropriate size for the current device
      const imageSize = getResponsiveImageSize();

      // If it's an Unsplash random URL, update the size
      if (url.includes('unsplash.com/random')) {
        // Extract the query parameters
        const queryMatch = url.match(/\?(.+)$/);
        const query = queryMatch ? queryMatch[1] : '';

        // Create a new URL with the updated size
        return `https://source.unsplash.com/random/${imageSize}/${query ? '?' + query : ''}`;
      }

      // For specific Unsplash images (not random), we can use the Unsplash API format
      if (url.includes('images.unsplash.com')) {
        // Remove any existing size parameters
        const baseUrl = url.split('?')[0];
        const [width, height] = imageSize.split('x');

        // Add new responsive size parameters
        return `${baseUrl}?w=${width}&h=${height}&auto=format&fit=crop`;
      }
    } catch (e) {
      console.error('Error creating responsive image URL', e);
    }

    // Return original URL if any issues occur
    return url;
  };

  const { data: courseData, isLoading, error } = useQuery<Course>({
    queryKey: ['course', classId],
    queryFn: async () => {
      try {
        if (!classId) {
          console.error('Invalid course ID provided: undefined');
          throw new Error('Invalid course ID: undefined');
        }
        const course = await getCourseById(classId);
        
        // Ensure we have a consistent ID format
        if (course.courseId && !course.id) {
          course.id = course.courseId.toString();
        }
        
        // Ensure we have the GUID available
        if (course.courseGuid) {
          // We'll use this GUID for future API calls
          console.log('Course GUID:', course.courseGuid);
        }
        
        return course;
      } catch (error) {
        console.error('Error fetching course:', error);
        throw error;
      }
    },
    enabled: !!classId && classId !== 'undefined',
    retry: 1 // Limit retries to avoid too many failed API calls
  });

  // Merge course data with location state if provided
  const getClassData = (): ClassData => {
    const locationState = location.state || {};

    if (courseData) {
      return {
        ...courseData,
        ...locationState,
        name: locationState.className || courseData.name || 'Class',
        section: locationState.section || courseData.section || 'Section',
        color: locationState.color || courseData.color || '#1a73e8',
        coverImage: locationState.coverImage || courseData.coverImage || classroomImage
      };
    }

    // Fallback if data is not loaded yet
    return {
      id: classId || '',
      name: locationState.className || 'Class',
      section: locationState.section || 'Section',
      teacherName: '',
      enrollmentCode: locationState.classCode || '',
      color: locationState.color || '#1a73e8',
      coverImage: locationState.coverImage || classroomImage,
      isNewClass: false
    };
  };

  const [classData, setClassData] = useState<ClassData>(getClassData());
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Upcoming assignments data
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
  const [allUpcomingAssignments, setAllUpcomingAssignments] = useState<Assignment[]>([]);
  const [showAllAssignments, setShowAllAssignments] = useState(false);

  // Load upcoming assignments when the component mounts or when classId changes
  useEffect(() => {
    if (classId) {
      loadUpcomingAssignments();

      // Listen for assignment updates
      const handleAssignmentUpdate = () => {
        loadUpcomingAssignments();
      };

      window.addEventListener('assignmentUpdated', handleAssignmentUpdate);
      window.addEventListener('assignmentDeleted', handleAssignmentUpdate);
      window.addEventListener('newAssignmentCreated', handleAssignmentUpdate);

      return () => {
        window.removeEventListener('assignmentUpdated', handleAssignmentUpdate);
        window.removeEventListener('assignmentDeleted', handleAssignmentUpdate);
        window.removeEventListener('newAssignmentCreated', handleAssignmentUpdate);
      };
    }
  }, [classId]);

  // Function to load upcoming assignments
  const loadUpcomingAssignments = () => {
    if (classId && classId !== 'undefined') {
      try {
        const assignments = getUpcomingAssignments(classId);

        // Store all assignments
        setAllUpcomingAssignments(assignments);

        // Sort assignments by priority: due-soon > missing > upcoming > completed
        const sortedAssignments = [...assignments].sort((a, b) => {
          const priorityOrder: Record<string, number> = {
            'due-soon': 0,
            'missing': 1,
            'upcoming': 2,
            'completed': 3
          };

          const priorityA = priorityOrder[a.status || 'upcoming'];
          const priorityB = priorityOrder[b.status || 'upcoming'];

          return priorityA - priorityB;
        });

        // Limit to 1 assignment for display (most urgent one)
        setUpcomingAssignments(sortedAssignments.slice(0, 1));
      } catch (error) {
        console.error('Error loading upcoming assignments:', error);
        setAllUpcomingAssignments([]);
        setUpcomingAssignments([]);
      }
    } else {
      // Reset assignments if no valid classId
      setAllUpcomingAssignments([]);
      setUpcomingAssignments([]);
    }
  };

  // Function to handle View All click
  const handleViewAllClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowAllAssignments(true);
  };

  // Close the modal when done viewing all assignments
  const handleCloseModal = () => {
    setShowAllAssignments(false);
  };

  // Load announcements when the component mounts or when classId changes
  useEffect(() => {
    if (classId && classId !== 'undefined') {
      loadAnnouncements();
    }
  }, [classId]);

  // Function to load announcements from API
  const loadAnnouncements = async () => {
    try {
      if (!classId || classId === 'undefined') {
        setAnnouncements([]);
        return;
      }

      // Use API call instead of localStorage
      const response = await getAnnouncements(classId);
      if (response && Array.isArray(response)) {
        // Sort by creation date (newest first)
        const sorted = [...response].sort((a: Announcement, b: Announcement) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setAnnouncements(sorted);
      } else {
        setAnnouncements([]);
      }
    } catch (e) {
      console.error('Error loading announcements', e);
      setAnnouncements([]);
    }
  };

  // Update state when location changes
  useEffect(() => {
    if (location.state && classId) {
      setClassData(prevData => ({
        ...prevData,
        ...location.state
      }));
    }
  }, [location.state, classId]);

  // Update document title when class data changes
  useEffect(() => {
    const className = classData.name || 'Class';
    const section = classData.section ? ` - ${classData.section}` : '';
    document.title = `${className}${section} - Google Classroom`;
  }, [classData]);

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState({
    color: classData.color || '#1a73e8',
    image: classData.coverImage || classroomImage
  });

  // Get current path to determine active tab
  const currentPath = location.pathname;
  const isStream = currentPath.endsWith('/stream') || currentPath === `/class/${classId}`;
  const isClasswork = currentPath.endsWith('/classwork');
  const isPeople = currentPath.endsWith('/people');
  const isGrades = currentPath.endsWith('/grades');
  const isSubmissions = currentPath.includes('/submissions/');

  // Function to handle theme changes
  const handleThemeChange = (newTheme: { color: string; image: string }) => {
    if (!classId || classId === 'undefined') {
      console.error('Cannot update theme: Invalid course ID');
      return;
    }

    const updatedClassData: Course = {
      ...classData,
      id: classId,
      courseId: classData.courseId,
      courseGuid: classData.courseGuid,
      color: newTheme.color,
      coverImage: newTheme.image
    };

    // Update the class data in state immediately
    setClassData(prevData => ({
      ...prevData,
      color: newTheme.color,
      coverImage: newTheme.image
    }));

    setTheme(newTheme);

    // Update the course via API - this will use the GUID if available due to our updated API function
    updateCourse(classData.courseGuid || classId, updatedClassData)
      .then(() => {
        // Invalidate course queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['course', classId] });
        queryClient.invalidateQueries({ queryKey: ['courses'] });
      })
      .catch(error => {
        console.error('Error updating course theme:', error);
      });
  };

  // Update theme when course data changes
  useEffect(() => {
    if (courseData) {
      setTheme({
        color: courseData.color || '#1a73e8',
        image: courseData.coverImage || classroomImage
      });
    }
  }, [courseData]);

  const isActive = (path: string) => {
    if (path === 'submissions' && isSubmissions) {
      return 'text-[#1967d2] border-b-2 border-[#1967d2]';
    }
    return location.pathname.includes(path) ? 'text-[#1967d2] border-b-2 border-[#1967d2]' : 'text-[#444746] hover:bg-[#f8f9fa]';
  };

  const copyClassCode = () => {
    const code = classData.enrollmentCode || 'zrgexl2e';
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Remove the IIFE wrapper for the banner and move it to a named function
  const renderBanner = () => {
    // Process the banner image URL to make it responsive
    const finalImageUrl = isValidImageUrl(theme.image)
      ? (theme.image && theme.image.includes('unsplash.com')
          ? getResponsiveImageUrl(theme.image)
          : theme.image)
      : FALLBACK_IMAGES.default;

    return (
      <div className="max-w-[1000px] mx-auto px-6 mt-6">
        <div
          className="rounded-lg overflow-hidden relative h-[180px] sm:h-[220px] md:h-[250px]"
          style={{ backgroundColor: theme.color }}
        >
          <div className="relative z-10 p-4 sm:p-6 pb-16">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-white text-[24px] sm:text-[32px] font-normal">{classData.name || 'Class'}</h1>
                <p className="text-white/90 text-lg sm:text-xl mt-1">{classData.section || 'Section'}</p>
              </div>
              <button
                onClick={() => setIsCustomizing(true)}
                className="bg-white hover:bg-gray-50 text-[#1a73e8] px-3 py-1.5 sm:px-4 sm:py-2 rounded flex items-center gap-2 text-sm font-medium"
              >
                <Pencil size={16} className="sm:size-18" />
                Customize
              </button>
            </div>
          </div>
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/90 z-10"></div>
            <img
              src={finalImageUrl}
              alt="Class banner"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                console.log('Banner image failed to load, using fallback');
                // Try the first fallback
                img.src = FALLBACK_IMAGES.classroom;

                // If the first fallback also fails, use the ultimate fallback
                img.onerror = () => {
                  img.src = FALLBACK_IMAGES.default;
                  img.onerror = null; // Prevent infinite loop

                  // Update the theme with the working fallback image
                  if (classId) {
                    const updatedData = { ...classData, coverImage: FALLBACK_IMAGES.default };
                    setClassData(updatedData);
                  }
                };
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <ClassDataContext.Provider value={classData}>
      <div className="min-h-screen bg-[#f9f9f9]">
        {/* Navigation Tabs */}
        <div className="bg-white border-b border-[#e0e0e0] w-full z-30" style={{ position: 'sticky', top: 64 }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full px-3 sm:px-6">
            <nav className="flex flex-wrap w-full sm:w-auto overflow-x-auto">
              <Link
                to={`/class/${classId}`}
                state={classData}
                className={`px-3 sm:px-4 py-[12px] sm:py-[14px] text-[13px] sm:text-[14px] whitespace-nowrap ${isActive('stream')}`}
              >
                Stream
              </Link>
              <Link
                to={`/class/${classId}/classwork`}
                state={classData}
                className={`px-3 sm:px-4 py-[12px] sm:py-[14px] text-[13px] sm:text-[14px] whitespace-nowrap ${isActive('classwork')}`}
              >
                Classwork
              </Link>
              <Link
                to={`/class/${classId}/people`}
                state={classData}
                className={`px-3 sm:px-4 py-[12px] sm:py-[14px] text-[13px] sm:text-[14px] whitespace-nowrap ${isActive('people')}`}
              >
                People
              </Link>
              <Link
                to={`/class/${classId}/grades`}
                state={classData}
                className={`px-3 sm:px-4 py-[12px] sm:py-[14px] text-[13px] sm:text-[14px] whitespace-nowrap ${isActive('grades')}`}
              >
                Grades
              </Link>
            </nav>
            <div className="hidden sm:flex items-center">
              <button className="p-2 hover:bg-[#f8f9fa] rounded-full">
                <Calendar size={20} className="text-[#444746]" />
              </button>
              <button className="p-2 hover:bg-[#f8f9fa] rounded-full">
                <BellDot size={20} className="text-[#444746]" />
              </button>
              <button className="p-2 hover:bg-[#f8f9fa] rounded-full">
                <Settings size={20} className="text-[#444746]" />
              </button>
            </div>
          </div>
        </div>

        {/* Call the banner rendering function */}
        {renderBanner()}

        {/* Theme Customizer Modal */}
        <ThemeCustomizer
          isOpen={isCustomizing}
          onClose={() => setIsCustomizing(false)}
          onSave={handleThemeChange}
          currentTheme={theme}
        />

        {/* Main Content */}
        <div className="max-w-[1000px] mx-auto pt-4 px-3 sm:px-6">
          {isStream && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Left Sidebar */}
              <div className="col-span-1 space-y-3">
                {/* Class Code */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-3 py-2 border-b flex justify-between items-center">
                    <h3 className="text-sm font-medium text-[#3c4043]">Class code</h3>
                    <button className="p-1 hover:bg-[#f8f9fa] rounded-full">
                      <MoreVertical size={16} className="text-[#5f6368]" />
                    </button>
                  </div>
                  <div className="p-3 flex items-center justify-between relative">
                    <span className="text-[#1a73e8] text-[15px] font-medium tracking-wide">{classData.enrollmentCode || 'zrgexl2e'}</span>
                    {copied && (
                      <div className="absolute left-0 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded">
                        Copied to clipboard
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <button className="p-1 hover:bg-[#f8f9fa] rounded-full">
                        <Expand size={18} className="text-[#5f6368]" />
                      </button>
                      <button
                        className="p-1 hover:bg-[#f8f9fa] rounded-full"
                        onClick={copyClassCode}
                      >
                        <Copy size={18} className="text-[#5f6368]" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Upcoming */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-3 py-2 border-b flex justify-between items-center">
                    <h3 className="text-sm font-medium text-[#3c4043]">Upcoming</h3>
                    <button className="p-1 hover:bg-[#f8f9fa] rounded-full">
                      <Clock size={16} className="text-[#5f6368]" />
                    </button>
                  </div>
                  <div className="p-3 space-y-3">
                    {upcomingAssignments.length > 0 ? (
                      upcomingAssignments.map((assignment) => (
                        <div key={assignment.id} className="group cursor-pointer hover:bg-[#f8f9fa] -mx-3 px-3 py-1 rounded">
                          <div className="flex items-start">
                            <div className={`w-2 h-2 rounded-full mt-1.5 mr-2`} style={{ backgroundColor: assignment.color }}></div>
                            <div>
                              <div className="flex items-center flex-wrap">
                                <span className="text-sm font-medium text-[#3c4043] group-hover:text-[#1a73e8]">{assignment.title}</span>
                                {assignment.status === 'due-soon' && (
                                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-[#fef7e0] text-[#e37400] rounded">Due Tomorrow</span>
                                )}
                                {assignment.status === 'completed' && (
                                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-[#e6f4ea] text-[#1e8e3e] rounded">Completed</span>
                                )}
                                {assignment.status === 'missing' && (
                                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-[#fce8e6] text-[#d93025] rounded">Missing</span>
                                )}
                              </div>
                              <p className="text-xs text-[#5f6368] mt-0.5">
                                {assignment.status === 'missing' ? 'Was due' : 'Due'} {assignment.dueDate}, {assignment.dueTime}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[#5f6368]">No work due soon</p>
                    )}
                    <a
                      href="#"
                      onClick={handleViewAllClick}
                      className="block mt-2 text-sm text-[#1a73e8] hover:bg-[#f6fafe] px-2 py-1 -mx-2 rounded"
                    >
                      View all
                    </a>
                  </div>
                </div>
              </div>

              {/* Main Stream Content */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                {/* Announcement Input */}
                <div className="mb-4">
                  <AnnouncementInput onAnnouncementPosted={loadAnnouncements} />
                </div>

                {/* Announcements List */}
                <AnnouncementList
                  announcements={announcements}
                  onAnnouncementUpdate={loadAnnouncements}
                />

                {/* Upcoming Assignments Modal */}
                {showAllAssignments && (
                  <UpcomingAssignmentsModal
                    isOpen={showAllAssignments}
                    onClose={handleCloseModal}
                    assignments={allUpcomingAssignments}
                  />
                )}

                {/* Stream Empty State - Only show when there are no announcements */}
                {announcements.length === 0 && (
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="flex flex-row w-full">
                      <div className="flex items-start p-4 w-full flex-wrap md:flex-nowrap">
                        <svg viewBox="0 0 241 149" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] mt-1 flex-shrink-0 mx-auto md:mx-0">
                          <path d="M138.19 145.143L136.835 145.664C134.646 146.498 132.249 145.352 131.519 143.164L82.4271 8.37444C81.5933 6.18697 82.7398 3.79117 84.9286 3.06201L86.2836 2.54118C88.4724 1.70786 90.8697 2.85368 91.5993 5.04115L140.691 139.831C141.421 142.018 140.379 144.414 138.19 145.143Z" stroke="#5F6368" strokeWidth="2"/>
                          <path d="M76.6602 10.5686C78.2029 12.2516 83.3923 14.7762 88.4414 13.0932C98.5395 9.72709 96.8565 2.57422 96.8565 2.57422" stroke="#5F6368" strokeWidth="2" strokeLinecap="round"/>
                          <path fillRule="evenodd" clipRule="evenodd" d="M60.1224 147.643C94.7266 135.143 112.55 96.9147 99.938 62.4361C87.4305 27.8532 49.1783 10.1451 14.5742 22.6449L60.1224 147.643ZM65.855 98.4772C77.3203 94.3106 83.2613 81.4983 79.0922 70.0401C74.923 58.4777 62.207 52.5403 50.6376 56.8111L65.855 98.4772Z" fill="#CEEAD6"/>
                          <path d="M58.1473 128.38L52.2567 130.905M52.2567 110.288L45.5246 112.812M44.6831 92.6157L39.2132 94.7195M38.3717 74.5232L32.9019 76.6269M32.4811 56.4306L26.5905 58.5344M25.749 38.7588L19.8584 40.8626" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M87.5996 128.38C94.472 121.227 105.86 101.199 103.168 78.3098C100.475 55.4206 89.7034 42.1247 84.6543 38.3379" stroke="#5F6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M225.952 147.956H157.994C154.554 147.956 151.74 145.143 151.74 141.706V73.79C151.74 70.3525 154.554 67.54 157.994 67.54H225.952C229.391 67.54 232.205 70.3525 232.205 73.79V141.706C232.205 145.247 229.495 147.956 225.952 147.956Z" stroke="#5F6368" strokeWidth="2"/>
                          <path d="M232.205 73.79C232.205 70.3525 229.391 67.54 225.952 67.54H157.994C154.554 67.54 151.74 70.3525 151.74 73.79V100.977L232.205 81.4982V73.79Z" fill="#5F6368"/>
                          <path d="M191.66 131.497C204.957 131.497 215.737 120.724 215.737 107.435C215.737 94.146 204.957 83.373 191.66 83.373C178.363 83.373 167.583 94.146 167.583 107.435C167.583 120.724 178.363 131.497 191.66 131.497Z" fill="white" stroke="#5F6368" strokeWidth="2"/>
                          <path d="M211.303 90.0912L207.095 93.4573M191.527 82.5176V87.1459M174.697 88.8289L178.063 93.4573M165.44 106.921L170.91 107.763M178.063 122.49L174.697 126.697M191.527 128.801V133.429M205.833 122.49L209.62 126.697M213.407 107.763H218.456" stroke="#5F6368" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M191.66 114.935C195.804 114.935 199.164 111.578 199.164 107.435C199.164 103.293 195.804 99.9355 191.66 99.9355C187.515 99.9355 184.155 103.293 184.155 107.435C184.155 111.578 187.515 114.935 191.66 114.935Z" fill="#5F6368"/>
                          <path d="M10.7177 130.977C12.698 130.977 12.698 127.852 10.7177 127.852C8.73733 127.852 8.73733 130.977 10.7177 130.977Z" fill="#5F6368"/>
                          <path d="M19.4368 106.921L8.49707 82.0967" stroke="#5F6368" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M13.126 93.0719C13.126 90.9273 13.5467 89.2442 14.7268 87.1405C17.0871 82.9328 22.162 83.7743 22.8034 86.3398C23.2241 88.0229 22.3005 91.7688 19.7759 93.072C16.8301 94.5926 14.809 94.755 13.9675 94.755" stroke="#5F6368" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M13.2331 93.6244C11.8849 91.9565 10.4997 90.9119 8.25948 90.0176C3.77892 88.2289 0.360966 92.0735 1.47485 94.4719C2.20559 96.0453 3.84062 97.8046 8.06124 97.8046C11.3764 97.8046 12.9821 95.9913 13.6366 95.4624" stroke="#5F6368" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M26.5609 148.997C39.7431 148.997 50.4294 138.317 50.4294 125.143C50.4294 111.969 39.7431 101.289 26.5609 101.289C13.3787 101.289 2.69238 111.969 2.69238 125.143C2.69238 138.317 13.3787 148.997 26.5609 148.997Z" fill="#DADCE0"/>
                          <path d="M16.8671 139.622C18.8475 139.622 18.8475 136.497 16.8671 136.497C14.8867 136.497 14.8867 139.622 16.8671 139.622Z" fill="#5F6368"/>
                          <path d="M21.245 131.81C23.2254 131.81 23.2254 128.685 21.245 128.685C19.2647 128.685 19.2647 131.81 21.245 131.81Z" fill="#5F6368"/>
                          <path d="M29.3749 138.685C31.3553 138.685 31.3553 135.56 29.3749 135.56C27.3946 135.56 27.3946 138.685 29.3749 138.685Z" fill="#5F6368"/>
                          <path d="M23.538 143.477C25.5184 143.477 25.5184 140.352 23.538 140.352C21.5576 140.352 21.5576 143.477 23.538 143.477Z" fill="#5F6368"/>
                          <path d="M18.3261 102.748C5.92283 107.227 -0.435161 120.977 4.0467 133.373C5.29745 136.914 7.38204 139.935 9.98777 142.435L34.0647 102.54C29.0617 100.873 23.6418 100.769 18.3261 102.748Z" fill="#5F6368"/>
                          <path d="M149.451 35.8135C150.433 41.143 154.921 51.129 163.336 48.4362C171.751 45.7433 168.666 35.1122 165.861 29.9229" stroke="#5F6368" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M167.374 31.082L148.926 37.4361C147.154 32.332 149.864 26.8112 154.971 25.0404C160.078 23.2696 165.602 25.9779 167.374 31.082Z" fill="#1E8E3E"/>
                          <path d="M199.581 23.0616L194.474 8.99933C195.933 7.95767 197.184 6.60353 198.122 5.04105C198.539 4.31189 198.956 3.47857 198.956 2.64525C198.956 1.81193 198.33 0.87444 197.497 0.87444C197.184 0.87444 196.871 0.978606 196.559 1.08277C194.474 1.91609 193.119 3.89523 191.972 5.87437L189.784 6.70769C190.201 4.52022 189.575 2.12442 188.116 0.45778C187.907 0.249449 187.803 0.145284 187.491 0.0411187C186.969 -0.167212 186.448 0.45778 186.136 0.978606C184.885 3.16607 184.781 5.87437 185.614 8.27017L168.104 14.6242C165.811 15.4576 164.56 18.0617 165.394 20.3533L166.228 22.7491C166.957 24.8324 169.25 25.8741 171.335 25.1449L174.045 32.5407C171.231 33.0615 168.625 34.7281 166.228 36.3948C165.186 37.1239 164.143 37.9573 164.247 39.3114C164.352 40.4572 165.186 41.2905 166.228 41.7072C168.104 42.3322 169.876 41.603 171.648 40.978C173.211 40.3531 174.879 39.7281 176.442 39.1031L176.859 40.3531C173.732 43.0614 171.752 47.1238 171.752 51.6029C171.752 56.3945 173.941 60.6653 177.485 63.3736C175.713 63.5819 173.837 64.1027 172.273 64.936C171.752 65.1444 171.335 65.4569 171.127 65.9777C170.71 66.811 171.439 67.8527 172.377 68.1652C173.315 68.4777 174.253 68.2693 175.192 68.061C176.963 67.7485 184.676 67.2277 188.637 66.4985C194.474 66.4985 212.714 66.4985 216.258 66.4985C224.596 66.4985 231.267 56.8112 231.267 48.4779C231.267 43.478 228.765 38.9989 224.909 36.2906C224.596 30.4574 230.225 31.3948 231.996 31.7073C234.185 32.2282 236.374 33.8948 238.459 32.3323C239.293 31.7073 239.709 30.6657 239.918 29.7282C245.338 7.43685 204.688 -2.97967 199.581 23.0616Z" fill="#DADCE0"/>
                          <path d="M185.302 16.0826C186.108 16.0826 186.761 15.4297 186.761 14.6243C186.761 13.8189 186.108 13.166 185.302 13.166C184.496 13.166 183.843 13.8189 183.843 14.6243C183.843 15.4297 184.496 16.0826 185.302 16.0826Z" fill="#5F6368"/>
                          <path d="M211.303 27.3983C213.406 25.7153 218.96 22.8541 224.346 24.8738C229.732 26.8934 232.2 30.7644 232.761 32.4474M211.303 20.2454C213.266 18.0014 219.044 14.3548 226.45 17.7209C231.359 19.9521 236.969 24.8738 239.073 31.1852M200.363 21.9285C199.942 23.4713 199.101 27.4825 199.101 31.1852C199.101 34.8878 199.942 40.0211 200.363 42.1248" stroke="#5F6368" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M165.172 18.1085L168.233 16.9138" stroke="#5F6368" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M172.172 67.3701H216.351" stroke="#5F6368" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M135.145 49.6982L127.151 65.687M116.211 11.8301L118.735 36.6548" stroke="#5F6368" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <div className="md:ml-4 flex-1 mt-4 md:mt-0 text-center md:text-left">
                          <h2 className="text-[20px] text-[#3c4043] font-normal mb-1">
                            This is where you can talk to your class
                          </h2>
                          <p className="text-[#5f6368] text-[14px] mb-4">
                            Use the stream to share announcements, post assignments, and respond to student questions
                          </p>
                          <button className="inline-flex items-center gap-2 px-4 py-1.5 text-[#1a73e8] hover:bg-[#f6fafe] rounded text-sm font-medium mx-auto md:mx-0">
                            <Settings2 size={16} />
                            Stream settings
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isClasswork && <ClassworkPage />}

          {isPeople && <PeoplePage />}

          {isGrades && <GradesPage />}

          {isSubmissions && <SubmissionsPage />}
        </div>
      </div>
      {/* Upcoming Assignments Modal */}
      <UpcomingAssignmentsModal
        isOpen={showAllAssignments}
        onClose={() => setShowAllAssignments(false)}
        assignments={allUpcomingAssignments}
      />
    </ClassDataContext.Provider>
  );
}
