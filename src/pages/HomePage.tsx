import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Course } from '../types/course';
import { Link, useLocation } from 'react-router-dom';
import { Users, Folder, Trash2, Edit } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useState, useEffect } from 'react';
import ArchiveConfirmationModal from '../components/ArchiveConfirmationModal';

const getRandomUnsplashImage = (className: string) => {
  const timestamp = Date.now();
  let query = 'education,classroom';
  
  // Add specific themes based on class name
  if (className.toLowerCase().includes('ui') || className.toLowerCase().includes('ux')) {
    query = 'ui,design';
  } else if (className.toLowerCase().includes('fullstack')) {
    query = 'coding,programming';
  } else if (className.toLowerCase().includes('riso')) {
    query = 'technology,computer';
  }
  
  return `https://source.unsplash.com/random/800x600?${query}&t=${timestamp}`;
};

// Helper function to preload images and ensure they're cached
const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
  });
};

export default function HomePage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveStep, setArchiveStep] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [bannerImages, setBannerImages] = useState<{[key: string]: string}>({});
  
  // Use useEffect to ensure banner images persist after page refresh
  useEffect(() => {
    // Try to load saved banner images from localStorage
    const savedBannerImages = localStorage.getItem('bannerImages');
    if (savedBannerImages) {
      try {
        const parsedImages = JSON.parse(savedBannerImages);
        setBannerImages(parsedImages);
        
        // Preload all images to ensure they're cached
        Object.values(parsedImages).forEach(imgSrc => {
          preloadImage(imgSrc).catch(() => console.log('Failed to preload image'));
        });
      } catch (e) {
        console.error('Error parsing banner images', e);
      }
    }
  }, []);
  
  // Save banner images to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(bannerImages).length > 0) {
      localStorage.setItem('bannerImages', JSON.stringify(bannerImages));
    }
  }, [bannerImages]);

  // Function to clear all created classes
  const clearCreatedClasses = () => {
    // Get all localStorage keys
    const keysToRemove = [];
    const classIdsToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('classData-')) {
        keysToRemove.push(key);
        classIdsToRemove.push(key.replace('classData-', ''));
      }
    }
    
    // Remove all class data keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // DON'T remove banner images - just refresh the current state
    // This prevents the banner images from disappearing when recreating the classes
    
    // Force sidebar refresh by creating a special event to clear all classes
    const clearClassesEvent = new CustomEvent('class-removed', {
      detail: {
        action: 'clearAll'
      }
    });
    window.dispatchEvent(clearClassesEvent);
    
    // Refresh the courses list
    queryClient.invalidateQueries({ queryKey: ['courses'] });
  };

  // Function to archive a class
  const handleArchiveClass = (course: Course) => {
    setSelectedCourse(course);
    setShowArchiveModal(true);
    setArchiveStep(0);
  };

  const confirmArchive = () => {
    if (selectedCourse) {
      // Store the archived class in localStorage
      const archivedClasses = JSON.parse(localStorage.getItem('archivedClasses') || '[]');
      
      // Include the banner image in the archived data
      let courseWithImage = {...selectedCourse};
      
      // Check if there's a banner image for this course and include it
      const bannerImageForClass = bannerImages[selectedCourse.id];
      if (bannerImageForClass) {
        courseWithImage.coverImage = bannerImageForClass;
      }
      
      archivedClasses.push(courseWithImage);
      localStorage.setItem('archivedClasses', JSON.stringify(archivedClasses));

      // Remove the class from the active classes
      const classKey = `classData-${selectedCourse.id}`;
      localStorage.removeItem(classKey);
      
      // BUT DON'T remove the banner image - this ensures it's preserved for other cards
      
      // Dispatch a custom event to update the sidebar
      const classRemovedEvent = new CustomEvent('class-removed', {
        detail: {
          action: 'removeClass',
          classId: selectedCourse.id
        }
      });
      window.dispatchEvent(classRemovedEvent);

      // Refresh the courses list
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  };

  // Function to handle edit click
  const handleEditClick = (course: Course) => {
    console.log("Edit button clicked", course);
    // Create a deep copy of the course to avoid reference issues
    const courseCopy = JSON.parse(JSON.stringify(course));
    setEditingCourse(courseCopy);
    setShowEditForm(true);
  };

  // Function to save edited course
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

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

    console.log("About to save to localStorage:", courseToSave);

    // Save to localStorage
    localStorage.setItem(`classData-${courseToSave.id}`, JSON.stringify(courseToSave));
    
    // Trigger a storage event for the sidebar to detect
    window.dispatchEvent(new Event('storage'));
    
    // Refresh courses list
    queryClient.invalidateQueries({ queryKey: ['courses'] });
    
    // Close form
    setShowEditForm(false);
    setEditingCourse(null);
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

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      // Get default courses
      const defaultCourses = [
        {
          id: 'ui-ux-1',
          name: 'UI/UX',
          section: 'Batch 1',
          teacherName: 'John Doe',
          coverImage: 'https://source.unsplash.com/random/1600x900/?ui,design',
          enrollmentCode: 'abc123',
          color: '#3c4043',
          textColor: 'white'
        },
        {
          id: 'fullstack-2',
          name: 'FullStack',
          section: 'Batch 2',
          teacherName: 'Jane Smith',
          coverImage: 'https://source.unsplash.com/random/1600x900/?coding,programming',
          enrollmentCode: 'def456',
          color: '#f8836b',
          textColor: 'white'
        },
        {
          id: 'riso-2',
          name: 'RISO',
          section: 'Batch-2',
          teacherName: 'San Mie Htay',
          coverImage: 'https://source.unsplash.com/random/1600x900/?technology,computer',
          enrollmentCode: 'ghi789',
          color: '#ff8a65',
          textColor: 'white'
        }
      ];
      
      // Track default course IDs to avoid duplicates
      const defaultCourseIds = defaultCourses.map(course => course.id);
      
      // Look for classes in localStorage
      const localClasses: Course[] = [];
      const editedDefaultCourseIds: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('classData-')) {
          try {
            const rawData = localStorage.getItem(key) || '';
            console.log(`Loading from localStorage [${key}]:`, rawData);
            
            const classData = JSON.parse(rawData);
            if (classData) {
              const courseId = classData.id;
              
              // Ensure all required fields are present with meaningful values
              const validatedCourse = {
                id: courseId,
                name: classData.name && classData.name !== '' ? classData.name : 'Class ' + courseId.slice(0, 4),
                section: classData.section || '',
                teacherName: classData.teacherName || 'You',
                coverImage: classData.coverImage || '',
                enrollmentCode: classData.enrollmentCode || `code-${Date.now()}`,
                color: classData.color || '#ff8a65',
                textColor: classData.textColor || 'white',
                subject: classData.subject || '',
                room: classData.room || ''
              };
              
              // Check if this is an edited default course
              if (defaultCourseIds.includes(courseId)) {
                editedDefaultCourseIds.push(courseId);
              }
              
              localClasses.push(validatedCourse);
              
              // Always update localStorage with validated course data
              localStorage.setItem(key, JSON.stringify(validatedCourse));
            }
          } catch (e) {
            console.error('Error parsing class data from localStorage', e);
          }
        }
      }
      
      // Filter out default courses that have edited versions in localStorage
      const filteredDefaultCourses = defaultCourses.filter(
        course => !editedDefaultCourseIds.includes(course.id)
      );
      
      // Return filtered default courses + localStorage courses
      return [...filteredDefaultCourses, ...localClasses];
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Fix the profile avatar display
  const getAvatarColor = (courseId: string, name: string) => {
    // Consistent colors for specific courses
    if (courseId === 'fullstack-2') return '#4285f4';
    if (courseId === 'riso-2') return '#5a67f2';
    
    // For custom courses, generate a color based on name
    const colors = ['#4285f4', '#0f9d58', '#f4b400', '#db4437', '#673ab7', '#ff6d00', '#795548'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getInitial = (name?: string) => {
    return name && name.trim() ? name.trim().charAt(0).toUpperCase() : '?';
  };

  const renderClassCard = (classData: Course) => {
    // Get the saved theme data from localStorage
    const savedData = localStorage.getItem(`classData-${classData.id}`);
    const themeData = savedData ? JSON.parse(savedData) : null;
    
    // Use the saved theme data if available, otherwise fallback to default values
    const cardColor = themeData?.color || classData.color || '#1a73e8';
    
    // Get banner image from state or generate a new one if not exists
    let cardImage = bannerImages[classData.id];
    if (!cardImage) {
      cardImage = themeData?.coverImage || classData.coverImage || getRandomUnsplashImage(classData.name);
      // Cache the image immediately
      preloadImage(cardImage)
        .then(imgSrc => {
          setBannerImages(prev => ({...prev, [classData.id]: imgSrc}));
        })
        .catch(() => {
          // If loading fails, try another image
          const fallbackImage = getRandomUnsplashImage(classData.name);
          setBannerImages(prev => ({...prev, [classData.id]: fallbackImage}));
        });
    }
    
    return (
      <Link
        to={`/class/${classData.id}`}
        state={{
          className: classData.name,
          section: classData.section,
          classCode: classData.enrollmentCode,
          color: cardColor,
          coverImage: cardImage
        }}
        key={classData.id}
        className="block rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
      >
        <div
          className="h-32 bg-cover bg-center relative"
          style={{
            backgroundColor: cardColor
          }}
        >
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/90 z-10"></div>
            <img 
              src={cardImage}
              alt={`${classData.name} banner`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                const newImage = getRandomUnsplashImage(classData.name);
                img.src = newImage;
                // Update banner images state when fallback is used
                setBannerImages(prev => ({...prev, [classData.id]: newImage}));
              }}
            />
          </div>
          <div className="relative z-10 p-6 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{classData.name}</h3>
              <p className="text-white text-opacity-90">{classData.section}</p>
            </div>
            {classData.teacherName && (
              <p className="text-white text-opacity-80">{classData.teacherName}</p>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <>

      
      {/* Edit Form Modal - Moved to root level */}
      {showEditForm && editingCourse && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" 
          style={{position: 'fixed', zIndex: 9999, top: 0, left: 0, right: 0, bottom: 0}}
          onClick={() => {
            setShowEditForm(false);
            setEditingCourse(null);
          }}
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
      
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          {/* <h1 className="text-2xl font-medium text-[#3c4043]">Your classes</h1> */}
          <div className="flex gap-4">
            <button
              onClick={clearCreatedClasses}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
              title="Clear all created classes"
            >
              <Trash2 size={16} />
              <span>Clear created classes</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses?.map((course) => (
            <div
              key={course.id}
              className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200/80"
              style={{ maxWidth: '300px' }}
            >
              <div className="relative">
                {renderClassCard(course)}
                
                {/* Quick Edit and Archive buttons */}
                <div className="absolute top-3 right-3 flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Quick edit button clicked", course);
                      setEditingCourse({...course});
                      setShowEditForm(true);
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
                
                {/* Profile avatar */}
                <div 
                  className="absolute right-6 bottom-0 translate-y-1/2 w-[46px] h-[46px] rounded-full flex items-center justify-center text-white text-lg font-medium border-2 border-white"
                  style={{
                    backgroundColor: getAvatarColor(course.id, course.name || ''),
                    boxShadow: '0 1px 5px rgba(0,0,0,0.1)'
                  }}
                >
                  <span>{course.id === 'riso-2' ? 'S' : getInitial(course.name)}</span>
                </div>
              </div>
              
              {/* Bottom part of card with icons */}
              <div className="bg-white p-3 flex justify-end items-center gap-4 h-[60px]">
                <Link 
                  to={`/class/${course.id}/people`}
                  className="text-[#5f6368] hover:text-[#3c4043] p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <Users size={20} strokeWidth={1.5} />
                </Link>
                <Link 
                  to={`/class/${course.id}/materials`}
                  className="text-[#5f6368] hover:text-[#3c4043] p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <Folder size={20} strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          ))}
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
