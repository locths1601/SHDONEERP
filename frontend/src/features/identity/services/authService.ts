import { apiClient } from '../../../lib/apiClient';

export interface LoginPayload {
  usernameOrEmail: string;
  password: string;
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

  getProfile: () => {
    return apiClient.get<LoginResult['user']>('/auth/me');
  },
};
