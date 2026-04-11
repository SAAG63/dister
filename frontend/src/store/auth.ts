import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginRequest, registerRequest, logoutRequest } from '../api/auth';

export interface User {
  id: string;
  username: string;
  email?: string;
  avatarUrl: string | null;
  createdAt: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setTokens: (token: string, refreshToken: string) => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const { token, refreshToken, user } = await loginRequest(email, password);
        set({ token, refreshToken, user, isAuthenticated: true });
      },

      register: async (username: string, email: string, password: string) => {
        const { token, refreshToken, user } = await registerRequest(username, email, password);
        set({ token, refreshToken, user, isAuthenticated: true });
      },

      logout: () => {
        const rt = get().refreshToken;
        if (rt) logoutRequest(rt).catch(() => {});
        set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
      },

      setTokens: (token: string, refreshToken: string) => {
        set({ token, refreshToken });
      },

      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },
    }),
    {
      name: 'socialhub-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
