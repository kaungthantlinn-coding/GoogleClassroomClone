import React from 'react';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * This component allows manual triggering of test notifications
 * to verify that notifications work correctly for teacher roles.
 */
const NotificationTester: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  
  // Function to create and dispatch a test notification
  const createTestNotification = () => {
    if (!user) return;
    
    const testNotification = {
      notificationId: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'announcement',
      title: `Test Notification ${new Date().toLocaleTimeString()}`,
      message: `This is a test notification for ${user.name} (${user.role})`,
      createdAt: new Date().toISOString(),
      isRead: false,
      data: {},
      userId: user.id,
      courseId: "123"
    };
    
    console.log('Manually dispatching test notification:', testNotification);
    
    // Dispatch a custom event with the notification
    const event = new CustomEvent('manual-notification', {
      detail: testNotification
    });
    
    document.dispatchEvent(event);
  };
  
  // Only show to the teacher
  if (!user || user.role !== 'teacher') return null;
  
  return (
    <div className="fixed bottom-20 right-4 z-50">
      <button
        onClick={createTestNotification}
        className="px-4 py-2 rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors duration-200"
      >
        Send Test Notification
      </button>
    </div>
  );
};

export default NotificationTester;
