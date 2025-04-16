import { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
}

interface Class {
  id: string;
  name: string;
  section: string;
  teacherName?: string;
  color?: string;
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
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
    
    // Add event listeners
    window.addEventListener('storage', handleStorageEvent as EventListener);
    window.addEventListener('class-created', handleClassCreatedEvent as EventListener);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageEvent as EventListener);
      window.removeEventListener('class-created', handleClassCreatedEvent as EventListener);
    };
  }, []);

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

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name) return;

    const id = `class-${Date.now()}`;
    const classToSave = {
      id,
      name: newClass.name,
      section: newClass.section || '',
      teacherName: 'You',
      enrollmentCode: `code-${Date.now().toString().slice(-6)}`,
      color: newClass.color || '#4285f4',
      textColor: 'white'
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

  return (
    <>
      <aside className={`${isCollapsed ? 'w-[72px]' : 'w-[280px]'} bg-white min-h-[calc(100vh-64px)] border-r overflow-y-auto`}>
        <nav className="py-3 px-2">
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
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-3' : 'gap-4 px-6'} py-3 rounded-r-full hover:bg-[#f8f9fa] text-[#3c4043]`}
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
                      `flex items-center ${isCollapsed ? 'justify-center px-3' : 'gap-4 pl-14 pr-6'} py-3 rounded-r-full ${
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
                        localStorage.removeItem(`classData-${classItem.id}`);
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
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-3' : 'gap-4 px-6'} py-3 rounded-r-full hover:bg-[#f8f9fa] text-[#3c4043]`}
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
                      `flex items-center ${isCollapsed ? 'justify-center px-3' : 'gap-4 pl-14 pr-6'} py-3 rounded-r-full ${
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
                  `flex items-center ${isCollapsed ? 'justify-center px-3' : 'gap-4 px-6'} py-3 rounded-r-full ${
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
            className="bg-white w-full max-w-[500px] rounded-lg shadow-xl overflow-hidden"
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
            <form onSubmit={handleCreateClass} className="p-6">
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
                  <div className="flex gap-2">
                    {['#4285f4', '#0f9d58', '#f4b400', '#db4437', '#673ab7', '#ff6d00', '#795548'].map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded-full ${newClass.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewClass({...newClass, color})}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 text-[#1a73e8] hover:bg-[#f6fafe] rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newClass.name}
                  className={`px-6 py-2 ${!newClass.name ? 'bg-gray-300 text-gray-500' : 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'} rounded-md font-medium`}
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