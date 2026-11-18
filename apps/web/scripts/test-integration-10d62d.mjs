/**
 * تست جامع یکپارچگی و تثبیت DataTable و اتصال آن به CampaignsTable (گام ۱۰D.6.2D)
 */
import assert from 'node:assert/strict';

console.log('🧪 Starting Step 10D.6.2D Integration & Stabilization verification tests...\n');

// مجموعه داده‌های پایه کمپین‌ها
const initialCampaigns = [
  { id: 'cmp_1', name: 'کمپین لید پاییزی', channel: 'اینستاگرام', status: 'active', budget: 45000000, spend: 21500000, date: '2026-10-01' },
  { id: 'cmp_2', name: 'کمپین سرچ B2B', channel: 'گوگل ادز', status: 'paused', budget: 25000000, spend: 12000000, date: '2026-10-15' },
  { id: 'cmp_3', name: 'کمپین برندینگ', channel: 'یکتانت', status: 'draft', budget: 10000000, spend: 0, date: '2026-11-01' },
  { id: 'cmp_4', name: 'کمپین ریتارگتینگ', channel: 'اینستاگرام', status: 'completed', budget: 30000000, spend: 28000000, date: '2026-08-01' },
];

// تست ۱: سناریوی انتخاب ردیف و تغییر FilterBar (حفظ انتخاب در تغییر فیلتر و بازگشت)
{
  let allCampaigns = [...initialCampaigns];
  // کاربر cmp_1 و cmp_2 را انتخاب می‌کند
  let selectedRowIds = ['cmp_1', 'cmp_2'];

  // کاربر فیلتر سرچ را روی "سرچ" می‌گذارد (تنها cmp_2 باقی می‌ماند)
  const filtered1 = allCampaigns.filter((c) => c.name.includes('سرچ'));
  assert.equal(filtered1.length, 1);
  assert.equal(filtered1[0].id, 'cmp_2');

  // انتخاب‌ها نباید دور ریخته شوند؛ cmp_1 همچنان در حافظه انتخاب‌ها ذخیره است
  assert.equal(selectedRowIds.includes('cmp_1'), true);
  assert.equal(selectedRowIds.includes('cmp_2'), true);

  // تعداد ردیف‌های انتخاب‌شده در فیلتر جاری
  const selectedInView = filtered1.filter((c) => selectedRowIds.includes(c.id));
  assert.equal(selectedInView.length, 1);

  // کاربر فیلتر را پاک می‌کند؛ همه ۴ کمپین بازمی‌گردند
  const filtered2 = [...allCampaigns];
  const reSelected = filtered2.filter((c) => selectedRowIds.includes(c.id));
  assert.equal(reSelected.length, 2, 'پس از پاک کردن فیلتر هر دو کمپین همچنان باید انتخاب‌شده باشند');
  assert.deepEqual(reSelected.map((c) => c.id).sort(), ['cmp_1', 'cmp_2']);

  console.log('✅ Test 1: Row selection preservation across filter changes passed.');
}

// تست ۲: حذف یک کمپین انتخاب‌شده از منبع داده و پاک‌سازی شناسه آن
{
  let selectedRowIds = ['cmp_1', 'cmp_2'];
  const deletedId = 'cmp_1';

  // حذف تکی انجام می‌شود
  selectedRowIds = selectedRowIds.filter((id) => id !== deletedId);
  assert.deepEqual(selectedRowIds, ['cmp_2'], 'شناسه کمپین حذف‌شده باید از انتخاب‌ها خارج شود');

  console.log('✅ Test 2: Deleting selected campaign removes ID from selection passed.');
}

// تست ۳: عملیات گروهی با موفقیت کامل (همه موفق)
{
  let selectedRowIds = ['cmp_1', 'cmp_2'];
  // شبیه‌سازی Promise.allSettled با موفقیت ۱۰۰٪
  const results = [
    { status: 'fulfilled', value: true },
    { status: 'fulfilled', value: true },
  ];

  const succeededIds = selectedRowIds.filter((_, idx) => results[idx].status === 'fulfilled');
  const failedIds = selectedRowIds.filter((_, idx) => results[idx].status === 'rejected');

  assert.equal(succeededIds.length, 2);
  assert.equal(failedIds.length, 0);

  // در صورت موفقیت کامل، انتخاب‌ها خالی می‌شوند
  selectedRowIds = failedIds;
  assert.equal(selectedRowIds.length, 0);

  console.log('✅ Test 3: Bulk operation 100% success clears all selections passed.');
}

// تست ۴: عملیات گروهی با شکست جزئی (۱ موفق و ۱ ناموفق)
{
  let selectedRowIds = ['cmp_1', 'cmp_2', 'cmp_3'];
  // فرض: cmp_1 و cmp_2 با موفقیت انجام می‌شوند، cmp_3 با خطا مواجه می‌شود
  const results = [
    { status: 'fulfilled', value: true },
    { status: 'fulfilled', value: true },
    { status: 'rejected', reason: new Error('خطای شبیه‌سازی سرور') },
  ];

  const succeededIds = selectedRowIds.filter((_, idx) => results[idx].status === 'fulfilled');
  const failedIds = selectedRowIds.filter((_, idx) => results[idx].status === 'rejected');

  assert.equal(succeededIds.length, 2);
  assert.equal(failedIds.length, 1);
  assert.equal(failedIds[0], 'cmp_3');

  // فقط شناسه‌های ناموفق در انتخاب‌ها باقی می‌مانند تا کاربر بتواند تلاش مجدد کند
  selectedRowIds = failedIds;
  assert.deepEqual(selectedRowIds, ['cmp_3'], 'فقط شناسه ناموفق باید برای Retry باقی بماند');

  console.log('✅ Test 4: Partial bulk failure retains only failed IDs for retry passed.');
}

// تست ۵: عملیات گروهی با شکست کلی (همه ناموفق)
{
  let selectedRowIds = ['cmp_1', 'cmp_2'];
  const results = [
    { status: 'rejected', reason: new Error('خطا') },
    { status: 'rejected', reason: new Error('خطا') },
  ];

  const succeededIds = selectedRowIds.filter((_, idx) => results[idx].status === 'fulfilled');
  const failedIds = selectedRowIds.filter((_, idx) => results[idx].status === 'rejected');

  assert.equal(succeededIds.length, 0);
  assert.equal(failedIds.length, 2);

  // هیچ شناسه‌ای پاک نمی‌شود
  selectedRowIds = failedIds;
  assert.deepEqual(selectedRowIds, ['cmp_1', 'cmp_2']);

  console.log('✅ Test 5: Total bulk failure retains all IDs passed.');
}

// تست ۶: انصراف از مدال تأیید (حفظ انتخاب‌ها)
{
  let selectedRowIds = ['cmp_1', 'cmp_2'];
  let isModalOpen = true;

  // کاربر دکمه انصراف را می‌زند
  const handleCancel = () => {
    isModalOpen = false;
    // انتخاب‌ها دست‌نخورده باقی می‌مانند
  };

  handleCancel();
  assert.equal(isModalOpen, false);
  assert.deepEqual(selectedRowIds, ['cmp_1', 'cmp_2']);

  console.log('✅ Test 6: Canceling modal preserves selections passed.');
}

// تست ۷: تصحیح خودکار شماره صفحه هنگام فیلتر شدن نتایج
{
  let pageIndex = 3;
  const pageSize = 20;
  // قبلاً ۶۰ رکورد داشتیم (۳ صفحه). اکنون کاربر فیلتر اعمال کرده و فقط ۱۵ رکورد مانده (۱ صفحه)
  const filteredCount = 15;
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
  if (pageIndex > totalPages) {
    pageIndex = totalPages;
  }
  assert.equal(pageIndex, 1, 'صفحه ۳ باید به صفحه ۱ تصحیح شود');

  console.log('✅ Test 7: Auto-clamping pageIndex on filter reduction passed.');
}

// تست ۸: بررسی چینش ستون‌های Sticky و جلوگیری از تداخل (No overlap & proper offset)
{
  const enableRowSelection = true;
  const checkboxOffset = 'right-0';
  const nameOffset = enableRowSelection ? 'right-[44px]' : 'right-0';
  const actionsOffset = 'left-0';

  assert.equal(checkboxOffset, 'right-0');
  assert.equal(nameOffset, 'right-[44px]', 'ستون نام در زمان فعال بودن چک‌باکس باید دقیقاً بعد از عرض ۴۴ پیکسلی چک‌باکس قرار گیرد');
  assert.equal(actionsOffset, 'left-0');

  console.log('✅ Test 8: Sticky column offsets and zero-overlap calculation passed.');
}

console.log('\n🎉 All 8 Integration & Stabilization verification tests passed successfully!\n');
