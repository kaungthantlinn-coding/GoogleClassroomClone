import { useState } from 'react';
import { Menu, Plus, Grid, Calendar } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import ClassActionDialog from './ClassActionDialog';

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'join' | 'create'>('join');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showToday, setShowToday] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleAddClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleMenuItemClick = (type: 'join' | 'create') => {
    setDialogType(type);
    setShowDialog(true);
    setShowDropdown(false);
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

  return (
    <nav className="bg-white border-b">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Menu size={24} strokeWidth={1.5} className="text-[#5f6368]" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <img
              src="https://www.gstatic.com/classroom/logo_square_48.svg"
              alt="Google Classroom"
              className="w-8 h-8"
            />
            <span className="text-[22px] text-[#3c4043] tracking-tight">Classroom</span>
          </Link>
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
            ) : (
              <>
                <button
                  onClick={handleAddClick}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  aria-label="Add or join class"
                >
                  <Plus size={24} strokeWidth={1.5} className="text-[#5f6368]" />
                </button>
                {showDropdown && (
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
            )}
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full" aria-label="Google apps">
            <Grid size={24} strokeWidth={1.5} className="text-[#5f6368]" />
          </button>
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full cursor-pointer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#1a73e8] flex items-center justify-center text-white cursor-pointer">
              {user?.name?.[0] || 'U'}
            </div>
          )}
        </div>
      </div>

      <ClassActionDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        type={dialogType}
      />
    </nav>
  );
}