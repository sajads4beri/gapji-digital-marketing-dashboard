import { api, setAccessToken } from '@/lib/api';
import type { UserRole } from '../users/types';
import type {
  AuthUser,
  UserOrgMembership,
  LoginCredentials,
  LoginResult,
} from './types';

/**
 * تبدیل ارقام فارسی و عربی به انگلیسی و پاکسازی کاراکترهای اضافه
 */
export function normalizeIdentifier(val: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  let normalized = trimmed;
  for (let i = 0; i < 10; i++) {
    normalized = normalized
      .replace(new RegExp(farsiDigits[i], 'g'), i.toString())
      .replace(new RegExp(arabicDigits[i], 'g'), i.toString());
  }

  // حذف فاصله و خط فاصله از شماره تماس
  return normalized.replace(/[\s-]/g, '').toLowerCase();
}

export interface BackendUserDto {
  id: string;
  email: string | null;
  mobile: string | null;
  fullName: string;
  role: string;
  organizationId: string | null;
}

export interface BackendLoginResponseDto {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: BackendUserDto;
  redirectUrl: string;
}

export interface BackendRefreshResponseDto {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

/**
 * نگاشت موجودیت کاربر بازگشتی از سرور واقعی به مدل فرانت‌اند (AuthUser)
 */
export function mapBackendUserToAuthUser(backendUser: BackendUserDto): AuthUser {
  const role = (backendUser.role as UserRole) || 'client';
  const orgId = backendUser.organizationId || '00000000-0000-0000-0000-000000000001';

  const orgMembership: UserOrgMembership = {
    orgId,
    orgName: 'آژانس دیجیتال مارکتینگ گپ‌جی',
    role,
    isDefault: true,
  };

  return {
    id: backendUser.id,
    fullName: backendUser.fullName || 'کاربر سامانه',
    email: backendUser.email || '',
    phoneNumber: backendUser.mobile || null,
    role,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    memberships: [orgMembership],
  };
}

/**
 * فهرست حساب‌های آزمایشی واقعی ثبت‌شده در پایگاه‌داده محلی PostgreSQL جهت تست سریع در محیط توسعه
 */
export const REAL_DEV_CREDENTIALS = [
  {
    email: 'admin@gapji.dev',
    mobile: '09120000001',
    role: 'admin' as UserRole,
    roleLabel: 'مدیر ارشد سامانه (ادمین)',
    fullName: 'مدیر ارشد گپ‌جی',
  },
  {
    email: 'marketing@gapji.dev',
    mobile: '09120000002',
    role: 'marketing_manager' as UserRole,
    roleLabel: 'مدیر مارکتینگ',
    fullName: 'سارا راد (مدیر مارکتینگ)',
  },
  {
    email: 'campaign@gapji.dev',
    mobile: '09120000003',
    role: 'campaign_manager' as UserRole,
    roleLabel: 'کارشناس کمپین (کمپین‌چی)',
    fullName: 'امیر نوری (کمپین‌چی)',
  },
  {
    email: 'sales@gapji.dev',
    mobile: '09120000004',
    role: 'sales_agent' as UserRole,
    roleLabel: 'کارشناس فروش',
    fullName: 'نیما باقری (کارشناس فروش)',
  },
  {
    email: 'content@gapji.dev',
    mobile: '09120000005',
    role: 'content_creator' as UserRole,
    roleLabel: 'کارشناس محتوا و وبینار',
    fullName: 'مینا صادقی (تولید محتوا)',
  },
  {
    email: 'client@gapji.dev',
    mobile: '09120000006',
    role: 'client' as UserRole,
    roleLabel: 'کارفرما (فقط‌خواندنی)',
    fullName: 'رضا بهرامی (کارفرما)',
  },
  {
    email: 'inactive@gapji.dev',
    mobile: '09120000007',
    role: 'campaign_manager' as UserRole,
    roleLabel: 'کاربر غیرفعال (تست رد ورود)',
    fullName: 'کاربر غیرفعال سیستم',
  },
  {
    email: 'ambiguous@gapji.dev',
    mobile: '09120000008',
    role: 'marketing_manager' as UserRole,
    roleLabel: 'چندسازمانی مبهم (تست رد ورود)',
    fullName: 'کاربر با چند عضویت فعال',
  },
];

export const REAL_DEV_PASSWORD = 'Password123!';

/**
 * سرویس ارتباط واقعی با اندپوینت‌های احراز هویت بک‌اند NestJS
 */
export const realAuthService = {
  /**
   * ورود با ایمیل یا موبایل از طریق اندپوینت واقعی POST /api/auth/login
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const normalizedIdentifier = normalizeIdentifier(credentials.identifier);
      const { data } = await api.post<BackendLoginResponseDto>('/auth/login', {
        identifier: normalizedIdentifier,
        password: credentials.password,
      });

      // ذخیره توکن دسترسی منحصراً در حافظه کلاینت (Memory-only)
      setAccessToken(data.accessToken);

      const authUser = mapBackendUserToAuthUser(data.user);
      const defaultOrgId = data.user.organizationId || '00000000-0000-0000-0000-000000000001';
      const activeRole = (data.user.role as UserRole) || 'client';

      return {
        success: true,
        user: authUser,
        requiresOrgSelection: false,
        defaultOrgId,
        activeRole,
      };
    } catch (err: any) {
      let errorMessage = 'اطلاعات ورود نامعتبر است.';
      if (err.response?.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          errorMessage = err.response.data.message.join('، ');
        } else {
          errorMessage = String(err.response.data.message);
        }
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'خطای اتصال به سرور backend (پورت ۳۰۰۱). لطفا از فعال بودن سرور اطمینان حاصل کنید.';
      }

      return {
        success: false,
        errorMessage,
      };
    }
  },

  /**
   * بازیابی نشست پس از رفرش صفحه از طریق اندپوینت POST /api/auth/refresh و HttpOnly Cookie
   */
  async restoreSession(): Promise<{ user: AuthUser; activeOrgId: string; activeRole: UserRole } | null> {
    try {
      // درخواست تمدید توکن با کوکی HttpOnly
      const { data } = await api.post<BackendRefreshResponseDto>('/auth/refresh');
      if (!data?.accessToken) {
        return null;
      }

      setAccessToken(data.accessToken);

      // دریافت پروفایل کاربر جاری
      const meResponse = await api.get<{ user: BackendUserDto }>('/auth/me');
      const authUser = mapBackendUserToAuthUser(meResponse.data.user);
      const activeOrgId = meResponse.data.user.organizationId || '00000000-0000-0000-0000-000000000001';
      const activeRole = (meResponse.data.user.role as UserRole) || 'client';

      return {
        user: authUser,
        activeOrgId,
        activeRole,
      };
    } catch (err) {
      setAccessToken(null);
      return null;
    }
  },

  /**
   * خروج از حساب کاربری از طریق اندپوینت واقعی POST /api/auth/logout
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // نادیده گرفتن خطای خروج از شبکه جهت تضمین پاکسازی استیت کلاینت
    } finally {
      setAccessToken(null);
    }
  },

  /**
   * استعلام مشخصات کاربر جاری
   */
  async getProfile(): Promise<AuthUser | null> {
    try {
      const { data } = await api.get<{ user: BackendUserDto }>('/auth/me');
      return mapBackendUserToAuthUser(data.user);
    } catch {
      return null;
    }
  },
};
