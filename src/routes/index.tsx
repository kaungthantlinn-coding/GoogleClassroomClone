import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/HomePage';
import TodoPage from '../pages/TodoPage';
import ArchivedPage from '../pages/ArchivedPage';
import SettingsPage from '../pages/SettingsPage';
import EnrolledPage from '../pages/EnrolledPage';
import ToReviewPage from '../pages/ToReviewPage';
import CalendarPage from '../pages/CalendarPage';
import ClassPage from '../pages/ClassPage';
import PeoplePage from '../pages/PeoplePage';
import GradesPage from '../pages/GradesPage';
import { ErrorBoundary } from '../components/ErrorBoundary';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ErrorBoundary><MainLayout /></ErrorBoundary>,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'enrolled', element: <EnrolledPage /> },
      { path: 'todo', element: <TodoPage /> },
      { path: 'archived', element: <ArchivedPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'to-review', element: <ToReviewPage /> },
      { path: 'class/:classId', element: <ClassPage /> },
      { path: 'class/:classId/stream', element: <ClassPage /> },
      { path: 'class/:classId/classwork', element: <ClassPage /> },
      { path: 'class/:classId/people', element: <PeoplePage /> },
      { path: 'class/:classId/grades', element: <GradesPage /> },
    ],
  },
]);