import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'submission' | 'announcement' | 'other';
  courseId?: string;
  assignmentId?: string;
  userId?: string;
  link?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

interface NotificationActions {
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

type NotificationStore = NotificationState & NotificationActions;

// Creating the store with proper type annotations
export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      // State
      notifications: [],
      unreadCount: 0,
      
      // Actions
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          timestamp: new Date().toISOString(),
          read: false,
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },
      
      markAsRead: (id) => {
        set((state) => {
          const notifications = state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification
          );
          const unreadCount = notifications.filter((notification) => !notification.read).length;
          return { notifications, unreadCount };
        });
      },
      
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
          unreadCount: 0,
        }));
      },
      
      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          const notifications = state.notifications.filter((n) => n.id !== id);
          const unreadCount = notification && !notification.read 
            ? state.unreadCount - 1 
            : state.unreadCount;
          return { notifications, unreadCount };
        });
      },
      
      clearAllNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
