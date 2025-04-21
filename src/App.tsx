import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { StudentDataProvider } from './contexts/StudentDataContext';

// Make sure the React import is properly detected
const App: React.FC = () => {
  return (
    <StudentDataProvider>
      <RouterProvider router={router} />
    </StudentDataProvider>
  );
};

export default App;