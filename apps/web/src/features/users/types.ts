/**
 * تعاریف و مدل‌های داده ماژول مدیریت کاربران و نقش‌ها (Users & Roles Management)
 * مرجع محصول: Marketing Platform – Phase 1: Frontend Pages (صفحه ۲۳)
 */

// ۱. نقش‌های کاربری (User Roles)
export type UserRole =
  | 'admin'
  | 'marketing_manager'
  | 'campaign_manager'
  | 'sales_agent'
  | 'content_creator'
  | 'client';

export const USER_ROLES: UserRole[] = [
  'admin',
  'marketing_manager',
  'campaign_manager',
  'sales_agent',
  'content_creator',
  'client',
];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'مدیر ارشد سامانه (ادمین)',
  marketing_manager: 'مدیر مارکتینگ',
  campaign_manager: 'کارشناس کمپین (کمپین‌چی)',
  sales_agent: 'کارشناس فروش',
  content_creator: 'کارشناس محتوا و وبینار',
  client: 'کارفرما (فقط‌خواندنی)',
};

export const USER_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'دسترسی کامل به تمامی بخش‌ها، تنظیمات سازمان و مدیریت کاربران',
  marketing_manager: 'مدیریت و تحلیل کمپین‌ها، هزینه‌ها، گزارش‌ها و شاخص‌های کلان',
  campaign_manager: 'ساخت و بهینه‌سازی کمپین‌ها، ثبت هزینه‌ها و ردیابی UTM',
  sales_agent: 'مدیریت سرنخ‌ها، ثبت تماس‌ها، پیگیری مشتریان و پیشبرد قراردادها',
  content_creator: 'مدیریت محتوا، وبینارها، تسک‌های اجرایی و رویدادها',
  client: 'مشاهده داشبورد اجرایی و گزارش‌های نهایی با دسترسی فقط‌خواندنی',
};

// ۲. وضعیت‌های کاربری (User Statuses)
export type UserStatus = 'active' | 'invited' | 'disabled';

export const USER_STATUSES: UserStatus[] = ['active', 'invited', 'disabled'];

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: 'فعال',
  invited: 'دعوت‌شده',
  disabled: 'غیرفعال',
};

export const USER_STATUS_STYLES: Record<
  UserStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  active: {
    label: 'فعال',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  invited: {
    label: 'دعوت‌شده',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  disabled: {
    label: 'غیرفعال',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
};

// ۳. موجودیت اصلی کاربر (UserItem)
export interface UserItem {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  lastLoginAt?: string | null; // تاریخ آخرین ورود به فرمت ISO 8601 یا null
  invitedAt?: string | null;   // تاریخ ارسال دعوت‌نامه به فرمت ISO 8601 یا null
  createdAt: string;           // زمان ایجاد به فرمت ISO 8601
  updatedAt: string;           // زمان آخرین به‌روزرسانی به فرمت ISO 8601
}

// ۴. مدل‌های ورودی و فیلترها (Inputs & Filters)
export interface UserFilter {
  search?: string;
  role?: UserRole | 'all';
  status?: UserStatus | 'all';
}

export interface InviteUserInput {
  email: string;
  role: UserRole;
  fullName?: string;
  phoneNumber?: string | null;
}

export interface UpdateUserRoleInput {
  userId: string;
  newRole: UserRole;
}

export interface ResendInvitationResult {
  success: boolean;
  sentAt: string;
  message: string;
}

// ۵. مدل‌های ماتریس دسترسی (Role & Permission Matrix)
export type PermissionCategory =
  | 'performance_campaigns' // فضای کاری ۱: عملکرد و کمپین‌ها
  | 'sales_leads'           // فضای کاری ۲: فروش و لید
  | 'tasks_settings';       // فضای کاری ۳: تسک‌ها، دانش و تنظیمات

export const PERMISSION_CATEGORY_LABELS: Record<PermissionCategory, string> = {
  performance_campaigns: 'عملکرد و کمپین‌ها (فضای کاری ۱)',
  sales_leads: 'فروش و سرنخ‌ها (فضای کاری ۲)',
  tasks_settings: 'تسک‌ها، دانش و تنظیمات (فضای کاری ۳ و تنظیمات)',
};

export interface PermissionOperation {
  id: string;
  title: string;
  category: PermissionCategory;
  description?: string;
}

export interface RoleAccessMatrix {
  roles: UserRole[];
  operations: PermissionOperation[];
  matrix: Record<string, Record<UserRole, boolean>>; // operationId -> { role: boolean }
}
