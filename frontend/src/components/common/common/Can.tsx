import { useAuthStore } from '@/stores/authStore';
import type { ReactNode } from 'react';

type GateMode = 'all' | 'any';

interface CanProps {
  children: ReactNode;
  fallback?: ReactNode;

  // Specific guards
  permission?: string | string[];
  role?: string | string[];
  group?: string | string[];
  mode?: GateMode;
}

const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
const isAdminRoleName = (roles?: string[]) => {
  if (!roles) return false;
  return roles.some((r) => {
    const n = normalize(r);
    return (
      n === 'systemadmin' ||
      n === 'productadmin' ||
      n === 'admin' ||
      n === 'systemadministrator' ||
      n === 'productadministrator'
    );
  });
};

// PRIMARY admin signal: membership in the seeded "Administrators" group.
// FALLBACK: historical admin role names (transitional).
const isAdmin = (user: { roles?: string[]; groups?: string[] }) => {
  if (user.groups?.includes('Administrators')) return true;
  return isAdminRoleName(user.roles);
};

/**
 * Conditional render based on permission / role / group.
 * Membership in the "Administrators" group always passes (admin bypass).
 */
export function Can({ children, fallback = null, permission, role, group, mode = 'all' }: CanProps) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  if (!isAuthenticated || !user) return <>{fallback}</>;

  // Admin bypass — Administrators group membership is the canonical signal.
  if (isAdmin(user)) {
    return <>{children}</>;
  }

  const check = (codes: string[] | undefined, type: 'perm' | 'role' | 'group') => {
    if (!codes || codes.length === 0) return true;
    const target =
      type === 'perm' ? user.permissions : type === 'role' ? user.roles : user.groups;

    if (type === 'role') {
      const normTarget = target.map(normalize);
      return mode === 'all'
        ? codes.every((c) => normTarget.includes(normalize(c)))
        : codes.some((c) => normTarget.includes(normalize(c)));
    }

    return mode === 'all'
      ? codes.every((c) => target.includes(c))
      : codes.some((c) => target.includes(c));
  };

  const ok =
    check(typeof permission === 'string' ? [permission] : permission, 'perm') &&
    check(typeof role === 'string' ? [role] : role, 'role') &&
    check(typeof group === 'string' ? [group] : group, 'group');

  return ok ? <>{children}</> : <>{fallback}</>;
}