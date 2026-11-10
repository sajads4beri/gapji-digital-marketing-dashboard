/**
 * تعاریف و مدل‌های داده ماژول ورود و مدیریت نشست کاربری (Authentication & Session)
 * مرجع محصول: Marketing Platform – Phase 1: Frontend Pages (صفحات ۶ و ۲۶ تا ۲۹)
 */

import type { UserRole, UserItem } from '../users/types';

/**
 * مدل عضویت کاربر در یک سازمان مشخص (سازمان‌های مجاز کاربر)
 * طبق صفحه ۶ سند: «لیست کارت‌های سازمان با نام و نقش کاربر در آن»
 */
export interface UserOrgMembership {
  orgId: string;
  orgName: string;
  role: UserRole;
  plan?: string;
  logoUrl?: string;
  isDefault?: boolean;
}

/**
 * مدل کاربر احرازهویت‌شده به همراه فهرست سازمان‌های در دسترس او
 */
export interface AuthUser extends UserItem {
  memberships: UserOrgMembership[];
}

/**
 * وضعیت نشست فعال کاربر در کلاینت
 */
export interface ActiveSession {
  user: AuthUser;
  activeOrgId: string;
  activeRole: UserRole;
  token?: string; // شبیه‌سازی توکن نشست کلاینت
  lastActiveAt: string;
}

/**
 * ورودی فرم لاگین (پشتیبانی همزمان از ایمیل یا شماره موبایل)
 */
export interface LoginCredentials {
  identifier: string; // ایمیل یا شماره موبایل
  password: string;
}

/**
 * نتیجه پردازش عملیات ورود Mock
 */
export type LoginResult =
  | {
      success: true;
      user: AuthUser;
      requiresOrgSelection: boolean;
      defaultOrgId: string;
      activeRole: UserRole;
    }
  | {
      success: false;
      errorMessage: string;
    };

/**
 * ورودی درخواست بازیابی رمز عبور
 */
export interface ForgotPasswordInput {
  identifier: string; // ایمیل یا موبایل
}

/**
 * نتیجه درخواست بازیابی رمز عبور (شبیه‌سازی‌شده)
 */
export interface ForgotPasswordResult {
  success: boolean;
  message: string;
  destinationType: 'email' | 'mobile';
  maskedDestination: string;
}
