/**
 * ابزارهای کمکی عمومی برای Mock Serviceها
 */

export class MockServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'MockServiceError';
    this.statusCode = statusCode;
  }
}

/**
 * شبیه‌سازی تاخیر پاسخ شبکه
 */
export async function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * تولید شناسه یکتا و ساختگی بدون وابستگی به سرور
 */
export function generateId(prefix = 'id'): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${randomPart}`;
}

/**
 * بررسی اجرای کد در محیط مرورگر (کلاینت) جهت جلوگیری از باگ SSR
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * خواندن امن داده از localStorage با کنترل خطا و فالبک پیش‌فرض
 */
export function getStoredItem<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`[MockUtils] Error reading localStorage key "${key}":`, error);
    return fallback;
  }
}

/**
 * ذخیره امن داده در localStorage
 */
export function setStoredItem<T>(key: string, value: T): boolean {
  if (!isBrowser()) {
    return false;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[MockUtils] Error writing to localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * حذف کلید از localStorage
 */
export function removeStoredItem(key: string): boolean {
  if (!isBrowser()) {
    return false;
  }
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
