import type { UserRole } from '@/features/users/types';
import { canAccessRoute } from '@/lib/permissions';

/**
 * اعتبارسنجی مقصد ریدایرکت (callbackUrl) مطابق ماتریس دسترسی و جلوگیری از Open Redirect
 */
export function getValidatedRedirectUrl(targetUrl: string | null, role: UserRole | null): string {
  if (!targetUrl) return '/';
  // امنیت: جلوگیری از Open Redirect (تنها مسیرهای نسبی مجاز هستند)
  if (!targetUrl.startsWith('/') || targetUrl.startsWith('//') || targetUrl.includes('://')) {
    return '/';
  }
  // جلوگیری از ایجاد حلقه با روت‌های Auth
  if (targetUrl === '/login' || targetUrl === '/select-org') {
    return '/';
  }
  // بررسی دسترسی بر اساس نقش
  if (role && canAccessRoute(targetUrl, role)) {
    return targetUrl;
  }
  return '/';
}
