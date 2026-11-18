/**
 * پیاده‌سازی Mock Service ماژول مدیریت کاربران و نقش‌ها (MockUserService)
 * منطبق بر قرارداد IUserService و قواعد کسب‌وکار سند محصول
 */

import {
  UserItem,
  UserRole,
  UserFilter,
  InviteUserInput,
  RoleAccessMatrix,
  ResendInvitationResult,
  USER_ROLES,
  PermissionOperation,
} from './types';
import { IUserService } from './users.contract';
import {
  getStoredUsers,
  getStoredUserById,
  addStoredUser,
  updateStoredUser,
} from './users.storage';

/**
 * نرمال‌سازی ارقام فارسی و عربی برای جستجوی متنی منعطف
 */
function normalizeSearchText(text?: string | null): string {
  if (!text) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = text.toLowerCase();
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(persianDigits[i], String(i)).replaceAll(arabicDigits[i], String(i));
  }
  return res.trim();
}

/**
 * اعتبارسنجی ساختار استاندارد نشانی ایمیل
 */
function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * داده‌های پایه ماتریس دسترسی به تفکیک عملیات و نقش‌های شش‌گانه
 */
const MOCK_OPERATIONS: PermissionOperation[] = [
  {
    id: 'dashboard_view',
    title: 'مشاهده داشبورد اجرایی و آمار کلان',
    category: 'performance_campaigns',
    description: 'دسترسی به شاخص‌های مالی کلان، نمودارهای روند و هشدارهای سیستم',
  },
  {
    id: 'campaigns_manage',
    title: 'مدیریت و ساخت کمپین‌ها',
    category: 'performance_campaigns',
    description: 'ایجاد، ویرایش، تغییر وضعیت و تنظیمات تارگتینگ کمپین‌ها',
  },
  {
    id: 'costs_manage',
    title: 'ثبت و مدیریت هزینه‌های بازاریابی',
    category: 'performance_campaigns',
    description: 'ثبت اسناد هزینه، ویرایش مبالغ، دسته‌بندی و تعیین ارز',
  },
  {
    id: 'data_import',
    title: 'ورود دسته‌ای داده‌ها (Import)',
    category: 'performance_campaigns',
    description: 'بارگذاری فایل‌های اکسل/CSV و نگاشت ستون‌ها به سیستم',
  },
  {
    id: 'leads_view',
    title: 'مشاهده سرنخ‌ها و لیدها',
    category: 'sales_leads',
    description: 'دسترسی به صندوق ورودی لیدها و جزییات پرونده',
  },
  {
    id: 'leads_manage',
    title: 'پیگیری در برد کانبان و تغییر وضعیت لید',
    category: 'sales_leads',
    description: 'جابجایی وضعیت سرنخ‌ها به پیشنهاد، مذاکره، مشتری یا ردشده',
  },
  {
    id: 'leads_calls',
    title: 'ثبت تماس‌های تلفنی و پیگیری‌ها',
    category: 'sales_leads',
    description: 'ثبت نتیجه تماس‌ها و تعیین تاریخ پیگیری بعدی',
  },
  {
    id: 'tasks_manage',
    title: 'مدیریت و انجام تسک‌های کاری',
    category: 'tasks_settings',
    description: 'ایجاد تسک، تخصیص مسئول، بررسی زیرتسک‌ها و چک‌لیست',
  },
  {
    id: 'calendar_view',
    title: 'مشاهده تقویم و رویدادهای بازاریابی',
    category: 'tasks_settings',
    description: 'رویدادهای اجرایی، وبینارها و مهلت‌های مقرر کمپین',
  },
  {
    id: 'org_settings',
    title: 'تنظیمات پایه سازمان',
    category: 'tasks_settings',
    description: 'ویرایش مشخصات کسب‌وکار، واحدهای پولی و تعاریف سیستم',
  },
  {
    id: 'users_manage',
    title: 'مدیریت کاربران، دعوت و تعیین نقش‌ها',
    category: 'tasks_settings',
    description: 'دعوت اعضا، تغییر نقش‌های کاربری و کنترل دسترسی‌ها',
  },
];

const MOCK_ACCESS_MATRIX: Record<string, Record<UserRole, boolean>> = {
  dashboard_view: {
    admin: true,
    marketing_manager: true,
    campaign_manager: true,
    sales_agent: false,
    content_creator: false,
    client: true,
  },
  campaigns_manage: {
    admin: true,
    marketing_manager: true,
    campaign_manager: true,
    sales_agent: false,
    content_creator: false,
    client: false,
  },
  costs_manage: {
    admin: true,
    marketing_manager: true,
    campaign_manager: true,
    sales_agent: false,
    content_creator: false,
    client: false,
  },
  data_import: {
    admin: true,
    marketing_manager: true,
    campaign_manager: true,
    sales_agent: true,
    content_creator: false,
    client: false,
  },
  leads_view: {
    admin: true,
    marketing_manager: true,
    campaign_manager: false,
    sales_agent: true,
    content_creator: false,
    client: false,
  },
  leads_manage: {
    admin: true,
    marketing_manager: true,
    campaign_manager: false,
    sales_agent: true,
    content_creator: false,
    client: false,
  },
  leads_calls: {
    admin: true,
    marketing_manager: true,
    campaign_manager: false,
    sales_agent: true,
    content_creator: false,
    client: false,
  },
  tasks_manage: {
    admin: true,
    marketing_manager: true,
    campaign_manager: true,
    sales_agent: true,
    content_creator: true,
    client: false,
  },
  calendar_view: {
    admin: true,
    marketing_manager: true,
    campaign_manager: true,
    sales_agent: true,
    content_creator: true,
    client: true,
  },
  org_settings: {
    admin: true,
    marketing_manager: false,
    campaign_manager: false,
    sales_agent: false,
    content_creator: false,
    client: false,
  },
  users_manage: {
    admin: true,
    marketing_manager: false,
    campaign_manager: false,
    sales_agent: false,
    content_creator: false,
    client: false,
  },
};

export class MockUserService implements IUserService {
  private delayMs: number;
  private shouldSimulateError = false;

  constructor(delayMs = 80) {
    this.delayMs = delayMs;
  }

  public setDelay(ms: number): void {
    this.delayMs = ms;
  }

  public setSimulateError(enable: boolean): void {
    this.shouldSimulateError = enable;
  }

  private async simulateDelay(): Promise<void> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
    if (this.shouldSimulateError) {
      throw new Error('خطای شبیه‌سازی‌شده در ارتباط با سرویس مدیریت کاربران.');
    }
  }

  /**
   * دریافت فهرست تمامی کاربران با قابلیت فیلتر چندگانه و جستجو
   */
  async getAllUsers(filter?: UserFilter): Promise<UserItem[]> {
    await this.simulateDelay();
    let users = getStoredUsers();

    if (!filter) {
      return [...users];
    }

    // ۱. فیلتر نقش
    if (filter.role && filter.role !== 'all') {
      users = users.filter((u) => u.role === filter.role);
    }

    // ۲. فیلتر وضعیت
    if (filter.status && filter.status !== 'all') {
      users = users.filter((u) => u.status === filter.status);
    }

    // ۳. فیلتر جستجوی متنی (نام، ایمیل، شماره تماس)
    if (filter.search && filter.search.trim()) {
      const q = normalizeSearchText(filter.search);
      users = users.filter((u) => {
        const nameMatch = normalizeSearchText(u.fullName).includes(q);
        const emailMatch = normalizeSearchText(u.email).includes(q);
        const phoneMatch = normalizeSearchText(u.phoneNumber).includes(q);
        return nameMatch || emailMatch || phoneMatch;
      });
    }

    return [...users];
  }

  /**
   * دریافت مشخصات یک کاربر بر اساس شناسه
   */
  async getUserById(userId: string): Promise<UserItem | null> {
    await this.simulateDelay();
    return getStoredUserById(userId);
  }

  /**
   * دریافت ساختار و محتوای ماتریس دسترسی
   */
  async getAccessMatrix(): Promise<RoleAccessMatrix> {
    await this.simulateDelay();
    return {
      roles: [...USER_ROLES],
      operations: [...MOCK_OPERATIONS],
      matrix: { ...MOCK_ACCESS_MATRIX },
    };
  }

  /**
   * دعوت کاربر جدید با نقش معین
   */
  async inviteUser(input: InviteUserInput): Promise<UserItem> {
    await this.simulateDelay();

    // الف) اعتبارسنجی ایمیل
    if (!input.email || !isValidEmail(input.email)) {
      throw new Error('نشانی ایمیل واردشده نامعتبر است.');
    }

    const cleanEmail = input.email.trim().toLowerCase();

    // ب) جلوگیری از دعوت ایمیل تکراری
    const currentUsers = getStoredUsers();
    const existing = currentUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('کاربری با این نشانی ایمیل قبلاً در سامانه ثبت شده است.');
    }

    // ج) اعتبارسنجی نقش
    if (!USER_ROLES.includes(input.role)) {
      throw new Error('نقش کاربری انتخاب‌شده معتبر نیست.');
    }

    const now = new Date().toISOString();
    const newUser: UserItem = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fullName: input.fullName?.trim() || cleanEmail.split('@')[0],
      email: cleanEmail,
      phoneNumber: input.phoneNumber?.trim() || null,
      role: input.role,
      status: 'invited',
      avatarUrl: null,
      lastLoginAt: null,
      invitedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    addStoredUser(newUser);
    return newUser;
  }

  /**
   * تغییر نقش کاربری با رعایت قانون حیاتی آخرین ادمین فعال
   */
  async changeUserRole(userId: string, newRole: UserRole): Promise<UserItem> {
    await this.simulateDelay();

    const targetUser = getStoredUserById(userId);
    if (!targetUser) {
      throw new Error(`کاربر با شناسه ${userId} یافت نشد.`);
    }

    if (!USER_ROLES.includes(newRole)) {
      throw new Error('نقش جدید انتخاب‌شده معتبر نیست.');
    }

    if (targetUser.role === newRole) {
      return targetUser;
    }

    // قانون حیاتی: اگر کاربر ادمین فعال است و قصد خلع نقش ادمین او را داریم
    if (targetUser.role === 'admin' && targetUser.status === 'active' && newRole !== 'admin') {
      const allUsers = getStoredUsers();
      const otherActiveAdmins = allUsers.filter(
        (u) => u.id !== userId && u.role === 'admin' && u.status === 'active'
      );

      if (otherActiveAdmins.length === 0) {
        throw new Error(
          'امکان تغییر نقش آخرین ادمین فعال سامانه وجود ندارد. حداقل یک کاربر ادمین فعال باید در سیستم باقی بماند.'
        );
      }
    }

    const updated = updateStoredUser(userId, { role: newRole });
    if (!updated) {
      throw new Error('خطا در به‌روزرسانی نقش کاربری.');
    }

    return updated;
  }

  /**
   * غیرفعال‌سازی کاربر با رعایت قانون حیاتی آخرین ادمین فعال
   */
  async deactivateUser(userId: string): Promise<UserItem> {
    await this.simulateDelay();

    const targetUser = getStoredUserById(userId);
    if (!targetUser) {
      throw new Error(`کاربر با شناسه ${userId} یافت نشد.`);
    }

    if (targetUser.status === 'disabled') {
      return targetUser;
    }

    // قانون حیاتی: ممانعت از غیرفعال‌سازی آخرین ادمین فعال
    if (targetUser.role === 'admin' && targetUser.status === 'active') {
      const allUsers = getStoredUsers();
      const otherActiveAdmins = allUsers.filter(
        (u) => u.id !== userId && u.role === 'admin' && u.status === 'active'
      );

      if (otherActiveAdmins.length === 0) {
        throw new Error(
          'امکان غیرفعال‌سازی آخرین ادمین فعال سامانه وجود ندارد. حداقل یک کاربر ادمین فعال باید در سیستم باقی بماند.'
        );
      }
    }

    const updated = updateStoredUser(userId, { status: 'disabled' });
    if (!updated) {
      throw new Error('خطا در غیرفعال‌سازی کاربر.');
    }

    return updated;
  }

  /**
   * فعال‌سازی مجدد کاربر
   */
  async activateUser(userId: string): Promise<UserItem> {
    await this.simulateDelay();

    const targetUser = getStoredUserById(userId);
    if (!targetUser) {
      throw new Error(`کاربر با شناسه ${userId} یافت نشد.`);
    }

    if (targetUser.status === 'active') {
      return targetUser;
    }

    const updated = updateStoredUser(userId, { status: 'active' });
    if (!updated) {
      throw new Error('خطا در فعال‌سازی کاربر.');
    }

    return updated;
  }

  /**
   * ارسال مجدد دعوت‌نامه (صرفاً برای وضعیت invited)
   */
  async resendInvitation(userId: string): Promise<ResendInvitationResult> {
    await this.simulateDelay();

    const targetUser = getStoredUserById(userId);
    if (!targetUser) {
      throw new Error(`کاربر با شناسه ${userId} یافت نشد.`);
    }

    if (targetUser.status !== 'invited') {
      throw new Error('ارسال مجدد دعوت‌نامه صرفاً برای کاربران با وضعیت «دعوت‌شده» امکان‌پذیر است.');
    }

    const now = new Date().toISOString();
    updateStoredUser(userId, { invitedAt: now });

    return {
      success: true,
      sentAt: now,
      message: `دعوت‌نامه مجدد با موفقیت برای نشانی ${targetUser.email} ارسال گردید.`,
    };
  }
}

export const userService = new MockUserService();
