import toast from 'react-hot-toast';
import { create } from 'zustand';
import { ApiError, authApi } from '../services/api';
import type { UserProfile } from '../types';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authModalMode: 'login' | 'register' | null;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: {
    name: string;
    username: string;
    email: string;
    password: string;
    profilePicture?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  adjustCounts: (delta: { posts?: number; following?: number }) => void;
  openAuthModal: (mode: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  authModalMode: null,

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await authApi.me();
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      set({
        user: res.user,
        isAuthenticated: true,
        authModalMode: null,
      });
      toast.success(`Welcome back, ${res.user.name}`);
      return true;
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Unable to sign in right now.';
      toast.error(message);
      return false;
    }
  },

  register: async (payload) => {
    try {
      const res = await authApi.register(payload);
      set({
        user: res.user,
        isAuthenticated: true,
        authModalMode: null,
      });
      toast.success(`Welcome to Connectly, ${res.user.name}!`);
      return true;
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Unable to create account right now.';
      toast.error(message);
      return false;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout and clear local session
    } finally {
      set({ user: null, isAuthenticated: false });
      toast.success('Signed out');
    }
  },

  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
  adjustCounts: (delta) =>
    set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          postsCount: Math.max(
            0,
            state.user.postsCount + (delta.posts ?? 0)
          ),
          followingCount: Math.max(
            0,
            state.user.followingCount + (delta.following ?? 0)
          ),
        },
      };
    }),
  openAuthModal: (mode) => set({ authModalMode: mode }),
  closeAuthModal: () => set({ authModalMode: null }),
}));
