import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

// Breakpoint values for responsive design
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
    
    // Check screen size on mount
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
    <div className="min-h-screen bg-[#f9f9f9]">
      <Navbar />
      <div className="flex">
        {/* On mobile, don't reserve space for sidebar as it will be floating */}
        {!isMobile && (
          <div 
            className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[260px]' : 'w-[72px]'}`}
            style={{ minHeight: '100vh' }}
          >
            {/* This div just reserves space for the fixed sidebar */}
          </div>
        )}
        
        {/* Sidebar component */}
        <Sidebar isCollapsed={!isSidebarOpen} />
        
        {/* Main content */}
        <main 
          className="flex-1 p-4 sm:p-6" 
          style={{ 
            paddingTop: '64px',
            // Add left padding on mobile to ensure content isn't hidden when sidebar opens
            paddingLeft: isMobile ? 'calc(1rem + 8px)' : undefined
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}