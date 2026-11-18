/**
 * ماسک‌کردن شماره موبایل جهت حفظ حریم خصوصی (سند محصول ص ۴ و ۱۷)
 * نمونه: 09123456789 -> 0912***6789
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return '';
  const clean = phone.trim();
  if (clean.length < 8) return clean;
  return `${clean.slice(0, 4)}***${clean.slice(-4)}`;
}

/**
 * نرمال‌سازی شماره موبایل ایرانی به قالب استاندارد ۱۱ رقمی (09xxxxxxxxx)
 */
export function normalizeMobileNumber(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  let clean = raw.trim();
  for (let i = 0; i < 10; i++) {
    clean = clean.replaceAll(persianDigits[i], String(i)).replaceAll(arabicDigits[i], String(i));
  }

  const hasPlus = clean.startsWith('+');
  clean = clean.replace(/\D/g, '');

  if (hasPlus || clean.startsWith('98') || clean.startsWith('0098')) {
    if (clean.startsWith('0098')) {
      clean = clean.substring(4);
    } else if (clean.startsWith('98')) {
      clean = clean.substring(2);
    }
  }

  if (clean.length === 10 && clean.startsWith('9')) {
    clean = '0' + clean;
  }

  return clean;
}
