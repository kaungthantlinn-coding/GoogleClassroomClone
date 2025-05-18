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
import ClassworkPage from '../pages/ClassworkPage';
import SubmissionsPage from '../pages/SubmissionsPage';
import StudentSubmissionPage from '../pages/StudentSubmissionPage';
import StudentAssignmentSubmitPage from '../pages/StudentAssignmentSubmitPage';
import GradesPage from '../pages/GradesPage';
import NotificationsPage from '../pages/NotificationsPage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import { ErrorBoundary } from '../components/ErrorBoundary';
import NotFound from '../components/NotFound';

export const router = createBrowserRouter([
  // Auth routes (outside MainLayout)
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/signup',
    element: <SignupPage />
  },
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
      { path: 'notifications', element: <NotificationsPage /> },

      // Class context routes
      { path: 'class/:classId', element: <ClassPage /> },
      { path: 'class/:classId/stream', element: <ClassPage /> },
      { path: 'class/:classId/classwork', element: <ClassPage /> },
      { path: 'class/:classId/people', element: <ClassPage /> },
      { path: 'class/:classId/grades', element: <GradesPage /> },
      { path: 'class/:classId/submissions/:assignmentId', element: <SubmissionsPage /> },
      { path: 'class/:classId/submissions/:assignmentId/student/:studentId', element: <StudentSubmissionPage /> },
      { path: 'class/:classId/assignment/:assignmentId/submit', element: <StudentAssignmentSubmitPage /> },

      // Non-class context routes
      { path: 'classwork', element: <ClassworkPage /> },
      { path: 'submissions/:assignmentId', element: <SubmissionsPage /> },
      { path: 'submissions/:assignmentId/student/:studentId', element: <StudentSubmissionPage /> },
      { path: 'assignment/:assignmentId/submit', element: <StudentAssignmentSubmitPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFound />
  }
]);