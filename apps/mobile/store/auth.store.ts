import { create } from 'zustand';
import { authApi, saveToken, deleteToken } from '../services/api';

interface AuthState {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true });
    const { accessToken, user } = await authApi.login(email, password);
    await saveToken(accessToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  register: async (data) => {
    set({ isLoading: true });
    const { accessToken, user } = await authApi.register(data);
    await saveToken(accessToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await deleteToken();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const user = await authApi.me();
      set({ user, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  refreshToken: async () => {
    try {
      const { accessToken, user } = await authApi.refresh();
      await saveToken(accessToken);
      set({ user });
    } catch {}
  },
}));
