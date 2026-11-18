/**
 * پیکربندی و راهنمای قلم ایران‌سنس (IranSans Typography Configuration)
 * 
 * طبق بررسی سیستم، هیچ‌کدام از فایل‌های فونت ایران‌سنس (.woff2, .woff, .ttf)
 * در مخزن موجود نیستند.
 * 
 * جهت فعال‌سازی فونت، فایل‌های زیر باید در مسیر:
 * apps/web/public/fonts/iransans/
 * قرار گیرند:
 * 1. IRANSansWeb_Light.woff2 (وزن 300)
 * 2. IRANSansWeb.woff2 (وزن 400 - Regular)
 * 3. IRANSansWeb_Medium.woff2 (وزن 500)
 * 4. IRANSansWeb_Bold.woff2 (وزن 700)
 * 5. IRANSansWeb_Black.woff2 (وزن 900)
 * 
 * همچنین ترجیحاً نسخه حاوی ارقام فارسی (IRANSansWeb(FaNum)) برای نمایش صحیح اعداد پیشنهاد می‌شود.
 */

export const IRANSANS_FONT_CONFIG = {
  fontFamily: 'IRANSans',
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    bold: 700,
    black: 900,
  },
  expectedDirectory: 'apps/web/public/fonts/iransans/',
  requiredFiles: [
    'IRANSansWeb_Light.woff2',
    'IRANSansWeb.woff2',
    'IRANSansWeb_Medium.woff2',
    'IRANSansWeb_Bold.woff2',
    'IRANSansWeb_Black.woff2',
  ],
  status: 'PENDING_ASSETS',
  fallbackFonts: [
    'IRANSans',
    'Vazirmatn',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Tahoma',
    'sans-serif',
  ],
};
