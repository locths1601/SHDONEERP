import { apiClient } from '../../../lib/apiClient';

export interface LoginPayload {
  usernameOrEmail: string;
  password: string;
}

export interface BootstrapPayload {
  adminUsername: string;
  adminEmail: string;
  fullName: string;
  password: string;
  bootstrapSecret?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    mustChangePassword: boolean;
    isAdmin: boolean;
    permissions: string[];
  };
}

export const authService = {
  login: (data: LoginPayload) => {
    return apiClient.post<LoginResult>('/auth/login', data);
  },

  refreshToken: (refreshToken: string) => {
    return apiClient.post<LoginResult>('/auth/refresh-token', { refreshToken });
  },

  logout: (refreshToken?: string) => {
    return apiClient.post('/auth/logout', { refreshToken: refreshToken || '' });
  },

  bootstrap: (data: BootstrapPayload) => {
    return apiClient.post('/auth/bootstrap', data);
  },

  getProfile: () => {
    return apiClient.get<LoginResult['user']>('/auth/me');
  },
};
