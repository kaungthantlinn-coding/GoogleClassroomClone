import { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink, Link } from 'react-router-dom';
import {
  Home,
  BookOpen,
  CheckSquare,
  Archive,
  Settings,
  GraduationCap,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Calendar,
  X,
  Menu,
  Plus,
  LogOut
} from 'lucide-react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { createCourse, getCourses, deleteCourse, unenrollCourse } from '../api/courseApi';

interface SidebarProps {
  isCollapsed: boolean;
}

// Breakpoint values for responsive design
const BREAKPOINTS = {
  sm: 640,  // Small devices
  md: 768,  // Medium devices
  lg: 1024, // Large devices
  xl: 1280  // Extra large devices
};

interface Class {
  id: string;
  name: string;
  section: string;
  teacherName?: string;
  color?: string;
  courseId?: number;
  courseGuid?: string;
}

// Function to generate a unique key even for items with undefined IDs
const generateUniqueKey = (prefix: string, item: Class) => {
  if (!item.id || item.id === 'undefined') {
    // Use name and section with a timestamp to create unique key
    return `${prefix}-${item.name}-${item.section}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  return `${prefix}-${item.id}`;
};

// Function to get a consistent color for a class
const getClassColor = (classItem: Partial<Class>, defaultColor = '#4285f4'): string => {
  // First check for explicit color property
  if (classItem.color && classItem.color !== 'undefined') {
    return classItem.color;
  }
  
  // Generate a consistent color based on the class name if available
  if (classItem.name) {
    const colors = ['#4285f4', '#0f9d58', '#f4b400', '#db4437', '#673ab7', '#ff6d00', '#795548'];
    const hash = classItem.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }
  
  // Fallback to default
  return defaultColor;
};

export default function Sidebar({ isCollapsed }: SidebarProps) {
  // State to track screen size
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const [teachingClasses, setTeachingClasses] = useState<Class[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<Class[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClass, setNewClass] = useState<Partial<Class>>({
    name: '',
    section: '',
    color: '#4285f4'
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get user role to determine if student or teacher
  const userRole = localStorage.getItem('user_role') || sessionStorage.getItem('user_role');
  const isStudent = userRole?.toLowerCase() === 'student';

  // Use React Query to fetch courses
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
    refetchOnWindowFocus: true,
  });

  // Update classes when courses data changes
  useEffect(() => {
    if (courses) {
      console.log("Courses data received:", JSON.stringify(courses, null, 2));
      const formattedCourses = courses.map(course => {
        console.log(`Processing course: ${course.name}, original color: ${course.color}, ID: ${course.id || course.courseId?.toString() || course.courseGuid}`);
        const calculatedColor = getClassColor({name: course.name, id: course.id || ''});
        console.log(`Calculated color: ${calculatedColor}`);
        
        return {
          id: course.id,
          name: course.name,
          section: course.section || '',
          // Use explicit color if available, otherwise calculate based on name
          color: course.color || calculatedColor,
          courseId: course.courseId,
          courseGuid: course.courseGuid
        };
      });
      console.log("Formatted courses:", JSON.stringify(formattedCourses, null, 2));
      
      // If user is a student, put courses in enrolledClasses, otherwise in teachingClasses
      if (isStudent) {
        setEnrolledClasses(formattedCourses);
        setTeachingClasses([]); // Clear teaching classes for students
      } else {
        setTeachingClasses(formattedCourses);
        setEnrolledClasses([]); // Clear enrolled classes for teachers
      }
    }
  }, [courses, isStudent]);

  // Legacy loadClasses function (now empty, keeping for backward compatibility with event handlers)
  const loadClasses = () => {
    // This function is now a no-op, as we're using React Query
    // Invalidate the courses query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ['courses'] });
  };

  useEffect(() => {
    // Load classes immediately on component mount
    loadClasses();

    // Add event listener for storage changes
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key && event.key.startsWith('classData-')) {
        loadClasses();
      }
    };

    // Add event listener for the new class-created event
    const handleClassCreatedEvent = (event: CustomEvent) => {
      if (event.detail?.action === 'addClass' && event.detail.class) {
        console.log("Adding class from event:", event.detail.class);
        setTeachingClasses(prevClasses => {
          const exists = prevClasses.some(cls => cls.id === event.detail.class.id);
          if (exists) return prevClasses;
          
          // Make sure we get the color property
          const newClass = {
            ...event.detail.class,
            color: event.detail.class.color || getClassColor(event.detail.class)
          };
          
          console.log("Adding to sidebar with color:", newClass.color);
          return [...prevClasses, newClass];
        });
      }
    };

    // Add new event listener for class deletion/archiving
    const handleClassRemovedEvent = (event: CustomEvent) => {
      if (event.detail?.action === 'removeClass' && event.detail.classId) {
        setTeachingClasses(prevClasses =>
          prevClasses.filter(cls => cls.id !== event.detail.classId)
        );
      } else if (event.detail?.action === 'clearAll') {
        // Load the classes again to ensure the sidebar is up to date
        loadClasses();
      }
    };

    // Function to check screen size and set mobile state
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.md);
      // Auto-collapse sidebar on small screens
      if (window.innerWidth < BREAKPOINTS.md) {
        setIsSidebarVisible(false);
      } else {
        setIsSidebarVisible(true);
      }
    };

    // Handle toggle sidebar event from Navbar
    const handleToggleSidebar = () => {
      setIsSidebarVisible(prevState => !prevState);
    };

    // Check screen size on mount
    checkScreenSize();

    // Add event listeners
    window.addEventListener('storage', handleStorageEvent as EventListener);
    window.addEventListener('class-created', handleClassCreatedEvent as EventListener);
    window.addEventListener('class-removed', handleClassRemovedEvent as EventListener);
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('toggle-sidebar', handleToggleSidebar);

    // Handle clicks outside sidebar to close it on mobile
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Return cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageEvent as EventListener);
      window.removeEventListener('class-created', handleClassCreatedEvent as EventListener);
      window.removeEventListener('class-removed', handleClassRemovedEvent as EventListener);
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('toggle-sidebar', handleToggleSidebar);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile]);

  const [isTeachingOpen, setIsTeachingOpen] = useState(true);
  const [isEnrolledOpen, setIsEnrolledOpen] = useState(true);

  const navItems = [
    { icon: Home, label: 'Home', to: '/' },
    { icon: Calendar, label: 'Calendar', to: '/calendar' },
  ];

  const teachingItems = [
    { icon: ClipboardList, label: 'To review', to: '/to-review' },
  ];

  const enrolledItems = [
    { icon: CheckSquare, label: 'To-do', to: '/todo' },
  ];

  const bottomNavItems = [
    { icon: Archive, label: 'Archived classes', to: '/archived' },
    { icon: Settings, label: 'Settings', to: '/settings' },
  ];

  // Function to get the cover image for a class with responsive sizing
  const getCoverImageForClass = (classId: string, className: string): string => {
    // Generate a class-specific image based on the class name
    let query = 'education,classroom';
    if (className.toLowerCase().includes('ui') || className.toLowerCase().includes('ux')) {
      query = 'ui,design';
    } else if (className.toLowerCase().includes('fullstack')) {
      query = 'coding,programming';
    } else if (className.toLowerCase().includes('riso')) {
      query = 'technology,computer';
    } else if (className.toLowerCase().includes('cloud')) {
      query = 'technology,cloud,computing';
    }
    
    // Get responsive image size based on screen width
    const imageSize = getResponsiveImageSize();
    return `https://source.unsplash.com/random/${imageSize}/?${query}`;
  };

  // Helper function to determine responsive image size based on screen width
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
      // Example: https://images.unsplash.com/photo-123456?w=1600&h=900
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

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name) return;

    const coverImage = getCoverImageForClass('temp-id', newClass.name);

    // Create the course data
    const courseData = {
      name: newClass.name,
      section: newClass.section || '',
      teacherName: 'You',
      color: newClass.color || '#4285f4',
      textColor: 'white',
      subject: '',
      room: ''
    };

    console.log("Creating course with color:", courseData.color);

    // Call the API to create the course
    createCourse(courseData)
      .then(createdCourse => {
        console.log('Created new course:', createdCourse);
        console.log('Returned color:', createdCourse.color);

        // Create a new class object for state update
        const newClassObj = {
          id: createdCourse.id || createdCourse.courseId?.toString() || createdCourse.courseGuid,
          name: createdCourse.name,
          section: createdCourse.section || '',
          color: createdCourse.color || courseData.color || '#4285f4',
          courseId: createdCourse.courseId,
          courseGuid: createdCourse.courseGuid
        };

        console.log('New class object for sidebar:', newClassObj);

        // Update state immediately with functional update
        setTeachingClasses(prevClasses => {
          const updatedClasses = [...prevClasses, newClassObj];
          return updatedClasses;
        });

        // Invalidate courses query to refresh data
        queryClient.invalidateQueries({ queryKey: ['courses'] });

        // Close modal and reset form
        setShowCreateModal(false);
        setNewClass({ name: '', section: '', color: '#4285f4' });

        // Navigate to the new class page
        navigate(`/class/${createdCourse.id}`, {
          state: {
            className: createdCourse.name,
            section: createdCourse.section,
            color: createdCourse.color || newClass.color || '#4285f4'
          }
        });
      })
      .catch(error => {
        console.error('Error creating class:', error);
      });
  };

  // Toggle sidebar visibility on mobile
  const toggleMobileSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // Function to handle toggle sidebar event from Navbar
  const handleToggleSidebar = () => {
    setIsSidebarVisible(prevState => !prevState);
  };

  // Function to open create class modal
  const openCreateClassModal = () => {
    setShowCreateModal(true);
    // Close sidebar on mobile when opening modal
    if (isMobile) {
      setIsSidebarVisible(false);
    }
  };

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isMobile && isSidebarVisible && (
        <div
          key="mobile-backdrop-overlay"
          className="fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300"
          onClick={toggleMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile create class button */}
      {isMobile && (
        <div className="fixed right-4 bottom-4 z-40" key="mobile-create-button">
          <button
            onClick={openCreateClassModal}
            className="p-3 bg-[#1a73e8] rounded-full shadow-lg text-white hover:bg-[#1557b0] transition-colors"
            aria-label="Create class"
          >
            <Plus size={24} />
          </button>
        </div>
      )}

      {/* Mobile menu toggle button */}
      {isMobile && !isSidebarVisible && (
        <div className="fixed left-4 top-4 z-40" key="mobile-menu-toggle">
          <button
            onClick={toggleMobileSidebar}
            className="p-2 bg-white rounded-full shadow-md text-[#3c4043] hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      )}

      <aside
        ref={sidebarRef}
        className={`fixed left-0 top-0 h-full bg-white shadow-lg z-30 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed && !isMobile ? 'w-[72px]' : 'w-[260px]'
        } ${isMobile ? (isSidebarVisible ? 'translate-x-0' : '-translate-x-full') : ''}`}
        style={{
          overflowY: 'auto',
          paddingTop: isMobile ? '80px' : '64px',
          boxShadow: isMobile ? '0 0 15px rgba(0,0,0,0.1)' : undefined
        }}
      >
        {/* Mobile close button */}
        {isMobile && isSidebarVisible && (
          <div className="absolute top-0 left-0 right-0 h-16 bg-white flex items-center justify-between px-4 border-b" key="mobile-close-button">
            <div className="flex items-center">
              <GraduationCap size={24} className="text-[#1a73e8] mr-2" />
              <span className="font-medium text-[#3c4043]">Classroom</span>
            </div>
            <button
              onClick={toggleMobileSidebar}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Close sidebar"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        )}
        <nav className="py-3 px-2 relative">
          {navItems.map((item) => (
            <div key={`nav-item-${item.to}`} className="relative">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? 'justify-center px-3' : 'gap-4 px-6'} py-3 rounded-r-full ${
                    isActive ? 'bg-[#e8f0fe] text-[#1967d2] font-medium' : 'hover:bg-[#f8f9fa] text-[#3c4043]'
                  }`
                }
              >
                <item.icon size={24} strokeWidth={1.5} />
                {!isCollapsed && <span className="text-sm">{item.label}</span>}
              </NavLink>
            </div>
          ))}

          <div className="mt-2">
            {/* Only show Teaching section if user is a teacher or has teaching classes */}
            {(!isStudent || teachingClasses.length > 0) && (
              <>
                <button
                  onClick={() => !isCollapsed && setIsTeachingOpen(!isTeachingOpen)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center w-full mx-auto' : 'gap-4 px-6'} py-3 rounded-r-full hover:bg-[#f8f9fa] text-[#3c4043]`}
                >
                  <GraduationCap size={24} strokeWidth={1.5} />
                  {!isCollapsed && (
                    <>
                      <span className="text-sm flex-1 text-left">Teaching</span>
                      {isTeachingOpen ? (
                        <ChevronUp size={20} strokeWidth={1.5} key="teaching-chevron-up" />
                      ) : (
                        <ChevronDown size={20} strokeWidth={1.5} key="teaching-chevron-down" />
                      )}
                    </>
                  )}
                </button>
                {(isCollapsed || isTeachingOpen) && (
                  <div key="teaching-items-container">
                    {teachingItems.map((item) => (
                      <NavLink
                        key={`teaching-item-${item.to}`}
                        to={item.to}
                        className={({ isActive }) =>
                          `flex items-center ${isCollapsed ? 'justify-center w-full mx-auto' : 'gap-4 pl-14 pr-6'} py-3 rounded-r-full ${
                            isActive ? 'bg-[#e8f0fe] text-[#1967d2] font-medium' : 'hover:bg-[#f8f9fa] text-[#3c4043]'
                          }`
                        }
                      >
                        <item.icon size={24} strokeWidth={1.5} />
                        {!isCollapsed && <span className="text-sm">{item.label}</span>}
                      </NavLink>
                    ))}

                    {/* Teaching Classes */}
                    {!isCollapsed && teachingClasses.map((classItem, index) => {
                      // Generate a unique key for each teaching class item
                      const uniqueKey = generateUniqueKey('teaching-class', classItem);
                      return (
                        <div key={uniqueKey} className="group relative flex items-center">
                          <Link
                            to={`/class/${classItem.id || classItem.courseId?.toString() || classItem.courseGuid || uniqueKey}`}
                            state={{
                              className: classItem.name,
                              section: classItem.section,
                              color: classItem.color,
                              coverImage: getCoverImageForClass(classItem.id || classItem.courseId?.toString() || classItem.courseGuid || uniqueKey, classItem.name)
                            }}
                            className="flex-1 flex items-center gap-2 pl-14 pr-6 py-2 hover:bg-[#f8f9fa] text-[#3c4043] rounded-r-full"
                          >
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                              style={{ backgroundColor: getClassColor(classItem) }}
                            >
                              {(classItem.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                              <span className="text-sm block truncate">{classItem.name || 'Unnamed Class'}</span>
                              <span className="text-xs text-gray-500 block truncate">{classItem.section || ''}</span>
                            </div>
                          </Link>
                          <button
                            onClick={() => {
                              // Delete the course via API
                              const courseIdToDelete = classItem.id || classItem.courseId?.toString() || classItem.courseGuid;
                              if (!courseIdToDelete) {
                                console.error('Cannot delete course - no valid ID found');
                                return;
                              }
                              
                              deleteCourse(courseIdToDelete)
                                .then(() => {
                                  console.log(`Deleted course: ${courseIdToDelete}`);
                                  // Update local state
                                  setTeachingClasses(prevClasses => prevClasses.filter(cls => 
                                    cls.id !== courseIdToDelete && 
                                    cls.courseId?.toString() !== courseIdToDelete && 
                                    cls.courseGuid !== courseIdToDelete
                                  ));
                                  // Invalidate course queries to refresh data
                                  queryClient.invalidateQueries({ queryKey: ['courses'] });
                                })
                                .catch(error => {
                                  console.error(`Failed to delete course ${courseIdToDelete}:`, error);
                                });
                            }}
                            className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full transition-opacity"
                          >
                            <X size={16} className="text-gray-500" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-2">
            {/* Only show Enrolled section if user is a student or has enrolled classes */}
            {(isStudent || enrolledClasses.length > 0) && (
              <>
                <button
                  onClick={() => !isCollapsed && setIsEnrolledOpen(!isEnrolledOpen)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center w-full mx-auto' : 'gap-4 px-6'} py-3 rounded-r-full hover:bg-[#f8f9fa] text-[#3c4043]`}
                >
                  <BookOpen size={24} strokeWidth={1.5} />
                  {!isCollapsed && (
                    <>
                      <span className="text-sm flex-1 text-left">Enrolled</span>
                      {isEnrolledOpen ? (
                        <ChevronUp size={20} strokeWidth={1.5} key="enrolled-chevron-up" />
                      ) : (
                        <ChevronDown size={20} strokeWidth={1.5} key="enrolled-chevron-down" />
                      )}
                    </>
                  )}
                </button>
                {(isCollapsed || isEnrolledOpen) && (
                  <div key="enrolled-items-container">
                    {enrolledItems.map((item) => (
                      <NavLink
                        key={`enrolled-item-${item.to}`}
                        to={item.to}
                        className={({ isActive }) =>
                          `flex items-center ${isCollapsed ? 'justify-center w-full mx-auto' : 'gap-4 pl-14 pr-6'} py-3 rounded-r-full ${
                            isActive ? 'bg-[#e8f0fe] text-[#1967d2] font-medium' : 'hover:bg-[#f8f9fa] text-[#3c4043]'
                          }`
                        }
                      >
                        <item.icon size={24} strokeWidth={1.5} />
                        {!isCollapsed && <span className="text-sm">{item.label}</span>}
                      </NavLink>
                    ))}

                    {/* Enrolled Classes */}
                    {!isCollapsed && enrolledClasses.map((classItem) => {
                      // Generate a unique key for each enrolled class item
                      const uniqueKey = generateUniqueKey('enrolled-class', classItem);
                      return (
                        <div key={uniqueKey} className="group relative flex items-center">
                          <Link
                            to={`/class/${classItem.id || classItem.courseId?.toString() || classItem.courseGuid || uniqueKey}`}
                            state={{
                              className: classItem.name,
                              section: classItem.section,
                              color: classItem.color,
                              coverImage: getCoverImageForClass(classItem.id || classItem.courseId?.toString() || classItem.courseGuid || uniqueKey, classItem.name)
                            }}
                            className="flex-1 flex items-center gap-2 pl-14 pr-6 py-2 hover:bg-[#f8f9fa] text-[#3c4043] rounded-r-full"
                          >
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                              style={{ backgroundColor: getClassColor(classItem) }}
                            >
                              {(classItem.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                              <span className="text-sm block truncate">{classItem.name || 'Unnamed Class'}</span>
                              <span className="text-xs text-gray-500 block truncate">{classItem.section || ''}</span>
                            </div>
                          </Link>
                          <button
                            onClick={() => {
                              // Get the correct course ID
                              const courseIdToUnenroll = classItem.id || classItem.courseId?.toString() || classItem.courseGuid;
                              if (!courseIdToUnenroll) {
                                console.error('Cannot unenroll from course - no valid ID found');
                                return;
                              }
                              
                              // Confirm before unenrolling
                              if (window.confirm(`Are you sure you want to unenroll from "${classItem.name}"?`)) {
                                console.log(`Attempting to unenroll from course with ID: ${courseIdToUnenroll}`);
                                
                                unenrollCourse(courseIdToUnenroll)
                                  .then(() => {
                                    console.log(`Successfully unenrolled from course: ${courseIdToUnenroll}`);
                                    // Update local state by removing the course
                                    setEnrolledClasses(prevClasses => prevClasses.filter(cls => 
                                      cls.id !== courseIdToUnenroll && 
                                      cls.courseId?.toString() !== courseIdToUnenroll && 
                                      cls.courseGuid !== courseIdToUnenroll
                                    ));
                                    // Invalidate course queries to refresh data
                                    queryClient.invalidateQueries({ queryKey: ['courses'] });
                                  })
                                  .catch(error => {
                                    console.error(`Failed to unenroll from course ${courseIdToUnenroll}:`, error);
                                    alert(`Failed to unenroll from class. Error: ${error.message || 'Unknown error'}`);
                                  });
                              }
                            }}
                            className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full transition-opacity"
                            title="Unenroll from class"
                          >
                            <LogOut size={16} className="text-gray-500" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-4 pt-4 border-t">
            {bottomNavItems.map((item) => (
              <NavLink
                key={`bottom-nav-${item.to}`}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? 'justify-center w-full mx-auto' : 'gap-4 px-6'} py-3 rounded-r-full ${
                    isActive ? 'bg-[#e8f0fe] text-[#1967d2] font-medium' : 'hover:bg-[#f8f9fa] text-[#3c4043]'
                  }`
                }
              >
                <item.icon size={24} strokeWidth={1.5} />
                {!isCollapsed && <span className="text-sm">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" key="create-class-modal">
          <div
            className="bg-white w-full max-w-[500px] mx-4 rounded-lg shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-[22px] font-normal text-[#3c4043]">Create class</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} className="text-[#5f6368]" />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    name="name"
                    value={newClass.name || ''}
                    onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                    placeholder="Class name (required)"
                    className="w-full px-3 py-2 border-b border-gray-300 focus:border-[#1a73e8] focus:outline-none text-[#3c4043]"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="section"
                    value={newClass.section || ''}
                    onChange={(e) => setNewClass({...newClass, section: e.target.value})}
                    placeholder="Section"
                    className="w-full px-3 py-2 border-b border-gray-300 focus:border-[#1a73e8] focus:outline-none text-[#3c4043]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Choose class color</label>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {['#4285f4', '#0f9d58', '#f4b400', '#db4437', '#673ab7', '#ff6d00', '#795548'].map((color, index) => (
                      <button
                        key={`color-${index}-${color.replace('#', '')}`}
                        type="button"
                        className={`w-8 h-8 sm:w-6 sm:h-6 rounded-full ${newClass.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewClass({...newClass, color})}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-full sm:w-auto px-6 py-3 sm:py-2 text-[#1a73e8] hover:bg-[#f6fafe] rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newClass.name}
                  className={`w-full sm:w-auto px-6 py-3 sm:py-2 ${!newClass.name ? 'bg-gray-300 text-gray-500' : 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'} rounded-md font-medium`}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}