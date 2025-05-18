import React, { createContext, useContext, useEffect, useState } from 'react';
import signalRService from '../services/signalRService';
import { useAuthStore } from '../stores/useAuthStore';

// Define the notification type
export interface Notification {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  data: Record<string, any>;
  courseId?: string;
  assignmentId?: string;
  userId?: string;
  link?: string;
}

// Define the context type
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = !!user;

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (isAuthenticated) {
      try {
        const storedNotifications = JSON.parse(localStorage.getItem('classroom-notifications') || '[]');
        
        // Only show notifications relevant to the current user role
        // For development: show all notifications
        setNotifications(storedNotifications);
        
        console.log(`Loaded ${storedNotifications.length} notifications from localStorage`);
      } catch (error) {
        console.error('Error loading notifications from localStorage:', error);
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated) {
      // Start SignalR connection when user is authenticated
      signalRService.startConnection();

      // Register notification handler for SignalR notifications
      const handleNotification = (notification: Notification) => {
        // For development: show all notifications to all users
        setNotifications(prev => [notification, ...prev]);
        
        // For production: filter notifications based on role (uncomment when ready)
        if (user?.role === 'teacher' || 
            (user?.role === 'student' && notification.userId === user.id)) {
          setNotifications(prev => [notification, ...prev]);
        }
      };

      signalRService.onNotification(handleNotification);

      // Also listen for manual notification events (for testing/demo purposes)
      const handleManualNotification = (event: CustomEvent) => {
        console.log('Received manual notification event:', event.detail);
        const notification = event.detail as Notification;
        
        // For development: show all notifications to all users
        setNotifications(prev => [notification, ...prev]);
        
        // For production: filter notifications based on role (uncomment when ready)
        // if (user?.role === 'teacher' || 
        //    (user?.role === 'student' && notification.userId === user.id)) {
        //  setNotifications(prev => [notification, ...prev]);
        // }
      };
      
      // Add event listener for manual notifications
      document.addEventListener('manual-notification', handleManualNotification as EventListener);

      // Clean up on unmount
      return () => {
        signalRService.offNotification(handleNotification);
        signalRService.stopConnection();
        document.removeEventListener('manual-notification', handleManualNotification as EventListener);
      };
    }
  }, [isAuthenticated, user]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Mark a notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => {
      const updatedNotifications = prev.map(n =>
        n.notificationId === notificationId ? { ...n, isRead: true } : n
      );
      
      // Also update in localStorage
      try {
        localStorage.setItem('classroom-notifications', JSON.stringify(updatedNotifications));
      } catch (error) {
        console.error('Error updating notifications in localStorage:', error);
      }
      
      return updatedNotifications;
    });
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => {
      const updatedNotifications = prev.map(n => ({ ...n, isRead: true }));
      
      // Also update in localStorage
      try {
        localStorage.setItem('classroom-notifications', JSON.stringify(updatedNotifications));
      } catch (error) {
        console.error('Error updating notifications in localStorage:', error);
      }
      
      return updatedNotifications;
    });
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    
    // Also clear in localStorage
    try {
      localStorage.setItem('classroom-notifications', JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing notifications in localStorage:', error);
    }
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead, 
        clearAllNotifications 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
