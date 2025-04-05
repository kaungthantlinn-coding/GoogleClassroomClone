import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleToggle = () => setIsSidebarOpen(!isSidebarOpen);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, [isSidebarOpen]);

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <Navbar />
      <div className="flex">
        <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[280px]' : 'w-[72px]'}`}>
          <Sidebar isCollapsed={!isSidebarOpen} />
        </div>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}