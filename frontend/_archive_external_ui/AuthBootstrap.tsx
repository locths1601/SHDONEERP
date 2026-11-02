import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { UserInfo } from '@/stores/authStore';

/**
 * Mounted once at the top of the app. Its only job is to make sure the
 * localStorage-cached user (permissions, groups, roles) stays in sync with
 * the DB whenever the user reopens the tab or reloads.
 *
 * Why this exists: when an admin changes another user's group membership /
 * role grants, that user's JWT still says the OLD permissions until it
 * expires (60 min). Their browser keeps the OLD user blob in localStorage.
 * Without this, the only way to pick up the new perms was a manual logout
 * or an incognito window.
 */
export function AuthBootstrap() {
  useEffect(() => {
    const state = useAuthStore.getState();
    const { accessToken, user } = state;
    if (!accessToken || !user) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await api.get<UserInfo>('/auth/me');
        if (cancelled) return;
        if (res.data && res.data.id) {
          // Only overwrite if the server returned a meaningfully different
          // user (different id). Avoids wiping the session on transient errors.
          if (res.data.id === user.id) {
            useAuthStore.getState().setUser(res.data);
          }
        }
      } catch {
        // Silent — interceptor handles 401/refresh; we just don't update.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
