import { create } from 'zustand';
import type { AuthUser } from '@/features/auth/types';
import type { UserRole } from '@/features/users/types';
import { canPerformAction, canAccessRoute } from '@/lib/permissions';

export interface AuthState {
  user: AuthUser | null;
  activeOrgId: string | null;
  activeRole: UserRole | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  setActiveOrgId: (orgId: string | null) => void;
  setActiveRole: (role: UserRole | null) => void;
  logout: () => void;
  can: (operation: string, context?: { isOwner?: boolean; dataType?: string }) => boolean;
  canAccessRoute: (route: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  activeOrgId: null,
  activeRole: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setActiveOrgId: (activeOrgId) => set({ activeOrgId }),
  setActiveRole: (activeRole) => set({ activeRole }),
  logout: () =>
    set({
      user: null,
      activeOrgId: null,
      activeRole: null,
      isAuthenticated: false,
    }),
  can: (operation, context) => {
    const { activeRole } = get();
    return canPerformAction(operation, activeRole, context);
  },
  canAccessRoute: (route) => {
    const { activeRole } = get();
    return canAccessRoute(route, activeRole);
  },
}));
