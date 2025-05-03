import { useState } from 'react';
import { Menu, Plus, Grid, Calendar, ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import ClassActionDialog from './ClassActionDialog';

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'join' | 'create'>('join');
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showToday, setShowToday] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleAddClick = () => {
    setShowAddDropdown(!showAddDropdown);
    setShowAvatarDropdown(false);
  };

  const handleMenuItemClick = (type: 'join' | 'create') => {
    setDialogType(type);
    setShowDialog(true);
    setShowAddDropdown(false);
  };

  const toggleSidebar = () => {
    const event = new CustomEvent('toggle-sidebar');
    window.dispatchEvent(event);
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTodayClick = () => {
    const today = new Date();
    navigate('/calendar', { state: { date: today.toISOString() } });
  };

  const isCalendarPage = location.pathname === '/calendar';
  const isClassPage = location.pathname.includes('/class/');
  const isSubmissionsPage = location.pathname.includes('/submissions/');
  const isArchivedPage = location.pathname === '/archived';

  const getPageTitle = () => {
    if (isCalendarPage) return 'Calendar';
    if (isArchivedPage) return 'Archived classes';
    if (isClassPage || isSubmissionsPage) {
      // Extract class ID from URL path
      const pathParts = location.pathname.split('/');
      const classId = pathParts[2]; // class ID is the third segment in /class/:id or /submissions/:id

      // Try to get class data from localStorage
      try {
        const classData = localStorage.getItem(`classData-${classId}`);
        if (classData) {
          const parsedData = JSON.parse(classData);
          // Check for both name and className fields to ensure we get the correct class name
          return parsedData.name || parsedData.className || 'Class';
        }
      } catch (error) {
        console.error('Error getting class name:', error);
      }

      // Fallback to state or default
      const state = location.state as { className?: string };
      return state?.className || 'Class';
    }
    return '';
  };

  const getClassSection = () => {
    if (isClassPage || isSubmissionsPage) {
      // Extract class ID from URL path
      const pathParts = location.pathname.split('/');
      const classId = pathParts[2]; // class ID is the third segment in /class/:id or /submissions/:id

      // Try to get class data from localStorage
      try {
        const classData = localStorage.getItem(`classData-${classId}`);
        if (classData) {
          const parsedData = JSON.parse(classData);
          // Make sure we check both section fields for consistency
          return parsedData.section || '';
        }
      } catch (error) {
        console.error('Error getting class section:', error);
      }

      // Fallback to state or default
      const state = location.state as { section?: string };
      return state?.section || '';
    }
    return '';
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-40 bg-white shadow transition-all duration-300">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Menu size={24} strokeWidth={1.5} className="text-[#5f6368]" />
          </button>

          {/* Conditional rendering for breadcrumb */}
          {(isCalendarPage || isClassPage || isArchivedPage || (getPageTitle() !== '') || location.pathname.includes('/submissions/')) ? (
            <div className="flex items-center text-[22px]">
              <Link to="/" className="flex items-center gap-2 text-[#3c4043] hover:text-[#1a73e8]">
                <img
                  src="https://www.gstatic.com/classroom/logo_square_48.svg"
                  alt="Google Classroom"
                  className="w-8 h-8"
                />
                <span className="tracking-tight">Classroom</span>
              </Link>
              <ChevronRight size={20} className="mx-1 text-[#5f6368]" />
              {isClassPage || location.pathname.includes('/submissions/') ? (
                <div className="flex flex-col">
                  <span className="text-[#3c4043] tracking-tight leading-tight">{getPageTitle()}</span>
                  {getClassSection() && (
                    <span className="text-sm text-[#5f6368] leading-tight">{getClassSection()}</span>
                  )}
                </div>
              ) : (
                <span className="text-[#5f6368] tracking-tight">{getPageTitle()}</span>
              )}
            </div>
          ) : (
            <Link to="/" className="flex items-center gap-2">
              <img
                src="https://www.gstatic.com/classroom/logo_square_48.svg"
                alt="Google Classroom"
                className="w-8 h-8"
              />
              <span className="text-[22px] text-[#3c4043] tracking-tight">Classroom</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            {isCalendarPage ? (
              <div
                className="relative"
                onMouseEnter={() => setShowToday(true)}
                onMouseLeave={() => setShowToday(false)}
              >
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Calendar size={24} strokeWidth={1.5} className="text-[#5f6368]" />
                </button>
                {showToday && (
                  <button
                    onClick={handleTodayClick}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-[#202124] py-1 px-3 rounded text-sm text-white whitespace-nowrap z-50"
                  >
                    Today
                  </button>
                )}
              </div>
            ) : !isArchivedPage ? (
              <>
                <button
                  onClick={handleAddClick}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  aria-label="Add or join class"
                >
                  <Plus size={24} strokeWidth={1.5} className="text-[#5f6368]" />
                </button>
                {showAddDropdown && (
                  <div className="absolute right-0 mt-1 py-2 w-[140px] bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <button
                      onClick={() => handleMenuItemClick('join')}
                      className="w-full px-4 py-1.5 text-left text-[14px] text-[#3c4043] hover:bg-[#f8f9fa]"
                    >
                      Join class
                    </button>
                    <button
                      onClick={() => handleMenuItemClick('create')}
                      className="w-full px-4 py-1.5 text-left text-[14px] text-[#3c4043] hover:bg-[#f8f9fa]"
                    >
                      Create class
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full" aria-label="Google apps">
            <Grid size={24} strokeWidth={1.5} className="text-[#5f6368]" />
          </button>
          <div className="relative">
            <button
              onClick={() => {
                setShowAvatarDropdown(!showAvatarDropdown);
                setShowAddDropdown(false);
              }}
              className="focus:outline-none ring-offset-2 ring-[#1a73e8] focus:ring-2 rounded-full"
              aria-label="User profile"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full cursor-pointer border-2 border-transparent hover:border-[#1a73e8] transition-all duration-200"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full bg-[#1a73e8] flex items-center justify-center text-white cursor-pointer hover:bg-[#1557b0] transition-colors duration-200"
                >
                  {user?.name?.[0] || 'U'}
                </div>
              )}
            </button>

            {showAvatarDropdown && (
              <div
                className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-200 transform transition-all duration-200 origin-top-right animate-fadeIn"
                onMouseLeave={() => setShowAvatarDropdown(false)}
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-full mr-4 border-2 border-[#1a73e8] shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#1a73e8] flex items-center justify-center text-white mr-4 shadow-md">
                        {user?.name?.[0] || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="text-base font-medium text-gray-900">{user?.name}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <Link
                  to="/settings"
                  className="flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem('user');
                    useAuthStore.getState().setUser(null);
                    navigate('/login');
                  }}
                  className="flex items-center w-full text-left px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDialog && (
        <ClassActionDialog
          isOpen={showDialog}
          type={dialogType}
          onClose={() => setShowDialog(false)}
        />
      )}

      {/* Redirect to login if not authenticated */}
      {!user && location.pathname !== '/login' && location.pathname !== '/signup' && (
        <>{setTimeout(() => navigate('/login'), 0)}</>
      )}
    </nav>
  );
}