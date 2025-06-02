import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { BellRing } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  
  // Debug log notifications status
  useEffect(() => {
    if (user) {
      console.log('NotificationBell: User role =', user.role);
      console.log('NotificationBell: Notification count =', notifications.length);
      console.log('NotificationBell: Unread count =', unreadCount);
      console.log('NotificationBell: All notifications =', notifications);
      if (notifications.length > 0) {
        console.log('NotificationBell: First notification =', notifications[0]);
      }
    }
  }, [notifications, unreadCount, user]);

  // Force re-render when notifications change
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [notifications.length, unreadCount]);

  const handleNotificationClick = (notificationId: string, link?: string, courseId?: string, assignmentId?: string) => {
    markAsRead(notificationId);
    
    if (link) {
      // Fix incorrect URL pattern - transform /class/:classId/assignment/:assignmentId to /class/:classId/submissions/:assignmentId
      if (link.match(/\/class\/\d+\/assignment\/\d+$/)) {
        const correctedLink = link.replace(/\/assignment\//, '/submissions/');
        console.log(`Fixing incorrect notification link from ${link} to ${correctedLink}`);
        navigate(correctedLink);
      } else {
        navigate(link);
      }
    } else if (courseId && assignmentId) {
      // Fallback if link is not available but we have courseId and assignmentId
      navigate(`/class/${courseId}/submissions/${assignmentId}`);
    }
    
    setShowDropdown(false);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 hover:bg-gray-100 rounded-full relative"
        aria-label="Notifications"
      >
        <BellRing size={24} strokeWidth={1.5} className="text-[#5f6368]" />
        {unreadCount > 0 && (
          <span
            key={`badge-${unreadCount}-${forceUpdate}`}
            className="notification-bell-badge absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full"
            style={{
              minWidth: '18px',
              minHeight: '18px',
              zIndex: 10,
              display: 'flex'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-200 transition-all duration-200 max-h-96 overflow-y-auto">
          <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-base font-medium text-gray-900">Notifications</h3>
            <div className="flex space-x-3">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/notifications');
                  setShowDropdown(false);
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                View all
              </button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500">
              <p>No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.notificationId}
                  onClick={() => handleNotificationClick(
                    notification.notificationId, 
                    notification.link, 
                    notification.courseId, 
                    notification.assignmentId
                  )}
                  className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-sm ${!notification.isRead ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                        {notification.title || notification.message}
                      </p>
                      {notification.title && (
                        <p className="text-xs text-gray-600 mt-0.5">{notification.message}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {formatTimestamp(notification.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
