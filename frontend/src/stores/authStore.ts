import { create } from 'zustand';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  mustChangePassword: boolean;
  isAdmin: boolean;
  permissions: string[];
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: AuthUser, token: string, refreshToken?: string) => void;
  logout: () => void;
  hasPermission: (permissionCode: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    const saved = localStorage.getItem('shd_user');
    return saved ? JSON.parse(saved) : null;
  })(),
  token: localStorage.getItem('shd_access_token'),
  isAuthenticated: !!localStorage.getItem('shd_access_token'),
  isLoading: false,

  setAuth: (user, token, refreshToken) => {
    localStorage.setItem('shd_access_token', token);
    localStorage.setItem('shd_user', JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem('shd_refresh_token', refreshToken);
    }
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('shd_access_token');
    localStorage.removeItem('shd_refresh_token');
    localStorage.removeItem('shd_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  hasPermission: (permissionCode: string) => {
    const { user } = get();
    if (!user) return false;
    if (user.isAdmin) return true; // Administrators bypass application permissions
    return user.permissions.includes(permissionCode.toLowerCase());
  },
}));
