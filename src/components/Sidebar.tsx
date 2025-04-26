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
  Plus
} from 'lucide-react';

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
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
  // State to track screen size
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const [teachingClasses, setTeachingClasses] = useState<Class[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClass, setNewClass] = useState<Partial<Class>>({
    name: '',
    section: '',
    color: '#4285f4'
  });
  const navigate = useNavigate();

  // Define loadClasses function at component level so it can be referenced throughout the component
  const loadClasses = () => {
    console.log("Loading classes for sidebar...");
    
    // Get all classes from localStorage first
    const allClasses: Record<string, any> = {};
    
    // First check for any manually created classes in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('classData-')) {
        try {
          const rawData = localStorage.getItem(key) || '';
          
          const classData = JSON.parse(rawData);
          const classId = key.replace('classData-', '');
          
          if (classData && classData.name && classData.name.trim() !== '' && classData.name !== 'Unnamed Class') {
            console.log(`Found class: ${classData.name} (${classId})`);
            allClasses[classId] = {
              id: classId,
              name: classData.name,
              section: classData.section || '',
              color: classData.color || '#4285f4'
            };
          }
        } catch (e) {
          console.error('Error loading class from localStorage', e);
        }
      }
    }
    
    // Add default classes only if they don't exist in localStorage
    const defaultClasses = [
      {
        id: 'ui-ux-1',
        name: 'UI/UX',
        section: 'Batch 1',
        color: '#3c4043'
      },
      {
        id: 'fullstack-2',
        name: 'FullStack',
        section: 'Batch 2',
        color: '#f8836b'
      },
      {
        id: 'riso-2',
        name: 'RISO',
        section: 'Batch-2',
        color: '#ff8a65'
      }
    ];
    
    // Add default classes to our collection if not already present
    defaultClasses.forEach(cls => {
      if (!allClasses[cls.id]) {
        allClasses[cls.id] = cls;
      }
    });
    
    // Convert the object to an array of classes
    const finalClasses = Object.values(allClasses);
    
    console.log("Final classes for sidebar:", finalClasses);
    
    // Update the teaching classes state
    setTeachingClasses(finalClasses);
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
        setTeachingClasses(prevClasses => {
          const exists = prevClasses.some(cls => cls.id === event.detail.class.id);
          if (exists) return prevClasses;
          return [...prevClasses, event.detail.class];
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
    
    // Check screen size on mount
    checkScreenSize();
    
    // Add event listeners
    window.addEventListener('storage', handleStorageEvent as EventListener);
    window.addEventListener('class-created', handleClassCreatedEvent as EventListener);
    window.addEventListener('class-removed', handleClassRemovedEvent as EventListener);
    window.addEventListener('resize', checkScreenSize);
    
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
    // First try to get from localStorage class data
    const savedData = localStorage.getItem(`classData-${classId}`);
    if (savedData) {
      try {
        const classData = JSON.parse(savedData);
        if (classData.coverImage) {
          // If the saved image is from Unsplash, make it responsive
          if (classData.coverImage.includes('unsplash.com')) {
            return getResponsiveImageUrl(classData.coverImage);
          }
          return classData.coverImage;
        }
      } catch (e) {
        console.error('Error parsing class data', e);
      }
    }
    
    // Then try from banner images
    const savedBannerImages = localStorage.getItem('bannerImages');
    if (savedBannerImages) {
      try {
        const bannerImages = JSON.parse(savedBannerImages);
        if (bannerImages[classId]) {
          // If the saved image is from Unsplash, make it responsive
          if (bannerImages[classId].includes('unsplash.com')) {
            return getResponsiveImageUrl(bannerImages[classId]);
          }
          return bannerImages[classId];
        }
      } catch (e) {
        console.error('Error parsing banner images', e);
      }
    }
    
    // Default to a class-specific image if all else fails
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

    const id = `class-${Date.now()}`;
    const coverImage = getCoverImageForClass(id, newClass.name);
    
    const classToSave = {
      id,
      name: newClass.name,
      section: newClass.section || '',
      teacherName: 'You',
      enrollmentCode: `code-${Date.now().toString().slice(-6)}`,
      color: newClass.color || '#4285f4',
      textColor: 'white',
      coverImage: coverImage
    };

    try {
      // Save to localStorage with reliable key format
      localStorage.setItem(`classData-${id}`, JSON.stringify(classToSave));
      
      // Create a new class object for state update
      const newClassObj = {
        id: classToSave.id,
        name: classToSave.name,
        section: classToSave.section,
        color: classToSave.color
      };
      
      // Update state immediately with functional update
      setTeachingClasses(prevClasses => {
        const updatedClasses = [...prevClasses, newClassObj];
        return updatedClasses;
      });

      // Dispatch storage event to trigger updates across tabs
      window.dispatchEvent(new Event('storage'));

      // Dispatch custom event for class creation
      const classCreatedEvent = new CustomEvent('class-created', {
        detail: {
          action: 'addClass',
          class: newClassObj
        }
      });
      window.dispatchEvent(classCreatedEvent);

      // Close modal and reset form
      setShowCreateModal(false);
      setNewClass({ name: '', section: '', color: '#4285f4' });
      
      // Navigate to the new class page
      navigate(`/class/${id}`);
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  // Toggle sidebar visibility on mobile
  const toggleMobileSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
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
      {/* Mobile menu toggle button */}
      {isMobile && (
        <div className="fixed left-4 top-16 z-40">
          <button 
            onClick={toggleMobileSidebar}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} className="text-[#3c4043]" />
          </button>
        </div>
      )}
      
      {/* Mobile create class button */}
      {isMobile && (
        <div className="fixed right-4 bottom-4 z-40">
          <button 
            onClick={openCreateClassModal}
            className="p-3 bg-[#1a73e8] rounded-full shadow-lg text-white hover:bg-[#1557b0] transition-colors"
            aria-label="Create class"
          >
            <Plus size={24} />
          </button>
        </div>
      )}

      <aside
        ref={sidebarRef}
        className={`fixed left-0 top-0 h-full bg-white shadow-lg z-30 flex flex-col transition-all duration-300 ${
          isCollapsed && !isMobile ? 'w-[72px]' : 'w-[260px]'
        } ${isMobile ? (isSidebarVisible ? 'translate-x-0' : '-translate-x-full') : ''}`}
        style={{ overflowY: 'auto' }}
      >
        <nav className="py-3 px-2 relative">
          {/* Non-mobile create class button */}
          {!isMobile && !isCollapsed && (
            <button
              onClick={openCreateClassModal}
              className="w-full flex items-center justify-center gap-2 my-2 py-2 px-4 bg-[#1a73e8] text-white rounded-md hover:bg-[#1557b0] transition-colors"
            >
              <Plus size={18} />
              <span className="text-sm font-medium">Create class</span>
            </button>
          )}
          {!isMobile && isCollapsed && (
            <button
              onClick={openCreateClassModal}
              className="w-full flex items-center justify-center my-2 py-2 rounded-md hover:bg-[#f8f9fa] transition-colors"
              title="Create class"
            >
              <Plus size={24} className="text-[#3c4043]" />
            </button>
          )}
          {navItems.map((item) => (
            <div key={item.to} className="relative">
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
            <button
              onClick={() => !isCollapsed && setIsTeachingOpen(!isTeachingOpen)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center w-full mx-auto' : 'gap-4 px-6'} py-3 rounded-r-full hover:bg-[#f8f9fa] text-[#3c4043]`}
            >
              <GraduationCap size={24} strokeWidth={1.5} />
              {!isCollapsed && (
                <>
                  <span className="text-sm flex-1 text-left">Teaching</span>
                  {isTeachingOpen ? (
                    <ChevronUp size={20} strokeWidth={1.5} />
                  ) : (
                    <ChevronDown size={20} strokeWidth={1.5} />
                  )}
                </>
              )}
            </button>
            {(isCollapsed || isTeachingOpen) && (
              <div>
                {teachingItems.map((item) => (
                  <NavLink
                    key={item.to}
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
                {!isCollapsed && teachingClasses.map((classItem) => (
                  <div key={classItem.id} className="group relative flex items-center">
                    <Link
                      to={`/class/${classItem.id}`}
                      state={{
                        className: classItem.name,
                        section: classItem.section,
                        color: classItem.color,
                        coverImage: getCoverImageForClass(classItem.id, classItem.name)
                      }}
                      className="flex-1 flex items-center gap-2 pl-14 pr-6 py-2 hover:bg-[#f8f9fa] text-[#3c4043] rounded-r-full"
                    >
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: classItem.color || '#4285f4' }}
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
                        // Remove the class from localStorage
                        localStorage.removeItem(`classData-${classItem.id}`);
                        
                        // We intentionally don't remove banner images to prevent side effects
                        // This ensures that if you recreate a class with the same ID, the banner image is preserved
                        
                        // Dispatch custom event for class removal
                        const classRemovedEvent = new CustomEvent('class-removed', {
                          detail: {
                            action: 'removeClass',
                            classId: classItem.id
                          }
                        });
                        window.dispatchEvent(classRemovedEvent);
                        
                        // Also update local state
                        setTeachingClasses(prevClasses => prevClasses.filter(cls => cls.id !== classItem.id));
                      }}
                      className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full transition-opacity"
                    >
                      <X size={16} className="text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-2">
            <button
              onClick={() => !isCollapsed && setIsEnrolledOpen(!isEnrolledOpen)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center w-full mx-auto' : 'gap-4 px-6'} py-3 rounded-r-full hover:bg-[#f8f9fa] text-[#3c4043]`}
            >
              <BookOpen size={24} strokeWidth={1.5} />
              {!isCollapsed && (
                <>
                  <span className="text-sm flex-1 text-left">Enrolled</span>
                  {isEnrolledOpen ? (
                    <ChevronUp size={20} strokeWidth={1.5} />
                  ) : (
                    <ChevronDown size={20} strokeWidth={1.5} />
                  )}
                </>
              )}
            </button>
            {(isCollapsed || isEnrolledOpen) && (
              <div>
                {enrolledItems.map((item) => (
                  <NavLink
                    key={item.to}
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
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t">
            {bottomNavItems.map((item) => (
              <NavLink
                key={item.to}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
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
                    {['#4285f4', '#0f9d58', '#f4b400', '#db4437', '#673ab7', '#ff6d00', '#795548'].map(color => (
                      <button
                        key={color}
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