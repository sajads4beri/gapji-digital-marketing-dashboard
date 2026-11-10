/**
 * سرویس آزمایشی (Mock Authentication Service) و نگهداری نشست ورود و سازمان‌ها
 * کلیدهای ذخیره‌سازی:
 *  - gapji_auth_session_v1: نشست فعال کاربر
 *  - gapji_last_org_id: آخرین سازمان انتخاب‌شده (مطابق الزام صفحه ۶ سند محصول)
 */

import type { UserRole } from '../users/types';
import type {
  AuthUser,
  UserOrgMembership,
  ActiveSession,
  LoginCredentials,
  LoginResult,
  ForgotPasswordResult,
} from './types';

export const STORAGE_KEY_AUTH_SESSION = 'gapji_auth_session_v1';
export const STORAGE_KEY_LAST_ORG = 'gapji_last_org_id';

// متغیرهای پشتیبان حافظه برای محیط Node.js / SSR
let memorySession: ActiveSession | null = null;
let memoryLastOrgId: string | null = null;

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

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

/**
 * فهرست حساب‌های آزمایشی توسعه با ارتباط واقع‌گرایانه بین کاربر و سازمان‌ها
 * توجه: این داده‌ها صرفاً جهت تست فرانت‌اند در فاز ۱ تعریف شده‌اند و جزو الزام مستند محصول نیستند.
 */
export const MOCK_DEVELOPMENT_USERS: AuthUser[] = [
  {
    id: 'usr_mock_1',
    fullName: 'علی محمدی',
    email: 'ali.mohammadi@gapji.ir',
    phoneNumber: '09121111111',
    role: 'admin',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
    lastLoginAt: '2026-04-10T12:00:00.000Z',
    memberships: [
      {
        orgId: 'org_gapji_1',
        orgName: 'شرکت فناوری گپ‌جی',
        role: 'admin',
        plan: 'سازمانی',
        logoUrl: '',
        isDefault: true,
      },
      {
        orgId: 'org_holding_2',
        orgName: 'هلدینگ تجارت دیجیتال',
        role: 'marketing_manager',
        plan: 'پیشرفته',
        logoUrl: '',
      },
    ],
  },
  {
    id: 'usr_mock_2',
    fullName: 'سارا احمدی',
    email: 'sara.ahmadi@gapji.ir',
    phoneNumber: '09122222222',
    role: 'admin',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-03-05T11:00:00.000Z',
    lastLoginAt: '2026-04-09T08:30:00.000Z',
    memberships: [
      {
        orgId: 'org_gapji_1',
        orgName: 'شرکت فناوری گپ‌جی',
        role: 'admin',
        plan: 'سازمانی',
        isDefault: true,
      },
    ],
  },
  {
    id: 'usr_mock_3',
    fullName: 'پرهام رادمنش',
    email: 'parham.rad@gapji.ir',
    phoneNumber: '09123333333',
    role: 'campaign_manager',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-03-10T14:00:00.000Z',
    lastLoginAt: '2026-04-08T15:00:00.000Z',
    memberships: [
      {
        orgId: 'org_gapji_1',
        orgName: 'شرکت فناوری گپ‌جی',
        role: 'campaign_manager',
        plan: 'سازمانی',
        isDefault: true,
      },
    ],
  },
  {
    id: 'usr_mock_4',
    fullName: 'مریم کریمی',
    email: 'maryam.karimi@gapji.ir',
    phoneNumber: '09124444444',
    role: 'sales_agent',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=60',
    createdAt: '2026-02-15T11:00:00.000Z',
    updatedAt: '2026-03-12T16:00:00.000Z',
    lastLoginAt: '2026-04-07T09:00:00.000Z',
    memberships: [
      {
        orgId: 'org_gapji_1',
        orgName: 'شرکت فناوری گپ‌جی',
        role: 'sales_agent',
        plan: 'سازمانی',
        isDefault: true,
      },
      {
        orgId: 'org_pars_3',
        orgName: 'فروشگاه آنلاین پارس',
        role: 'sales_agent',
        plan: 'پایه',
      },
    ],
  },
  {
    id: 'usr_mock_5',
    fullName: 'مهدی ناصری',
    email: 'client@gapji.ir',
    phoneNumber: '09126666666',
    role: 'client',
    status: 'active',
    avatarUrl: null,
    createdAt: '2026-03-01T12:00:00.000Z',
    updatedAt: '2026-03-15T17:00:00.000Z',
    lastLoginAt: '2026-04-05T11:00:00.000Z',
    memberships: [
      {
        orgId: 'org_gapji_1',
        orgName: 'شرکت فناوری گپ‌جی',
        role: 'client',
        plan: 'سازمانی',
        isDefault: true,
      },
    ],
  },
  {
    id: 'usr_mock_disabled',
    fullName: 'کاربر تعلیق‌شده',
    email: 'disabled@gapji.ir',
    phoneNumber: '09120000000',
    role: 'campaign_manager',
    status: 'disabled',
    avatarUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    memberships: [
      {
        orgId: 'org_gapji_1',
        orgName: 'شرکت فناوری گپ‌جی',
        role: 'campaign_manager',
      },
    ],
  },
];

// رمز عبور ثابت محیط توسعه برای تمام حساب‌های تستی
export const MOCK_DEFAULT_PASSWORD = 'password123';

class MockAuthService {
  /**
   * بررسی و بازیابی نشست فعال از LocalStorage
   */
  getActiveSession(): ActiveSession | null {
    if (isClient()) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY_AUTH_SESSION);
        if (raw) {
          return JSON.parse(raw);
        }
      } catch (e) {
        console.warn('Error reading auth session from storage', e);
      }
    }
    return memorySession;
  }

  /**
   * ذخیره نشست فعال در LocalStorage
   */
  saveActiveSession(session: ActiveSession): void {
    memorySession = session;
    if (isClient()) {
      try {
        window.localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(session));
      } catch (e) {
        console.warn('Error saving auth session to storage', e);
      }
    }
  }

  /**
   * پاکسازی نشست جاری (خروج از حساب)
   */
  clearActiveSession(): void {
    memorySession = null;
    if (isClient()) {
      try {
        window.localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
      } catch (e) {
        console.warn('Error clearing auth session', e);
      }
    }
  }

  /**
   * بازیابی شناسه آخرین سازمان انتخاب‌شده
   */
  getLastSelectedOrgId(): string | null {
    if (isClient()) {
      try {
        return window.localStorage.getItem(STORAGE_KEY_LAST_ORG);
      } catch {
        return null;
      }
    }
    return memoryLastOrgId;
  }

  /**
   * ذخیره شناسه آخرین سازمان انتخاب‌شده (مطابق الزام صفحه ۶ سند محصول)
   */
  saveLastSelectedOrgId(orgId: string): void {
    memoryLastOrgId = orgId;
    if (isClient()) {
      try {
        window.localStorage.setItem(STORAGE_KEY_LAST_ORG, orgId);
      } catch (e) {
        console.warn('Error saving last selected org', e);
      }
    }
  }

  /**
   * پردازش ورود کاربر با شبیه‌سازی تأخیر شبکه (۴۰۰ میلی‌ثانیه)
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    // شبیه‌سازی تاخیر طبیعی شبکه جهت تست Spinner
    await new Promise((resolve) => setTimeout(resolve, 400));

    const normalized = normalizeIdentifier(credentials.identifier);
    if (!normalized) {
      return {
        success: false,
        errorMessage: 'لطفاً ایمیل یا شماره موبایل خود را وارد نمایید.',
      };
    }

    if (!credentials.password) {
      return {
        success: false,
        errorMessage: 'لطفاً رمز عبور خود را وارد نمایید.',
      };
    }

    // جستجوی کاربر در لیست حساب‌های تستی
    const user = MOCK_DEVELOPMENT_USERS.find((u) => {
      const emailNorm = normalizeIdentifier(u.email);
      const phoneNorm = u.phoneNumber ? normalizeIdentifier(u.phoneNumber) : '';
      return emailNorm === normalized || phoneNorm === normalized;
    });

    if (!user) {
      return {
        success: false,
        errorMessage: 'کاربری با این مشخصات در سامانه یافت نشد.',
      };
    }

    if (user.status === 'disabled') {
      return {
        success: false,
        errorMessage: 'حساب کاربری شما غیرفعال شده است. لطفاً با مدیر سامانه تماس بگیرید.',
      };
    }

    // اعتبارسنجی رمز عبور (رمز تستی: password123 یا ۱۲۳۴۵۶ برای راحتی تست)
    if (
      credentials.password !== MOCK_DEFAULT_PASSWORD &&
      credentials.password !== '123456'
    ) {
      return {
        success: false,
        errorMessage: 'رمز عبور وارد شده اشتباه است.',
      };
    }

    // بررسی چندسازمانی بودن کاربر طبق صفحه ۶ سند محصول
    const memberships = user.memberships || [];
    const isMultiOrg = memberships.length > 1;

    // بررسی آخرین سازمان ذخیره‌شده
    const lastOrgId = this.getLastSelectedOrgId();
    let initialOrg: UserOrgMembership | undefined;

    if (lastOrgId) {
      initialOrg = memberships.find((m) => m.orgId === lastOrgId);
    }
    if (!initialOrg) {
      initialOrg = memberships.find((m) => m.isDefault) || memberships[0];
    }

    const activeOrgId = initialOrg ? initialOrg.orgId : '';
    const activeRole = initialOrg ? initialOrg.role : user.role;

    // ذخیره نشست فعال
    this.saveActiveSession({
      user,
      activeOrgId,
      activeRole,
      token: `mock_jwt_${user.id}_${Date.now()}`,
      lastActiveAt: new Date().toISOString(),
    });

    return {
      success: true,
      user,
      requiresOrgSelection: isMultiOrg && !lastOrgId,
      defaultOrgId: activeOrgId,
      activeRole,
    };
  }

  /**
   * انتخاب سازمان توسط کاربر چندسازمانی
   */
  selectOrganization(orgId: string): boolean {
    const session = this.getActiveSession();
    if (!session) return false;

    const membership = session.user.memberships.find((m) => m.orgId === orgId);
    if (!membership) return false;

    // ذخیره به عنوان آخرین سازمان انتخاب‌شده (مطابق سند)
    this.saveLastSelectedOrgId(orgId);

    // به‌روزرسانی نشست فعال با سازمان جدید و نقش متناظر با آن سازمان
    this.saveActiveSession({
      ...session,
      activeOrgId: membership.orgId,
      activeRole: membership.role,
      lastActiveAt: new Date().toISOString(),
    });

    return true;
  }

  /**
   * شبیه‌سازی ارسال لینک بازیابی رمز عبور (صفحه ۶ سند محصول)
   */
  async sendPasswordRecoveryLink(identifier: string): Promise<ForgotPasswordResult> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const normalized = normalizeIdentifier(identifier);
    if (!normalized) {
      return {
        success: false,
        message: 'لطفاً ایمیل یا شماره موبایل حساب خود را وارد نمایید.',
        destinationType: 'email',
        maskedDestination: '',
      };
    }

    const isEmail = normalized.includes('@');
    const isPhone = /^(\+98|0)?9\d{9}$/.test(normalized);

    if (!isEmail && !isPhone) {
      return {
        success: false,
        message: 'فرمت ایمیل یا شماره موبایل معتبر نمی‌باشد.',
        destinationType: isEmail ? 'email' : 'mobile',
        maskedDestination: '',
      };
    }

    // ایجاد مقصد ماسک‌شده جهت امنیت
    let masked = normalized;
    if (isEmail) {
      const [localPart, domain] = normalized.split('@');
      const visible = localPart.slice(0, 2);
      masked = `${visible}***@${domain}`;
    } else {
      const last4 = normalized.slice(-4);
      masked = `۰۹۱۲***${last4}`;
    }

    return {
      success: true,
      message: isEmail
        ? `لینک بازیابی رمز عبور به ایمیل ${masked} ارسال گردید.`
        : `پیامک حاوی لینک بازیابی به شماره ${masked} ارسال گردید.`,
      destinationType: isEmail ? 'email' : 'mobile',
      maskedDestination: masked,
    };
  }
}

export const authService = new MockAuthService();
