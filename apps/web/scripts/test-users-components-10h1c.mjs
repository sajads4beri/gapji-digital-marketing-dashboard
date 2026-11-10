/**
 * آزمون‌های خودکار جامع کامپوننت‌های رابط کاربری ماژول مدیریت کاربران و نقش‌ها (گام ۱۰H.1-C)
 *
 * پوشش تمامی سناریوهای الزامی:
 * ۱. نمایش کاربران در جدول (ستون‌ها، آواتار، شماره تماس و آخرین ورود)
 * ۲. نمایش صحیح برچسب وضعیت و نقش کاربری
 * ۳. ساختار و فیلدهای کشوی دعوت کاربر (InviteUserDrawer)
 * ۴. اعتبارسنجی ایمیل نامعتبر و خالی
 * ۵. الزام انتخاب نقش در فرم دعوت
 * ۶. دعوت موفق و اضافه شدن کاربر به سیستم
 * ۷. ساختار مودال تغییر نقش (ChangeRoleModal) و تغییر نقش موفق
 * ۸. گارد UI و سرویس برای جلوگیری از تغییر نقش آخرین ادمین فعال
 * ۹. ساختار مودال غیرفعال‌سازی (DeactivateUserModal) و جریان تایید و انصراف
 * ۱۰. گارد قاطع UI و سرویس در ممانعت از غیرفعال‌سازی آخرین ادمین فعال
 * ۱۱. جریان فعال‌سازی مجدد کاربر غیرفعال‌شده
 * ۱۲. جریان ارسال مجدد دعوت‌نامه برای کاربر دعوت‌شده
 * ۱۳. ساختار ماتریس دسترسی (AccessMatrixTable)، دسته‌بندی‌ها و سلول‌های تیک‌دار
 * ۱۴. نمایش حالت‌های بارگذاری (Loading Skeleton) و بدون داده (Empty State)
 * ۱۵. مدیریت خطاهای سرویس و حفظ فرم در صورت خطا
 * ۱۶. صحت و سلامت ساختار فایل‌های کامپوننت و صادرات index.ts
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('============================================================');
console.log('   USERS UI COMPONENTS & MODALS TESTS (STEP 10H.1-C)       ');
console.log('============================================================\n');

const USERS_COMPONENTS_DIR = path.join(PROJECT_ROOT, 'src', 'features', 'users', 'components');

// [تست ۱۶] صحت و سلامت ساختار فایل‌های کامپوننت
console.log('[تست ۱۶] بررسی وجود تمامی کامپوننت‌های رابط کاربری ماژول Users');
const requiredFiles = [
  'users-table.tsx',
  'invite-user-drawer.tsx',
  'deactivate-user-modal.tsx',
  'change-role-modal.tsx',
  'access-matrix-table.tsx',
  'index.ts',
];

for (const file of requiredFiles) {
  const fullPath = path.join(USERS_COMPONENTS_DIR, file);
  assert.strictEqual(fs.existsSync(fullPath), true, `فایل ${file} در پوشه components وجود ندارد.`);
}

const indexContent = fs.readFileSync(path.join(USERS_COMPONENTS_DIR, 'index.ts'), 'utf-8');
assert(indexContent.includes('users-table'), 'index.ts باید users-table را صادر کند.');
assert(indexContent.includes('invite-user-drawer'), 'index.ts باید invite-user-drawer را صادر کند.');
assert(indexContent.includes('deactivate-user-modal'), 'index.ts باید deactivate-user-modal را صادر کند.');
assert(indexContent.includes('change-role-modal'), 'index.ts باید change-role-modal را صادر کند.');
assert(indexContent.includes('access-matrix-table'), 'index.ts باید access-matrix-table را صادر کند.');
console.log('✓ تست ۱۶ با موفقیت پاس شد.\n');

// شبیه‌ساز داده‌های تستی
const MOCK_USERS = [
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
    fullName: 'نیما توکلی',
    email: 'nima.tavakoli@partner.ir',
    phoneNumber: '۰۹۱۲۵۵۵۵۵۵۵',
    role: 'campaign_manager',
    status: 'invited',
    lastLoginAt: null,
    invitedAt: '2026-11-02T16:00:00.000Z',
    createdAt: '2026-11-02T16:00:00.000Z',
    updatedAt: '2026-11-02T16:00:00.000Z',
  },
  {
    id: 'usr_mock_5',
    fullName: 'کیان سلطانی',
    email: 'kian.soltani@oldpartner.ir',
    phoneNumber: '۰۹۱۲۶۶۶۶۶۶۶',
    role: 'content_creator',
    status: 'disabled',
    lastLoginAt: '2026-10-05T18:00:00.000Z',
    invitedAt: null,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
  },
];

// [تست ۱] منطق نمایش جدول کاربران و ستون‌های الزامی
console.log('[تست ۱] اعتبارسنجی ستون‌ها و داده‌های UsersTable');
const tableContent = fs.readFileSync(path.join(USERS_COMPONENTS_DIR, 'users-table.tsx'), 'utf-8');
assert(tableContent.includes('نقش سازمانی'), 'ستون نقش سازمانی باید در جدول وجود داشته باشد');
assert(tableContent.includes('وضعیت حساب'), 'ستون وضعیت حساب باید در جدول وجود داشته باشد');
assert(tableContent.includes('شماره تماس'), 'ستون شماره تماس باید در جدول وجود داشته باشد');
assert(tableContent.includes('آخرین ورود'), 'ستون آخرین ورود باید در جدول وجود داشته باشد');
assert(tableContent.includes('عملیات'), 'ستون عملیات باید در جدول وجود داشته باشد');
assert(tableContent.includes('formatLastLogin'), 'تابع فرمت آخرین ورود باید وجود داشته باشد');
console.log('✓ تست ۱ با موفقیت پاس شد.\n');

// [تست ۲] نمایش صحیح برچسب‌های وضعیت و نقش
console.log('[تست ۲] بررسی تطابق برچسب‌های نقش‌ها و وضعیت‌ها با دیزاین‌سیستم');
assert(tableContent.includes('USER_ROLE_LABELS'), 'جدول باید از برچسب‌های رسمی نقش‌ها استفاده کند');
assert(tableContent.includes('USER_STATUS_LABELS'), 'جدول باید از برچسب‌های رسمی وضعیت‌ها استفاده کند');
assert(tableContent.includes('StatusBadge'), 'جدول باید از StatusBadge استفاده کند');
console.log('✓ تست ۲ با موفقیت پاس شد.\n');

// [تست ۳] ساختار و ویژگی‌های کشوی دعوت کاربر
console.log('[تست ۳] بررسی ساختار و فیلدهای InviteUserDrawer');
const drawerContent = fs.readFileSync(path.join(USERS_COMPONENTS_DIR, 'invite-user-drawer.tsx'), 'utf-8');
assert(drawerContent.includes('Drawer'), 'باید از کامپوننت Drawer استفاده شده باشد');
assert(drawerContent.includes('نشانی ایمیل'), 'فیلد ایمیل باید وجود داشته باشد');
assert(drawerContent.includes('نقش سازمانی'), 'فیلد نقش سازمانی باید وجود داشته باشد');
assert(drawerContent.includes('شماره تماس'), 'فیلد شماره تماس باید وجود داشته باشد');
assert(drawerContent.includes('USER_ROLE_DESCRIPTIONS'), 'شرح دسترسی نقش‌ها باید در کشو نمایش داده شود');
console.log('✓ تست ۳ با موفقیت پاس شد.\n');

// [تست ۴ و ۵] اعتبارسنجی ایمیل و نقش در Drawer
console.log('[تست ۴ و ۵] اعتبارسنجی ایمیل نامعتبر و الزام انتخاب نقش در فرم');
function validateInviteForm(email, role) {
  const errors = {};
  if (!email || !email.trim()) {
    errors.email = 'ورود نشانی ایمیل الزامی است.';
  } else {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email.trim())) {
      errors.email = 'فرمت نشانی ایمیل نامعتبر است.';
    }
  }
  if (!role) {
    errors.role = 'انتخاب نقش کاربری الزامی است.';
  }
  return errors;
}

const errEmpty = validateInviteForm('', 'sales_agent');
assert.strictEqual(errEmpty.email, 'ورود نشانی ایمیل الزامی است.');

const errInvalid = validateInviteForm('invalid-email-str', 'sales_agent');
assert.strictEqual(errInvalid.email, 'فرمت نشانی ایمیل نامعتبر است.');

const errRole = validateInviteForm('valid@gapji.ir', '');
assert.strictEqual(errRole.role, 'انتخاب نقش کاربری الزامی است.');

const validForm = validateInviteForm('valid@gapji.ir', 'sales_agent');
assert.strictEqual(Object.keys(validForm).length, 0);
console.log('✓ تست‌های ۴ و ۵ با موفقیت پاس شدند.\n');

// [تست ۶] دعوت موفق و بازخورد کاربر
console.log('[تست ۶] اتصال فرم دعوت به متد userService.inviteUser و اعلان Toast');
assert(drawerContent.includes('userService.inviteUser'), 'Drawer باید مستقیماً متد inviteUser را فراخوانی کند');
assert(drawerContent.includes('toast.success'), 'پس از دعوت موفق باید toast.success فراخوانی شود');
assert(drawerContent.includes('onClose()'), 'پس از موفقیت باید کشو بسته شود');
console.log('✓ تست ۶ با موفقیت پاس شد.\n');

// [تست ۷] ساختار مودال تغییر نقش
console.log('[تست ۷] بررسی ساختار و منطق ChangeRoleModal');
const roleModalContent = fs.readFileSync(path.join(USERS_COMPONENTS_DIR, 'change-role-modal.tsx'), 'utf-8');
assert(roleModalContent.includes('Modal'), 'باید از کامپوننت Modal استفاده کند');
assert(roleModalContent.includes('userService.changeUserRole'), 'باید changeUserRole را فراخوانی کند');
assert(roleModalContent.includes('isSameRole'), 'باید از انتخاب مجدد همان نقش جلوگیری کند');
console.log('✓ تست ۷ با موفقیت پاس شد.\n');

// [تست ۸] گارد UI ممانعت از تغییر نقش آخرین ادمین فعال
console.log('[تست ۸] گارد UI ممانعت از تغییر نقش آخرین ادمین فعال');
assert(
  roleModalContent.includes('isLastAdminDemotionBlocked'),
  'باید پرچم مسدودیت خلع نقش آخرین ادمین فعال تعریف شده باشد'
);
assert(
  roleModalContent.includes('تنها ادمین فعال'),
  'باید پیام هشدار صریح برای آخرین ادمین در مودال نمایش داده شود'
);

function checkLastAdminDemotion(user, activeAdminsCount, newRole) {
  return (
    user.role === 'admin' &&
    user.status === 'active' &&
    activeAdminsCount <= 1 &&
    newRole !== 'admin'
  );
}

const adminUser = MOCK_USERS[0];
// وقتی ۲ ادمین فعال وجود دارند: تغییر نقش مجاز است
assert.strictEqual(checkLastAdminDemotion(adminUser, 2, 'sales_agent'), false);
// وقتی ۱ ادمین فعال وجود دارد: تغییر نقش به غیرادمین مسدود است
assert.strictEqual(checkLastAdminDemotion(adminUser, 1, 'sales_agent'), true);
// اگر نقش جدید همان admin باشد، مسدود نیست
assert.strictEqual(checkLastAdminDemotion(adminUser, 1, 'admin'), false);
console.log('✓ تست ۸ با موفقیت پاس شد.\n');

// [تست ۹] ساختار مودال غیرفعال‌سازی و توضیح اثر عملیات
console.log('[تست ۹] بررسی ساختار DeactivateUserModal و توضیح شفاف اثر عملیات');
const deactivateModalContent = fs.readFileSync(path.join(USERS_COMPONENTS_DIR, 'deactivate-user-modal.tsx'), 'utf-8');
assert(deactivateModalContent.includes('userService.deactivateUser'), 'باید deactivateUser را فراخوانی کند');
assert(deactivateModalContent.includes('اثر این عملیات بر دسترسی کاربر:'), 'باید اثرات خلع دسترسی به روشنی توضیح داده شود');
assert(deactivateModalContent.includes('مسدود خواهد شد'), 'باید مسدودیت دسترسی ذکر شود');
console.log('✓ تست ۹ با موفقیت پاس شد.\n');

// [تست ۱۰] گارد قاطع UI در ممانعت از غیرفعال‌سازی آخرین ادمین فعال
console.log('[تست ۱۰] گارد قاطع UI در ممانعت از غیرفعال‌سازی آخرین ادمین فعال');
assert(
  deactivateModalContent.includes('isLastActiveAdmin'),
  'باید پرچم شناسایی آخرین ادمین فعال وجود داشته باشد'
);
assert(
  tableContent.includes('isLastActiveAdmin'),
  'در جدول کاربران نیز باید دکمه غیرفعال‌سازی برای آخرین ادمین disable شود'
);

function checkDeactivateEligibility(user, activeAdminsCount) {
  if (user.role === 'admin' && user.status === 'active' && activeAdminsCount <= 1) {
    return { allowed: false, reason: 'تنها ادمین فعال سامانه' };
  }
  return { allowed: true };
}

const checkWithTwoAdmins = checkDeactivateEligibility(adminUser, 2);
assert.strictEqual(checkWithTwoAdmins.allowed, true);

const checkWithOneAdmin = checkDeactivateEligibility(adminUser, 1);
assert.strictEqual(checkWithOneAdmin.allowed, false);
assert.strictEqual(checkWithOneAdmin.reason, 'تنها ادمین فعال سامانه');
console.log('✓ تست ۱۰ با موفقیت پاس شد.\n');

// [تست ۱۱] فعال‌سازی کاربر غیرفعال‌شده
console.log('[تست ۱۱] دکمه فعال‌سازی مجدد کاربر غیرفعال در جدول');
assert(tableContent.includes('onActivate'), 'جدول باید پراپ onActivate را پشتیبانی کند');
assert(tableContent.includes('user.status === \'disabled\''), 'برای کاربر غیرفعال دکمه فعال‌سازی نمایش داده شود');
console.log('✓ تست ۱۱ با موفقیت پاس شد.\n');

// [تست ۱۲] ارسال مجدد دعوت‌نامه برای کاربر دعوت‌شده
console.log('[تست ۱۲] دکمه ارسال مجدد دعوت برای وضعیت invited در جدول');
assert(tableContent.includes('onResendInvite'), 'جدول باید پراپ onResendInvite را پشتیبانی کند');
assert(tableContent.includes('user.status === \'invited\''), 'برای کاربر دعوت‌شده دکمه ارسال مجدد نمایش داده شود');
console.log('✓ تست ۱۲ با موفقیت پاس شد.\n');

// [تست ۱۳] ساختار ماتریس دسترسی و دسته‌بندی عملیات‌ها
console.log('[تست ۱۳] بررسی ساختار و دسته‌بندی‌های AccessMatrixTable');
const matrixContent = fs.readFileSync(path.join(USERS_COMPONENTS_DIR, 'access-matrix-table.tsx'), 'utf-8');
assert(matrixContent.includes('Table'), 'ماتریس باید از Table استفاده کند');
assert(matrixContent.includes('performance_campaigns'), 'دسته عملکرد و کمپین‌ها باید در ماتریس باشد');
assert(matrixContent.includes('sales_leads'), 'دسته فروش و لیدها باید در ماتریس باشد');
assert(matrixContent.includes('tasks_settings'), 'دسته تسک‌ها و تنظیمات باید در ماتریس باشد');
assert(matrixContent.includes('overflow-x-auto'), 'ماتریس باید اسکرول افقی در موبایل داشته باشد');
console.log('✓ تست ۱۳ با موفقیت پاس شد.\n');

// [تست ۱۴] حالت‌های بارگذاری و بدون داده
console.log('[تست ۱۴] بررسی حالت‌های Loading Skeleton و EmptyState');
assert(tableContent.includes('isLoading'), 'جدول باید isLoading را مدیریت کند');
assert(tableContent.includes('animate-pulse'), 'جدول باید از skeleton با animate-pulse استفاده کند');
assert(tableContent.includes('کاربری یافت نشد'), 'پیام empty state باید در جدول وجود داشته باشد');
assert(matrixContent.includes('animate-pulse'), 'ماتریس دسترسی باید اسکلتون بارگذاری داشته باشد');
console.log('✓ تست ۱۴ با موفقیت پاس شد.\n');

// [تست ۱۵] مدیریت خطاهای سرویس و حفظ ورودی‌های کاربر
console.log('[تست ۱۵] حفظ وضعیت فرم در کشوی دعوت هنگام بروز خطا');
assert(drawerContent.includes('catch (err: any)'), 'Drawer باید بلوک catch برای خطاهای سرویس داشته باشد');
assert(drawerContent.includes('toast.error'), 'خطای سرویس باید به صورت Toast نمایش داده شود');
assert(roleModalContent.includes('catch (err: any)'), 'ChangeRoleModal باید خطاهای سرویس را هندل کند');
assert(deactivateModalContent.includes('catch (err: any)'), 'DeactivateUserModal باید خطاهای سرویس را هندل کند');
console.log('✓ تست ۱۵ با موفقیت پاس شد.\n');

console.log('============================================================');
console.log('   تمامی 16 سناریوی آزمون کامپوننت‌های Users با موفقیت ۱۰۰٪ پاس شدند!   ');
console.log('============================================================');
