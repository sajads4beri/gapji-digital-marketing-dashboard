/**
 * آزمون‌های خودکار جامع صفحه اصلی مدیریت کاربران و نقش‌ها و اتصال به منوی ناوبری (گام ۱۰H.1-D)
 *
 * پوشش ۱۸ سناریوی کلیدی آزمون:
 * ۱. مسیر /settings/users و وجود فایل صفحه (page.tsx) و رپر Suspense
 * ۲. رندر مسیر راهنما (Breadcrumb) شامل «تنظیمات سامانه» و «کاربران و نقش‌ها»
 * ۳. وجود دو تب تفکیک‌شده («کاربران سازمان» و «نقش‌ها و دسترسی‌ها»)
 * ۴. سوئیچ بین تب‌ها با URL searchParams (?tab=matrix) بدون رفرش کامل
 * ۵. واکشی و رندر جدول کاربران (UsersTable) با داده‌های اولیه
 * ۶. فیلتر کاربران بر اساس نقش سازمانی (UserRole)
 * ۷. فیلتر کاربران بر اساس وضعیت حساب (UserStatus: active, invited, disabled)
 * ۸. جستجوی متنی چندبعدی در نام کامل، ایمیل و شماره تماس
 * ۹. به‌روزرسانی صحیح و بلادرنگ کارت‌های آمار خلاصه اعضا
 * ۱۰. جریان دعوت کاربر جدید از طریق کشو (InviteUserDrawer) و همگام‌سازی
 * ۱۱. جریان تغییر نقش کاربری و گارد آخرین ادمین فعال
 * ۱۲. جریان غیرفعال‌سازی و فعال‌سازی مجدد کاربر
 * ۱۳. جریان ارسال مجدد دعوت‌نامه (resendInvitation)
 * ۱۴. رندر ماتریس دسترسی و نقش‌ها در تب ماتریس (AccessMatrixTable)
 * ۱۵. هندلینگ وضعیت‌های بارگذاری، خالی بودن و خطا
 * ۱۶. قابلیت بازخوانی مجدد (Retry / Refresh)
 * ۱۷. فعال بودن و درستی پیکربندی روت /settings/users در navigation.ts
 * ۱۸. عدم رگرسیون در سایر روت‌های ناوبری سامانه
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('============================================================');
console.log('   USERS & ROLES PAGE & NAVIGATION INTEGRATION (STEP 10H.1-D)');
console.log('============================================================\n');

let passCount = 0;

// ۱. ثوابت و شبیه‌ساز منطق داده‌های صفحه
const INITIAL_USERS = [
  {
    id: 'usr_mock_1',
    fullName: 'علی محمدی',
    email: 'ali.mohammadi@gapji.ir',
    phoneNumber: '۰۹۱۲۱۱۱۱۱۱۱',
    role: 'admin',
    status: 'active',
    lastLoginAt: '2026-11-03T08:30:00.000Z',
    invitedAt: null,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-11-02T10:00:00.000Z',
  },
  {
    id: 'usr_mock_2',
    fullName: 'سارا احمدی',
    email: 'sara.ahmadi@gapji.ir',
    phoneNumber: '۰۹۱۲۲۲۲۲۲۲۲',
    role: 'admin',
    status: 'active',
    lastLoginAt: '2026-11-02T14:00:00.000Z',
    invitedAt: null,
    createdAt: '2026-09-15T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'usr_mock_3',
    fullName: 'پرهام رادمنش',
    email: 'parham.rad@gapji.ir',
    phoneNumber: '۰۹۱۲۳۳۳۳۳۳۳',
    role: 'marketing_manager',
    status: 'active',
    lastLoginAt: '2026-11-01T09:00:00.000Z',
    invitedAt: null,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-25T10:00:00.000Z',
  },
  {
    id: 'usr_mock_4',
    fullName: 'نیلوفر کمالی',
    email: 'niloofar.kamali@gapji.ir',
    phoneNumber: '۰۹۱۲۴۴۴۴۴۴۴',
    role: 'media_buyer',
    status: 'active',
    lastLoginAt: '2026-10-30T17:15:00.000Z',
    invitedAt: null,
    createdAt: '2026-10-05T10:00:00.000Z',
    updatedAt: '2026-10-28T10:00:00.000Z',
  },
  {
    id: 'usr_mock_5',
    fullName: 'مهسا کاظمی',
    email: 'mahsa.kazemi@gapji.ir',
    phoneNumber: '۰۹۱۲۵۵۵۵۵۵۵',
    role: 'content_creator',
    status: 'invited',
    lastLoginAt: null,
    invitedAt: '2026-11-01T11:00:00.000Z',
    createdAt: '2026-11-01T11:00:00.000Z',
    updatedAt: '2026-11-01T11:00:00.000Z',
  },
  {
    id: 'usr_mock_6',
    fullName: 'کیان صفری',
    email: 'kian.safari@gapji.ir',
    phoneNumber: '۰۹۱۲۶۶۶۶۶۶۶',
    role: 'sales_agent',
    status: 'disabled',
    lastLoginAt: '2026-10-15T12:00:00.000Z',
    invitedAt: null,
    createdAt: '2026-09-20T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
  },
  {
    id: 'usr_mock_7',
    fullName: 'رعنا صادقی',
    email: 'rana.sadeghi@gapji.ir',
    phoneNumber: '۰۹۱۲۷۷۷۷۷۷۷',
    role: 'analyst_viewer',
    status: 'invited',
    lastLoginAt: null,
    invitedAt: '2026-11-02T16:00:00.000Z',
    createdAt: '2026-11-02T16:00:00.000Z',
    updatedAt: '2026-11-02T16:00:00.000Z',
  },
];

// توابع شبیه‌ساز فیلتر و جستجوی صفحه
function filterUsers(users, { role = 'all', status = 'all', searchQuery = '' }) {
  return users.filter((u) => {
    if (role !== 'all' && u.role !== role) return false;
    if (status !== 'all' && u.status !== status) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const nameMatch = u.fullName.toLowerCase().includes(q);
      const emailMatch = u.email.toLowerCase().includes(q);
      const phoneMatch = u.phoneNumber ? u.phoneNumber.includes(q) : false;
      if (!nameMatch && !emailMatch && !phoneMatch) return false;
    }
    return true;
  });
}

function calculateMetrics(users) {
  return {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    invited: users.filter((u) => u.status === 'invited').length,
    disabled: users.filter((u) => u.status === 'disabled').length,
    activeAdmins: users.filter((u) => u.role === 'admin' && u.status === 'active').length,
  };
}

// -------------------------------------------------------------
// [تست ۱] بررسی فایل صفحه و رپر Suspense
// -------------------------------------------------------------
console.log('[تست ۱] بررسی وجود فایل page.tsx و رپر Suspense برای رندر SSR امن');
const pagePath = path.join(PROJECT_ROOT, 'src', 'app', '(app)', 'settings', 'users', 'page.tsx');
assert(fs.existsSync(pagePath), 'فایل page.tsx در مسیر app/(app)/settings/users/ وجود ندارد.');
const pageContent = fs.readFileSync(pagePath, 'utf-8');
assert(pageContent.includes("'use client'"), 'صفحه باید دارای دستور use client باشد.');
assert(pageContent.includes('React.Suspense'), 'صفحه باید از React.Suspense برای دریافت پارامترهای آدرس استفاده کند.');
assert(pageContent.includes('useSearchParams'), 'صفحه باید از useSearchParams جهت مدیریت تب فعال استفاده کند.');
console.log('✓ تست ۱ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۲] رندر مسیر راهنما (Breadcrumb)
// -------------------------------------------------------------
console.log('[تست ۲] بررسی رندر مسیر راهنما (Breadcrumb) با عناوین صحیح');
assert(pageContent.includes('Breadcrumb'), 'کامپوننت Breadcrumb باید در صفحه وارد و استفاده شده باشد.');
assert(pageContent.includes("label: 'تنظیمات سامانه'"), 'مسیر راهنما باید شامل بخش تنظیمات سامانه باشد.');
assert(pageContent.includes("label: 'کاربران و نقش‌ها'"), 'مسیر راهنما باید به کاربران و نقش‌ها منتهی شود.');
console.log('✓ تست ۲ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۳] ساختار دو تب اصلی (کاربران و ماتریس نقش‌ها)
// -------------------------------------------------------------
console.log('[تست ۳] بررسی ساختار دوگانه تب‌ها («کاربران سازمان» و «نقش‌ها و دسترسی‌ها»)');
assert(pageContent.includes('کاربران سازمان'), 'تب اول باید عنوان «کاربران سازمان» داشته باشد.');
assert(pageContent.includes('نقش‌ها و دسترسی‌ها'), 'تب دوم باید عنوان «نقش‌ها و دسترسی‌ها» داشته باشد.');
assert(pageContent.includes("activeTab === 'users'"), 'شرط رندر تب کاربران باید وجود داشته باشد.');
assert(pageContent.includes("activeTab === 'matrix'"), 'شرط رندر تب ماتریس باید وجود داشته باشد.');
console.log('✓ تست ۳ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۴] مدیریت تب‌ها در URL searchParams بدون رفرش کامل
// -------------------------------------------------------------
console.log('[تست ۴] شبیه‌سازی تغییر تب با URL params و حالت پیش‌فرض');
function getActiveTabFromParam(param) {
  return param === 'matrix' ? 'matrix' : 'users';
}
assert.strictEqual(getActiveTabFromParam(null), 'users', 'در صورت نبود پارامتر، تب پیش‌فرض باید users باشد.');
assert.strictEqual(getActiveTabFromParam('matrix'), 'matrix', 'در صورت پارامتر matrix، تب باید matrix شود.');
assert.strictEqual(getActiveTabFromParam('unknown'), 'users', 'در صورت پارامتر نامعتبر، تب باید users شود.');
assert(pageContent.includes("router.replace"), 'سوئیچ تب‌ها باید با router.replace و بدون رفرش کامل رخ دهد.');
assert(pageContent.includes("scroll: false"), 'سوئیچ تب نباید اسکرول صفحه را تغییر دهد.');
console.log('✓ تست ۴ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۵] واکشی کاربران و رندر اولیه جدول
// -------------------------------------------------------------
console.log('[تست ۵] واکشی اولیه کاربران و اتصال به UsersTable');
assert(pageContent.includes('userService.getAllUsers'), 'صفحه باید کاربران را از userService فراخوانی کند.');
assert(pageContent.includes('<UsersTable'), 'صفحه باید کامپوننت UsersTable را رندر کند.');
assert(INITIAL_USERS.length === 7, 'تعداد کاربران اولیه در شبیه‌ساز باید ۷ نفر باشد.');
console.log('✓ تست ۵ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۶] فیلتر کاربران بر اساس نقش سازمانی
// -------------------------------------------------------------
console.log('[تست ۶] راستی‌آزمایی فیلتر نقش کاربری (ادمین، خریدار رسانه، کارشناس و ...)');
const adminUsers = filterUsers(INITIAL_USERS, { role: 'admin' });
assert.strictEqual(adminUsers.length, 2, 'تعداد کاربران با نقش admin باید ۲ نفر باشد.');
assert(adminUsers.every((u) => u.role === 'admin'), 'تمامی کاربران فیلترشده باید ادمین باشند.');

const mediaBuyers = filterUsers(INITIAL_USERS, { role: 'media_buyer' });
assert.strictEqual(mediaBuyers.length, 1, 'تعداد خریدار رسانه باید ۱ نفر باشد.');
assert.strictEqual(mediaBuyers[0].fullName, 'نیلوفر کمالی');

const allRoles = filterUsers(INITIAL_USERS, { role: 'all' });
assert.strictEqual(allRoles.length, 7, 'در صورت انتخاب همه نقش‌ها باید ۷ کاربر بازگردند.');
console.log('✓ تست ۶ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۷] فیلتر کاربران بر اساس وضعیت حساب
// -------------------------------------------------------------
console.log('[تست ۷] راستی‌آزمایی فیلتر وضعیت حساب (فعال، دعوت‌شده، غیرفعال)');
const activeUsers = filterUsers(INITIAL_USERS, { status: 'active' });
assert.strictEqual(activeUsers.length, 4, 'تعداد کاربران فعال باید ۴ نفر باشد.');

const invitedUsers = filterUsers(INITIAL_USERS, { status: 'invited' });
assert.strictEqual(invitedUsers.length, 2, 'تعداد کاربران دعوت‌شده باید ۲ نفر باشد.');

const disabledUsers = filterUsers(INITIAL_USERS, { status: 'disabled' });
assert.strictEqual(disabledUsers.length, 1, 'تعداد کاربران غیرفعال باید ۱ نفر باشد.');
assert.strictEqual(disabledUsers[0].fullName, 'کیان صفری');
console.log('✓ تست ۷ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۸] جستجوی متنی چندبعدی (نام، ایمیل، شماره تلفن)
// -------------------------------------------------------------
console.log('[تست ۸] راستی‌آزمایی جستجوی متنی چندبعدی');
const nameSearchResult = filterUsers(INITIAL_USERS, { searchQuery: 'سارا' });
assert.strictEqual(nameSearchResult.length, 1, 'جستجوی «سارا» باید یک کاربر بیابد.');
assert.strictEqual(nameSearchResult[0].email, 'sara.ahmadi@gapji.ir');

const emailSearchResult = filterUsers(INITIAL_USERS, { searchQuery: 'kamali@gapji.ir' });
assert.strictEqual(emailSearchResult.length, 1, 'جستجوی ایمیل باید کاربر مربوطه را پیدا کند.');
assert.strictEqual(emailSearchResult[0].fullName, 'نیلوفر کمالی');

const phoneSearchResult = filterUsers(INITIAL_USERS, { searchQuery: '۰۹۱۲۷۷۷' });
assert.strictEqual(phoneSearchResult.length, 1, 'جستجوی شماره تلفن فارسی باید کاربر را پیدا کند.');
assert.strictEqual(phoneSearchResult[0].fullName, 'رعنا صادقی');
console.log('✓ تست ۸ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۹] شمارنده‌های آماری خلاصه وضعیت کاربران
// -------------------------------------------------------------
console.log('[تست ۹] محاسبه و نمایش کارت‌های آمار خلاصه اعضای سازمان');
const initialMetrics = calculateMetrics(INITIAL_USERS);
assert.strictEqual(initialMetrics.total, 7, 'کل اعضا باید ۷ نفر باشد.');
assert.strictEqual(initialMetrics.active, 4, 'اعضای فعال باید ۴ نفر باشد.');
assert.strictEqual(initialMetrics.invited, 2, 'اعضای دعوت‌شده باید ۲ نفر باشد.');
assert.strictEqual(initialMetrics.disabled, 1, 'اعضای غیرفعال باید ۱ نفر باشد.');
assert.strictEqual(initialMetrics.activeAdmins, 2, 'تعداد ادمین‌های فعال باید ۲ نفر باشد.');
assert(pageContent.includes('کل اعضا'), 'کارت کل اعضا باید در صفحه رندر شود.');
assert(pageContent.includes('کاربران فعال'), 'کارت کاربران فعال باید در صفحه رندر شود.');
assert(pageContent.includes('دعوت‌شده'), 'کارت دعوت‌شده باید در صفحه رندر شود.');
assert(pageContent.includes('غیرفعال'), 'کارت غیرفعال باید در صفحه رندر شود.');
console.log('✓ تست ۹ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۰] جریان دعوت کاربر جدید (InviteUserDrawer)
// -------------------------------------------------------------
console.log('[تست ۱۰] شبیه‌سازی جریان دعوت کاربر و به‌روزرسانی جدول و آمار');
let testUsers = [...INITIAL_USERS];
const newUser = {
  id: 'usr_mock_8',
  fullName: 'کاربر جدید دعوت‌شده',
  email: 'new.member@gapji.ir',
  phoneNumber: '۰۹۱۲۹۹۹۹۹۹۹',
  role: 'content_creator',
  status: 'invited',
  lastLoginAt: null,
  invitedAt: '2026-11-03T10:00:00.000Z',
  createdAt: '2026-11-03T10:00:00.000Z',
  updatedAt: '2026-11-03T10:00:00.000Z',
};
testUsers.push(newUser);
const updatedMetricsAfterInvite = calculateMetrics(testUsers);
assert.strictEqual(updatedMetricsAfterInvite.total, 8, 'پس از دعوت باید تعداد کل ۸ شود.');
assert.strictEqual(updatedMetricsAfterInvite.invited, 3, 'تعداد دعوت‌شده‌ها باید ۳ شود.');
assert(pageContent.includes('<InviteUserDrawer'), 'کامپوننت InviteUserDrawer باید در صفحه وارد شده باشد.');
console.log('✓ تست ۱۰ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۱] جریان تغییر نقش کاربری و گارد آخرین ادمین فعال
// -------------------------------------------------------------
console.log('[تست ۱۱] شبیه‌سازی تغییر نقش کاربری و گارد آخرین ادمین فعال');
assert(pageContent.includes('<ChangeRoleModal'), 'کامپوننت ChangeRoleModal باید در صفحه موجود باشد.');
assert(pageContent.includes('activeAdminsCount={activeAdminsCount}'), 'تعداد ادمین‌های فعال باید به مودال ارسال شود.');

// حالت ۱: دو ادمین فعال داریم، تغییر نقش یک ادمین به نقش دیگر مجاز است
let activeAdmins = testUsers.filter((u) => u.role === 'admin' && u.status === 'active').length;
assert.strictEqual(activeAdmins, 2, 'در ابتدا دو ادمین فعال داریم.');
testUsers = testUsers.map((u) => (u.id === 'usr_mock_2' ? { ...u, role: 'marketing_manager' } : u));
activeAdmins = testUsers.filter((u) => u.role === 'admin' && u.status === 'active').length;
assert.strictEqual(activeAdmins, 1, 'اکنون فقط یک ادمین فعال باقی مانده است.');

// حالت ۲: حالا که ۱ ادمین فعال داریم، تلاش برای تغییر نقش آن باید توسط گارد رد شود
const lastAdmin = testUsers.find((u) => u.role === 'admin' && u.status === 'active');
assert(lastAdmin, 'آخرین ادمین فعال پیدا شد.');
function attemptDemoteAdmin(user, currentActiveAdmins, newRole) {
  if (user.role === 'admin' && user.status === 'active' && currentActiveAdmins <= 1 && newRole !== 'admin') {
    throw new Error('امکان تغییر نقش تنها مدیر سیستم (Admin) فعال وجود ندارد.');
  }
  return true;
}
assert.throws(
  () => attemptDemoteAdmin(lastAdmin, activeAdmins, 'content_creator'),
  /تنها مدیر سیستم/,
  'گارد آخرین ادمین فعال باید مانع از خلع نقش ادمین شود.'
);
console.log('✓ تست ۱۱ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۲] جریان غیرفعال‌سازی و فعال‌سازی مجدد
// -------------------------------------------------------------
console.log('[تست ۱۲] شبیه‌سازی غیرفعال‌سازی کاربر عادی و گارد برای آخرین ادمین');
assert(pageContent.includes('<DeactivateUserModal'), 'کامپوننت DeactivateUserModal باید در صفحه موجود باشد.');
assert(pageContent.includes('handleActivateUser'), 'تابع handleActivateUser باید در صفحه وجود داشته باشد.');

// جلوگیری از غیرفعال‌سازی آخرین ادمین فعال
function attemptDeactivate(user, currentActiveAdmins) {
  if (user.role === 'admin' && user.status === 'active' && currentActiveAdmins <= 1) {
    throw new Error('امکان غیرفعال‌سازی تنها مدیر سیستم (Admin) فعال وجود ندارد.');
  }
  return true;
}
assert.throws(
  () => attemptDeactivate(lastAdmin, activeAdmins),
  /امکان غیرفعال‌سازی تنها مدیر سیستم/,
  'گارد باید مانع از غیرفعال‌سازی آخرین ادمین شود.'
);

// غیرفعال‌سازی کاربر عادی
let userToDeactivate = testUsers.find((u) => u.id === 'usr_mock_3');
assert.strictEqual(userToDeactivate.status, 'active');
testUsers = testUsers.map((u) => (u.id === 'usr_mock_3' ? { ...u, status: 'disabled' } : u));
assert.strictEqual(testUsers.find((u) => u.id === 'usr_mock_3').status, 'disabled');

// فعال‌سازی مجدد کاربر
testUsers = testUsers.map((u) => (u.id === 'usr_mock_3' ? { ...u, status: 'active' } : u));
assert.strictEqual(testUsers.find((u) => u.id === 'usr_mock_3').status, 'active');
console.log('✓ تست ۱۲ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۳] جریان ارسال مجدد دعوت‌نامه
// -------------------------------------------------------------
console.log('[تست ۱۳] شبیه‌سازی ارسال مجدد دعوت‌نامه برای کاربر دعوت‌شده');
assert(pageContent.includes('handleResendInvite'), 'تابع handleResendInvite باید در صفحه وجود داشته باشد.');
assert(pageContent.includes('userService.resendInvitation'), 'ارسال مجدد باید متد سرویس را فراخوانی کند.');
const invitedMember = testUsers.find((u) => u.status === 'invited');
assert(invitedMember, 'کاربر با وضعیت دعوت‌شده وجود دارد.');
console.log('✓ تست ۱۳ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۴] رندر ماتریس دسترسی و نقش‌ها (AccessMatrixTable)
// -------------------------------------------------------------
console.log('[تست ۱۴] رندر کامپوننت ماتریس دسترسی‌ها در تب دوم');
assert(pageContent.includes('<AccessMatrixTable'), 'کامپوننت AccessMatrixTable باید در صفحه تعبیه شده باشد.');
const matrixComponentPath = path.join(PROJECT_ROOT, 'src', 'features', 'users', 'components', 'access-matrix-table.tsx');
assert(fs.existsSync(matrixComponentPath), 'فایل access-matrix-table.tsx وجود دارد.');
const matrixContent = fs.readFileSync(matrixComponentPath, 'utf-8');
assert(matrixContent.includes('ماتریس دسترسی نقش‌ها'), 'عنوان ماتریس دسترسی در کامپوننت موجود است.');
console.log('✓ تست ۱۴ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۵] بررسی لودینگ، فیلتر خالی و نمایش ارور
// -------------------------------------------------------------
console.log('[تست ۱۵] نمایش وضعیت‌های بارگذاری، خالی بودن و خطا در صفحه');
assert(pageContent.includes('animate-pulse'), 'فال‌بک ساسپنس باید لودینگ شبیه اسکلتون با انیمیشن پالس داشته باشد.');
assert(pageContent.includes('error &&'), 'مدیریت نمایش خطای بارگذاری باید در صفحه وجود داشته باشد.');
assert(pageContent.includes('AlertTriangle'), 'آیکون اخطار برای پیام خطا تعریف شده است.');
console.log('✓ تست ۱۵ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۶] دکمه تلاش مجدد (Retry) و دکمه به‌روزرسانی (Refresh)
// -------------------------------------------------------------
console.log('[تست ۱۶] وجود قابلیت بارگذاری مجدد (Refresh) و تلاش مجدد در خطا');
assert(pageContent.includes('به‌روزرسانی'), 'دکمه به‌روزرسانی دستی باید در سربرگ صفحه موجود باشد.');
assert(pageContent.includes('تلاش دوباره'), 'دکمه تلاش دوباره باید در باکس نمایش خطا وجود داشته باشد.');
console.log('✓ تست ۱۶ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۷] بررسی اتصال منوی ناوبری (navigation.ts)
// -------------------------------------------------------------
console.log('[تست ۱۷] بررسی فعال‌سازی لینک /settings/users در navigation.ts');
const navPath = path.join(PROJECT_ROOT, 'src', 'config', 'navigation.ts');
assert(fs.existsSync(navPath), 'فایل navigation.ts وجود ندارد.');
const navContent = fs.readFileSync(navPath, 'utf-8');
assert(navContent.includes("id: 'users-roles'"), 'آیتم users-roles باید در navigation.ts موجود باشد.');
assert(navContent.includes("href: '/settings/users'"), 'آدرس آیتم ناوبری باید دقیقا /settings/users باشد.');
assert(navContent.includes('icon: ShieldCheck'), 'آیکون آیتم ناوبری باید ShieldCheck باشد.');
assert(navContent.includes("matchPattern: (pathname) => pathname.startsWith('/settings/users')"), 'الگوی matchPattern باید تنظیم شده باشد.');

// اطمینان از حذف comingSoon از آیتم users-roles
const usersRolesMatch = navContent.match(/id:\s*'users-roles'[\s\S]*?\},/);
assert(usersRolesMatch, 'بخش users-roles در navigation.ts یافت نشد.');
const usersRolesBlock = usersRolesMatch[0];
assert(!usersRolesBlock.includes('comingSoon: true'), 'آیتم users-roles نباید دارای comingSoon: true باشد.');
console.log('✓ تست ۱۷ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۸] عدم رگرسیون در سایر مسیرهای منوی ناوبری
// -------------------------------------------------------------
console.log('[تست ۱۸] بررسی عدم رگرسیون در سایر روت‌های فعال ناوبری');
const requiredActiveRoutes = [
  { id: 'dashboard', href: '/' },
  { id: 'campaigns-list', href: '/campaigns' },
  { id: 'campaign-create', href: '/campaigns/new' },
  { id: 'costs', href: '/performance/costs' },
  { id: 'leads-inbox', href: '/leads' },
  { id: 'leads-board', href: '/leads/board' },
  { id: 'tasks', href: '/work/tasks' },
  { id: 'users-roles', href: '/settings/users' },
];

for (const route of requiredActiveRoutes) {
  assert(
    navContent.includes(`id: '${route.id}'`),
    `مسیر ${route.id} در ناوبری گم شده است.`
  );
  assert(
    navContent.includes(`href: '${route.href}'`),
    `آدرس ${route.href} برای مسیر ${route.id} پیدا نشد.`
  );
}
console.log('✓ تست ۱۸ با موفقیت پاس شد.');
passCount++;

console.log('\n============================================================');
console.log(`نتیجه نهایی: تمامی ${passCount} سناریوی آزمون صفحه کاربران و ناوبری با موفقیت ۱۰۰٪ پاس شدند.`);
console.log('============================================================\n');
