import React from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { User } from '../types/course';

const RoleToggle: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  // Function to toggle between teacher and student roles
  const toggleRole = () => {
    if (!user) return;
    
    // Create a new user object with the switched role
    const newRole: 'teacher' | 'student' = user.role === 'teacher' ? 'student' : 'teacher';
    
    // Create a properly typed user object
    const updatedUser: User = {
      ...user,
      role: newRole
    };
    
    // Update in state
    setUser(updatedUser);
    
    // Also update in localStorage for persistence
    try {
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log(`Role switched to: ${newRole}`);
    } catch (error) {
      console.error('Failed to update role in localStorage:', error);
    }
    
    // Reload the page to apply changes
    window.location.reload();
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggleRole}
        className={`px-4 py-2 rounded-full shadow-lg ${
          user.role === 'teacher' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-medium transition-colors duration-200`}
      >
        Role: {user.role}
        <span className="block text-xs opacity-80">Click to toggle</span>
      </button>
    </div>
  );
};

export default RoleToggle;
