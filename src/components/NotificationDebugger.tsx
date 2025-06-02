import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuthStore } from '../stores/useAuthStore';

const NotificationDebugger: React.FC = () => {
  const { notifications, unreadCount } = useNotifications();
  const user = useAuthStore(state => state.user);

  const triggerTestNotification = () => {
    const testNotification = {
      notificationId: `test-${Date.now()}`,
      type: 'submission',
      title: 'Test Notification',
      message: 'This is a test notification to debug the notification system',
      createdAt: new Date().toISOString(),
      isRead: false,
      data: {},
      userId: user?.id || 'test-user',
      assignmentId: '1033',
      courseId: '3',
      link: '/class/3/submissions/1033'
    };

    console.log('Triggering test notification:', testNotification);
    
    // Dispatch the manual notification event
    const event = new CustomEvent('manual-notification', {
      detail: testNotification
    });
    document.dispatchEvent(event);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50">
      <h3 className="text-sm font-bold mb-2">Notification Debugger</h3>
      <div className="text-xs space-y-1 mb-3">
        <div>User: {user?.name} ({user?.role})</div>
        <div>Total Notifications: {notifications.length}</div>
        <div>Unread Count: {unreadCount}</div>
        <div>Authenticated: {user ? 'Yes' : 'No'}</div>
      </div>
      <button
        onClick={triggerTestNotification}
        className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
      >
        Trigger Test Notification
      </button>
      <div className="mt-2 max-h-32 overflow-y-auto">
        <div className="text-xs font-semibold">Recent Notifications:</div>
        {notifications.slice(0, 3).map((notif, index) => (
          <div key={notif.notificationId} className="text-xs text-gray-600 truncate">
            {index + 1}. {notif.title} ({notif.isRead ? 'read' : 'unread'})
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationDebugger;
