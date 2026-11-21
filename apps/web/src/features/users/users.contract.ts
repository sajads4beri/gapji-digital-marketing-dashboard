/**
 * قرارداد سرویس ماژول مدیریت کاربران و نقش‌ها (IUserService)
 * منطبق بر الزامات معماری و مستقل از پیاده‌سازی Mock
 */

import type {
  UserItem,
  UserRole,
  UserFilter,
  InviteUserInput,
  RoleAccessMatrix,
  ResendInvitationResult,
} from './types';

export interface IUserService {
  /**
   * دریافت فهرست تمامی کاربران با قابلیت فیلتر اختیاری
   */
  getAllUsers(filter?: UserFilter): Promise<UserItem[]>;

  /**
   * دریافت مشخصات یک کاربر با شناسه
   */
  getUserById(userId: string): Promise<UserItem | null>;

  /**
   * دریافت ماتریس دسترسی نقش‌ها به عملیات‌های سامانه
   */
  getAccessMatrix(): Promise<RoleAccessMatrix>;

  /**
   * بروزرسانی و ذخیره ماتریس دسترسی نقش‌ها (ویژه ادمین)
   */
  updateAccessMatrix(matrix: Record<string, Record<string, boolean>>): Promise<RoleAccessMatrix>;

  /**
   * دعوت کاربر جدید به سازمان با نقش مشخص
   */
  inviteUser(input: InviteUserInput): Promise<UserItem>;

  /**
   * تغییر نقش کاربری (با رعایت گارد آخرین ادمین فعال)
   */
  changeUserRole(userId: string, newRole: UserRole): Promise<UserItem>;

  /**
   * غیرفعال‌سازی کاربر (با رعایت گارد آخرین ادمین فعال)
   */
  deactivateUser(userId: string): Promise<UserItem>;

  /**
   * فعال‌سازی مجدد کاربر غیرفعال‌شده
   */
  activateUser(userId: string): Promise<UserItem>;

  /**
   * ارسال مجدد دعوت‌نامه (صرفاً برای کاربران با وضعیت invited)
   */
  resendInvitation(userId: string): Promise<ResendInvitationResult>;
}
