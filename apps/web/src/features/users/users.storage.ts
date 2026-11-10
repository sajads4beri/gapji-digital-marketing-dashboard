/**
 * لایه ذخیره‌سازی و پایداری داده‌های ماژول کاربران (LocalStorage & Memory Fallback)
 * کلید اصلی ذخیره‌سازی: gapji_users_v1
 */

import type { UserItem } from './types';

export const STORAGE_KEY_USERS = 'gapji_users_v1';
export const STORAGE_KEY_SEEDED = 'gapji_users_seeded_v1';

// حافظه موقت ایزوله جهت سناریوهای SSR، تست‌های خودکار محیط Node.js یا موارد قفل بودن localStorage
let memoryUsers: UserItem[] = [];
let memorySeeded = false;

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * ایجاد داده‌های اولیه ساختگی با تاریخ‌های پویا نسبت به زمان جاری
 * شامل حداقل دو ادمین فعال، مدیر مارکتینگ، کارشناس فروش، کاربر دعوت‌شده و کاربر غیرفعال
 */
export function createInitialUserSeedData(referenceDateInput?: Date | string): UserItem[] {
  const ref = referenceDateInput
    ? typeof referenceDateInput === 'string'
      ? new Date(referenceDateInput)
      : referenceDateInput
    : new Date();

  const baseTime = isNaN(ref.getTime()) ? Date.now() : ref.getTime();
  const msInHour = 3600000;
  const msInDay = 86400000;

  const toIsoAgo = (offsetDays: number, hourOffset = 10) => {
    const d = new Date(baseTime - offsetDays * msInDay);
    d.setHours(hourOffset, 0, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: 'usr_mock_1',
      fullName: 'علی محمدی',
      email: 'ali.mohammadi@gapji.ir',
      phoneNumber: '۰۹۱۲۱۱۱۱۱۱۱',
      role: 'admin',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
      lastLoginAt: new Date(baseTime - 1 * msInHour).toISOString(),
      invitedAt: null,
      createdAt: toIsoAgo(60),
      updatedAt: toIsoAgo(1),
    },
    {
      id: 'usr_mock_2',
      fullName: 'سارا احمدی',
      email: 'sara.ahmadi@gapji.ir',
      phoneNumber: '۰۹۱۲۲۲۲۲۲۲۲',
      role: 'admin',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
      lastLoginAt: toIsoAgo(1, 14),
      invitedAt: null,
      createdAt: toIsoAgo(45),
      updatedAt: toIsoAgo(2),
    },
    {
      id: 'usr_mock_3',
      fullName: 'پرهام رادمنش',
      email: 'parham.rad@gapji.ir',
      phoneNumber: '۰۹۱۲۳۳۳۳۳۳۳',
      role: 'marketing_manager',
      status: 'active',
      avatarUrl: null,
      lastLoginAt: toIsoAgo(2, 9),
      invitedAt: null,
      createdAt: toIsoAgo(30),
      updatedAt: toIsoAgo(3),
    },
    {
      id: 'usr_mock_4',
      fullName: 'مریم حسینی',
      email: 'm.hosseini@gapji.ir',
      phoneNumber: '۰۹۱۲۴۴۴۴۴۴۴',
      role: 'sales_agent',
      status: 'active',
      avatarUrl: null,
      lastLoginAt: toIsoAgo(4, 11),
      invitedAt: null,
      createdAt: toIsoAgo(20),
      updatedAt: toIsoAgo(4),
    },
    {
      id: 'usr_mock_5',
      fullName: 'نیما توکلی',
      email: 'nima.tavakoli@partner.ir',
      phoneNumber: '۰۹۱۲۵۵۵۵۵۵۵',
      role: 'campaign_manager',
      status: 'invited',
      avatarUrl: null,
      lastLoginAt: null,
      invitedAt: toIsoAgo(1, 16),
      createdAt: toIsoAgo(1, 16),
      updatedAt: toIsoAgo(1, 16),
    },
    {
      id: 'usr_mock_6',
      fullName: 'کیان سلطانی',
      email: 'kian.soltani@oldpartner.ir',
      phoneNumber: '۰۹۱۲۶۶۶۶۶۶۶',
      role: 'content_creator',
      status: 'disabled',
      avatarUrl: null,
      lastLoginAt: toIsoAgo(25, 18),
      invitedAt: null,
      createdAt: toIsoAgo(90),
      updatedAt: toIsoAgo(10),
    },
    {
      id: 'usr_mock_7',
      fullName: 'رویا کاظمی',
      email: 'roya.kazemi@clientcorp.ir',
      phoneNumber: '۰۹۱۲۷۷۷۷۷۷۷',
      role: 'client',
      status: 'active',
      avatarUrl: null,
      lastLoginAt: toIsoAgo(5, 12),
      invitedAt: null,
      createdAt: toIsoAgo(15),
      updatedAt: toIsoAgo(5),
    },
  ];
}

/**
 * بازیابی کل کاربران از مخزن ذخیره‌سازی با بارگذاری خودکار Seed در صورت خالی بودن
 */
export function getStoredUsers(): UserItem[] {
  if (isClient()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_USERS);
      const isSeeded = window.localStorage.getItem(STORAGE_KEY_SEEDED);

      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      // اگر قبلاً Seed شده و کاربر به عمد همه را حذف کرده، مجدداً Seed نمی‌شود
      if (isSeeded === 'true') {
        return [];
      }

      // ایجاد داده‌های اولیه
      const seeds = createInitialUserSeedData();
      window.localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(seeds));
      window.localStorage.setItem(STORAGE_KEY_SEEDED, 'true');
      return seeds;
    } catch {
      // در صورت خطای پارس یا قفل بودن Storage به حافظه موقت رجوع می‌شود
    }
  }

  // مدیریت در محیط حافظه (Node / SSR)
  if (!memorySeeded) {
    memoryUsers = createInitialUserSeedData();
    memorySeeded = true;
  }
  return [...memoryUsers];
}

/**
 * یافتن کاربر با شناسه مشخص
 */
export function getStoredUserById(id: string): UserItem | null {
  const users = getStoredUsers();
  return users.find((u) => u.id === id) || null;
}

/**
 * ذخیره فهرست کامل کاربران در مخزن
 */
export function saveStoredUsers(users: UserItem[]): void {
  if (isClient()) {
    try {
      window.localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
      window.localStorage.setItem(STORAGE_KEY_SEEDED, 'true');
      return;
    } catch {
      // fallback
    }
  }
  memoryUsers = [...users];
  memorySeeded = true;
}

/**
 * افزودن کاربر جدید به ابتدای فهرست
 */
export function addStoredUser(user: UserItem): void {
  const current = getStoredUsers();
  const next = [user, ...current];
  saveStoredUsers(next);
}

/**
 * به‌روزرسانی کاربر موجود با مقادیر جدید
 */
export function updateStoredUser(id: string, updates: Partial<UserItem>): UserItem | null {
  const current = getStoredUsers();
  const index = current.findIndex((u) => u.id === id);
  if (index === -1) return null;

  const existing = current[index];
  const updated: UserItem = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const next = [...current];
  next[index] = updated;
  saveStoredUsers(next);
  return updated;
}

/**
 * حذف کاربر از مخزن
 */
export function deleteStoredUser(id: string): boolean {
  const current = getStoredUsers();
  const next = current.filter((u) => u.id !== id);
  if (next.length === current.length) return false;
  saveStoredUsers(next);
  return true;
}

/**
 * پاکسازی و ریست مخزن (جهت استفاده در سناریوهای آزمون خودکار)
 */
export function resetStoredUsers(): void {
  if (isClient()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY_USERS);
      window.localStorage.removeItem(STORAGE_KEY_SEEDED);
    } catch {
      // fallback
    }
  }
  memoryUsers = [];
  memorySeeded = false;
}
