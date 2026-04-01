import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../mocks/data';
import { currentUser } from '../mocks/data';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => void;
  register: (username: string, email: string, password: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (_email: string, _password: string) => {
        set({
          token: 'mock-jwt-token',
          user: currentUser,
          isAuthenticated: true,
        });
      },

      register: (_username: string, _email: string, _password: string) => {
        set({
          token: 'mock-jwt-token',
          user: currentUser,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
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
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
