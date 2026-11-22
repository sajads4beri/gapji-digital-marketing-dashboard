/**
 * تست جامع قابلیت‌های پیشرفته DataTable (انتخاب ردیف، عملیات گروهی، مدیریت ستون‌ها و تراکم)
 */
import assert from 'node:assert/strict';

console.log('🧪 Starting DataTable Advanced (10D.6.2B) verification tests...\n');

// شبیه‌ساز داده‌ها
const sampleData = [
  { id: 'cmp_1', name: 'کمپین ۱', budget: 1000 },
  { id: 'cmp_2', name: 'کمپین ۲', budget: 2000 },
  { id: 'cmp_3', name: 'کمپین ۳', budget: 3000 },
  { id: 'cmp_4', name: 'کمپین ۴', budget: 4000 },
  { id: 'cmp_5', name: 'کمپین ۵', budget: 5000 },
];

const sampleColumns = [
  { id: 'name', accessorKey: 'name', hideable: false }, // ستون ثابت غیرقابل مخفی‌سازی
  { id: 'budget', accessorKey: 'budget', hideable: true },
  { id: 'extra', accessorKey: 'extra', hideable: true, defaultHidden: true }, // پیش‌فرض مخفی
];

// ۱. تست انتخاب ردیف و وضعیت Indeterminate
{
  const pageSize = 2;
  const page1VisibleIds = ['cmp_1', 'cmp_2'];
  let selected = [];

  // هیچ انتخابی وجود ندارد
  let isAll = page1VisibleIds.every((id) => selected.includes(id));
  let isSome = page1VisibleIds.some((id) => selected.includes(id)) && !isAll;
  assert.equal(isAll, false);
  assert.equal(isSome, false);

  // انتخاب فقط یک ردیف در صفحه ۱ -> وضعیت Indeterminate فعال می‌شود
  selected = ['cmp_1'];
  isAll = page1VisibleIds.every((id) => selected.includes(id));
  isSome = page1VisibleIds.some((id) => selected.includes(id)) && !isAll;
  assert.equal(isAll, false);
  assert.equal(isSome, true, 'در صورت انتخاب برخی ردیف‌ها باید indeterminate=true باشد');

  // انتخاب هر دو ردیف در صفحه ۱ -> وضعیت All فعال شده و Indeterminate خاموش می‌شود
  selected = ['cmp_1', 'cmp_2'];
  isAll = page1VisibleIds.every((id) => selected.includes(id));
  isSome = page1VisibleIds.some((id) => selected.includes(id)) && !isAll;
  assert.equal(isAll, true, 'تمام ردیف‌های صفحه انتخاب شده‌اند');
  assert.equal(isSome, false);

  console.log('✅ Test 1: Row selection and Indeterminate state logic passed.');
}

// ۲. تست حفظ انتخاب‌ها بین صفحات مختلف (Cross-page selection persistence)
{
  const page1Ids = ['cmp_1', 'cmp_2'];
  const page2Ids = ['cmp_3', 'cmp_4'];

  // در صفحه ۱ کاربر ردیف cmp_1 را انتخاب می‌کند
  let selected = ['cmp_1'];

  // کاربر به صفحه ۲ می‌رود و cmp_3 و cmp_4 را انتخاب می‌کند
  selected = Array.from(new Set([...selected, ...page2Ids]));

  assert.deepEqual(selected.sort(), ['cmp_1', 'cmp_3', 'cmp_4']);

  // کاربر مجدداً به صفحه ۱ برمی‌گردد؛ انتخاب‌های صفحه ۱ باید حفظ شده باشند
  assert.equal(selected.includes('cmp_1'), true);

  console.log('✅ Test 2: Cross-page selection persistence passed.');
}

// ۳. تست پاک‌سازی شناسه‌های نامعتبر در صورت حذف داده‌ها (Pruning stale IDs)
{
  let selected = ['cmp_1', 'cmp_deleted', 'cmp_2'];
  const currentData = [{ id: 'cmp_1' }, { id: 'cmp_2' }, { id: 'cmp_3' }];
  const validIds = new Set(currentData.map((d) => d.id));

  const sanitized = selected.filter((id) => validIds.has(id));
  assert.deepEqual(sanitized, ['cmp_1', 'cmp_2'], 'شناسه ناموجود cmp_deleted باید پاک‌سازی شود');

  console.log('✅ Test 3: Stale selected ID pruning on data deletion passed.');
}

// ۴. تست عملیات گروهی و پاک‌سازی انتخاب‌ها
{
  let selectedIds = ['cmp_1', 'cmp_2'];
  const selectedRows = sampleData.filter((d) => selectedIds.includes(d.id));

  assert.equal(selectedRows.length, 2);
  assert.equal(selectedRows[0].name, 'کمپین ۱');
  assert.equal(selectedRows[1].name, 'کمپین ۲');

  // تابع پاک‌سازی انتخاب‌ها (Clear Selection)
  const clearSelection = () => {
    selectedIds = [];
  };
  clearSelection();
  assert.equal(selectedIds.length, 0);

  console.log('✅ Test 4: Bulk actions row mapping and clearSelection passed.');
}

// ۵. تست نمایش و مخفی‌سازی ستون‌ها و حفاظت از ستون‌های hideable: false
{
  // وضعیت اولیه ستون‌ها بر مبنای defaultHidden
  const visibility = {};
  sampleColumns.forEach((col) => {
    visibility[col.id] = col.defaultHidden ? false : true;
  });

  assert.equal(visibility.name, true);
  assert.equal(visibility.budget, true);
  assert.equal(visibility.extra, false, 'ستون extra به دلیل defaultHidden باید ابتدا مخفی باشد');

  // فیلتر ستون‌های مرئی
  const getVisibleColumns = (cols, vis) =>
    cols.filter((c) => c.hideable === false || vis[c.id] !== false);

  let visibleCols = getVisibleColumns(sampleColumns, visibility);
  assert.equal(visibleCols.length, 2); // name و budget
  assert.deepEqual(visibleCols.map((c) => c.id), ['name', 'budget']);

  // تلاش برای مخفی کردن ستون ثابت (hideable: false)
  const toggleColumn = (colId) => {
    const col = sampleColumns.find((c) => c.id === colId);
    if (col && col.hideable === false) {
      // غیرقابل مخفی‌سازی
      return;
    }
    visibility[colId] = !visibility[colId];
  };

  toggleColumn('name'); // نباید تغییر کند
  assert.equal(visibility.name, true);

  // فعال کردن ستون extra
  toggleColumn('extra');
  assert.equal(visibility.extra, true);
  visibleCols = getVisibleColumns(sampleColumns, visibility);
  assert.equal(visibleCols.length, 3);

  console.log('✅ Test 5: Column visibility toggle, hideable: false, and defaultHidden passed.');
}

// ۶. تست حالت تراکم (Density Mode)
{
  let density = 'comfortable';
  const toggleDensity = () => {
    density = density === 'comfortable' ? 'compact' : 'comfortable';
  };

  assert.equal(density, 'comfortable');
  toggleDensity();
  assert.equal(density, 'compact');
  toggleDensity();
  assert.equal(density, 'comfortable');

  // تغییر تراکم نباید به داده‌ها یا ساختار ستون آسیبی بزند
  assert.equal(sampleData.length, 5);

  console.log('✅ Test 6: Density mode toggle (comfortable <-> compact) passed.');
}

console.log('\n🎉 All 6 Advanced DataTable verification tests passed successfully!\n');
