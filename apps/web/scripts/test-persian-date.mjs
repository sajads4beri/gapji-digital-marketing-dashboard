/**
 * تست مستقل، کامل و قابل اجرای مجدد موتور تقویم شمسی
 * اجرا: node apps/web/scripts/test-persian-date.mjs
 * بدون نیاز به نصب هیچ‌گونه کتابخانه خارجی
 */

import assert from 'node:assert';
import {
  isoToJalali,
  jalaliToIso,
  formatPersianDate,
  getPersianMonthDays,
  getPersianMonthStartWeekday,
  isPersianLeapYear,
  compareIsoDates,
  isValidIsoDate,
  getTodayIsoDate,
  PERSIAN_MONTH_NAMES,
} from '../src/lib/persian-date.ts';

console.log('--- آغاز اجرای تست‌های موتور تقویم شمسی ---');

// ۱. بررسی سال‌های کبیسه و غیرکبیسه
console.log('۱. تست سال‌های کبیسه و غیرکبیسه...');
assert.strictEqual(isPersianLeapYear(1399), true, 'سال ۱۳۹۹ باید کبیسه باشد');
assert.strictEqual(isPersianLeapYear(1400), false, 'سال ۱۴۰۰ نباید کبیسه باشد');
assert.strictEqual(isPersianLeapYear(1401), false, 'سال ۱۴۰۱ نباید کبیسه باشد');
assert.strictEqual(isPersianLeapYear(1402), false, 'سال ۱۴۰۲ نباید کبیسه باشد');
assert.strictEqual(isPersianLeapYear(1403), true, 'سال ۱۴۰۳ باید کبیسه باشد');
assert.strictEqual(isPersianLeapYear(1404), false, 'سال ۱۴۰۴ نباید کبیسه باشد');
assert.strictEqual(isPersianLeapYear(1408), true, 'سال ۱۴۰۸ باید کبیسه باشد');
console.log('   ✓ وضعیت سال‌های کبیسه تایید شد.');

// ۲. تست روز ۳۰ اسفند و طول ماه‌ها
console.log('۲. تست روز ۳۰ اسفند و طول ماه‌ها...');
assert.strictEqual(getPersianMonthDays(1402, 12), 29, 'اسفند ۱۴۰۲ باید ۲۹ روزه باشد');
assert.strictEqual(getPersianMonthDays(1403, 12), 30, 'اسفند ۱۴۰۳ (کبیسه) باید ۳۰ روزه باشد');
assert.strictEqual(getPersianMonthDays(1403, 1), 31, 'فروردین باید ۳۱ روزه باشد');
assert.strictEqual(getPersianMonthDays(1403, 6), 31, 'شهریور باید ۳۱ روزه باشد');
assert.strictEqual(getPersianMonthDays(1403, 7), 30, 'مهر باید ۳۰ روزه باشد');

const iso30Esfand = jalaliToIso(1403, 12, 30);
assert.strictEqual(iso30Esfand, '2025-03-20', 'روز ۳۰ اسفند ۱۴۰۳ باید ۲۰ مارس ۲۰۲۵ باشد');
const back30Esfand = isoToJalali(iso30Esfand);
assert.strictEqual(back30Esfand.year, 1403);
assert.strictEqual(back30Esfand.month, 12);
assert.strictEqual(back30Esfand.day, 30);
console.log('   ✓ تست روز ۳۰ اسفند و طول ماه‌ها با موفقیت پاس شد.');

// ۳. تست مرز تغییر فصل (۳۱ شهریور به ۱ مهر)
console.log('۳. تست مرز ۳۱ شهریور به ۱ مهر...');
const iso31Shahrivar = jalaliToIso(1403, 6, 31);
const iso1Mehr = jalaliToIso(1403, 7, 1);
assert.strictEqual(iso31Shahrivar, '2024-09-21', '۳۱ شهریور ۱۴۰۳ باید ۲۱ سپتامبر ۲۰۲۴ باشد');
assert.strictEqual(iso1Mehr, '2024-09-22', '۱ مهر ۱۴۰۳ باید ۲۲ سپتامبر ۲۰۲۴ باشد');
assert.strictEqual(
  new Date(iso1Mehr).getTime() - new Date(iso31Shahrivar).getTime(),
  86400000,
  'فاصله ۳۱ شهریور و ۱ مهر باید دقیقاً ۱ روز (۸۶۴۰۰۰۰۰ میلی‌ثانیه) باشد',
);
console.log('   ✓ مرز ۳۱ شهریور به ۱ مهر تایید شد.');

// ۴. تست مقادیر نامعتبر و رفتارهای خطا
console.log('۴. تست ورودی‌های نامعتبر...');
assert.strictEqual(isValidIsoDate(''), false);
assert.strictEqual(isValidIsoDate(null), false);
assert.strictEqual(isValidIsoDate('invalid-date'), false);
assert.strictEqual(isValidIsoDate('2024-13-45'), false);
assert.strictEqual(isValidIsoDate('2024-05-10'), true);

const invalidJalali = isoToJalali('bad-string');
assert.strictEqual(invalidJalali.isValid, false, 'تاریخ نامعتبر نباید valid باشد');
assert.strictEqual(formatPersianDate(''), '—', 'تاریخ خالی باید خط تیره برگرداند');
assert.strictEqual(formatPersianDate('bad-date'), '—', 'تاریخ نامعتبر باید خط تیره برگرداند');
console.log('   ✓ مدیریت ورودی‌های نامعتبر تایید شد.');

// ۵. تست روز هفته شروع ماه (هفته از شنبه = ۰)
console.log('۵. تست روز هفته شروع ماه (شنبه تا جمعه)...');
// اول فروردین ۱۴۰۳ در روز چهارشنبه (index 4) واقع شده است: شنبه=0, یکشنبه=1, دوشنبه=2, سه‌شنبه=3, چهارشنبه=4
const startW1403_1 = getPersianMonthStartWeekday(1403, 1);
assert.strictEqual(startW1403_1, 4, 'روز اول فروردین ۱۴۰۳ باید چهارشنبه (شاخص ۴) باشد');

// اول فروردین ۱۴۰۴ در روز جمعه (index 6) واقع شده است
const startW1404_1 = getPersianMonthStartWeekday(1404, 1);
assert.strictEqual(startW1404_1, 6, 'روز اول فروردین ۱۴۰۴ باید جمعه (شاخص ۶) باشد');
console.log('   ✓ شروع هفته از شنبه تایید شد.');

// ۶. تست رفت و برگشت ۱۱٬۳۲۳ روز متوالی (۳۱ سال پیاپی از ۱۳۹۰ تا ۱۴۲۰)
console.log('۶. تست جامع رفت و برگشت ۱۱٬۳۲۳ روز متوالی (سال‌های ۱۳۹۰ تا ۱۴۲۰)...');
let totalTested = 0;
for (let y = 1390; y <= 1420; y++) {
  const isLeap = isPersianLeapYear(y);
  for (let m = 1; m <= 12; m++) {
    const maxD = m <= 6 ? 31 : m <= 11 ? 30 : isLeap ? 30 : 29;
    for (let d = 1; d <= maxD; d++) {
      totalTested++;
      const iso = jalaliToIso(y, m, d);
      const back = isoToJalali(iso);
      if (!back.isValid || back.year !== y || back.month !== m || back.day !== d) {
        throw new Error(
          `عدم تطابق در تاریخ ${y}/${m}/${d}: ISO=${iso}, بازگشت=${back.year}/${back.month}/${back.day}`,
        );
      }
    }
  }
}
console.log(`   ✓ تمامی ${totalTested.toLocaleString('fa-IR')} روز با موفقیت ۱۰۰٪ تست شدند.`);

// ۷. تست مقایسه تاریخ‌ها و تایم‌زون
console.log('۷. تست مقایسه تاریخ‌ها و تاریخ امروز...');
assert.strictEqual(compareIsoDates('2024-05-10', '2024-05-15'), -1);
assert.strictEqual(compareIsoDates('2024-05-15', '2024-05-15'), 0);
assert.strictEqual(compareIsoDates('2024-05-20', '2024-05-15'), 1);

const todayStr = getTodayIsoDate();
assert.strictEqual(/^\d{4}-\d{2}-\d{2}$/.test(todayStr), true, 'فرمت تاریخ امروز باید YYYY-MM-DD باشد');
console.log(`   ✓ تاریخ امروز سیستم: ${todayStr} (${formatPersianDate(todayStr)})`);

console.log('--- کلیه تست‌های موتور تقویم شمسی با موفقیت کامل پاس شدند! ---');
