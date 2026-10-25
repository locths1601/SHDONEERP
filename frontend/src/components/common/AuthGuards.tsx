import React from 'react';
import { useAuthStore } from '../../stores/authStore';

export interface CanProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ permission, children, fallback = null }) => {
  const hasPermission = useAuthStore((state) => state.hasPermission);

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export interface RequireAuthProps {
  permission?: string;
  children: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ permission, children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  if (!isAuthenticated) {
    window.location.href = '/login';
    return null;
  }

  if (permission && !hasPermission(permission)) {
    window.location.href = '/403';
    return null;
  }

  return <>{children}</>;
};
