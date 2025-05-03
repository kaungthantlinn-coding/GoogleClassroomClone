import { create } from 'zustand';
import { User } from '../types/course';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
}

// Try to get user from localStorage
const getUserFromStorage = (): User | null => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Error loading user from localStorage:', error);
    return null;
  }
};

// Initialize with user from localStorage if available
const initialUser = getUserFromStorage();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));