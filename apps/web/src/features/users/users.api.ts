/**
 * سرویس ارتباط واقعی با اندپوینت‌های مدیریت کاربران و عضویت سازمان
 * متصل به بک‌اند واقعی NestJS و پایگاه داده PostgreSQL
 * منطبق بر قرارداد IUserService و نیازمندی‌های صفحه ۲۳ سند محصول
 */

import { api } from '@/lib/api';
import {
  UserItem,
  UserRole,
  UserFilter,
  InviteUserInput,
  RoleAccessMatrix,
  ResendInvitationResult,
} from './types';
import { IUserService } from './users.contract';

function extractErrorMessage(error: any, fallback: string): string {
  if (error?.response?.data?.message) {
    const msg = error.response.data.message;
    if (Array.isArray(msg)) {
      return msg.join('، ');
    }
    return String(msg);
  }
  if (error?.message) {
    return error.message;
  }
  return fallback;
}

export class RealUserService implements IUserService {
  /**
   * دریافت فهرست اعضای سازمان جاری از اندپوینت واقعی GET /api/users
   */
  async getAllUsers(filter?: UserFilter): Promise<UserItem[]> {
    try {
      const params: Record<string, string> = {};
      if (filter?.role && filter.role !== 'all') {
        params.role = filter.role;
      }
      if (filter?.status && filter.status !== 'all') {
        params.status = filter.status;
      }
      if (filter?.search && filter.search.trim()) {
        params.search = filter.search.trim();
      }

      const { data } = await api.get<UserItem[]>('/users', { params });
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در بارگذاری فهرست کاربران از سرور'));
    }
  }

  /**
   * دریافت مشخصات یک کاربر بر اساس شناسه از اندپوینت GET /api/users/:id
   */
  async getUserById(userId: string): Promise<UserItem | null> {
    try {
      const { data } = await api.get<UserItem>(`/users/${userId}`);
      return data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        return null;
      }
      throw new Error(extractErrorMessage(err, 'خطا در واکشی مشخصات کاربر'));
    }
  }

  /**
   * دریافت ماتریس سطوح دسترسی نقش‌ها از اندپوینت GET /api/users/access-matrix
   */
  async getAccessMatrix(): Promise<RoleAccessMatrix> {
    try {
      const { data } = await api.get<RoleAccessMatrix>('/users/access-matrix');
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در بارگذاری ماتریس دسترسی‌ها'));
    }
  }

  /**
   * دعوت کاربر جدید با اندپوینت POST /api/users/invite
   */
  async inviteUser(input: InviteUserInput): Promise<UserItem> {
    try {
      const { data } = await api.post<{ user: UserItem; message: string; invitationToken?: string }>(
        '/users/invite',
        {
          email: input.email.trim(),
          role: input.role,
          fullName: input.fullName?.trim(),
          phoneNumber: input.phoneNumber?.trim(),
        },
      );
      return data.user;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در ارسال دعوت‌نامه کاربر'));
    }
  }

  /**
   * تغییر نقش سازمانی کاربر با اندپوینت PATCH /api/users/:id/role
   */
  async changeUserRole(userId: string, newRole: UserRole): Promise<UserItem> {
    try {
      const { data } = await api.patch<UserItem>(`/users/${userId}/role`, {
        newRole,
      });
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در تغییر نقش کاربر'));
    }
  }

  /**
   * غیرفعال‌سازی کاربر با اندپوینت PATCH /api/users/:id/deactivate
   */
  async deactivateUser(userId: string): Promise<UserItem> {
    try {
      const { data } = await api.patch<UserItem>(`/users/${userId}/deactivate`);
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در غیرفعال‌سازی حساب کاربر'));
    }
  }

  /**
   * فعال‌سازی مجدد کاربر با اندپوینت PATCH /api/users/:id/activate
   */
  async activateUser(userId: string): Promise<UserItem> {
    try {
      const { data } = await api.patch<UserItem>(`/users/${userId}/activate`);
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در فعال‌سازی مجدد کاربر'));
    }
  }

  /**
   * ارسال مجدد دعوت‌نامه با اندپوینت POST /api/users/:id/resend-invite
   */
  async resendInvitation(userId: string): Promise<ResendInvitationResult> {
    try {
      const { data } = await api.post<ResendInvitationResult>(`/users/${userId}/resend-invite`);
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در ارسال مجدد دعوت‌نامه'));
    }
  }
}

export const userService: IUserService = new RealUserService();
