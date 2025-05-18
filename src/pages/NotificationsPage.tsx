import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { BellRing, Filter, Search, Check, Clock, Archive, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

// Filter options for notifications
type FilterType = 'all' | 'unread' | 'read' | 'submissions' | 'announcements' | 'comments';

const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Apply filters and search
  const filteredNotifications = notifications.filter(notification => {
    // Apply filter type
    if (filterType === 'unread' && notification.isRead) return false;
    if (filterType === 'read' && !notification.isRead) return false;
    if (filterType === 'submissions' && notification.type !== 'submission') return false;
    if (filterType === 'announcements' && notification.type !== 'announcement') return false;
    if (filterType === 'comments' && notification.type !== 'comment') return false;
    
    // Apply search query if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        notification.title?.toLowerCase().includes(query) || 
        notification.message.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

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

  // Function to determine the icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'submission':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'announcement':
        return <BellRing className="h-5 w-5 text-purple-500" />;
      case 'comment':
        return <Archive className="h-5 w-5 text-yellow-500" />;
      default:
        return <BellRing className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <div className="flex space-x-2">
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={markAllAsRead}
              className="text-sm"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={clearAllNotifications}
            className="text-sm text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear all
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        {/* Header with stats & search */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="p-2 bg-blue-100 rounded-full">
              <BellRing className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-base font-medium">All Notifications</h2>
              <p className="text-sm text-gray-500">
                {unreadCount} unread of {notifications.length} total
              </p>
            </div>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search notifications" 
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex overflow-x-auto scrollbar-hide px-4 py-2 border-b border-gray-200">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md mr-2 whitespace-nowrap ${
              filterType === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('unread')}
            className={`px-4 py-2 text-sm font-medium rounded-md mr-2 whitespace-nowrap ${
              filterType === 'unread' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilterType('submissions')}
            className={`px-4 py-2 text-sm font-medium rounded-md mr-2 whitespace-nowrap ${
              filterType === 'submissions' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Submissions
          </button>
          <button
            onClick={() => setFilterType('announcements')}
            className={`px-4 py-2 text-sm font-medium rounded-md mr-2 whitespace-nowrap ${
              filterType === 'announcements' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Announcements
          </button>
          <button
            onClick={() => setFilterType('comments')}
            className={`px-4 py-2 text-sm font-medium rounded-md mr-2 whitespace-nowrap ${
              filterType === 'comments' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Comments
          </button>
        </div>

        {/* Notification list */}
        <div className="divide-y divide-gray-100">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center">
              <BellRing className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
              <p className="mt-2 text-gray-500 max-w-md mx-auto">
                {searchQuery 
                  ? "No notifications match your search criteria." 
                  : "You don't have any notifications yet."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.notificationId}
                onClick={() => handleNotificationClick(
                  notification.notificationId,
                  notification.link,
                  notification.courseId,
                  notification.assignmentId
                )}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-all duration-150 ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex">
                  <div className="mr-4 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className={`text-sm ${!notification.isRead ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {formatTimestamp(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    {notification.courseId && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          Course #{notification.courseId}
                        </span>
                      </div>
                    )}
                  </div>
                  {!notification.isRead && (
                    <div className="ml-2 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination placeholder - can be implemented for larger notification lists */}
        {filteredNotifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
