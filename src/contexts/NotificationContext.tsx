import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = !!user;
  const signalRInitialized = useRef(false);
  
  // Debug log to verify user role
  useEffect(() => {
    if (user) {
      console.log('Current user:', user?.name, 'Role:', user?.role);
    }
  }, [user]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (isAuthenticated) {
      try {
        const storedNotifications = JSON.parse(localStorage.getItem('classroom-notifications') || '[]');
        
        // Only show notifications to teachers
        if (user?.role?.toLowerCase() === 'teacher') {
          setNotifications(storedNotifications);
          console.log(`Loaded ${storedNotifications.length} notifications for teacher from localStorage`);
        } else {
          // For non-teachers, show no notifications
          setNotifications([]);
          console.log(`No notifications loaded - user role '${user?.role}' is not teacher`);
        }
      } catch (error) {
        console.error('Error loading notifications from localStorage:', error);
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Only start SignalR when user is authenticated AND not loading AND not already initialized
    if (isAuthenticated && !isLoading && user && user.name && !signalRInitialized.current) {
      console.log(`Starting SignalR connection - user authenticated and loading complete (${user.name}, ${user.role})`);
      signalRInitialized.current = true;

      // Start SignalR connection when user is authenticated and loading is complete
      const initializeSignalR = async () => {
        try {
          // Wait for authentication token to be available
          console.log('Waiting for authentication token to be available...');

          const tokenAvailable = await signalRService.waitForAuthentication(5000);
          if (!tokenAvailable) {
            console.error('Authentication token not available after waiting, skipping SignalR initialization');
            return;
          }

          // Debug authentication status before attempting connection
          signalRService.debugAuthStatus();

          const connected = await signalRService.startConnection();
          if (connected) {
            console.log('SignalR connection initialized successfully');
          } else {
            console.error('Failed to initialize SignalR connection - authentication may be required');
            // Debug again after failed connection attempt
            signalRService.debugAuthStatus();
          }
        } catch (error) {
          console.error('Error initializing SignalR connection:', error);
          signalRService.debugAuthStatus();
        }
      };

      initializeSignalR();

      // Register notification handler for SignalR notifications
      const handleNotification = (notification: Notification) => {
        // Only show notifications to teachers
        if (user?.role === 'teacher') {
          console.log('Teacher notification received:', notification);
          setNotifications(prev => [notification, ...prev]);
        } else {
          console.log('Notification filtered out - user is not a teacher');
        }
      };

      signalRService.onNotification(handleNotification);

      // Also listen for manual notification events (for testing/demo purposes)
      const handleManualNotification = (event: CustomEvent) => {
        console.log('Received manual notification event:', event.detail);
        const notification = event.detail as Notification;

        // Only show notifications to teachers
        if (user?.role === 'teacher') {
          console.log('Teacher manual notification received:', notification);
          setNotifications(prev => {
            const updatedNotifications = [notification, ...prev];

            // Save to localStorage immediately
            try {
              localStorage.setItem('classroom-notifications', JSON.stringify(updatedNotifications));
              console.log('Manual notification saved to localStorage');
            } catch (error) {
              console.error('Error saving manual notification to localStorage:', error);
            }

            return updatedNotifications;
          });
        } else {
          console.log('Manual notification filtered out - user is not a teacher');
        }
      };
      
      // Add event listener for manual notifications
      document.addEventListener('manual-notification', handleManualNotification as EventListener);

      // Clean up on unmount
      return () => {
        signalRService.offNotification(handleNotification);
        signalRService.stopConnection();
        document.removeEventListener('manual-notification', handleManualNotification as EventListener);
        signalRInitialized.current = false; // Reset for potential re-initialization
      };
    } else if (isLoading) {
      console.log('Waiting for auth loading to complete before starting SignalR...');
    } else if (!isAuthenticated) {
      console.log('User not authenticated, not starting SignalR connection');
    } else if (!user?.name) {
      console.log('User data incomplete, waiting for full user info...');
    }
  }, [isAuthenticated, isLoading, user]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  // Debug log to verify notification count
  useEffect(() => {
    console.log(`NotificationContext: Current notifications: ${notifications.length}, Unread: ${unreadCount}`);
    console.log('NotificationContext: User:', user?.name, user?.role);
    console.log('NotificationContext: All notifications:', notifications);
  }, [notifications.length, unreadCount, user]);

  // Force the unread count into the UI
  useEffect(() => {
    if (notifications.length > 0) {
      // This ensures the unread count is properly reflected in the UI
      const notificationBell = document.querySelector('.notification-bell-badge');
      if (notificationBell) {
        console.log('Found notification bell badge, updating it');
        notificationBell.textContent = unreadCount.toString();
        notificationBell.classList.toggle('hidden', unreadCount === 0);
      }
    }
  }, [notifications.length, unreadCount]);

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

    // Function to create a test notification
  const createTestNotification = () => {
    if (!user) return;
    
    const testNotification: Notification = {
      notificationId: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'announcement',
      title: 'Test Notification',
      message: `This is a test notification for ${user.name} (${user.role})`,
      createdAt: new Date().toISOString(),
      isRead: false,
      data: {},
      userId: user.id
    };
    
    console.log('Creating test notification:', testNotification);
    
    // For teacher users, add to notifications
    if (user.role === 'teacher') {
      console.log('Adding test notification to teacher user');
      setNotifications(prev => [testNotification, ...prev]);
    } else {
      console.log('Test notification not added - user is not a teacher');
    }
  };
  
  // Create a test notification on mount (for debugging)
  useEffect(() => {
    if (user && isAuthenticated && user.role === 'teacher') {
      // Create a test notification after a short delay
      const timer = setTimeout(() => {
        createTestNotification();
        // Force update localStorage
        try {
          // Direct save, no need to read previous notifications
          const updatedNotifications = [...notifications];
          localStorage.setItem('classroom-notifications', JSON.stringify(updatedNotifications));
          console.log(`Saved ${updatedNotifications.length} notifications to localStorage`);
        } catch (error) {
          console.error('Error saving notifications to localStorage:', error);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, notifications.length]);

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
