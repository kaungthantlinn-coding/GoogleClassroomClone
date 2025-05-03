import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { StudentDataProvider } from './contexts/StudentDataContext';
import { useAuthStore } from './stores/useAuthStore';

// Make sure the React import is properly detected
const App: React.FC = () => {
  const loadUser = useAuthStore(state => state.loadUser);
  
  useEffect(() => {
    // Load authenticated user on app startup
    loadUser();
  }, [loadUser]);

  return (
    <StudentDataProvider>
      <RouterProvider router={router} />
    </StudentDataProvider>
  );
};

export default App;