import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  requireAnyPermission?: string[];
  requireAnyRole?: string[];
}

const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
const isAdminRole = (roles?: string[]) => {
  if (!roles) return false;
  return roles.some((r) => {
    const n = normalize(r);
    return n === 'systemadmin' || n === 'productadmin';
  });
};

export function RequireAuth({ children, requireAnyPermission, requireAnyRole }: Props) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isAuth = useAuthStore((s) => s.isAuthenticated());
  const isSysAdmin = useAuthStore((s) => s.isSystemAdmin());

  if (!isAuth || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // SystemAdmin / ProductAdmin bypass (Administrators group is the canonical signal)
  if (isSysAdmin || user.groups?.includes('Administrators') || isAdminRole(user.roles)) {
    return <>{children}</>;
  }

  if (requireAnyRole && requireAnyRole.length > 0) {
    const normRoles = user.roles.map(normalize);
    const ok = requireAnyRole.some((r) => normRoles.includes(normalize(r)));
    if (!ok) return <Navigate to="/forbidden" replace />;
  }

  if (requireAnyPermission && requireAnyPermission.length > 0) {
    const ok = requireAnyPermission.some((p) => user.permissions.includes(p));
    if (!ok) return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
