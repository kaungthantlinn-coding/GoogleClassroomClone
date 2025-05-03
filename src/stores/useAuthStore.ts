import { create } from 'zustand';
import { User } from '../types/course';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getCurrentUser,
  getUserSettings as apiGetUserSettings,
  updateUserSettings as apiUpdateUserSettings,
  changePassword as apiChangePassword
} from '../api/authApi';

interface UserSettings {
  name: string;
  email: string;
  avatar?: string;
  role: string;
  emailNotifications: string;
}

interface AuthState {
  user: User | null;
  userSettings: UserSettings | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'teacher' | 'student') => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  loadUserSettings: () => Promise<void>;
  updateSettings: (settings: UserSettings) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmNewPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userSettings: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await apiLogin({ email, password });
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false
      });
    }
  },

  register: async (name, email, password, role) => {
    set({ isLoading: true, error: null });
    try {
      const user = await apiRegister({ name, email, password, role });
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Registration failed',
        isLoading: false
      });
    }
  },

  logout: () => {
    apiLogout();
    set({ user: null, userSettings: null, isAuthenticated: false });
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const user = await getCurrentUser();
      set({
        user,
        isAuthenticated: !!user,
        isLoading: false
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  loadUserSettings: async () => {
    if (!get().user) return;

    set({ isLoading: true });
    try {
      const userSettings = await apiGetUserSettings();
      set({ userSettings, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load user settings',
        isLoading: false
      });
    }
  },

  updateSettings: async (settings) => {
    set({ isLoading: true, error: null });
    try {
      const updatedSettings = await apiUpdateUserSettings(settings);
      set({
        userSettings: updatedSettings,
        isLoading: false
      });

      // Also update the user object with relevant fields
      const user = get().user;
      if (user) {
        set({
          user: {
            ...user,
            name: settings.name,
            email: settings.email,
            avatar: settings.avatar
          }
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update settings',
        isLoading: false
      });
    }
  },

  changePassword: async (currentPassword, newPassword, confirmNewPassword) => {
    set({ isLoading: true, error: null });
    try {
      await apiChangePassword({
        currentPassword,
        newPassword,
        confirmNewPassword
      });
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to change password',
        isLoading: false
      });
    }
  },
}));