import { useQuery } from '@tanstack/react-query';
import { Course } from '../types/course';
import { Link } from 'react-router-dom';
import { Users, Folder } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      // Mock data matching the image
      return [
        {
          id: 'ui-ux-1',
          name: 'UI/UX',
          section: 'Batch 1',
          teacherName: 'John Doe',
          coverImage: '',
          enrollmentCode: 'abc123',
          color: '#3c4043', // dark gray background
          textColor: 'white'
        },
        {
          id: 'fullstack-2',
          name: 'FullStack',
          section: 'Batch 2',
          teacherName: 'Jane Smith',
          coverImage: '',
          enrollmentCode: 'def456',
          color: '#f8836b', // coral/orange background
          textColor: 'white'
        },
        {
          id: 'riso-2',
          name: 'RISO',
          section: 'Batch-2',
          teacherName: 'San Mie Htay',
          coverImage: '',
          enrollmentCode: 'ghi789',
          color: '#ff8a65', // light orange background
          textColor: 'white'
        }
      ];
    },
  });

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // If click is not on a menu toggle button (which has a specific class), close the menu
      const target = event.target as HTMLElement;
      const isMenuButton = target.closest('.menu-toggle-button');
      if (!isMenuButton && openMenuId !== null) {
        setOpenMenuId(null);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses?.map((course) => (
          <div
            key={course.id}
            className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200/80"
            style={{ maxWidth: '300px' }}
          >
            <div className="relative">
              <Link 
                to={`/class/${course.id}`} 
                state={{ 
                  className: course.name, 
                  section: course.section 
                }}
                className="block"
              >
                <div
                  className="h-[100px] p-4 relative"
                  style={{
                    backgroundColor: course.color || '#1a73e8',
                  }}
                >                  
                  {/* Class info */}
                  <div className="relative z-10">
                    <h3 className={`text-xl font-medium leading-tight ${course.textColor === 'white' ? 'text-white' : 'text-[#3c4043]'}`}>
                      {course.name}
                    </h3>
                    <p className={`text-sm leading-tight mt-1 ${course.textColor === 'white' ? 'text-white/90' : 'text-[#5f6368]'}`}>
                      {course.section}
                    </p>
                    <p className={`text-sm leading-tight mt-0.5 ${course.textColor === 'white' ? 'text-white/90' : 'text-[#5f6368]'}`}>
                      {course.teacherName}
                    </p>
                  </div>
                </div>
              </Link>
              
              {/* Three dots menu */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === course.id ? null : course.id);
                }}
                className="absolute top-3 right-3 text-white opacity-80 hover:opacity-100 z-20 p-1.5 hover:bg-white/10 rounded-full transition-all duration-200 menu-toggle-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
                </svg>
              </button>
              
              {/* Dropdown menu */}
              {openMenuId === course.id && (
                <div 
                  className="absolute top-12 right-3 bg-white rounded-md shadow-lg py-1.5 z-50 w-[140px]"
                  style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.2)" }}
                >
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Handle edit action
                      setOpenMenuId(null);
                    }}
                    className="w-full px-4 py-2 text-left text-[14px] text-[#3c4043] hover:bg-[#f1f3f4]"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Handle archive action
                      setOpenMenuId(null);
                    }}
                    className="w-full px-4 py-2 text-left text-[14px] text-[#3c4043] hover:bg-[#f1f3f4]"
                  >
                    Archive
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Handle copy invite link action
                      setOpenMenuId(null);
                    }}
                    className="w-full px-4 py-2 text-left text-[14px] text-[#3c4043] hover:bg-[#f1f3f4]"
                  >
                    Copy invite link
                  </button>
                </div>
              )}
              
              {/* Profile avatar */}
              <div 
                className="absolute right-6 bottom-0 translate-y-1/2 w-[46px] h-[46px] rounded-full flex items-center justify-center text-white text-lg font-medium border-2 border-white"
                style={{
                  backgroundColor: course.id === 'fullstack-2' ? '#4285f4' : course.id === 'riso-2' ? '#5a67f2' : '#7b86e2',
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
    </div>
  );
}
