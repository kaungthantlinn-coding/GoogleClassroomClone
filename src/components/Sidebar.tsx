import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  CheckSquare, 
  Archive, 
  Settings, 
  ChevronRight, 
  GraduationCap, 
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
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

  return (
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
  );
}