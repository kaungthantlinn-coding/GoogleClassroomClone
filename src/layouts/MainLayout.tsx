import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { NotificationProvider } from '../contexts/NotificationContext';

const BREAKPOINTS = {
  sm: 640,  // Small devices
  md: 768,  // Medium devices
  lg: 1024, // Large devices
  xl: 1280  // Extra large devices
};

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to handle sidebar toggle event
    const handleToggle = () => setIsSidebarOpen(!isSidebarOpen);
    
    // Function to check screen size and set mobile state
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth < BREAKPOINTS.md;
      setIsMobile(isMobileView);
      
      // Auto-collapse sidebar on small screens
      if (isMobileView && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    

    checkScreenSize();
    
    // Add event listeners
    window.addEventListener('toggle-sidebar', handleToggle);
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggle);
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [isSidebarOpen]);

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-[#f9f9f9]">
        <Navbar />
        <div className="flex">
          {!isMobile && (
            <div 
              className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[260px]' : 'w-[72px]'}`}
              style={{ minHeight: '100vh' }}
            >
              {/* Sidebar component */}
            </div>
          )}
          
          {/* Sidebar component */}
          <Sidebar isCollapsed={!isSidebarOpen} />
          
          {/* Main content */}
          <main 
            className="flex-1 p-4 sm:p-6" 
            style={{ 
              paddingTop: '64px',
              paddingLeft: isMobile ? 'calc(1rem + 8px)' : undefined
            }}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}