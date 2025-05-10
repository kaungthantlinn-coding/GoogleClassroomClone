import React, { useEffect, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Course } from '../types/course';
import { Link } from 'react-router-dom';
import { Users, Folder, Trash2, Edit, Plus, MoreVertical, LogOut } from 'lucide-react';
import { deleteCourse, getCourses, updateCourse, enrollCourse, enrollCourseByCode, unenrollCourse } from '../api/courseApi';
import axios from 'axios';
import ArchiveConfirmationModal from '../components/ArchiveConfirmationModal';

// Fallback images when Unsplash API fails - using publicly accessible CDNs for reliability
const FALLBACK_IMAGES = {
  ui: 'https://images.pexels.com/photos/196645/pexels-photo-196645.jpeg',
  coding: 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg',
  tech: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg',
  education: 'https://images.pexels.com/photos/256520/pexels-photo-256520.jpeg',
  default: 'https://images.pexels.com/photos/733857/pexels-photo-733857.jpeg' // Changed to a public CDN URL
};

// Function to generate truly unique keys for courses
const generateUniqueKey = (prefix: string, course: Course): string => {
  const courseIdStr = course.courseId ? course.courseId.toString() : course.id;
  if (!courseIdStr || courseIdStr === 'undefined') {
    // Create a uniqueness factor based on available properties
    const nameHash = course.name ? course.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const uniqueSegment = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${nameHash}`;
    return `${prefix}-${uniqueSegment}`;
  }
  return `${prefix}-${courseIdStr}`;
};

// Function to validate image URLs
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  if (url === 'string') return false;
  if (url.includes('http://localhost:3003/string')) return false;
  if (url.includes('http://localhost:3003/src/assets/')) return false; // Direct URL references to local assets won't work
  return true;
};

const getRandomUnsplashImage = (className: string) => {
  const timestamp = Date.now();
  let query = 'education,classroom';
  let fallbackKey = 'education';

  // Add specific themes based on class name
  if (className.toLowerCase().includes('ui') || className.toLowerCase().includes('ux')) {
    query = 'ui,design';
    fallbackKey = 'ui';
  } else if (className.toLowerCase().includes('fullstack')) {
    query = 'coding,programming';
    fallbackKey = 'coding';
  } else if (className.toLowerCase().includes('riso')) {
    query = 'technology,computer';
    fallbackKey = 'tech';
  }

  return {
    primary: `https://source.unsplash.com/random/800x600?${query}&t=${timestamp}`,
    fallback: FALLBACK_IMAGES[fallbackKey as keyof typeof FALLBACK_IMAGES] || FALLBACK_IMAGES.default
  };
};

// Helper function to preload images and ensure they're cached
const preloadImage = (src: string, fallbackSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!isValidImageUrl(src)) {
      resolve(fallbackSrc);
      return;
    }

    const img = new Image();

    img.onload = () => resolve(src);

    img.onerror = () => {
      console.log(`Failed to load primary image: ${src}, using fallback`);
      // Try the fallback image instead
      const fallbackImg = new Image();
      fallbackImg.src = fallbackSrc;

      fallbackImg.onload = () => resolve(fallbackSrc);
      fallbackImg.onerror = () => {
        console.log(`Fallback image also failed: ${fallbackSrc}, using default fallback`);
        // If even the fallback fails, return a reliable external image
        resolve(FALLBACK_IMAGES.default);
      };
    };

    img.src = src;
  });
};

export default function HomePage() {
  const queryClient = useQueryClient();
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveStep, setArchiveStep] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseImages, setCourseImages] = useState<{[key: string]: string}>({});
  
  // For student enrollment
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [enrollmentError, setEnrollmentError] = useState('');
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  
  // For student unenrollment
  const [showUnenrollModal, setShowUnenrollModal] = useState(false);
  const [unenrollCourseId, setUnenrollCourseId] = useState<string>('');
  const [unenrollCourseName, setUnenrollCourseName] = useState<string>('');
  const [unenrollLoading, setUnenrollLoading] = useState(false);
  const [unenrollError, setUnenrollError] = useState('');
  
  // For dropdown menu
  const [openMenuCourseId, setOpenMenuCourseId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get user role
  const userRole = localStorage.getItem('user_role') || sessionStorage.getItem('user_role');
  const isStudent = userRole?.toLowerCase() === 'student';

  // Convert imported classroom image to data URL on component mount
  useEffect(() => {
    // We can use the imported classroomImage directly for React components
    // but for fallbacks, we'll use the FALLBACK_IMAGES.default which is a public CDN URL
  }, []);

  // Use React Query to fetch course images when needed
  const fetchCourseImage = async (courseId: string, courseName: string) => {
    // If we already have an image for this course, use it
    if (courseImages[courseId] && isValidImageUrl(courseImages[courseId])) {
      return courseImages[courseId];
    }
    
    // Otherwise generate a new image
    const imageOptions = getRandomUnsplashImage(courseName);
    
    // Try to load Unsplash image in background
    try {
      const imgSrc = await preloadImage(imageOptions.primary, imageOptions.fallback);
      setCourseImages(prev => ({...prev, [courseId]: imgSrc}));
      return imgSrc;
    } catch (error) {
      console.error('Failed to load image:', error);
      return imageOptions.fallback;
    }
  };

  // Function to clear all created classes
  const clearCreatedClasses = () => {
    if (window.confirm('Are you sure you want to clear all created classes?')) {
      // Get all courses and delete them via API, but filter out any with invalid IDs
      courses?.filter(course => course.id && course.id !== 'undefined').forEach(course => {
        deleteCourse(course.id)
          .then(() => {
            console.log(`Deleted course: ${course.id}`);
          })
          .catch(error => {
            console.error(`Failed to delete course ${course.id}:`, error);
          });
      });
      
      // Refresh the courses list
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      
      // Dispatch event to update sidebar
      const clearEvent = new CustomEvent('class-removed', {
        detail: { action: 'clearAll' }
      });
      window.dispatchEvent(clearEvent);
    }
  };

  // Function to archive a class
  const handleArchiveClass = (course: Course) => {
    setSelectedCourse(course);
    setShowArchiveModal(true);
    setArchiveStep(0);
  };

  const confirmArchive = () => {
    if (!selectedCourse) return;

    // Delete course via API
    deleteCourse(selectedCourse.id)
      .then(() => {
        console.log(`Deleted course: ${selectedCourse.id}`);

        // Refresh the courses list
        queryClient.invalidateQueries({ queryKey: ['courses'] });

        // Dispatch event to update sidebar
        const archiveEvent = new CustomEvent('class-removed', {
          detail: { action: 'removeClass', classId: selectedCourse.id }
        });
        window.dispatchEvent(archiveEvent);

        // Close the modal
        setShowArchiveModal(false);
        setSelectedCourse(null);
      })
      .catch(error => {
        console.error(`Failed to delete course ${selectedCourse.id}:`, error);
      });
  };

  // Function to open edit form modal with the selected course
  const openEditForm = (course: Course) => {
    console.log("Opening edit form for course:", course);
    // Create a deep copy of the course to avoid reference issues
    const courseCopy = JSON.parse(JSON.stringify(course));
    // Ensure id is set
    if (!courseCopy.id && courseCopy.courseId) {
      courseCopy.id = courseCopy.courseId.toString();
    }
    setEditingCourse(courseCopy);
    setShowEditForm(true);
  };

  // Function to save edited course
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    // Ensure id is set before saving
    if (!editingCourse.id && editingCourse.courseId) {
      editingCourse.id = editingCourse.courseId.toString();
    }
    if (!editingCourse.id && editingCourse.courseGuid) {
      editingCourse.id = editingCourse.courseGuid;
    }
    if (!editingCourse.id) {
      alert('Course ID is missing. Cannot save changes.');
      return;
    }

    console.log("Saving edited course", editingCourse);

    // Generate a class name if empty
    let className = editingCourse.name && editingCourse.name.trim() !== ''
      ? editingCourse.name
      : `Class ${editingCourse.id.slice(0, 4)}`;

    // Create a safe copy with all required properties
    const courseToSave = {
      ...editingCourse,
      id: editingCourse.id,
      name: className,
      section: editingCourse.section || "",
      teacherName: editingCourse.teacherName || "You",
      enrollmentCode: editingCourse.enrollmentCode || `code-${Date.now()}`,
      color: editingCourse.color || "#ff8a65",
      textColor: editingCourse.textColor || "white"
    };

    console.log("About to save course:", courseToSave);

    // Call the updateCourse API
    updateCourse(courseToSave.id, courseToSave)
      .then(() => {
        // Refresh courses list
        queryClient.invalidateQueries({ queryKey: ['courses'] });

        // Close form
        setShowEditForm(false);
        setEditingCourse(null);
      })
      .catch(error => {
        console.error("Error updating course:", error);
      });
  };

  // Function to handle input changes in edit form
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingCourse) return;

    // Ensure we convert empty strings to null so they don't override defaults
    const value = e.target.value.trim() === '' ? null : e.target.value;

    setEditingCourse({
      ...editingCourse,
      [e.target.name]: value
    });
  };

  const { data: courses, isLoading, error: coursesError } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      try {
        // Fetch courses from the API
        const coursesData = await getCourses();
        
        return coursesData;
      } catch (error) {
        console.error('Error fetching courses:', error);
        
        throw error; // For teachers, still throw the error
      }
    },
  });

  // Handle theme update events
  useEffect(() => {
    const handleThemeUpdated = (event: any) => {
      const { courseId, theme } = event.detail;
      console.log('HomePage received theme update event:', { courseId, theme });
      
      // Invalidate course queries to ensure we get fresh data
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    };
    
    // Add theme update event listener
    window.addEventListener('themeUpdated', handleThemeUpdated);
    
    // Cleanup
    return () => {
      window.removeEventListener('themeUpdated', handleThemeUpdated);
    };
  }, [queryClient]);
  
  // Apply theme data from localStorage cache to courses
  const applyThemeCache = (coursesList: Course[]): Course[] => {
    try {
      // Get theme cache from localStorage
      const themeCache = JSON.parse(localStorage.getItem('themeCache') || '{}');
      
      // Apply cached themes to courses if available
      return coursesList.map(course => {
        const courseId = course.courseId?.toString() || course.id || course.courseGuid;
        if (courseId && themeCache[courseId]) {
          console.log(`Applying cached theme to course ${courseId}:`, themeCache[courseId]);
          return {
            ...course,
            color: themeCache[courseId].color,
            coverImage: themeCache[courseId].coverImage
          };
        }
        return course;
      });
    } catch (error) {
      console.error('Error applying theme cache:', error);
      return coursesList;
    }
  };
  
  // Fetch course images for all courses that need them - MOVED AFTER courses is defined
  useEffect(() => {
    if (courses) {
      // Apply theme cache to courses
      const themedCourses = applyThemeCache(courses);
      
      console.log("HomePage processed courses with themes:", 
        JSON.stringify(themedCourses.map(c => ({
          id: c.id,
          name: c.name,
          color: c.color
        })), null, 2));
      
      themedCourses.forEach(course => {
        const cardId = course.courseId?.toString() || course.id || course.courseGuid || generateUniqueKey('card', course);
        if (course.name && !isValidImageUrl(courseImages[cardId])) {
          fetchCourseImage(cardId, course.name);
        }
      });
    }
  }, [courses, courseImages]);

  // Function to handle course enrollment for students
  const handleEnrollCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!enrollmentCode.trim()) {
      setEnrollmentError('Please enter an enrollment code');
      return;
    }
    
    setEnrollmentLoading(true);
    setEnrollmentError('');
    
    try {
      // Call the API to enroll in a course
      await enrollCourseByCode(enrollmentCode.trim());
      
      // Refresh the courses list
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      
      // Close the modal and reset form
      setShowEnrollModal(false);
      setEnrollmentCode('');
      
      // Show success message
      alert('Successfully enrolled in the course!');
    } catch (error) {
      console.error('Error enrolling in course:', error);
      setEnrollmentError(
        error instanceof Error 
          ? error.message 
          : 'Failed to enroll in the course. Please check the code and try again.'
      );
    } finally {
      setEnrollmentLoading(false);
    }
  };

  // Handle clicks outside the dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenMenuCourseId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to handle unenrolling from a course
  const handleUnenrollCourse = async () => {
    if (!unenrollCourseId) {
      console.error('No course ID provided for unenrollment');
      setUnenrollError('Course ID is missing. Please try again.');
      return;
    }
    
    console.log(`Starting unenroll process for course: ${unenrollCourseId} (${unenrollCourseName})`);
    
    setUnenrollLoading(true);
    setUnenrollError('');
    
    try {
      // Call the API to unenroll from a course
      await unenrollCourse(unenrollCourseId);
      
      // Refresh the courses list
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      
      // Close the modal and reset form
      setShowUnenrollModal(false);
      setUnenrollCourseId('');
      setUnenrollCourseName('');
      
      // Show success message
      alert('Successfully unenrolled from the course!');
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      setUnenrollError(
        error instanceof Error 
          ? error.message 
          : 'Failed to unenroll from the course. Please try again later.'
      );
      // Keep the modal open so the user can see the error
    } finally {
      setUnenrollLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading courses...</div>;
  }

  // Show an error message if there's an authentication error or other API issue
  if (coursesError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
          <h2 className="text-xl text-red-600 font-medium mb-4">Error Loading Courses</h2>
          <p className="text-gray-700 mb-4">
            {axios.isAxiosError(coursesError) && coursesError.response?.status === 401 
              ? "Authentication failed. Please log in to access your courses."
              : "There was an error loading your courses. Please try again later."}
          </p>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['courses'] })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Fix the profile avatar display
  const getAvatarColor = (courseId: string, name: string, color?: string) => {
    // First use the explicitly provided color if available
    if (color && color !== 'undefined') {
      console.log(`Using provided color for ${name}: ${color}`);
      return color;
    }

    // Consistent colors for specific courses
    if (courseId === 'fullstack-2') return '#4285f4';
    if (courseId === 'riso-2') return '#5a67f2';

    // For custom courses, generate a color based on name
    const colors = ['#4285f4', '#1e8e3e', '#d93025', '#f4b400', '#673ab7', '#ff6d00', '#795548'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const generatedColor = colors[hash % colors.length];
    console.log(`Generated color for ${name}: ${generatedColor}`);
    return generatedColor;
  };

  const getInitial = (name?: string) => {
    return name && name.trim() ? name.trim().charAt(0).toUpperCase() : '?';
  };

  const renderClassCard = (classData: Course) => {
    // Generate a consistent ID for this course
    const cardId = classData.courseId?.toString() || classData.id || classData.courseGuid || generateUniqueKey('card', classData);
    
    // Check localStorage theme cache directly to ensure we have the latest
    let cardColor = classData.color;
    let cardImage = classData.coverImage;
    
    try {
      const themeCache = JSON.parse(localStorage.getItem('themeCache') || '{}');
      if (cardId && themeCache[cardId]) {
        // If we have a cached theme, use it (overrides API data)
        console.log(`Card using cached theme for ${cardId}:`, themeCache[cardId]);
        cardColor = themeCache[cardId].color || cardColor;
        cardImage = themeCache[cardId].coverImage || cardImage;
      }
    } catch (error) {
      console.error('Error reading theme cache in card render:', error);
    }
    
    // Final fallbacks
    cardColor = cardColor || getAvatarColor(classData.id, classData.name);
    cardImage = cardImage || courseImages[cardId];
    
    // Fallback for invalid image URLs
    if (!isValidImageUrl(cardImage)) {
      const theme = classData.name 
        ? getRandomUnsplashImage(classData.name)
        : { fallback: FALLBACK_IMAGES.default };
      cardImage = theme.fallback;
    }
    return (
      <div key={`card-content-${cardId}`} className="w-full h-full flex flex-col">
        {/* Banner image */}
        <div className="h-32 w-full bg-cover bg-center relative flex-shrink-0" style={{backgroundColor: cardColor}}>
          <img 
            src={cardImage}
            alt={`${classData.name} banner`}
            className="w-full h-full object-cover object-center rounded-t-lg"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              const imageOptions = getRandomUnsplashImage(classData.name);
              img.src = imageOptions.fallback;
              setCourseImages(prev => ({...prev, [cardId]: imageOptions.fallback}));
            }}
          />
          {/* Avatar */}
          <div 
            className="absolute left-6 -bottom-6 w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold border-4 border-white shadow-lg bg-opacity-90"
            style={{backgroundColor: cardColor}}
          >
            {getInitial(classData.name)}
          </div>
        </div>
        {/* Card content */}
        <div className="flex-1 flex flex-col justify-between bg-white rounded-b-lg pt-8 pb-4 px-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{classData.name}</h3>
            <p className="text-sm text-gray-500 mb-2 truncate">{classData.section || 'No section'}</p>
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-2">
              <Users size={18} strokeWidth={1.5} className="text-gray-400" />
              <span className="text-sm text-gray-700">{classData.teacherName || 'Teacher'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Folder size={18} strokeWidth={1.5} className="text-gray-400" />
              <span className="text-sm text-gray-700">{classData.subject || 'No subject'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Edit Form Modal */}
      {showEditForm && editingCourse && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" 
          style={{position: 'fixed', zIndex: 9999, top: 0, left: 0, right: 0, bottom: 0}}
          onClick={() => {
            setShowEditForm(false);
            setEditingCourse(null);
          }}
          key="edit-form-modal"
        >
          <div
            className="bg-white w-full max-w-[500px] rounded-lg shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-[22px] font-normal text-[#3c4043]">Edit class</h2>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setEditingCourse(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Trash2 size={20} className="text-[#5f6368]" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6">
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    name="name"
                    value={editingCourse.name || ''}
                    onChange={handleEditInputChange}
                    placeholder="Class name (required)"
                    className="w-full px-3 py-2 border-b border-gray-300 focus:border-[#1a73e8] focus:outline-none text-[#3c4043]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="section"
                    value={editingCourse.section || ''}
                    onChange={handleEditInputChange}
                    placeholder="Section"
                    className="w-full px-3 py-2 border-b border-gray-300 focus:border-[#1a73e8] focus:outline-none text-[#3c4043]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="teacherName"
                    value={editingCourse.teacherName || ''}
                    onChange={handleEditInputChange}
                    placeholder="Teacher name"
                    className="w-full px-3 py-2 border-b border-gray-300 focus:border-[#1a73e8] focus:outline-none text-[#3c4043]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="subject"
                    value={editingCourse.subject || ''}
                    onChange={handleEditInputChange}
                    placeholder="Subject"
                    className="w-full px-3 py-2 border-b border-gray-300 focus:border-[#1a73e8] focus:outline-none text-[#3c4043]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="room"
                    value={editingCourse.room || ''}
                    onChange={handleEditInputChange}
                    placeholder="Room"
                    className="w-full px-3 py-2 border-b border-gray-300 focus:border-[#1a73e8] focus:outline-none text-[#3c4043]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingCourse(null);
                  }}
                  className="px-6 py-2 text-[#1a73e8] hover:bg-[#f6fafe] rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#1a73e8] text-white rounded-md font-medium hover:bg-[#1557b0]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Enrollment Modal for Students */}
      {showEnrollModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" 
          style={{position: 'fixed', zIndex: 9999, top: 0, left: 0, right: 0, bottom: 0}}
          onClick={() => setShowEnrollModal(false)}
          key="enroll-modal"
        >
          <div
            className="bg-white w-full max-w-[450px] rounded-lg shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-[22px] font-normal text-[#3c4043]">Join a class</h2>
              <div className="text-sm text-blue-600">Student View</div>
            </div>
            <form onSubmit={handleEnrollCourse} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class code
                  </label>
                  <input
                    type="text"
                    value={enrollmentCode}
                    onChange={(e) => setEnrollmentCode(e.target.value)}
                    placeholder="Enter class code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ask your teacher for the class code, then enter it here
                  </p>
                  {enrollmentError && (
                    <p className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded">
                      {enrollmentError}
                    </p>
                  )}
                </div>
                
                <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  <p className="font-medium mb-1">How to join a class?</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Use a class code from your teacher</li>
                    <li>Enter the code in the field above</li>
                    <li>Click "Join" to access your class</li>
                  </ol>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-6 py-2 text-[#1a73e8] hover:bg-[#f6fafe] rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollmentLoading || !enrollmentCode.trim()}
                  className="px-6 py-2 bg-[#1a73e8] text-white rounded-md font-medium hover:bg-[#1557b0] disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {enrollmentLoading ? 'Joining...' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Unenroll Confirmation Modal */}
      {showUnenrollModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" 
          style={{position: 'fixed', zIndex: 9999, top: 0, left: 0, right: 0, bottom: 0}}
          onClick={() => setShowUnenrollModal(false)}
          key="unenroll-modal"
        >
          <div
            className="bg-white w-full max-w-[450px] rounded-lg shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-[22px] font-normal text-[#3c4043]">Unenroll from class</h2>
              <div className="text-sm text-red-600">Student View</div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700">
                  Are you sure you want to unenroll from <span className="font-semibold">{unenrollCourseName}</span>?
                </p>
                <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm">
                  <p className="font-medium">Warning:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>You will lose access to all class materials</li>
                    <li>Your submissions will remain but won't be accessible</li>
                    <li>You'll need a new class code to rejoin</li>
                  </ul>
                </div>
                
                {unenrollError && (
                  <p className="text-sm text-red-600 p-2 bg-red-50 rounded">
                    {unenrollError}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUnenrollModal(false)}
                  className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Unenroll button clicked');
                    handleUnenrollCourse();
                  }}
                  disabled={unenrollLoading}
                  className="px-6 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  type="button"
                >
                  {unenrollLoading ? 'Unenrolling...' : 'Unenroll'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          {/* Only show clear classes button for teachers */}
          {!isStudent && (
            <div className="flex gap-4" key="controls-container">
              <button
                key="clear-classes-button"
                onClick={clearCreatedClasses}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                title="Clear all created classes"
              >
                <Trash2 size={16} />
                <span>Clear created classes</span>
              </button>
            </div>
          )}
          
          {/* Show join class button for students */}
          {isStudent && (
            <div className="flex gap-4" key="student-controls">
              <button
                key="join-class-button"
                onClick={() => setShowEnrollModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                title="Join a class"
              >
                <Plus size={16} />
                <span>Join class</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" key="courses-grid">
          {courses && courses.length > 0 ? (
            courses.map((course) => {
              // Generate a truly unique key for this course
              const courseKey = generateUniqueKey('course', course);
              return (
                <div
                  key={courseKey}
                  className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200/80"
                  style={{ maxWidth: '300px' }}
                >
                  <div className="relative" key={`content-${courseKey}`}>
                    <Link
                      to={`/class/${course.courseId || course.id || course.courseGuid}`}
                      state={{
                        className: course.name,
                        section: course.section,
                        classCode: course.enrollmentCode,
                        color: course.color || '#1a73e8',
                        coverImage: (() => {
                          // Generate a safe card ID that won't be undefined
                          const cardId = course.courseId?.toString() || course.id || course.courseGuid || '';
                          // Check if we have a cached image
                          if (cardId && courseImages[cardId] && isValidImageUrl(courseImages[cardId])) {
                            return courseImages[cardId];
                          }
                          // Use course cover image if valid
                          if (isValidImageUrl(course.coverImage)) {
                            return course.coverImage;
                          }
                          // Fallback to default
                          return FALLBACK_IMAGES.default;
                        })()
                      }}
                      className="block rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                      {renderClassCard(course)}
                    </Link>
                    
                    {/* Course Menu - shown to everyone */}
                    <div className="absolute top-3 right-3 flex space-x-1" key={`buttons-${courseKey}`}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Normalize the course ID
                          const courseId = course.courseId?.toString() || course.id || course.courseGuid;
                          setOpenMenuCourseId(openMenuCourseId === courseId ? null : courseId);
                        }}
                        className="text-white bg-white/20 hover:bg-white/30 opacity-90 hover:opacity-100 z-20 p-1.5 rounded-full transition-all duration-200"
                        title="Course options"
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openMenuCourseId === (course.courseId?.toString() || course.id || course.courseGuid) && (
                        <div 
                          ref={dropdownRef}
                          className="absolute right-0 top-9 w-40 bg-white rounded-md shadow-lg py-1 z-30"
                        >
                          {/* Options for Teachers */}
                          {!isStudent && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpenMenuCourseId(null);
                                  openEditForm(course);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Edit size={16} className="text-gray-500" />
                                Edit class
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpenMenuCourseId(null);
                                  handleArchiveClass(course);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Trash2 size={16} className="text-gray-500" />
                                Archive class
                              </button>
                            </>
                          )}
                          
                          {/* Options for Students */}
                          {isStudent && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpenMenuCourseId(null);
                                
                                // Get the correct course ID
                                const courseId = course.courseId?.toString() || course.id || course.courseGuid;
                                console.log('Setting up unenroll for course:', courseId, course.name);
                                
                                // Set the state for the unenroll modal
                                setUnenrollCourseId(courseId);
                                setUnenrollCourseName(course.name);
                                setShowUnenrollModal(true);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <LogOut size={16} className="text-red-500" />
                              Unenroll
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Edit and Archive buttons - only shown to teachers */}
                    {!isStudent && (
                      <div className="absolute top-3 right-10 flex space-x-1" key={`edit-buttons-${courseKey}`}>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openEditForm(course);
                          }}
                          className="text-white bg-white/20 hover:bg-white/30 opacity-90 hover:opacity-100 z-20 p-1.5 rounded-full transition-all duration-200"
                          title="Edit class"
                        >
                          <Edit size={18} />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleArchiveClass(course);
                          }}
                          className="text-white bg-white/20 hover:bg-white/30 opacity-90 hover:opacity-100 z-20 p-1.5 rounded-full transition-all duration-200"
                          title="Archive class"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8">
              <div className="bg-white rounded-lg shadow-md p-8 max-w-lg mx-auto">
                <h2 className="text-xl text-gray-700 font-medium mb-4">
                  {isStudent ? 'No Enrolled Classes Found' : 'No Classes Found'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {isStudent ? 
                    'You are not enrolled in any classes yet. Use a class code from your teacher to join a class.' : 
                    'You haven\'t created any classes yet.'}
                </p>
                {isStudent ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowEnrollModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-lg rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={20} />
                      <span>Join a class with code</span>
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      Your teacher will provide you with a class code to enter
                    </p>
                    <div className="mt-4 text-xs text-gray-400">
                      Role: Student | Using student authentication
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    <p>Create a class to get started</p>
                    <div className="mt-4 text-xs text-gray-400">
                      Role: Teacher
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Archive Confirmation Modal */}
        <ArchiveConfirmationModal
          isOpen={showArchiveModal}
          onClose={() => {
            setShowArchiveModal(false);
            setArchiveStep(0);
          }}
          onConfirm={confirmArchive}
          className={selectedCourse?.name || ''}
          currentStep={archiveStep}
          setCurrentStep={setArchiveStep}
        />
      </div>
    </>
  );
}
