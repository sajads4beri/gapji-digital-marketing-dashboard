'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '../users/types';
import type {
  AuthUser,
  UserOrgMembership,
  LoginCredentials,
  LoginResult,
} from './types';
import { realAuthService } from './auth-api';
import { setOnAuthFailure } from '@/lib/api';
import { canPerformAction, canAccessRoute } from '@/lib/permissions';

export interface AuthContextValue {
  user: AuthUser | null;
  activeOrgId: string | null;
  activeOrgName: string | null;
  activeRole: UserRole | null;
  availableOrganizations: UserOrgMembership[];
  isLoading: boolean;
  isAuthenticated: boolean;
  lastSelectedOrgId: string | null;
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  logout: () => void;
  selectOrganization: (orgId: string) => boolean;
  can: (operation: string, context?: { isOwner?: boolean; dataType?: string }) => boolean;
  canAccessRoute: (route: string) => boolean;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [activeOrgId, setActiveOrgId] = React.useState<string | null>(null);
  const [activeRole, setActiveRole] = React.useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [lastSelectedOrgId, setLastSelectedOrgId] = React.useState<string | null>(null);

  // ۱. بازیابی نشست از سرور واقعی بک‌اند هنگام بارگذاری اولیه صفحه با کوکی HttpOnly
  React.useEffect(() => {
    let isMounted = true;

    // ثبت کالبک پاکسازی استیت کلاینت در زمان شکست رفرش توکن
    setOnAuthFailure(() => {
      if (isMounted) {
        setUser(null);
        setActiveOrgId(null);
        setActiveRole(null);
      }
    });

    async function initSession() {
      try {
        const session = await realAuthService.restoreSession();
        if (session && isMounted) {
          setUser(session.user);
          setActiveOrgId(session.activeOrgId);
          setActiveRole(session.activeRole);
          setLastSelectedOrgId(session.activeOrgId);
        }
      } catch (e) {
        // عدم وجود سشن معتبر
        if (isMounted) {
          setUser(null);
          setActiveOrgId(null);
          setActiveRole(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // ۲. استخراج سازمان‌های در دسترس کاربر جاری
  const availableOrganizations = React.useMemo(() => {
    return user?.memberships || [];
  }, [user]);

  // ۳. استخراج نام سازمان فعال جاری
  const activeOrgName = React.useMemo(() => {
    if (!activeOrgId || !user) return null;
    const found = user.memberships.find((m) => m.orgId === activeOrgId);
    return found ? found.orgName : 'آژانس دیجیتال مارکتینگ گپ‌جی';
  }, [activeOrgId, user]);

  // ۴. متد ورود به حساب با اندپوینت واقعی بک‌اند
  const login = React.useCallback(async (credentials: LoginCredentials): Promise<LoginResult> => {
    const result = await realAuthService.login(credentials);
    if (result.success) {
      setUser(result.user);
      setActiveOrgId(result.defaultOrgId);
      setActiveRole(result.activeRole);
      setLastSelectedOrgId(result.defaultOrgId);
    }
    return result;
  }, []);

  // ۵. متد خروج از حساب با اندپوینت واقعی بک‌اند و ابطال سشن
  const logout = React.useCallback(async () => {
    try {
      await realAuthService.logout();
    } finally {
      setUser(null);
      setActiveOrgId(null);
      setActiveRole(null);
      router.replace('/login');
    }
  }, [router]);

  // ۶. متد تغییر سازمان فعال (توسط کاربر چندسازمانی)
  const selectOrganization = React.useCallback(
    (orgId: string): boolean => {
      if (!user) return false;
      const found = user.memberships.find((m) => m.orgId === orgId);
      if (found) {
        setActiveOrgId(found.orgId);
        setActiveRole(found.role);
        setLastSelectedOrgId(found.orgId);
        return true;
      }
      return false;
    },
    [user],
  );

  // ۷. تابع بررسی دسترسی متمرکز متصل به منبع حقیقت permissions.ts
  const can = React.useCallback(
    (operation: string, context?: { isOwner?: boolean; dataType?: string }): boolean => {
      if (!activeRole) return false;
      if (operation.startsWith('/')) {
        return canAccessRoute(operation, activeRole);
      }
      return canPerformAction(operation, activeRole, context);
    },
    [activeRole],
  );

  const checkRoute = React.useCallback(
    (route: string): boolean => {
      return canAccessRoute(route, activeRole);
    },
    [activeRole],
  );

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      activeOrgId,
      activeOrgName,
      activeRole,
      availableOrganizations,
      isLoading,
      isAuthenticated: Boolean(user && activeOrgId),
      lastSelectedOrgId,
      login,
      logout,
      selectOrganization,
      can,
      canAccessRoute: checkRoute,
    }),
    [
      user,
      activeOrgId,
      activeOrgName,
      activeRole,
      availableOrganizations,
      isLoading,
      lastSelectedOrgId,
      login,
      logout,
      selectOrganization,
      can,
      checkRoute,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
